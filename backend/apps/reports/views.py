from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    ExpensesReportService,
    InventoryReportService,
    ProfitLossReportService,
    ReportCSVExporter,
    SalesReportService,
    parse_date_range,
)
from apps.accounts.permissions import IsManagerRole


class SalesReportView(APIView):
    """
    GET /api/reports/sales/
    Returns aggregate sales revenue, order volumes, tax, discounts,
    chronological breakdown, payment mode splits, and bestsellers.
    """
    permission_classes = [IsManagerRole]

    def get(self, request):
        start_str = request.query_params.get("start_date")
        end_str = request.query_params.get("end_date")
        start_date, end_date, start_dt, end_dt = parse_date_range(start_str, end_str)

        data = SalesReportService.get_report(start_date, end_date, start_dt, end_dt)
        return Response(data)


class InventoryReportView(APIView):
    """
    GET /api/reports/inventory/
    Returns inventory valuation at cost vs retail, profit margin analysis,
    category breakdown, and replenishment alerts.
    """
    permission_classes = [IsManagerRole]

    def get(self, request):
        data = InventoryReportService.get_report()
        return Response(data)


class ExpensesReportView(APIView):
    """
    GET /api/reports/expenses/
    Returns operational expenditure breakdown by category, payment method,
    and chronological spend for the selected date window.
    """
    permission_classes = [IsManagerRole]

    def get(self, request):
        start_str = request.query_params.get("start_date")
        end_str = request.query_params.get("end_date")
        start_date, end_date, _, _ = parse_date_range(start_str, end_str)

        data = ExpensesReportService.get_report(start_date, end_date)
        return Response(data)


class ProfitLossReportView(APIView):
    """
    GET /api/reports/profit-loss/
    Returns Comprehensive P&L statement including Net Sales, COGS,
    Gross Profit, Categorized Operating Expenses, Net Profit, and margins.
    """
    permission_classes = [IsManagerRole]

    def get(self, request):
        start_str = request.query_params.get("start_date")
        end_str = request.query_params.get("end_date")
        start_date, end_date, start_dt, end_dt = parse_date_range(start_str, end_str)

        data = ProfitLossReportService.get_report(start_date, end_date, start_dt, end_dt)
        return Response(data)


class ReportExportView(APIView):
    """
    GET /api/reports/export/?report_type=sales|inventory|expenses|profit_loss
    Streams formatted CSV report file.
    """
    permission_classes = [IsManagerRole]

    def get(self, request):
        report_type = request.query_params.get("report_type", "sales").lower()
        if report_type not in ["sales", "inventory", "expenses", "profit_loss"]:
            return Response(
                {"detail": "Invalid report_type. Must be one of: sales, inventory, expenses, profit_loss."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_str = request.query_params.get("start_date")
        end_str = request.query_params.get("end_date")
        start_date, end_date, start_dt, end_dt = parse_date_range(start_str, end_str)

        csv_content = ReportCSVExporter.export(report_type, start_date, end_date, start_dt, end_dt)

        filename = f"{report_type}_report_{start_date}_to_{end_date}.csv"
        response = HttpResponse(csv_content, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
