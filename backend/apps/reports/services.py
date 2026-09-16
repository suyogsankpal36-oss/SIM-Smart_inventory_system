import csv
import datetime
from decimal import Decimal
import io

from django.db.models import Count, F, Sum
from django.utils import timezone

from apps.expenses.models import Expense
from apps.products.models import Category, Product
from apps.sales.models import Order, OrderItem


def parse_date_range(start_str, end_str):
    """
    Parses start_date and end_date query strings (YYYY-MM-DD).
    Defaults to current month if absent or invalid.
    Returns (start_date, end_date, start_dt, end_dt).
    """
    today = timezone.localdate() if hasattr(timezone, "localdate") else timezone.now().date()
    start_date = None
    end_date = None

    if start_str:
        try:
            start_date = datetime.date.fromisoformat(start_str)
        except ValueError:
            pass

    if end_str:
        try:
            end_date = datetime.date.fromisoformat(end_str)
        except ValueError:
            pass

    if not start_date and not end_date:
        # Default to current month
        start_date = today.replace(day=1)
        end_date = today
    elif not start_date:
        start_date = end_date.replace(day=1)
    elif not end_date:
        end_date = today

    if start_date > end_date:
        start_date, end_date = end_date, start_date

    start_dt = timezone.make_aware(datetime.datetime.combine(start_date, datetime.time.min))
    end_dt = timezone.make_aware(datetime.datetime.combine(end_date, datetime.time.max))

    return start_date, end_date, start_dt, end_dt


