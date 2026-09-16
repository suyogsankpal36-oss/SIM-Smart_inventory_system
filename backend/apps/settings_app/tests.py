from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import BusinessSettings

User = get_user_model()


class BusinessSettingsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_set", email="admin_set@example.com", password="password123", role=User.Role.ADMIN
        )
        self.manager = User.objects.create_user(
            username="mgr_set", email="mgr_set@example.com", password="password123", role=User.Role.MANAGER
        )
        self.employee = User.objects.create_user(
            username="emp_set", email="emp_set@example.com", password="password123", role=User.Role.EMPLOYEE
        )

    def test_authenticated_user_can_read_settings(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/settings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("business_name", response.data)
        self.assertIn("currency", response.data)
        self.assertIn("default_tax_rate", response.data)
        self.assertIn("low_stock_threshold", response.data)
        self.assertEqual(response.data["currency"], "INR")

    def test_unauthenticated_user_rejected(self):
        response = self.client.get("/api/settings/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_update_settings(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "business_name": "Apex Retail Enterprises",
            "address": "100 MG Road, Fort",
            "phone": "+91 9876543210",
            "email": "contact@apexretail.in",
            "gst_number": "27aaact1234a1z5",
            "currency": "INR",
            "currency_symbol": "₹",
            "default_tax_rate": "18.00",
            "low_stock_threshold": 10,
            "invoice_prefix": "APX",
        }
        response = self.client.patch("/api/settings/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["business_name"], "Apex Retail Enterprises")
        # GSTIN and invoice prefix should be auto-uppercased
        self.assertEqual(response.data["gst_number"], "27AAACT1234A1Z5")
        self.assertEqual(response.data["invoice_prefix"], "APX")
        self.assertEqual(response.data["low_stock_threshold"], 10)

        # Confirm singleton in DB
        settings_obj = BusinessSettings.load()
        self.assertEqual(settings_obj.business_name, "Apex Retail Enterprises")
        self.assertEqual(settings_obj.pk, 1)

    def test_employee_and_manager_forbidden_from_updating(self):
        # Employee forbidden
        self.client.force_authenticate(user=self.employee)
        res_emp = self.client.patch("/api/settings/", {"business_name": "Hacked"}, format="json")
        self.assertEqual(res_emp.status_code, status.HTTP_403_FORBIDDEN)

        # Manager forbidden
        self.client.force_authenticate(user=self.manager)
        res_mgr = self.client.patch("/api/settings/", {"business_name": "Hacked By Mgr"}, format="json")
        self.assertEqual(res_mgr.status_code, status.HTTP_403_FORBIDDEN)

    def test_validation_invalid_tax_rate(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.patch("/api/settings/", {"default_tax_rate": "150.00"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res_neg = self.client.patch("/api/settings/", {"default_tax_rate": "-5.00"}, format="json")
        self.assertEqual(res_neg.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation_invalid_threshold(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.patch("/api/settings/", {"low_stock_threshold": 0}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_singleton_enforcement(self):
        s1 = BusinessSettings.load()
        self.assertEqual(s1.pk, 1)
        s2 = BusinessSettings.load()
        self.assertEqual(s2.pk, 1)
        self.assertEqual(BusinessSettings.objects.count(), 1)
