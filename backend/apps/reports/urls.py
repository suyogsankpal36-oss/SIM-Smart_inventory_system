from django.urls import path
from .controllers import (
    ExpensesReportController,
    InventoryReportController,
    ProfitLossReportController,
    ReportExportController,
    SalesReportController,
)

urlpatterns = [
    path("sales/", SalesReportController.as_view(), name="report-sales"),
    path("inventory/", InventoryReportController.as_view(), name="report-inventory"),
    path("expenses/", ExpensesReportController.as_view(), name="report-expenses"),
    path("profit-loss/", ProfitLossReportController.as_view(), name="report-profit-loss"),
    path("export/", ReportExportController.as_view(), name="report-export"),
]