class SalesReportService:
    @staticmethod
    def get_report(start_date, end_date, start_dt, end_dt):
        orders_qs = Order.objects.filter(
            status=Order.Status.COMPLETED,
            created_at__gte=start_dt,
            created_at__lte=end_dt,
        )

        total_orders = orders_qs.count()
        gross_sales = orders_qs.aggregate(s=Sum("subtotal"))["s"] or Decimal("0.00")
        total_tax = orders_qs.aggregate(s=Sum("tax"))["s"] or Decimal("0.00")
        total_discount = orders_qs.aggregate(s=Sum("discount"))["s"] or Decimal("0.00")
        net_sales = orders_qs.aggregate(s=Sum("total_amount"))["s"] or Decimal("0.00")

        aov = round(net_sales / total_orders, 2) if total_orders > 0 else Decimal("0.00")

        # Items sold count
        order_items_qs = OrderItem.objects.filter(order__in=orders_qs)
        total_items_sold = order_items_qs.aggregate(s=Sum("quantity"))["s"] or 0

        # Sales by payment method
        pm_map = dict(Order.PaymentMethod.choices)
        pm_agg = (
            orders_qs.values("payment_method")
            .annotate(total=Sum("total_amount"), count=Count("id"))
            .order_by("-total")
        )
        net_sales_float = float(net_sales)
        payment_method_breakdown = []
        for item in pm_agg:
            m_total = float(item["total"] or 0)
            pct = round((m_total / net_sales_float * 100), 1) if net_sales_float > 0 else 0.0
            payment_method_breakdown.append({
                "method": item["payment_method"],
                "label": pm_map.get(item["payment_method"], item["payment_method"].replace("_", " ").title()),
                "total": m_total,
                "orders_count": item["count"],
                "percentage": pct,
            })

        # Top-selling products
        top_products_agg = (
            order_items_qs.values("product__id", "product__name", "product__sku")
            .annotate(units_sold=Sum("quantity"), revenue=Sum("total"))
            .order_by("-units_sold")[:10]
        )
        top_products = [
            {
                "product_id": item["product__id"],
                "name": item["product__name"],
                "sku": item["product__sku"],
                "units_sold": item["units_sold"],
                "revenue": float(item["revenue"] or 0),
            }
            for item in top_products_agg
        ]

        # Timeline breakdown (daily if range <= 60 days, else monthly)
        days_diff = (end_date - start_date).days
        timeline = []

        if days_diff <= 62:
            # Daily timeline
            cur_date = start_date
            while cur_date <= end_date:
                day_start = timezone.make_aware(datetime.datetime.combine(cur_date, datetime.time.min))
                day_end = timezone.make_aware(datetime.datetime.combine(cur_date, datetime.time.max))
                day_orders = orders_qs.filter(created_at__gte=day_start, created_at__lte=day_end)
                day_sales = day_orders.aggregate(s=Sum("total_amount"))["s"] or Decimal("0.00")
                day_items = OrderItem.objects.filter(order__in=day_orders).aggregate(s=Sum("quantity"))["s"] or 0

                timeline.append({
                    "period": cur_date.strftime("%Y-%m-%d"),
                    "name": cur_date.strftime("%b %d"),
                    "sales": float(round(day_sales, 2)),
                    "orders": day_orders.count(),
                    "items": day_items,
                })
                cur_date += datetime.timedelta(days=1)
        else:
            # Monthly timeline
            cur = start_date.replace(day=1)
            while cur <= end_date:
                y = cur.year
                m = cur.month
                if m == 12:
                    next_month = datetime.date(y + 1, 1, 1)
                else:
                    next_month = datetime.date(y, m + 1, 1)
                m_end = next_month - datetime.timedelta(days=1)

                m_start_dt = timezone.make_aware(datetime.datetime.combine(cur, datetime.time.min))
                m_end_dt = timezone.make_aware(datetime.datetime.combine(m_end, datetime.time.max))

                m_orders = orders_qs.filter(created_at__gte=m_start_dt, created_at__lte=m_end_dt)
                m_sales = m_orders.aggregate(s=Sum("total_amount"))["s"] or Decimal("0.00")
                m_items = OrderItem.objects.filter(order__in=m_orders).aggregate(s=Sum("quantity"))["s"] or 0

                timeline.append({
                    "period": cur.strftime("%Y-%m"),
                    "name": cur.strftime("%b %Y"),
                    "sales": float(round(m_sales, 2)),
                    "orders": m_orders.count(),
                    "items": m_items,
                })
                cur = next_month

        return {
            "start_date": str(start_date),
            "end_date": str(end_date),
            "gross_sales": float(round(gross_sales, 2)),
            "total_tax": float(round(total_tax, 2)),
            "total_discount": float(round(total_discount, 2)),
            "net_sales": float(round(net_sales, 2)),
            "total_orders": total_orders,
            "total_items_sold": total_items_sold,
            "average_order_value": float(round(aov, 2)),
            "payment_method_breakdown": payment_method_breakdown,
            "top_products": top_products,
            "timeline": timeline,
        }


