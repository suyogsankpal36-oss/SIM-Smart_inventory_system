from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import InvoiceViewSet, OrderViewSet, POSCheckoutView, POSProductCatalogView

router = DefaultRouter()
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"invoices", InvoiceViewSet, basename="invoice")

urlpatterns = [
    path("pos/checkout/", POSCheckoutView.as_view(), name="pos-checkout"),
    path("pos/products/", POSProductCatalogView.as_view(), name="pos-products"),
    path("", include(router.urls)),
]
