from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    CustomTokenObtainPairView,
    GoogleLoginView,
    GuestDemoLoginView,
    LogoutView,
    RegisterView,
    UserProfileView,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user-management")

urlpatterns = [
    # Authentication & JWT
    path("login/", CustomTokenObtainPairView.as_view(), name="auth-login"),
    path("google/", GoogleLoginView.as_view(), name="auth-google"),
    path("guest-demo/", GuestDemoLoginView.as_view(), name="auth-guest-demo"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),

    # Profile & Account
    path("me/", UserProfileView.as_view(), name="auth-profile"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),

    # Admin User Management
    path("", include(router.urls)),
]
