from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Supplier

User = get_user_model()


class SupplierAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_sup", email="admin_sup@example.com", password="password123", role=User.Role.ADMIN
        )
        self.manager = User.objects.create_user(
            username="mgr_sup", email="mgr_sup@example.com", password="password123", role=User.Role.MANAGER
        )
        self.employee = User.objects.create_user(
            username="emp_sup", email="emp_sup@example.com", password="password123", role=User.Role.EMPLOYEE
        )

    def test_manager_can_create_supplier(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            "name": "Tata Consumer Distribution Ltd",
            "contact_person": "Vikram Malhotra",
            "phone": "+91 9876543210",
            "email": "supply@tataconsumer.com",
            "gst_number": "27aaact1234a1z5",
            "city": "Mumbai",
            "state": "Maharashtra",
            "payment_terms": Supplier.PaymentTerms.NET_30,
            "status": Supplier.Status.ACTIVE,
        }
        response = self.client.post("/api/suppliers/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Tata Consumer Distribution Ltd")
        # GSTIN should be uppercase
        self.assertEqual(response.data["gst_number"], "27AAACT1234A1Z5")
        self.assertEqual(Supplier.objects.count(), 1)

    def test_employee_can_list_and_lookup_supplier(self):
        s1 = Supplier.objects.create(
            name="Britannia Industries",
            contact_person="Anita Roy",
            phone="9123456789",
            city="Bengaluru",
            status=Supplier.Status.ACTIVE,
        )
        Supplier.objects.create(
            name="Inactive Vendor",
            phone="9000000000",
            status=Supplier.Status.INACTIVE,
        )

        self.client.force_authenticate(user=self.employee)
        # List
        res_list = self.client.get("/api/suppliers/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        results = res_list.data.get("results", res_list.data)
        self.assertEqual(len(results), 2)

        # Lookup should only return active vendors matching query
        res_lookup = self.client.get("/api/suppliers/lookup/?q=Britannia")
        self.assertEqual(res_lookup.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_lookup.data), 1)
        self.assertEqual(res_lookup.data[0]["name"], "Britannia Industries")

    def test_manager_can_update_supplier(self):
        sup = Supplier.objects.create(name="Nestle India", phone="9988776655", city="Delhi")
        self.client.force_authenticate(user=self.manager)
        response = self.client.patch(
            f"/api/suppliers/{sup.id}/",
            {"contact_person": "Rohan Gupta", "payment_terms": "net_60"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sup.refresh_from_db()
        self.assertEqual(sup.contact_person, "Rohan Gupta")
        self.assertEqual(sup.payment_terms, "net_60")

    def test_employee_and_manager_forbidden_from_deleting(self):
        sup = Supplier.objects.create(name="Supplier To Preserve", phone="9898989898")

        # Employee cannot delete
        self.client.force_authenticate(user=self.employee)
        res_emp = self.client.delete(f"/api/suppliers/{sup.id}/")
        self.assertEqual(res_emp.status_code, status.HTTP_403_FORBIDDEN)

        # Manager cannot delete
        self.client.force_authenticate(user=self.manager)
        res_mgr = self.client.delete(f"/api/suppliers/{sup.id}/")
        self.assertEqual(res_mgr.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Supplier.objects.filter(id=sup.id).exists())

    def test_admin_can_delete_supplier(self):
        sup = Supplier.objects.create(name="Supplier Admin Delete", phone="9111111111")
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/suppliers/{sup.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Supplier.objects.filter(id=sup.id).exists())

    def test_filter_and_search(self):
        Supplier.objects.create(
            name="Parle Agro", contact_person="Suresh", phone="9444455555", city="Mumbai", status=Supplier.Status.ACTIVE
        )
        Supplier.objects.create(
            name="Amul Dairy", contact_person="Ramesh", phone="9333322222", city="Anand", status=Supplier.Status.ACTIVE
        )

        self.client.force_authenticate(user=self.employee)
        # Search by name
        res = self.client.get("/api/suppliers/?search=Parle")
        results = res.data.get("results", res.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Parle Agro")

        # Filter by city
        res_city = self.client.get("/api/suppliers/?city=Anand")
        results_city = res_city.data.get("results", res_city.data)
        self.assertEqual(len(results_city), 1)
        self.assertEqual(results_city[0]["name"], "Amul Dairy")
