from django.urls import path

from .controllers import (
    InventorySummaryController,
    InventoryTransactionController,
    StockAdjustmentController,
    StockAlertsController,
)

urlpatterns = [
    path("adjust/", StockAdjustmentController.as_view(), name="inventory-adjust"),
    path("transactions/", InventoryTransactionController.as_view(), name="inventory-transactions"),
    path("summary/", InventorySummaryController.as_view(), name="inventory-summary"),
    path("alerts/", StockAlertsController.as_view(), name="inventory-alerts"),
]
