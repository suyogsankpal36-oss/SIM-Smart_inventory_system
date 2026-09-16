from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Customer
from apps.sales.models import Order

User = get_user_model()


class CustomerAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_cust", email="admin_cust@example.com", password="password123", role=User.Role.ADMIN
        )
        self.manager = User.objects.create_user(
            username="mgr_cust", email="mgr_cust@example.com", password="password123", role=User.Role.MANAGER
        )
        self.employee = User.objects.create_user(
            username="emp_cust", email="emp_cust@example.com", password="password123", role=User.Role.EMPLOYEE
        )

    def test_employee_can_create_customer(self):
        self.client.force_authenticate(user=self.employee)
        payload = {
            "name": "Tata Consumer Products",
            "email": "contact@tata.com",
            "phone": "+91 9876543210",
            "address": "Bombay House, Homi Mody Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "postal_code": "400001",
            "gst_number": "27aaact1234a1z5",
        }
        response = self.client.post("/api/customers/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Tata Consumer Products")
        # GSTIN should be uppercase
        self.assertEqual(response.data["gst_number"], "27AAACT1234A1Z5")
        self.assertEqual(Customer.objects.count(), 1)

    def test_search_customers_by_various_fields(self):
        c1 = Customer.objects.create(
            name="Reliance Mart",
            phone="9123456780",
            email="info@reliance.com",
            city="Ahmedabad",
            gst_number="24AAACR1234A1Z1",
        )
        c2 = Customer.objects.create(
            name="Infosys Campus Store",
            phone="9988776655",
            email="procure@infosys.com",
            city="Bengaluru",
            gst_number="29AAACI1234A1Z2",
        )

        self.client.force_authenticate(user=self.employee)

        # Search by name
        res_name = self.client.get("/api/customers/?search=Reliance")
        self.assertEqual(res_name.status_code, status.HTTP_200_OK)
        results = res_name.data.get("results", res_name.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Reliance Mart")

        # Search by phone
        res_phone = self.client.get("/api/customers/?search=998877")
        self.assertEqual(res_phone.status_code, status.HTTP_200_OK)
        results = res_phone.data.get("results", res_phone.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Infosys Campus Store")

        # Search by GSTIN
        res_gst = self.client.get("/api/customers/?search=24AAACR")
        self.assertEqual(res_gst.status_code, status.HTTP_200_OK)
        results = res_gst.data.get("results", res_gst.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Reliance Mart")

    def test_customer_detail_includes_recent_orders(self):
        cust = Customer.objects.create(
            name="Adani Enterprises",
            phone="9000000001",
            total_purchases=1,
            total_amount_spent=Decimal("15000.00"),
        )
        order = Order.objects.create(
            customer=cust,
            subtotal=Decimal("15000.00"),
            total_amount=Decimal("15000.00"),
            payment_method=Order.PaymentMethod.UPI,
            created_by=self.employee,
        )

        self.client.force_authenticate(user=self.employee)
        response = self.client.get(f"/api/customers/{cust.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("recent_orders", response.data)
        self.assertEqual(len(response.data["recent_orders"]), 1)
        self.assertEqual(response.data["recent_orders"][0]["order_number"], order.order_number)

    def test_manager_can_update_customer(self):
        cust = Customer.objects.create(name="Wipro Ltd", city="Pune")
        self.client.force_authenticate(user=self.manager)
        response = self.client.patch(f"/api/customers/{cust.id}/", {"city": "Bengaluru"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cust.refresh_from_db()
        self.assertEqual(cust.city, "Bengaluru")

    def test_employee_forbidden_from_deleting_customer(self):
        cust = Customer.objects.create(name="Client to Delete")
        self.client.force_authenticate(user=self.employee)
        response = self.client.delete(f"/api/customers/{cust.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Customer.objects.filter(id=cust.id).exists())

    def test_admin_can_delete_customer(self):
        cust = Customer.objects.create(name="Client Admin Delete")
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/customers/{cust.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Customer.objects.filter(id=cust.id).exists())

    def test_top_customers_endpoint(self):
        Customer.objects.create(name="Top 1", total_purchases=5, total_amount_spent=Decimal("50000.00"))
        Customer.objects.create(name="Top 2", total_purchases=2, total_amount_spent=Decimal("20000.00"))
        Customer.objects.create(name="Zero Spend", total_purchases=0, total_amount_spent=Decimal("0.00"))

        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/customers/top/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["name"], "Top 1")
        self.assertEqual(response.data[1]["name"], "Top 2")

    def test_lookup_endpoint(self):
        Customer.objects.create(name="Sharma Electronics", phone="9898989898")
        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/customers/lookup/?q=Sharma")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Sharma Electronics")
