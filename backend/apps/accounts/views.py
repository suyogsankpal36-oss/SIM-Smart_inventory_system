"""
Accounts Views / Presentation Bridge.
Re-exports MVC Controllers from controllers.py for Django internal routing and test runners.
"""
from .controllers import (
    CustomTokenObtainPairView,
    RegisterView,
    GoogleLoginView,
    GuestDemoLoginView,
    LogoutView,
    UserProfileView,
    ChangePasswordView,
    UserViewSet,
    # Explicit MVC Controller Exports
    AuthController,
    RegisterController,
    GoogleAuthController,
    GuestDemoController,
    LogoutController,
    UserProfileController,
    ChangePasswordController,
    UserManagementController,
)

__all__ = [
    "CustomTokenObtainPairView",
    "RegisterView",
    "GoogleLoginView",
    "GuestDemoLoginView",
    "LogoutView",
    "UserProfileView",
    "ChangePasswordView",
    "UserViewSet",
    "AuthController",
    "RegisterController",
    "GoogleAuthController",
    "GuestDemoController",
    "LogoutController",
    "UserProfileController",
    "ChangePasswordController",
    "UserManagementController",
]
