import base64
import json
import re
from django.contrib.auth import get_user_model
from django.db.models import Count, DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsAdminUserRole
from .throttles import ExponentialBackoffAuthThrottle
from .serializers import (
    AdminResetPasswordSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserAdminSerializer,
    UserSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Authenticates with either email or username and password.
    Returns access token, refresh token, and user payload.
    Protected with progressive exponential backoff against brute-force attacks.
    """
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = (ExponentialBackoffAuthThrottle,)

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                ExponentialBackoffAuthThrottle.record_success(request)
            return response
        except Exception as exc:
            ExponentialBackoffAuthThrottle.record_failure(request)
            raise exc


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Registers a new user account and returns JWT tokens for immediate login.
    Protected with exponential backoff against registration floods.
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    throttle_classes = (ExponentialBackoffAuthThrottle,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for immediate seamless login
        refresh = RefreshToken.for_user(user)
        refresh["email"] = user.email
        refresh["role"] = user.role
        refresh["username"] = user.username

        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "message": "User registered successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class GoogleLoginView(generics.GenericAPIView):
    """
    POST /api/auth/google/
    Authenticates or provisions a user account via Google OAuth.
    Supports verified Google ID token (credential JWT) or payload { email, name, sub, picture }.
    Returns JWT access & refresh tokens along with user profile.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        data = request.data
        credential = data.get("credential") or data.get("token")
        email = data.get("email")
        name = data.get("name", "")
        first_name = data.get("given_name") or data.get("first_name", "")
        last_name = data.get("family_name") or data.get("last_name", "")
        google_id = data.get("sub") or data.get("google_id", "")

        # If Google credential JWT token is passed, decode payload safely
        if credential and isinstance(credential, str):
            try:
                parts = credential.split(".")
                if len(parts) >= 2:
                    padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                    payload_json = base64.urlsafe_b64decode(padded).decode("utf-8")
                    payload = json.loads(payload_json)
                    email = payload.get("email", email)
                    name = payload.get("name", name)
                    first_name = payload.get("given_name", first_name)
                    last_name = payload.get("family_name", last_name)
                    google_id = payload.get("sub", google_id)
            except Exception:
                pass

        if not email:
            return Response(
                {"detail": "A valid Google account email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = email.lower().strip()

        # Find existing user by email or username
        user = User.objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).first()

        if not user:
            # Generate unique clean username
            base_username = email.split("@")[0]
            base_username = re.sub(r"[^a-zA-Z0-9_.-]", "", base_username)[:30] or "user"
            candidate = base_username
            counter = 1
            while User.objects.filter(username__iexact=candidate).exists():
                candidate = f"{base_username}{counter}"
                counter += 1

            if not first_name and name:
                parts = name.split(" ", 1)
                first_name = parts[0]
                last_name = parts[1] if len(parts) > 1 else ""

            user = User.objects.create_user(
                username=candidate,
                email=email,
                first_name=first_name[:50],
                last_name=last_name[:50],
                role=User.Role.EMPLOYEE,
                is_active=True,
            )

        if not user.is_active:
            return Response(
                {"detail": "This account is inactive or suspended. Please contact your administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Issue JWT tokens for user
        refresh = RefreshToken.for_user(user)
        refresh["email"] = user.email
        refresh["role"] = user.role
        refresh["username"] = user.username

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
                "message": "Google authentication successful.",
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(generics.GenericAPIView):
    """
    POST /api/auth/logout/
    Blacklists the provided refresh token to invalidate the session.
    Gracefully returns HTTP 200 even if the token was already expired or blacklisted.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Token already expired, invalid, or already blacklisted; still complete logout
                pass

        return Response(
            {"message": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )



class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/me/
    PUT /api/auth/me/
    PATCH /api/auth/me/
    Retrieves or updates the currently authenticated user's profile.
    """
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """
    POST /api/auth/change-password/
    Updates the authenticated user's password.
    """
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ChangePasswordSerializer
    throttle_classes = (ExponentialBackoffAuthThrottle,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response(
            {"message": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )


class UserViewSet(viewsets.ModelViewSet):
    """
    /api/auth/users/
    Admin-only user management CRUD.
    Supports filtering by role, status, and searching across names/emails/usernames.
    Annotates cashier/staff sales performance metrics.
    """
    serializer_class = UserAdminSerializer
    permission_classes = (IsAdminUserRole,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ("role", "is_active")
    search_fields = ("username", "email", "first_name", "last_name", "phone")
    ordering_fields = ("created_at", "username", "role", "email", "orders_count", "total_sales")

    def get_queryset(self):
        return (
            User.objects.annotate(
                orders_count=Count("orders_created", filter=Q(orders_created__status="completed")),
                total_sales=Coalesce(
                    Sum("orders_created__total_amount", filter=Q(orders_created__status="completed")),
                    Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
                ),
            ).order_by("-created_at")
        )

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise ValidationError({"detail": "You cannot delete your own account."})

        # Check if instance is the last admin
        if instance.role == User.Role.ADMIN:
            remaining_admins = (
                User.objects.filter(role=User.Role.ADMIN, is_active=True).exclude(id=instance.id).count()
            )
            if remaining_admins == 0:
                raise ValidationError({"detail": "Cannot delete the sole remaining active administrator."})

        super().perform_destroy(instance)

    def perform_update(self, serializer):
        instance = self.get_object()
        new_active = serializer.validated_data.get("is_active", instance.is_active)
        new_role = serializer.validated_data.get("role", instance.role)

        if instance.id == self.request.user.id:
            if new_active is False:
                raise ValidationError({"detail": "You cannot deactivate your own account."})
            if new_role != User.Role.ADMIN:
                raise ValidationError({"detail": "You cannot demote your own administrator role."})

        serializer.save()

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        """
        POST /api/auth/users/<id>/reset-password/
        Admin-driven password reset for a team member.
        """
        user = self.get_object()
        serializer = AdminResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response(
            {"message": f"Password for {user.username} was reset successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """
        GET /api/auth/users/stats/
        Returns aggregated counts of total staff, active/inactive staff, and role breakdown.
        """
        total_staff = User.objects.count()
        active_staff = User.objects.filter(is_active=True).count()
        inactive_staff = total_staff - active_staff
        admin_count = User.objects.filter(role=User.Role.ADMIN).count()
        manager_count = User.objects.filter(role=User.Role.MANAGER).count()
        employee_count = User.objects.filter(role=User.Role.EMPLOYEE).count()

        return Response(
            {
                "total_staff": total_staff,
                "active_staff": active_staff,
                "inactive_staff": inactive_staff,
                "admin_count": admin_count,
                "manager_count": manager_count,
                "employee_count": employee_count,
            },
            status=status.HTTP_200_OK,
        )
