from django.urls import path
from .views import (
    ExpensesReportView,
    InventoryReportView,
    ProfitLossReportView,
    ReportExportView,
    SalesReportView,
)

urlpatterns = [
    path("sales/", SalesReportView.as_view(), name="report-sales"),
    path("inventory/", InventoryReportView.as_view(), name="report-inventory"),
    path("expenses/", ExpensesReportView.as_view(), name="report-expenses"),
    path("profit-loss/", ProfitLossReportView.as_view(), name="report-profit-loss"),
    path("export/", ReportExportView.as_view(), name="report-export"),
]
