from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AccountsAuthTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            first_name="Admin",
            last_name="System",
        )
        self.employee_user = User.objects.create_user(
            username="empuser",
            email="employee@example.com",
            password="EmployeePassword123!",
            role=User.Role.EMPLOYEE,
            first_name="Jane",
            last_name="Doe",
        )
        self.login_url = reverse("auth-login")
        self.refresh_url = reverse("auth-refresh")
        self.register_url = reverse("auth-register")
        self.logout_url = reverse("auth-logout")
        self.me_url = reverse("auth-profile")
        self.change_password_url = reverse("auth-change-password")
        self.users_url = reverse("user-management-list")
        self.guest_demo_url = reverse("auth-guest-demo")

    def test_guest_demo_login(self):
        """Verify 1-click live guest demo issues valid JWT tokens and admin privileges."""
        res = self.client.post(self.guest_demo_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertIn("user", res.data)
        self.assertEqual(res.data["user"]["username"], "guest_demo")
        self.assertEqual(res.data["user"]["role"], "admin")
        self.assertTrue(res.data.get("is_guest_demo"))

    def test_login_with_username(self):
        payload = {"username": "adminuser", "password": "AdminPassword123!"}
        res = self.client.post(self.login_url, payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertIn("user", res.data)
        self.assertEqual(res.data["user"]["role"], "admin")

    def test_login_with_email(self):
        payload = {"username": "employee@example.com", "password": "EmployeePassword123!"}
        res = self.client.post(self.login_url, payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertEqual(res.data["user"]["email"], "employee@example.com")
        self.assertEqual(res.data["user"]["role"], "employee")

    def test_login_invalid_password(self):
        payload = {"username": "adminuser", "password": "WrongPassword!"}
        res = self.client.post(self.login_url, payload)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        refresh = RefreshToken.for_user(self.employee_user)
        res = self.client.post(self.refresh_url, {"refresh": str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_registration_success(self):
        payload = {
            "email": "newuser@example.com",
            "password": "NewUserPassword123!",
            "password_confirm": "NewUserPassword123!",
            "first_name": "New",
            "last_name": "Person",
            "phone": "9876543210",
        }
        res = self.client.post(self.register_url, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", res.data)
        self.assertIn("user", res.data)
        self.assertEqual(res.data["user"]["username"], "newuser")
        self.assertEqual(res.data["user"]["role"], "employee")

    def test_registration_password_mismatch(self):
        payload = {
            "email": "mismatch@example.com",
            "password": "Password123!",
            "password_confirm": "DifferentPassword123!",
        }
        res = self.client.post(self.register_url, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_duplicate_email(self):
        payload = {
            "email": "admin@example.com",
            "password": "Password123!",
            "password_confirm": "Password123!",
        }
        res = self.client.post(self.register_url, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_retrieval_and_update(self):
        self.client.force_authenticate(user=self.employee_user)
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], "employee@example.com")

        update_res = self.client.patch(self.me_url, {"phone": "1234567890"})
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data["phone"], "1234567890")

    def test_change_password(self):
        self.client.force_authenticate(user=self.employee_user)
        payload = {
            "old_password": "EmployeePassword123!",
            "new_password": "NewUpdatedPassword123!",
            "new_password_confirm": "NewUpdatedPassword123!",
        }
        res = self.client.post(self.change_password_url, payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Verify old password no longer works
        self.employee_user.refresh_from_db()
        self.assertTrue(self.employee_user.check_password("NewUpdatedPassword123!"))
        self.assertFalse(self.employee_user.check_password("EmployeePassword123!"))

    def test_logout_and_blacklist(self):
        refresh = RefreshToken.for_user(self.employee_user)
        self.client.force_authenticate(user=self.employee_user)
        res = self.client.post(self.logout_url, {"refresh": str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Refresh token must now be rejected when trying to refresh
        refresh_res = self.client.post(self.refresh_url, {"refresh": str(refresh)})
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_user_management_permissions(self):
        # Admin can view user list
        self.client.force_authenticate(user=self.admin_user)
        admin_res = self.client.get(self.users_url)
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)

        # Employee is forbidden
        self.client.force_authenticate(user=self.employee_user)
        emp_res = self.client.get(self.users_url)
        self.assertEqual(emp_res.status_code, status.HTTP_403_FORBIDDEN)


class StaffManagementTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="headadmin",
            email="headadmin@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            first_name="Head",
            last_name="Admin",
        )
        self.manager_user = User.objects.create_user(
            username="storemanager",
            email="manager@example.com",
            password="ManagerPassword123!",
            role=User.Role.MANAGER,
            first_name="Store",
            last_name="Manager",
        )
        self.employee_user = User.objects.create_user(
            username="cashier1",
            email="cashier1@example.com",
            password="CashierPassword123!",
            role=User.Role.EMPLOYEE,
            first_name="Cashier",
            last_name="One",
        )
        self.users_url = reverse("user-management-list")
        self.stats_url = reverse("user-management-stats")

    def test_admin_list_users_with_sales_metrics(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get(self.users_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Should include orders_count, total_sales, full_name
        first_user = res.data["results"][0] if "results" in res.data else res.data[0]
        self.assertIn("orders_count", first_user)
        self.assertIn("total_sales", first_user)
        self.assertIn("full_name", first_user)

    def test_admin_create_staff_member(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "username": "cashier2",
            "email": "cashier2@example.com",
            "first_name": "Cashier",
            "last_name": "Two",
            "role": "employee",
            "phone": "9876500000",
        }
        res = self.client.post(self.users_url, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["username"], "cashier2")
        self.assertEqual(res.data["role"], "employee")

        # Verify fallback password ChangeMe123! works
        new_staff = User.objects.get(username="cashier2")
        self.assertTrue(new_staff.check_password("ChangeMe123!"))

    def test_admin_reset_employee_password(self):
        self.client.force_authenticate(user=self.admin_user)
        reset_url = reverse("user-management-reset-password", kwargs={"pk": self.employee_user.id})
        payload = {
            "new_password": "NewSecretPassword123!",
            "new_password_confirm": "NewSecretPassword123!",
        }
        res = self.client.post(reset_url, payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.employee_user.refresh_from_db()
        self.assertTrue(self.employee_user.check_password("NewSecretPassword123!"))

    def test_admin_reset_password_mismatch(self):
        self.client.force_authenticate(user=self.admin_user)
        reset_url = reverse("user-management-reset-password", kwargs={"pk": self.employee_user.id})
        payload = {
            "new_password": "NewSecretPassword123!",
            "new_password_confirm": "Mismatched123!",
        }
        res = self.client.post(reset_url, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_delete_self(self):
        self.client.force_authenticate(user=self.admin_user)
        self_delete_url = reverse("user-management-detail", kwargs={"pk": self.admin_user.id})
        res = self.client.delete(self_delete_url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(id=self.admin_user.id).exists())

    def test_admin_cannot_deactivate_self(self):
        self.client.force_authenticate(user=self.admin_user)
        self_detail_url = reverse("user-management-detail", kwargs={"pk": self.admin_user.id})
        res = self.client.patch(self_detail_url, {"is_active": False})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.is_active)

    def test_staff_stats_endpoint(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get(self.stats_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["admin_count"], 1)
        self.assertEqual(res.data["manager_count"], 1)
        self.assertEqual(res.data["employee_count"], 1)
        self.assertEqual(res.data["total_staff"], 3)
        self.assertEqual(res.data["active_staff"], 3)
        self.assertEqual(res.data["inactive_staff"], 0)

    def test_exponential_backoff_on_failed_logins(self):
        """Verify progressive exponential backoff returns 429 and Retry-After after free attempts."""
        from django.core.cache import cache
        cache.clear()

        login_url = reverse("auth-login")
        # Perform 3 failed attempts (free allowance)
        for _ in range(3):
            res = self.client.post(login_url, {"username": "headadmin", "password": "WrongPassword!"})
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 4th attempt should trigger 429 Throttled with progressive backoff
        throttled_res = self.client.post(login_url, {"username": "headadmin", "password": "WrongPassword!"})
        self.assertEqual(throttled_res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("Retry-After", throttled_res.headers)
        self.assertIn("retry_after", throttled_res.data)

        # Clear cache after test
        cache.clear()

    def test_strict_registration_validation(self):
        """Verify strict schema rejects injection attempts, bad formatting, and weak passwords."""
        register_url = reverse("auth-register")
        # Malformed username with HTML injection
        bad_username_payload = {
            "username": "<script>alert(1)</script>",
            "email": "valid@example.com",
            "password": "ValidPassword123!",
            "password_confirm": "ValidPassword123!",
        }
        res = self.client.post(register_url, bad_username_payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Weak password (missing digit/symbol/uppercase)
        weak_pwd_payload = {
            "username": "cleanuser",
            "email": "clean@example.com",
            "password": "weakpassword",
            "password_confirm": "weakpassword",
        }
        res = self.client.post(register_url, weak_pwd_payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid phone format with letters
        bad_phone_payload = {
            "username": "phoneuser",
            "email": "phone@example.com",
            "phone": "invalid-phone-abc",
            "password": "ValidPassword123!",
            "password_confirm": "ValidPassword123!",
        }
        res = self.client.post(register_url, bad_phone_payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_exception_handler_sanitization(self):
        """Verify custom_exception_handler masks DB errors and unhandled exceptions to safe JSON."""
        from django.db import IntegrityError
        from apps.accounts.exceptions import custom_exception_handler

        # Simulated DB error
        db_exc = IntegrityError("Duplicate entry 'test' for key 'users.username'")
        res = custom_exception_handler(db_exc, {"request": None})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn("Duplicate entry", res.data["detail"])
        self.assertNotIn("users.username", str(res.data))

        # Simulated Unhandled 500
        unhandled_exc = RuntimeError("Secret file path /etc/passwd leaked")
        res_500 = custom_exception_handler(unhandled_exc, {"request": None})
        self.assertEqual(res_500.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertNotIn("/etc/passwd", str(res_500.data))
        self.assertIn("unexpected internal server error", res_500.data["detail"])

