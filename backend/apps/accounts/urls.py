from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .controllers import (
    AuthController,
    ChangePasswordController,
    GoogleAuthController,
    GuestDemoController,
    LogoutController,
    RegisterController,
    UserProfileController,
    UserManagementController,
)

router = DefaultRouter()
router.register(r"users", UserManagementController, basename="user-management")

urlpatterns = [
    # Authentication & JWT Controllers
    path("login/", AuthController.as_view(), name="auth-login"),
    path("google/", GoogleAuthController.as_view(), name="auth-google"),
    path("guest-demo/", GuestDemoController.as_view(), name="auth-guest-demo"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("register/", RegisterController.as_view(), name="auth-register"),
    path("logout/", LogoutController.as_view(), name="auth-logout"),

    # Profile & Account Controllers
    path("me/", UserProfileController.as_view(), name="auth-profile"),
    path("change-password/", ChangePasswordController.as_view(), name="auth-change-password"),

    # Admin User Management Controller (ViewSet)
    path("", include(router.urls)),
]