class InventoryReportService:
    @staticmethod
    def get_report():
        products = Product.objects.filter(is_active=True).select_related("category")

        total_skus = products.count()
        total_units = products.aggregate(s=Sum("stock_quantity"))["s"] or 0

        in_stock_count = products.filter(status=Product.Status.IN_STOCK).count()
        low_stock_count = products.filter(status=Product.Status.LOW_STOCK).count()
        out_of_stock_count = products.filter(status=Product.Status.OUT_OF_STOCK).count()

        # Valuation calculations
        cost_val = Decimal("0.00")
        retail_val = Decimal("0.00")
        for p in products:
            qty = Decimal(str(p.stock_quantity))
            cost_val += qty * p.purchase_price
            retail_val += qty * p.selling_price

        potential_profit = retail_val - cost_val
        margin_pct = (
            round((potential_profit / retail_val * 100), 1) if retail_val > 0 else Decimal("0.0")
        )

        # Category breakdown
        cat_map = {}
        for p in products:
            cat_name = p.category.name if p.category else "Uncategorized"
            if cat_name not in cat_map:
                cat_map[cat_name] = {
                    "category": cat_name,
                    "sku_count": 0,
                    "total_units": 0,
                    "cost_valuation": Decimal("0.00"),
                    "retail_valuation": Decimal("0.00"),
                }
            qty = Decimal(str(p.stock_quantity))
            cat_map[cat_name]["sku_count"] += 1
            cat_map[cat_name]["total_units"] += p.stock_quantity
            cat_map[cat_name]["cost_valuation"] += qty * p.purchase_price
            cat_map[cat_name]["retail_valuation"] += qty * p.selling_price

        category_breakdown = []
        cost_val_float = float(cost_val)
        for cat_data in cat_map.values():
            c_cost = float(cat_data["cost_valuation"])
            share = round((c_cost / cost_val_float * 100), 1) if cost_val_float > 0 else 0.0
            category_breakdown.append({
                "category": cat_data["category"],
                "sku_count": cat_data["sku_count"],
                "total_units": cat_data["total_units"],
                "cost_valuation": float(round(cat_data["cost_valuation"], 2)),
                "retail_valuation": float(round(cat_data["retail_valuation"], 2)),
                "share_percentage": share,
            })
        category_breakdown.sort(key=lambda x: x["cost_valuation"], reverse=True)

        # Replenishment urgency list
        urgency_qs = products.filter(stock_quantity__lte=F("minimum_stock")).order_by("stock_quantity")[:15]
        replenishment_list = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock_quantity": p.stock_quantity,
                "minimum_stock": p.minimum_stock,
                "cost_price": float(p.purchase_price),
                "status": p.status,
                "category": p.category.name if p.category else "Uncategorized",
            }
            for p in urgency_qs
        ]

        return {
            "total_skus": total_skus,
            "total_units": total_units,
            "in_stock_count": in_stock_count,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "cost_valuation": float(round(cost_val, 2)),
            "retail_valuation": float(round(retail_val, 2)),
            "potential_profit": float(round(potential_profit, 2)),
            "unrealized_margin_percentage": float(margin_pct),
            "category_breakdown": category_breakdown,
            "replenishment_list": replenishment_list,
        }


