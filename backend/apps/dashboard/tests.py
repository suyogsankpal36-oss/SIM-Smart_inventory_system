from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.expenses.models import Expense
from apps.products.models import Category, Product
from apps.sales.models import Order
from apps.settings_app.models import BusinessSettings

User = get_user_model()


class DashboardApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="dashuser",
            email="dash@example.com",
            password="Password123!",
            role=User.Role.ADMIN,
        )
        self.dashboard_url = reverse("dashboard-stats")

        # Create settings
        settings = BusinessSettings.load()
        settings.business_name = "Apex Retail"
        settings.currency_symbol = "₹"
        settings.save()

        # Create category and products
        category = Category.objects.create(name="Electronics")
        self.prod1 = Product.objects.create(
            name="Wireless Mouse",
            sku="PRD-MSE-01",
            category=category,
            purchase_price=Decimal("250.00"),
            selling_price=Decimal("450.00"),
            stock_quantity=2,  # Low stock (<= minimum_stock 5)
            minimum_stock=5,
        )
        self.prod2 = Product.objects.create(
            name="Mechanical Keyboard",
            sku="PRD-KBD-02",
            category=category,
            purchase_price=Decimal("1200.00"),
            selling_price=Decimal("2200.00"),
            stock_quantity=20,  # In stock
            minimum_stock=5,
        )

        # Create customer and order
        self.customer = Customer.objects.create(
            name="Alice Walker",
            email="alice@example.com",
        )
        self.order = Order.objects.create(
            customer=self.customer,
            subtotal=Decimal("450.00"),
            total_amount=Decimal("450.00"),
            payment_method=Order.PaymentMethod.CASH,
            status=Order.Status.COMPLETED,
            created_by=self.user,
        )

        # Create expense
        Expense.objects.create(
            category=Expense.Category.RENT,
            description="Office monthly rent",
            amount=Decimal("150.00"),
            date=timezone.now().date(),
            created_by=self.user,
        )

    def test_unauthenticated_access_denied(self):
        res = self.client.get(self.dashboard_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_dashboard_metrics(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get(self.dashboard_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Verify payload structure
        self.assertIn("business", res.data)
        self.assertIn("kpis", res.data)
        self.assertIn("sales_trend_7d", res.data)
        self.assertIn("monthly_comparison_6m", res.data)
        self.assertIn("recent_orders", res.data)
        self.assertIn("low_stock_items", res.data)

        # Verify KPI values
        kpis = res.data["kpis"]
        self.assertEqual(kpis["total_sales"], 450.0)
        self.assertEqual(kpis["today_sales"], 450.0)
        self.assertEqual(kpis["today_orders_count"], 1)
        self.assertEqual(kpis["total_products"], 2)
        self.assertEqual(kpis["low_stock_count"], 1)
        self.assertEqual(kpis["total_customers"], 1)

        # Verify Recent Orders
        recent = res.data["recent_orders"]
        self.assertEqual(len(recent), 1)
        self.assertEqual(recent[0]["customer_name"], "Alice Walker")
        self.assertEqual(recent[0]["total_amount"], 450.0)

        # Verify Low Stock
        low_stock = res.data["low_stock_items"]
        self.assertEqual(len(low_stock), 1)
        self.assertEqual(low_stock[0]["sku"], "PRD-MSE-01")

        # Verify 7-day trend series length
        self.assertEqual(len(res.data["sales_trend_7d"]), 7)
        # Verify 6-month series length
        self.assertEqual(len(res.data["monthly_comparison_6m"]), 6)
