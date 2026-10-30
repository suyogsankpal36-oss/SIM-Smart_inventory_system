"""
Notifications Views / Presentation Bridge.
Re-exports MVC Controllers from controllers.py for Django routing and test compatibility.
"""
from .controllers import (
    NotificationController,
    NotificationViewSet,
)

__all__ = [
    "NotificationController",
    "NotificationViewSet",
]
