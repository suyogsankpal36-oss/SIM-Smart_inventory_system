"""
Expenses Controllers (MVC Pattern)
Orchestrates Expense entity operations, spending trend analytics, and categories.
"""
import datetime
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUserRole, IsManagerRole
from apps.core.mvc import BaseModelController
from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseController(BaseModelController):
    """
    Controller for managing operational expenses.
    Accessible to Managers and Admins; record deletion is restricted to Admins.
    """
    queryset = Expense.objects.select_related("created_by").all()
    serializer_class = ExpenseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "payment_method"]
    search_fields = ["description", "notes"]
    ordering_fields = ["date", "amount", "created_at"]
    ordering = ["-date", "-created_at"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdminUserRole()]
        return [IsManagerRole()]

    def get_queryset(self):
        qs = super().get_queryset()
        from_date = self.request.query_params.get("from_date")
        to_date = self.request.query_params.get("to_date")

        if from_date:
            try:
                datetime.date.fromisoformat(from_date)
                qs = qs.filter(date__gte=from_date)
            except ValueError:
                pass

        if to_date:
            try:
                datetime.date.fromisoformat(to_date)
                qs = qs.filter(date__lte=to_date)
            except ValueError:
                pass

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Calculates executive metrics for the Expenses management dashboard:
        - Today's expenses
        - This month's expenses
        - This year's expenses
        - All-time count and total
        - Category breakdown with percentages
        - Payment method breakdown
        - Trailing 6-month trend
        """
        today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
        start_of_month = today.replace(day=1)
        start_of_year = today.replace(month=1, day=1)

        # Totals
        all_qs = Expense.objects.all()
        total_all_time = all_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        total_count = all_qs.count()

        today_total = all_qs.filter(date=today).aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        today_count = all_qs.filter(date=today).count()

        month_total = all_qs.filter(date__gte=start_of_month, date__lte=today).aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        month_count = all_qs.filter(date__gte=start_of_month, date__lte=today).count()

        year_total = all_qs.filter(date__gte=start_of_year, date__lte=today).aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        year_count = all_qs.filter(date__gte=start_of_year, date__lte=today).count()

        # Category breakdown
        cat_map = dict(Expense.Category.choices)
        cat_agg = (
            all_qs.values("category")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )
        all_amount_float = float(total_all_time)
        category_breakdown = []
        for item in cat_agg:
            cat_val = item["category"]
            cat_total = float(item["total"] or 0)
            cat_cnt = item["count"]
            percentage = round((cat_total / all_amount_float * 100), 1) if all_amount_float > 0 else 0.0
            category_breakdown.append({
                "category": cat_val,
                "label": cat_map.get(cat_val, cat_val.title()),
                "total": cat_total,
                "count": cat_cnt,
                "percentage": percentage,
            })

        # Payment method breakdown
        pm_map = dict(Expense.PaymentMethod.choices)
        pm_agg = (
            all_qs.values("payment_method")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )
        payment_method_breakdown = [
            {
                "method": item["payment_method"],
                "label": pm_map.get(item["payment_method"], item["payment_method"].replace("_", " ").title()),
                "total": float(item["total"] or 0),
                "count": item["count"],
            }
            for item in pm_agg
        ]

        # Trailing 6 months trend
        monthly_trend = []
        for i in range(5, -1, -1):
            y = today.year
            m = today.month - i
            while m <= 0:
                m += 12
                y -= 1
            m_start = datetime.date(y, m, 1)
            if m == 12:
                m_end = datetime.date(y + 1, 1, 1) - datetime.timedelta(days=1)
            else:
                m_end = datetime.date(y, m + 1, 1) - datetime.timedelta(days=1)

            m_qs = all_qs.filter(date__gte=m_start, date__lte=m_end)
            m_total = m_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
            monthly_trend.append({
                "month": m_start.strftime("%Y-%m"),
                "name": m_start.strftime("%b %Y"),
                "total": float(round(m_total, 2)),
                "count": m_qs.count(),
            })

        return Response({
            "today_total": float(round(today_total, 2)),
            "today_count": today_count,
            "month_total": float(round(month_total, 2)),
            "month_count": month_count,
            "year_total": float(round(year_total, 2)),
            "year_count": year_count,
            "total_all_time": float(round(total_all_time, 2)),
            "total_count": total_count,
            "top_category": category_breakdown[0] if category_breakdown else None,
            "category_breakdown": category_breakdown,
            "payment_method_breakdown": payment_method_breakdown,
            "monthly_trend": monthly_trend,
        })

    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        """
        Returns list of valid expense categories for UI selection.
        """
        return Response([
            {"value": choice[0], "label": choice[1]}
            for choice in Expense.Category.choices
        ])

    @action(detail=False, methods=["get"], url_path="payment-methods")
    def payment_methods(self, request):
        """
        Returns list of valid payment methods for UI selection.
        """
        return Response([
            {"value": choice[0], "label": choice[1]}
            for choice in Expense.PaymentMethod.choices
        ])


# ===========================================================================
# MVC Aliases
# ===========================================================================
ExpenseViewSet = ExpenseController
