from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import InventoryTransaction
from apps.products.models import Category, Product

User = get_user_model()


class InventoryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_inv", email="admin_inv@example.com", password="password123", role=User.Role.ADMIN
        )
        self.manager = User.objects.create_user(
            username="mgr_inv", email="mgr_inv@example.com", password="password123", role=User.Role.MANAGER
        )
        self.employee = User.objects.create_user(
            username="emp_inv", email="emp_inv@example.com", password="password123", role=User.Role.EMPLOYEE
        )

        self.category = Category.objects.create(name="Beverages")
        self.product = Product.objects.create(
            name="Mineral Water 1L",
            sku="WAT-001",
            category=self.category,
            purchase_price=Decimal("12.00"),
            selling_price=Decimal("20.00"),
            stock_quantity=20,
            minimum_stock=10,
        )
        self.product.refresh_status(save=True)

    def test_stock_in_success(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            "product_id": self.product.id,
            "adjustment_type": "stock_in",
            "quantity": 30,
            "reference": "PO-2026-01",
            "notes": "Received 30 bottles",
        }
        response = self.client.post("/api/inventory/adjust/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["new_stock"], 50)
        self.assertEqual(response.data["previous_stock"], 20)
        self.assertEqual(response.data["quantity"], 30)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 50)
        self.assertEqual(self.product.status, Product.Status.IN_STOCK)

    def test_stock_out_success(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            "product_id": self.product.id,
            "adjustment_type": "stock_out",
            "quantity": 15,
            "reference": "DMG-001",
            "notes": "Damaged batch discarded",
        }
        response = self.client.post("/api/inventory/adjust/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["new_stock"], 5)
        self.assertEqual(response.data["previous_stock"], 20)
        self.assertEqual(response.data["quantity"], -15)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 5)
        # 5 <= minimum_stock (10) -> should be low_stock
        self.assertEqual(self.product.status, Product.Status.LOW_STOCK)

    def test_stock_out_exceeding_current_rejected(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            "product_id": self.product.id,
            "adjustment_type": "stock_out",
            "quantity": 50,  # Only 20 available
            "reference": "REQ-001",
        }
        response = self.client.post("/api/inventory/adjust/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 20)

    def test_physical_count_adjustment(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            "product_id": self.product.id,
            "adjustment_type": "adjustment",
            "quantity": 8,  # physical count found 8 instead of 20
            "reference": "AUDIT-FEB",
            "notes": "Reconciliation after stock take",
        }
        response = self.client.post("/api/inventory/adjust/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["new_stock"], 8)
        self.assertEqual(response.data["previous_stock"], 20)
        self.assertEqual(response.data["quantity"], -12)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 8)

    def test_employee_forbidden_from_adjusting(self):
        self.client.force_authenticate(user=self.employee)
        payload = {
            "product_id": self.product.id,
            "adjustment_type": "stock_in",
            "quantity": 10,
        }
        response = self.client.post("/api/inventory/adjust/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_inventory_summary_metrics(self):
        # Product 1: 20 units * 12.00 cost = 240.00; 20 units * 20.00 retail = 400.00
        # Create Product 2: 10 units * 50.00 cost = 500.00; 10 units * 80.00 retail = 800.00
        p2 = Product.objects.create(
            name="Orange Juice 1L",
            sku="JUI-001",
            category=self.category,
            purchase_price=Decimal("50.00"),
            selling_price=Decimal("80.00"),
            stock_quantity=10,
            minimum_stock=5,
        )
        p2.refresh_status(save=True)

        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/inventory/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["total_products"], 2)
        self.assertEqual(data["total_stock_units"], 30)
        self.assertEqual(data["total_cost_valuation"], 740.00)
        self.assertEqual(data["total_retail_valuation"], 1200.00)
        self.assertEqual(data["potential_profit"], 460.00)
