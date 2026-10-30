from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .controllers import (
    InvoiceController,
    OrderController,
    POSCheckoutController,
    POSProductCatalogController,
)

router = DefaultRouter()
router.register(r"orders", OrderController, basename="order")
router.register(r"invoices", InvoiceController, basename="invoice")

urlpatterns = [
    path("pos/checkout/", POSCheckoutController.as_view(), name="pos-checkout"),
    path("pos/products/", POSProductCatalogController.as_view(), name="pos-products"),
    path("", include(router.urls)),
]
