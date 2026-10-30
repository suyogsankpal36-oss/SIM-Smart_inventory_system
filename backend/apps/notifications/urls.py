from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .controllers import NotificationController

router = DefaultRouter()
router.register(r"", NotificationController, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
]
