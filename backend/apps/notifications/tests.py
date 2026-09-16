from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Category, Product
from .models import Notification

User = get_user_model()


class NotificationTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
        )
        self.category = Category.objects.create(name="Electronics", status="active")
        self.list_url = reverse("notification-list")
        self.unread_count_url = reverse("notification-unread-count")
        self.mark_all_read_url = reverse("notification-mark-all-read")
        self.clear_read_url = reverse("notification-clear-read")

    def test_low_stock_notification_triggered(self):
        # Create product with stock <= minimum_stock
        product = Product.objects.create(
            name="Wireless Mouse",
            sku="WM-001",
            category=self.category,
            purchase_price=Decimal("200.00"),
            selling_price=Decimal("450.00"),
            stock_quantity=4,
            minimum_stock=10,
        )

        alert = Notification.objects.filter(reference_id=str(product.id), is_read=False).first()
        self.assertIsNotNone(alert)
        self.assertEqual(alert.notification_type, Notification.NotificationType.LOW_STOCK)
        self.assertEqual(alert.severity, Notification.Severity.WARNING)
        self.assertIn("Wireless Mouse", alert.title)

    def test_out_of_stock_critical_notification(self):
        product = Product.objects.create(
            name="Mechanical Keyboard",
            sku="KB-001",
            category=self.category,
            purchase_price=Decimal("1200.00"),
            selling_price=Decimal("2500.00"),
            stock_quantity=0,
            minimum_stock=5,
        )

        alert = Notification.objects.filter(reference_id=str(product.id), is_read=False).first()
        self.assertIsNotNone(alert)
        self.assertEqual(alert.notification_type, Notification.NotificationType.OUT_OF_STOCK)
        self.assertEqual(alert.severity, Notification.Severity.CRITICAL)

    def test_auto_resolve_when_restocked(self):
        product = Product.objects.create(
            name="USB-C Hub",
            sku="HUB-001",
            category=self.category,
            purchase_price=Decimal("500.00"),
            selling_price=Decimal("999.00"),
            stock_quantity=2,
            minimum_stock=5,
        )

        # Confirm unread alert exists
        alert = Notification.objects.filter(reference_id=str(product.id), is_read=False).first()
        self.assertIsNotNone(alert)

        # Restock product
        product.stock_quantity = 25
        product.save()

        # Alert should now be marked as read
        alert.refresh_from_db()
        self.assertTrue(alert.is_read)
        self.assertIsNotNone(alert.read_at)

    def test_unread_count_and_list_endpoints(self):
        self.client.force_authenticate(user=self.admin_user)

        # Clean notifications
        Notification.objects.all().delete()

        Notification.objects.create(
            title="Alert 1",
            message="Test message 1",
            notification_type=Notification.NotificationType.SYSTEM,
            severity=Notification.Severity.INFO,
        )
        Notification.objects.create(
            title="Alert 2",
            message="Test message 2",
            notification_type=Notification.NotificationType.LOW_STOCK,
            severity=Notification.Severity.WARNING,
        )

        res = self.client.get(self.unread_count_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["unread_count"], 2)

        list_res = self.client.get(self.list_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        count = list_res.data["count"] if "count" in list_res.data else len(list_res.data)
        self.assertEqual(count, 2)

    def test_mark_individual_and_all_read(self):
        self.client.force_authenticate(user=self.admin_user)
        notif = Notification.objects.create(
            title="Unread Notice",
            message="Needs reading",
            notification_type=Notification.NotificationType.SYSTEM,
        )

        mark_url = reverse("notification-mark-read", kwargs={"pk": notif.id})
        res = self.client.post(mark_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["is_read"])

        # Create another unread
        Notification.objects.create(
            title="Another Unread",
            message="Needs reading too",
            notification_type=Notification.NotificationType.SYSTEM,
        )
        all_res = self.client.post(self.mark_all_read_url)
        self.assertEqual(all_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(is_read=False).count(), 0)

    def test_clear_read_notifications(self):
        self.client.force_authenticate(user=self.admin_user)
        Notification.objects.create(
            title="Read Alert",
            message="Already read",
            is_read=True,
        )
        Notification.objects.create(
            title="Still Unread",
            message="Pending action",
            is_read=False,
        )

        res = self.client.delete(self.clear_read_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(is_read=True).count(), 0)
        self.assertEqual(Notification.objects.filter(is_read=False).count(), 1)
