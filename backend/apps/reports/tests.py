import datetime
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.customers.models import Customer
from apps.expenses.models import Expense
from apps.products.models import Category, Product
from apps.sales.models import Order, OrderItem

User = get_user_model()


class ReportsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_rep", email="admin_rep@example.com", password="password123", role=User.Role.ADMIN
        )
        self.manager = User.objects.create_user(
            username="mgr_rep", email="mgr_rep@example.com", password="password123", role=User.Role.MANAGER
        )
        self.employee = User.objects.create_user(
            username="emp_rep", email="emp_rep@example.com", password="password123", role=User.Role.EMPLOYEE
        )

        self.category = Category.objects.create(name="Beverages")
        self.p1 = Product.objects.create(
            name="Organic Green Tea",
            sku="TEA-001",
            category=self.category,
            purchase_price=Decimal("100.00"),
            selling_price=Decimal("150.00"),
            stock_quantity=50,
            minimum_stock=10,
            status=Product.Status.IN_STOCK,
        )
        self.p2 = Product.objects.create(
            name="Arabica Coffee Beans",
            sku="COF-001",
            category=self.category,
            purchase_price=Decimal("200.00"),
            selling_price=Decimal("300.00"),
            stock_quantity=5,
            minimum_stock=10,
            status=Product.Status.LOW_STOCK,
        )

        self.customer = Customer.objects.create(name="Report Customer", phone="9998887771")

        # Create completed order: 2 Tea (300.00) + 1 Coffee (300.00) = 600.00
        # Cost = (2 * 100) + (1 * 200) = 400.00
        # Gross profit = 600 - 400 = 200.00
        self.order = Order.objects.create(
            customer=self.customer,
            subtotal=Decimal("600.00"),
            tax=Decimal("0.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("600.00"),
            payment_method=Order.PaymentMethod.UPI,
            status=Order.Status.COMPLETED,
            created_by=self.manager,
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.p1,
            quantity=2,
            price=Decimal("150.00"),
            total=Decimal("300.00"),
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.p2,
            quantity=1,
            price=Decimal("300.00"),
            total=Decimal("300.00"),
        )

        # Operating expense: Rent = 50.00
        today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
        self.expense = Expense.objects.create(
            category=Expense.Category.RENT,
            description="Office rent",
            amount=Decimal("50.00"),
            payment_method=Expense.PaymentMethod.BANK_TRANSFER,
            date=today,
            created_by=self.manager,
        )

    def test_sales_report(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/reports/sales/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["total_orders"], 1)
        self.assertEqual(data["net_sales"], 600.0)
        self.assertEqual(data["total_items_sold"], 3)
        self.assertEqual(data["average_order_value"], 600.0)
        self.assertGreaterEqual(len(data["top_products"]), 2)
        self.assertEqual(data["top_products"][0]["sku"], "TEA-001")
        self.assertEqual(data["top_products"][0]["units_sold"], 2)

    def test_inventory_report(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/reports/inventory/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["total_skus"], 2)
        self.assertEqual(data["total_units"], 55)
        # Cost: (50 * 100) + (5 * 200) = 5000 + 1000 = 6000
        # Retail: (50 * 150) + (5 * 300) = 7500 + 1500 = 9000
        self.assertEqual(data["cost_valuation"], 6000.0)
        self.assertEqual(data["retail_valuation"], 9000.0)
        self.assertEqual(data["potential_profit"], 3000.0)
        self.assertAlmostEqual(data["unrealized_margin_percentage"], 33.3, places=1)
        self.assertEqual(data["low_stock_count"], 1)
        self.assertEqual(len(data["replenishment_list"]), 1)
        self.assertEqual(data["replenishment_list"][0]["sku"], "COF-001")

    def test_expenses_report(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/reports/expenses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["total_expenses"], 50.0)
        self.assertEqual(data["total_count"], 1)
        self.assertEqual(len(data["category_breakdown"]), 1)
        self.assertEqual(data["category_breakdown"][0]["category"], "rent")

    def test_profit_loss_report(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/reports/profit-loss/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["net_sales"], 600.0)
        self.assertEqual(data["cogs"], 400.0)
        self.assertEqual(data["gross_profit"], 200.0)
        self.assertAlmostEqual(data["gross_margin_percentage"], 33.3, places=1)
        self.assertEqual(data["operating_expenses"], 50.0)
        # Net Profit = 200.0 - 50.0 = 150.0
        self.assertEqual(data["net_profit"], 150.0)
        self.assertEqual(data["net_margin_percentage"], 25.0)

    def test_csv_export_endpoint(self):
        self.client.force_authenticate(user=self.manager)
        for r_type in ["sales", "inventory", "expenses", "profit_loss"]:
            res = self.client.get(f"/api/reports/export/?report_type={r_type}")
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertEqual(res["Content-Type"], "text/csv")
            self.assertIn("attachment; filename=", res["Content-Disposition"])
            self.assertGreater(len(res.content), 0)

    def test_employee_forbidden_from_reports(self):
        self.client.force_authenticate(user=self.employee)
        res = self.client.get("/api/reports/sales/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        res = self.client.get("/api/reports/profit-loss/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        res = self.client.get("/api/reports/export/?report_type=sales")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
