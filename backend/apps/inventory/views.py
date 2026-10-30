"""
Inventory Views / Presentation Bridge.
Re-exports MVC Controllers from controllers.py for Django routing and test compatibility.
"""
from .controllers import (
    StockAdjustmentController,
    InventoryTransactionController,
    InventorySummaryController,
    StockAlertsController,
    StockAdjustmentView,
    InventoryTransactionListView,
    InventorySummaryView,
    StockAlertsView,
)

__all__ = [
    "StockAdjustmentController",
    "InventoryTransactionController",
    "InventorySummaryController",
    "StockAlertsController",
    "StockAdjustmentView",
    "InventoryTransactionListView",
    "InventorySummaryView",
    "StockAlertsView",
]
