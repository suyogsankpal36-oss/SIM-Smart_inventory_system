from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Category, Product
from apps.inventory.models import InventoryTransaction

User = get_user_model()


class CategoryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username="admin_cat", email="admin_cat@example.com", password="password123", role=User.Role.ADMIN
        )
        self.employee_user = User.objects.create_user(
            username="emp_cat", email="emp_cat@example.com", password="password123", role=User.Role.EMPLOYEE
        )

    def test_create_category_admin_success(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            "/api/products/categories/",
            {"name": "Electronics", "description": "Gadgets & Hardware", "status": "active"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Electronics")
        self.assertEqual(Category.objects.count(), 1)

    def test_create_category_employee_forbidden(self):
        self.client.force_authenticate(user=self.employee_user)
        response = self.client.post(
            "/api/products/categories/",
            {"name": "Appliances", "status": "active"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_categories_with_product_count(self):
        cat = Category.objects.create(name="Groceries")
        Product.objects.create(
            name="Apple",
            sku="APP-001",
            category=cat,
            purchase_price=Decimal("20.00"),
            selling_price=Decimal("30.00"),
            stock_quantity=50,
        )

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get("/api/products/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check pagination or results list
        results = response.data.get("results", response.data)
        groceries = next(item for item in results if item["name"] == "Groceries")
        self.assertEqual(groceries["product_count"], 1)

    def test_prevent_category_delete_with_linked_products(self):
        cat = Category.objects.create(name="Hardware")
        Product.objects.create(
            name="Hammer",
            sku="HAM-001",
            category=cat,
            purchase_price=Decimal("150.00"),
            selling_price=Decimal("250.00"),
            stock_quantity=10,
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f"/api/products/categories/{cat.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("associated product", response.data["detail"])
        self.assertTrue(Category.objects.filter(id=cat.id).exists())


class ProductAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_prod", email="admin_prod@example.com", password="password123", role=User.Role.ADMIN
        )
        self.employee = User.objects.create_user(
            username="emp_prod", email="emp_prod@example.com", password="password123", role=User.Role.EMPLOYEE
        )
        self.category = Category.objects.create(name="Stationery")

    def test_create_product_with_initial_stock(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Ballpoint Pen",
            "sku": "PEN-001",
            "category": self.category.id,
            "purchase_price": "10.00",
            "selling_price": "20.00",
            "tax_rate": "18.00",
            "minimum_stock": 5,
            "initial_stock": 100,
        }
        response = self.client.post("/api/products/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "in_stock")
        self.assertEqual(response.data["stock_quantity"], 100)

        # Confirm initial InventoryTransaction record was created automatically
        tx = InventoryTransaction.objects.filter(product__sku="PEN-001").first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.quantity, 100)
        self.assertEqual(tx.previous_stock, 0)
        self.assertEqual(tx.new_stock, 100)
        self.assertEqual(tx.reference, "INITIAL-STOCK")

    def test_create_product_out_of_stock_status(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Notebook",
            "sku": "NOT-001",
            "category": self.category.id,
            "purchase_price": "40.00",
            "selling_price": "70.00",
            "minimum_stock": 5,
            "initial_stock": 0,
        }
        response = self.client.post("/api/products/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "out_of_stock")
        self.assertEqual(response.data["stock_quantity"], 0)

    def test_generate_sku_endpoint(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/products/generate-sku/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["sku"].startswith("PRD-"))

    def test_duplicate_sku_rejected(self):
        Product.objects.create(
            name="Existing Product",
            sku="DUP-001",
            purchase_price=Decimal("5.00"),
            selling_price=Decimal("10.00"),
        )
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "New Product",
            "sku": "DUP-001",
            "purchase_price": "5.00",
            "selling_price": "10.00",
        }
        response = self.client.post("/api/products/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_and_low_stock_filters(self):
        p1 = Product.objects.create(
            name="Gaming Mouse",
            sku="MOU-001",
            purchase_price=Decimal("500.00"),
            selling_price=Decimal("800.00"),
            stock_quantity=2,
            minimum_stock=5,
        )
        p1.refresh_status(save=True)

        p2 = Product.objects.create(
            name="Office Keyboard",
            sku="KEY-001",
            purchase_price=Decimal("400.00"),
            selling_price=Decimal("600.00"),
            stock_quantity=25,
            minimum_stock=5,
        )
        p2.refresh_status(save=True)

        self.client.force_authenticate(user=self.employee)

        # Search by keyword
        resp_search = self.client.get("/api/products/?search=Gaming")
        self.assertEqual(resp_search.status_code, status.HTTP_200_OK)
        results = resp_search.data.get("results", resp_search.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["sku"], "MOU-001")

        # Low stock filter
        resp_low = self.client.get("/api/products/?low_stock=true")
        self.assertEqual(resp_low.status_code, status.HTTP_200_OK)
        results_low = resp_low.data.get("results", resp_low.data)
        self.assertEqual(len(results_low), 1)
        self.assertEqual(results_low[0]["sku"], "MOU-001")

    def test_barcode_svg_endpoints(self):
        p = Product.objects.create(
            name="Laser Printer",
            sku="PRN-001",
            purchase_price=Decimal("8000.00"),
            selling_price=Decimal("12000.00"),
        )
        self.client.force_authenticate(user=self.employee)

        # Code128 Barcode
        res_bc = self.client.get(f"/api/products/{p.id}/barcode/?type=code128")
        self.assertEqual(res_bc.status_code, status.HTTP_200_OK)
        self.assertEqual(res_bc["Content-Type"], "image/svg+xml")
        self.assertIn(b"<svg", res_bc.content)

        # QR Code
        res_qr = self.client.get(f"/api/products/{p.id}/barcode/?type=qr")
        self.assertEqual(res_qr.status_code, status.HTTP_200_OK)
        self.assertEqual(res_qr["Content-Type"], "image/svg+xml")
        self.assertIn(b"<svg", res_qr.content)

    def test_single_and_batch_label_pdf_endpoints(self):
        p = Product.objects.create(
            name="USB Flash Drive",
            sku="USB-064",
            purchase_price=Decimal("300.00"),
            selling_price=Decimal("550.00"),
        )
        self.client.force_authenticate(user=self.employee)

        # Single Label PDF
        res_pdf = self.client.get(f"/api/products/{p.id}/label-pdf/?quantity=2&layout=a4_24")
        self.assertEqual(res_pdf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pdf["Content-Type"], "application/pdf")
        self.assertTrue(len(res_pdf.content) > 1000)

        # Batch Labels PDF
        batch_payload = {
            "items": [{"product_id": p.id, "quantity": 4}],
            "layout": "a4_24",
        }
        res_batch = self.client.post("/api/products/batch-labels-pdf/", batch_payload, format="json")
        self.assertEqual(res_batch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_batch["Content-Type"], "application/pdf")
        self.assertTrue(len(res_batch.content) > 1000)

