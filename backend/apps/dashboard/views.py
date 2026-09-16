import datetime
from decimal import Decimal

from django.db.models import F, Sum
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.models import Customer
from apps.expenses.models import Expense
from apps.products.models import Product
from apps.sales.models import Order
from apps.settings_app.models import BusinessSettings
from apps.suppliers.models import Supplier


class DashboardStatsView(APIView):
    """
    GET /api/dashboard/
    Returns aggregated executive metrics, trailing 7-day sales trend,
    trailing 6-month financial performance, latest orders, and low-stock alerts.
    Uses datetime range queries to ensure full compatibility with MariaDB.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + datetime.timedelta(days=1)
        start_of_month = start_of_day.replace(day=1)

        # Settings
        try:
            settings_obj = BusinessSettings.load()
            currency_symbol = settings_obj.currency_symbol or "₹"
            currency = settings_obj.currency or "INR"
            business_name = settings_obj.business_name or "Smart Business"
        except Exception:
            currency_symbol = "₹"
            currency = "INR"
            business_name = "Smart Business"

        # Orders QuerySet
        completed_orders = Order.objects.filter(status=Order.Status.COMPLETED)

        # All-time and daily totals
        total_sales = completed_orders.aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")
        total_orders_count = completed_orders.count()

        today_orders = completed_orders.filter(created_at__gte=start_of_day, created_at__lt=end_of_day)
        today_sales = today_orders.aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")
        today_orders_count = today_orders.count()

        # Monthly metrics
        month_orders = completed_orders.filter(created_at__gte=start_of_month)
        month_sales = month_orders.aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")

        month_expenses = (
            Expense.objects.filter(date__gte=start_of_month.date()).aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )
        estimated_profit = month_sales - month_expenses

        # Counts
        total_products = Product.objects.filter(is_active=True).count()
        total_customers = Customer.objects.count()
        total_suppliers = Supplier.objects.filter(status=Supplier.Status.ACTIVE).count()
        low_stock_count = Product.objects.filter(
            is_active=True, stock_quantity__lte=F("minimum_stock")
        ).count()

        # 7-Day Sales Trend
        today_date = now.date()
        sales_trend_7d = []
        for i in range(6, -1, -1):
            d = today_date - datetime.timedelta(days=i)
            day_start = timezone.make_aware(datetime.datetime.combine(d, datetime.time.min))
            day_end = timezone.make_aware(datetime.datetime.combine(d, datetime.time.max))
            day_qs = completed_orders.filter(created_at__gte=day_start, created_at__lte=day_end)
            day_total = day_qs.aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")
            sales_trend_7d.append({
                "date": d.strftime("%b %d"),
                "sales": float(day_total),
                "total": float(day_total),
                "orders": day_qs.count(),
            })

        # 6-Month Comparison (Revenue vs Expenses)
        monthly_comparison_6m = []
        for i in range(5, -1, -1):
            year = today_date.year
            month = today_date.month - i
            while month <= 0:
                month += 12
                year -= 1
            m_start_date = datetime.date(year, month, 1)
            if month == 12:
                m_end_date = datetime.date(year + 1, 1, 1)
            else:
                m_end_date = datetime.date(year, month + 1, 1)

            m_start_dt = timezone.make_aware(datetime.datetime.combine(m_start_date, datetime.time.min))
            m_end_dt = timezone.make_aware(datetime.datetime.combine(m_end_date, datetime.time.min))

            m_sales = (
                completed_orders.filter(
                    created_at__gte=m_start_dt, created_at__lt=m_end_dt
                ).aggregate(total=Sum("total_amount"))["total"]
                or Decimal("0.00")
            )
            m_exp = (
                Expense.objects.filter(
                    date__gte=m_start_date, date__lt=m_end_date
                ).aggregate(total=Sum("amount"))["total"]
                or Decimal("0.00")
            )

            monthly_comparison_6m.append({
                "month": m_start_date.strftime("%b %Y"),
                "revenue": float(m_sales),
                "sales": float(m_sales),
                "expenses": float(m_exp),
                "profit": float(m_sales - m_exp),
            })

        # Recent 5 Orders
        recent_orders_qs = completed_orders.select_related("customer").order_by("-created_at")[:5]
        recent_orders = []
        for ord_item in recent_orders_qs:
            recent_orders.append({
                "id": ord_item.id,
                "order_number": ord_item.order_number,
                "customer_name": ord_item.customer.name if ord_item.customer else "Walk-in Customer",
                "total_amount": float(ord_item.total_amount),
                "payment_method": ord_item.get_payment_method_display(),
                "status": ord_item.status,
                "created_at": ord_item.created_at.strftime("%Y-%m-%d %H:%M"),
            })

        # Top 5 Low Stock Products
        low_stock_qs = Product.objects.filter(
            is_active=True, stock_quantity__lte=F("minimum_stock")
        ).order_by("stock_quantity")[:5]
        low_stock_items = []
        for prod in low_stock_qs:
            low_stock_items.append({
                "id": prod.id,
                "name": prod.name,
                "sku": prod.sku,
                "stock_quantity": prod.stock_quantity,
                "minimum_stock": prod.minimum_stock,
                "status": prod.status,
            })

        data = {
            "business": {
                "name": business_name,
                "currency_symbol": currency_symbol,
                "currency": currency,
            },
            "kpis": {
                "total_sales": float(total_sales),
                "total_orders_count": total_orders_count,
                "today_sales": float(today_sales),
                "today_orders_count": today_orders_count,
                "month_sales": float(month_sales),
                "month_expenses": float(month_expenses),
                "estimated_profit": float(estimated_profit),
                "total_products": total_products,
                "total_customers": total_customers,
                "total_suppliers": total_suppliers,
                "low_stock_count": low_stock_count,
            },
            "sales_trend_7d": sales_trend_7d,
            "monthly_comparison_6m": monthly_comparison_6m,
            "recent_orders": recent_orders,
            "low_stock_items": low_stock_items,
        }

        return Response(data, status=status.HTTP_200_OK)