class ExpensesReportService:
    @staticmethod
    def get_report(start_date, end_date):
        expenses_qs = Expense.objects.filter(date__gte=start_date, date__lte=end_date)

        total_expenses = expenses_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        total_count = expenses_qs.count()

        # Category breakdown
        cat_map = dict(Expense.Category.choices)
        cat_agg = (
            expenses_qs.values("category")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )
        total_float = float(total_expenses)
        category_breakdown = []
        for item in cat_agg:
            c_tot = float(item["total"] or 0)
            pct = round((c_tot / total_float * 100), 1) if total_float > 0 else 0.0
            category_breakdown.append({
                "category": item["category"],
                "label": cat_map.get(item["category"], item["category"].title()),
                "total": c_tot,
                "count": item["count"],
                "percentage": pct,
            })

        # Payment method breakdown
        pm_map = dict(Expense.PaymentMethod.choices)
        pm_agg = (
            expenses_qs.values("payment_method")
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

        # Monthly timeline
        cur = start_date.replace(day=1)
        timeline = []
        while cur <= end_date:
            y = cur.year
            m = cur.month
            if m == 12:
                next_m = datetime.date(y + 1, 1, 1)
            else:
                next_m = datetime.date(y, m + 1, 1)
            m_end = next_m - datetime.timedelta(days=1)

            m_qs = expenses_qs.filter(date__gte=cur, date__lte=m_end)
            m_total = m_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
            timeline.append({
                "period": cur.strftime("%Y-%m"),
                "name": cur.strftime("%b %Y"),
                "total": float(round(m_total, 2)),
                "count": m_qs.count(),
            })
            cur = next_m

        return {
            "start_date": str(start_date),
            "end_date": str(end_date),
            "total_expenses": float(round(total_expenses, 2)),
            "total_count": total_count,
            "category_breakdown": category_breakdown,
            "payment_method_breakdown": payment_method_breakdown,
            "timeline": timeline,
        }


class ProfitLossReportService:
    @staticmethod
    def get_report(start_date, end_date, start_dt, end_dt):
        orders_qs = Order.objects.filter(
            status=Order.Status.COMPLETED,
            created_at__gte=start_dt,
            created_at__lte=end_dt,
        )

        gross_sales = orders_qs.aggregate(s=Sum("subtotal"))["s"] or Decimal("0.00")
        total_discount = orders_qs.aggregate(s=Sum("discount"))["s"] or Decimal("0.00")
        net_sales = orders_qs.aggregate(s=Sum("total_amount"))["s"] or Decimal("0.00")
        tax_collected = orders_qs.aggregate(s=Sum("tax"))["s"] or Decimal("0.00")

        # Cost of Goods Sold (COGS)
        order_items = OrderItem.objects.filter(order__in=orders_qs).select_related("product")
        cogs = Decimal("0.00")
        for item in order_items:
            cogs += Decimal(str(item.quantity)) * item.product.purchase_price

        gross_profit = net_sales - cogs
        gross_margin = (
            round((gross_profit / net_sales * 100), 1) if net_sales > 0 else Decimal("0.0")
        )

        # Operating Expenses
        expenses_qs = Expense.objects.filter(date__gte=start_date, date__lte=end_date)
        total_operating_expenses = expenses_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0.00")

        cat_map = dict(Expense.Category.choices)
        cat_agg = (
            expenses_qs.values("category")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        expense_breakdown = [
            {
                "category": item["category"],
                "label": cat_map.get(item["category"], item["category"].title()),
                "total": float(item["total"] or 0),
            }
            for item in cat_agg
        ]

        net_profit = gross_profit - total_operating_expenses
        net_margin = (
            round((net_profit / net_sales * 100), 1) if net_sales > 0 else Decimal("0.0")
        )

        # Monthly P&L Ledger
        monthly_ledger = []
        cur = start_date.replace(day=1)
        while cur <= end_date:
            y = cur.year
            m = cur.month
            if m == 12:
                next_m = datetime.date(y + 1, 1, 1)
            else:
                next_m = datetime.date(y, m + 1, 1)
            m_end = next_m - datetime.timedelta(days=1)

            m_start_dt = timezone.make_aware(datetime.datetime.combine(cur, datetime.time.min))
            m_end_dt = timezone.make_aware(datetime.datetime.combine(m_end, datetime.time.max))

            m_orders = orders_qs.filter(created_at__gte=m_start_dt, created_at__lte=m_end_dt)
            m_rev = m_orders.aggregate(s=Sum("total_amount"))["s"] or Decimal("0.00")

            m_items = OrderItem.objects.filter(order__in=m_orders).select_related("product")
            m_cogs = Decimal("0.00")
            for it in m_items:
                m_cogs += Decimal(str(it.quantity)) * it.product.purchase_price

            m_gp = m_rev - m_cogs
            m_exp = expenses_qs.filter(date__gte=cur, date__lte=m_end).aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
            m_np = m_gp - m_exp

            monthly_ledger.append({
                "period": cur.strftime("%Y-%m"),
                "month_name": cur.strftime("%B %Y"),
                "revenue": float(round(m_rev, 2)),
                "cogs": float(round(m_cogs, 2)),
                "gross_profit": float(round(m_gp, 2)),
                "expenses": float(round(m_exp, 2)),
                "net_profit": float(round(m_np, 2)),
                "net_margin": float(round((m_np / m_rev * 100), 1)) if m_rev > 0 else 0.0,
            })
            cur = next_m

        return {
            "start_date": str(start_date),
            "end_date": str(end_date),
            "gross_sales": float(round(gross_sales, 2)),
            "total_discount": float(round(total_discount, 2)),
            "net_sales": float(round(net_sales, 2)),
            "tax_collected": float(round(tax_collected, 2)),
            "cogs": float(round(cogs, 2)),
            "gross_profit": float(round(gross_profit, 2)),
            "gross_margin_percentage": float(gross_margin),
            "operating_expenses": float(round(total_operating_expenses, 2)),
            "expense_breakdown": expense_breakdown,
            "net_profit": float(round(net_profit, 2)),
            "net_margin_percentage": float(net_margin),
            "monthly_ledger": monthly_ledger,
        }


class ReportCSVExporter:
    @staticmethod
    def export(report_type, start_date, end_date, start_dt, end_dt):
        output = io.StringIO()
        writer = csv.writer(output)

        if report_type == "sales":
            data = SalesReportService.get_report(start_date, end_date, start_dt, end_dt)
            writer.writerow(["Sales Report", f"{start_date} to {end_date}"])
            writer.writerow([])
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Net Sales Revenue", data["net_sales"]])
            writer.writerow(["Gross Sales", data["gross_sales"]])
            writer.writerow(["Discounts Granted", data["total_discount"]])
            writer.writerow(["Tax Collected", data["total_tax"]])
            writer.writerow(["Completed Orders", data["total_orders"]])
            writer.writerow(["Total Items Sold", data["total_items_sold"]])
            writer.writerow(["Average Order Value (AOV)", data["average_order_value"]])
            writer.writerow([])
            writer.writerow(["Date", "Sales (INR)", "Orders", "Items Sold"])
            for t in data["timeline"]:
                writer.writerow([t["period"], t["sales"], t["orders"], t["items"]])
            writer.writerow([])
            writer.writerow(["Top Selling Product", "SKU", "Units Sold", "Revenue (INR)"])
            for p in data["top_products"]:
                writer.writerow([p["name"], p["sku"], p["units_sold"], p["revenue"]])

        elif report_type == "inventory":
            data = InventoryReportService.get_report()
            writer.writerow(["Inventory Valuation Report"])
            writer.writerow([])
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total SKUs", data["total_skus"]])
            writer.writerow(["Total Units", data["total_units"]])
            writer.writerow(["Cost Valuation (INR)", data["cost_valuation"]])
            writer.writerow(["Retail Valuation (INR)", data["retail_valuation"]])
            writer.writerow(["Potential Profit (INR)", data["potential_profit"]])
            writer.writerow(["Unrealized Margin %", data["unrealized_margin_percentage"]])
            writer.writerow([])
            writer.writerow(["Category", "SKUs", "Total Units", "Cost Valuation (INR)", "Retail Valuation (INR)", "Share %"])
            for c in data["category_breakdown"]:
                writer.writerow([c["category"], c["sku_count"], c["total_units"], c["cost_valuation"], c["retail_valuation"], c["share_percentage"]])

        elif report_type == "expenses":
            data = ExpensesReportService.get_report(start_date, end_date)
            writer.writerow(["Operating Expenses Report", f"{start_date} to {end_date}"])
            writer.writerow([])
            writer.writerow(["Total Expenses (INR)", data["total_expenses"]])
            writer.writerow(["Total Entries", data["total_count"]])
            writer.writerow([])
            writer.writerow(["Category", "Total (INR)", "Entries Count", "Percentage %"])
            for c in data["category_breakdown"]:
                writer.writerow([c["label"], c["total"], c["count"], c["percentage"]])

        elif report_type == "profit_loss":
            data = ProfitLossReportService.get_report(start_date, end_date, start_dt, end_dt)
            writer.writerow(["Profit & Loss (P&L) Statement", f"{start_date} to {end_date}"])
            writer.writerow([])
            writer.writerow(["Line Item", "Amount (INR)"])
            writer.writerow(["Net Sales Revenue", data["net_sales"]])
            writer.writerow(["Cost of Goods Sold (COGS)", data["cogs"]])
            writer.writerow(["Gross Profit", data["gross_profit"]])
            writer.writerow(["Gross Margin %", data["gross_margin_percentage"]])
            writer.writerow(["Operating Expenses", data["operating_expenses"]])
            writer.writerow(["Net Profit / Income", data["net_profit"]])
            writer.writerow(["Net Margin %", data["net_margin_percentage"]])
            writer.writerow([])
            writer.writerow(["Month", "Revenue", "COGS", "Gross Profit", "Expenses", "Net Profit", "Margin %"])
            for m in data["monthly_ledger"]:
                writer.writerow([m["month_name"], m["revenue"], m["cogs"], m["gross_profit"], m["expenses"], m["net_profit"], m["net_margin"]])

        return output.getvalue()
