from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Invoice, Order, OrderItem
from apps.customers.models import Customer
from apps.inventory.models import InventoryTransaction
from apps.products.models import Category, Product

User = get_user_model()


class POSSalesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_sales", email="admin_sales@example.com", password="password123", role=User.Role.ADMIN
        )
        self.manager = User.objects.create_user(
            username="mgr_sales", email="mgr_sales@example.com", password="password123", role=User.Role.MANAGER
        )
        self.employee = User.objects.create_user(
            username="cashier_1", email="cashier@example.com", password="password123", role=User.Role.EMPLOYEE
        )

        self.category = Category.objects.create(name="Beverages")
        self.product = Product.objects.create(
            name="Green Tea 500ml",
            sku="TEA-001",
            category=self.category,
            purchase_price=Decimal("25.00"),
            selling_price=Decimal("50.00"),
            tax_rate=Decimal("18.00"),
            stock_quantity=20,
            minimum_stock=5,
        )
        self.product.refresh_status(save=True)

        self.customer = Customer.objects.create(
            name="Rohit Verma",
            phone="9876543210",
        )

    def test_successful_pos_checkout_with_customer(self):
        self.client.force_authenticate(user=self.employee)
        payload = {
            "customer_id": self.customer.id,
            "payment_method": "upi",
            "discount": "5.00",
            "items": [
                {
                    "product_id": self.product.id,
                    "quantity": 2,
                    "discount": "0.00",
                }
            ],
        }
        response = self.client.post("/api/pos/checkout/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data

        # 2 units * 50.00 = 100.00 subtotal
        # tax = 18% of 100.00 = 18.00
        # discount = 5.00
        # total_amount = 100.00 - 5.00 + 18.00 = 113.00
        self.assertEqual(Decimal(str(data["subtotal"])), Decimal("100.00"))
        self.assertEqual(Decimal(str(data["tax"])), Decimal("18.00"))
        self.assertEqual(Decimal(str(data["discount"])), Decimal("5.00"))
        self.assertEqual(Decimal(str(data["total_amount"])), Decimal("113.00"))
        self.assertEqual(data["payment_method"], "upi")
        self.assertEqual(data["customer_name"], "Rohit Verma")
        self.assertIsNotNone(data["invoice"]["invoice_number"])

        # Verify stock was decremented from 20 to 18
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 18)

        # Verify InventoryTransaction of type 'sale' was logged
        tx = InventoryTransaction.objects.filter(product=self.product).order_by("-created_at").first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.transaction_type, InventoryTransaction.TransactionType.SALE)
        self.assertEqual(tx.quantity, -2)
        self.assertEqual(tx.previous_stock, 20)
        self.assertEqual(tx.new_stock, 18)
        self.assertEqual(tx.reference, data["order_number"])

        # Verify Customer analytics updated
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.total_purchases, 1)
        self.assertEqual(self.customer.total_amount_spent, Decimal("113.00"))
        self.assertIsNotNone(self.customer.last_purchase_date)

    def test_walk_in_checkout_without_customer(self):
        self.client.force_authenticate(user=self.employee)
        payload = {
            "payment_method": "cash",
            "items": [
                {
                    "product_id": self.product.id,
                    "quantity": 1,
                }
            ],
        }
        response = self.client.post("/api/pos/checkout/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["customer_name"], "Walk-in Customer")
        self.assertIsNone(response.data["customer"])

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 19)

    def test_overselling_rejected_with_error(self):
        self.client.force_authenticate(user=self.employee)
        payload = {
            "payment_method": "cash",
            "items": [
                {
                    "product_id": self.product.id,
                    "quantity": 50,  # Only 20 in stock!
                }
            ],
        }
        response = self.client.post("/api/pos/checkout/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Insufficient stock", response.data["detail"])

        # Stock should remain unchanged
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 20)
        self.assertEqual(Order.objects.count(), 0)

    def test_pos_product_catalog_listing(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/pos/products/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["sku"], "TEA-001")

        # Barcode match
        res_barcode = self.client.get("/api/pos/products/?barcode=TEA-001")
        self.assertEqual(res_barcode.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_barcode.data), 1)

    def test_order_cancellation_manager_success(self):
        # 1. Complete an order
        self.client.force_authenticate(user=self.employee)
        payload = {
            "customer_id": self.customer.id,
            "payment_method": "cash",
            "items": [{"product_id": self.product.id, "quantity": 3}],
        }
        res_order = self.client.post("/api/pos/checkout/", payload, format="json")
        order_id = res_order.data["id"]
        order_amount = Decimal(str(res_order.data["total_amount"]))

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 17)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.total_purchases, 1)

        # 2. Cancel the order as manager
        self.client.force_authenticate(user=self.manager)
        cancel_res = self.client.post(f"/api/orders/{order_id}/cancel/", {"reason": "Customer returned unopened bottles"}, format="json")
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_res.data["status"], "cancelled")

        # 3. Verify stock restored (+3 back to 20)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 20)

        # 4. Verify InventoryTransaction RETURN was recorded
        return_tx = InventoryTransaction.objects.filter(product=self.product, transaction_type=InventoryTransaction.TransactionType.RETURN).first()
        self.assertIsNotNone(return_tx)
        self.assertEqual(return_tx.quantity, 3)
        self.assertEqual(return_tx.new_stock, 20)

        # 5. Verify customer analytics reversed
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.total_purchases, 0)
        self.assertEqual(self.customer.total_amount_spent, Decimal("0.00"))

    def test_order_cancellation_employee_forbidden(self):
        order = Order.objects.create(subtotal=Decimal("50.00"), total_amount=Decimal("50.00"))
        self.client.force_authenticate(user=self.employee)
        res = self.client.post(f"/api/orders/{order.id}/cancel/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_invoices_list_and_detail(self):
        order = Order.objects.create(
            subtotal=Decimal("100.00"),
            total_amount=Decimal("118.00"),
            payment_method=Order.PaymentMethod.CARD,
            created_by=self.employee,
        )
        invoice = Invoice.objects.create(order=order, total_amount=Decimal("118.00"))

        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/invoices/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["invoice_number"], invoice.invoice_number)
