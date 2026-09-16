from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.products.models import Category, Product
from apps.sales.models import Order
from .models import ActivityLog
from .services import AuditService

User = get_user_model()


class AuditLogTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
        )
        self.employee_user = User.objects.create_user(
            username="empuser",
            email="employee@example.com",
            password="EmployeePassword123!",
            role=User.Role.EMPLOYEE,
        )
        self.category = Category.objects.create(name="Office Supplies", status="active")
        self.list_url = reverse("audit-log-list")
        self.stats_url = reverse("audit-log-stats")
        self.export_url = reverse("audit-log-export")

    def test_audit_service_logging(self):
        log = AuditService.log(
            action=ActivityLog.ActionType.UPDATE,
            module=ActivityLog.ModuleType.PRODUCTS,
            entity_name="Product: Premium Pen",
            entity_id="101",
            description="Price adjusted from ₹50 to ₹60",
            changes={"price": {"old": 50, "new": 60}},
            actor=self.admin_user,
            ip_address="192.168.1.100",
        )
        self.assertIsNotNone(log)
        self.assertEqual(log.actor, self.admin_user)
        self.assertEqual(log.action, ActivityLog.ActionType.UPDATE)
        self.assertEqual(log.module, ActivityLog.ModuleType.PRODUCTS)
        self.assertEqual(log.ip_address, "192.168.1.100")

    def test_admin_can_view_logs_and_filter(self):
        AuditService.log(
            action=ActivityLog.ActionType.CREATE,
            module=ActivityLog.ModuleType.CUSTOMERS,
            entity_name="Customer: Acme Corp",
            description="Acme Corp registered",
            actor=self.admin_user,
        )

        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get(self.list_url, {"module": "customers"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data["results"] if "results" in res.data else res.data
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0]["module"], "customers")

    def test_employee_forbidden_from_audit_logs(self):
        self.client.force_authenticate(user=self.employee_user)
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        stats_res = self.client.get(self.stats_url)
        self.assertEqual(stats_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_immutability_post_and_delete_not_allowed(self):
        self.client.force_authenticate(user=self.admin_user)
        # Attempt POST to create directly via API
        post_res = self.client.post(self.list_url, {"description": "Tampered entry"})
        self.assertEqual(post_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # Attempt DELETE
        log = ActivityLog.objects.create(
            description="Permanent record",
            entity_name="System",
            action=ActivityLog.ActionType.UPDATE,
            module=ActivityLog.ModuleType.SETTINGS,
        )
        detail_url = reverse("audit-log-detail", kwargs={"pk": log.id})
        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_stats_endpoint(self):
        self.client.force_authenticate(user=self.admin_user)
        AuditService.log(
            action=ActivityLog.ActionType.PRICE_CHANGE,
            module=ActivityLog.ModuleType.PRODUCTS,
            entity_name="Product: Laptop",
            description="Price change",
            actor=self.admin_user,
        )
        res = self.client.get(self.stats_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("total_logs", res.data)
        self.assertIn("today_logs", res.data)
        self.assertIn("action_counts", res.data)
        self.assertIn("module_counts", res.data)
        self.assertIn("top_actors", res.data)

    def test_export_csv_endpoint(self):
        self.client.force_authenticate(user=self.admin_user)
        AuditService.log(
            action=ActivityLog.ActionType.CREATE,
            module=ActivityLog.ModuleType.ACCOUNTS,
            entity_name="User: newstaff",
            description="New staff onboarded",
            actor=self.admin_user,
            ip_address="127.0.0.1",
        )
        res = self.client.get(self.export_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res["Content-Type"], "text/csv; charset=utf-8")
        content = res.content.decode("utf-8")
        self.assertIn("Timestamp (UTC)", content)
        self.assertIn("Actor Username", content)
        self.assertIn("newstaff", content)

    def test_signals_automatically_record_events(self):
        # 1. Product creation
        product = Product.objects.create(
            name="Wireless Barcode Scanner",
            sku="SCN-999",
            category=self.category,
            purchase_price=Decimal("1500.00"),
            selling_price=Decimal("2800.00"),
            stock_quantity=10,
            minimum_stock=2,
        )
        self.assertTrue(
            ActivityLog.objects.filter(
                module=ActivityLog.ModuleType.PRODUCTS,
                action=ActivityLog.ActionType.CREATE,
                entity_name__icontains="Wireless Barcode Scanner",
            ).exists()
        )

        # 2. Order creation
        customer = Customer.objects.create(name="Retail Customer")
        order = Order.objects.create(
            customer=customer,
            subtotal=Decimal("2800.00"),
            discount=Decimal("0.00"),
            tax=Decimal("0.00"),
            total_amount=Decimal("2800.00"),
            created_by=self.admin_user,
        )
        self.assertTrue(
            ActivityLog.objects.filter(
                module=ActivityLog.ModuleType.SALES,
                action=ActivityLog.ActionType.CREATE,
                entity_name__icontains=order.order_number,
            ).exists()
        )
