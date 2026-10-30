from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .controllers import CustomerController

router = DefaultRouter()
router.register(r"", CustomerController, basename="customer")

urlpatterns = [
    path("", include(router.urls)),
]
