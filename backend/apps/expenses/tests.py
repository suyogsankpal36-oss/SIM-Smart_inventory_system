import datetime
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from .models import Expense

User = get_user_model()


class ExpenseAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_exp", email="admin_exp@example.com", password="password123", role=User.Role.ADMIN
        )
        self.manager = User.objects.create_user(
            username="mgr_exp", email="mgr_exp@example.com", password="password123", role=User.Role.MANAGER
        )
        self.employee = User.objects.create_user(
            username="emp_exp", email="emp_exp@example.com", password="password123", role=User.Role.EMPLOYEE
        )

    def test_manager_can_create_expense(self):
        self.client.force_authenticate(user=self.manager)
        today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
        payload = {
            "category": Expense.Category.RENT,
            "description": "Store front monthly lease",
            "amount": "25000.00",
            "payment_method": Expense.PaymentMethod.BANK_TRANSFER,
            "date": str(today),
            "notes": "Paid via NEFT reference #987654",
        }
        response = self.client.post("/api/expenses/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["description"], "Store front monthly lease")
        self.assertEqual(response.data["category"], "rent")
        self.assertEqual(response.data["category_display"], "Rent")
        self.assertEqual(response.data["created_by"], self.manager.id)
        self.assertEqual(Expense.objects.count(), 1)

    def test_invalid_amount_rejected(self):
        self.client.force_authenticate(user=self.manager)
        today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
        payload = {
            "category": Expense.Category.ELECTRICITY,
            "description": "Zero amount bill",
            "amount": "0.00",
            "date": str(today),
        }
        response = self.client.post("/api/expenses/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        err_dict = response.data.get("errors", response.data)
        self.assertIn("amount", err_dict)

        # Negative amount
        payload["amount"] = "-150.00"
        response = self.client.post("/api/expenses/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        err_dict = response.data.get("errors", response.data)
        self.assertIn("amount", err_dict)

    def test_employee_forbidden_from_expenses(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/expenses/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Employee cannot create either
        today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
        response = self.client.post(
            "/api/expenses/",
            {"category": "other", "description": "Tea", "amount": "50.00", "date": str(today)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_rejected(self):
        response = self.client.get("/api/expenses/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_manager_cannot_delete_expense(self):
        today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
        exp = Expense.objects.create(
            category=Expense.Category.MAINTENANCE,
            description="AC servicing",
            amount=Decimal("1200.00"),
            payment_method=Expense.PaymentMethod.CASH,
            date=today,
            created_by=self.manager,
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(f"/api/expenses/{exp.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Expense.objects.filter(id=exp.id).exists())

    def test_admin_can_delete_expense(self):
        today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
        exp = Expense.objects.create(
            category=Expense.Category.MARKETING,
            description="Banner printing",
            amount=Decimal("3500.00"),
            payment_method=Expense.PaymentMethod.UPI,
            date=today,
            created_by=self.admin,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/expenses/{exp.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Expense.objects.filter(id=exp.id).exists())

    def test_filter_and_search_expenses(self):
        today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
        past = today - datetime.timedelta(days=15)

        Expense.objects.create(
            category=Expense.Category.ELECTRICITY,
            description="Office Electricity bill",
            amount=Decimal("4500.00"),
            payment_method=Expense.PaymentMethod.UPI,
            date=today,
            notes="Mahavitaran bill",
            created_by=self.admin,
        )
        Expense.objects.create(
            category=Expense.Category.TRANSPORTATION,
            description="Freight delivery charges",
            amount=Decimal("1800.00"),
            payment_method=Expense.PaymentMethod.CASH,
            date=past,
            notes="Courier service",
            created_by=self.admin,
        )

        self.client.force_authenticate(user=self.admin)

        # Search by description
        res = self.client.get("/api/expenses/?search=Electricity")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        items = res.data.get("results", res.data)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["description"], "Office Electricity bill")

        # Filter by category
        res = self.client.get(f"/api/expenses/?category={Expense.Category.TRANSPORTATION}")
        items = res.data.get("results", res.data)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["category"], "transportation")

        # Filter by date range
        res = self.client.get(f"/api/expenses/?from_date={str(today)}")
        items = res.data.get("results", res.data)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["description"], "Office Electricity bill")

    def test_summary_endpoint(self):
        today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
        Expense.objects.create(
            category=Expense.Category.RENT,
            description="Rent",
            amount=Decimal("10000.00"),
            payment_method=Expense.PaymentMethod.BANK_TRANSFER,
            date=today,
            created_by=self.admin,
        )
        Expense.objects.create(
            category=Expense.Category.SALARY,
            description="Staff salary",
            amount=Decimal("15000.00"),
            payment_method=Expense.PaymentMethod.BANK_TRANSFER,
            date=today,
            created_by=self.admin,
        )

        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/expenses/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["today_total"], 25000.0)
        self.assertEqual(data["today_count"], 2)
        self.assertEqual(data["month_total"], 25000.0)
        self.assertEqual(data["total_count"], 2)
        self.assertGreaterEqual(len(data["category_breakdown"]), 2)
        self.assertIn("monthly_trend", data)

    def test_categories_and_payment_methods_endpoints(self):
        self.client.force_authenticate(user=self.manager)
        res_cat = self.client.get("/api/expenses/categories/")
        self.assertEqual(res_cat.status_code, status.HTTP_200_OK)
        self.assertTrue(any(c["value"] == "rent" for c in res_cat.data))

        res_pm = self.client.get("/api/expenses/payment-methods/")
        self.assertEqual(res_pm.status_code, status.HTTP_200_OK)
        self.assertTrue(any(pm["value"] == "cash" for pm in res_pm.data))
