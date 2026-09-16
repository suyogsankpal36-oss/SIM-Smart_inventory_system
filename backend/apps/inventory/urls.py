from django.urls import path

from .views import (
    InventorySummaryView,
    InventoryTransactionListView,
    StockAdjustmentView,
    StockAlertsView,
)

urlpatterns = [
    path("adjust/", StockAdjustmentView.as_view(), name="inventory-adjust"),
    path("transactions/", InventoryTransactionListView.as_view(), name="inventory-transactions"),
    path("summary/", InventorySummaryView.as_view(), name="inventory-summary"),
    path("alerts/", StockAlertsView.as_view(), name="inventory-alerts"),
]
