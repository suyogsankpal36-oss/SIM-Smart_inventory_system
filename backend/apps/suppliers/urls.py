from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .controllers import SupplierController

router = DefaultRouter()
router.register(r"", SupplierController, basename="supplier")

urlpatterns = [
    path("", include(router.urls)),
]
