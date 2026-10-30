"""
Inventory Controllers (MVC Pattern)
Orchestrates stock adjustment transactions, inventory audit queries, valuation summaries, and alerts.
"""
from decimal import Decimal
from django.db import models, transaction
from django.db.models import F, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployeeRole, IsManagerRole
from apps.core.mvc import BaseController
from apps.products.models import Product
from apps.products.serializers import ProductListSerializer
from .models import InventoryTransaction
from .serializers import InventoryTransactionSerializer, StockAdjustmentSerializer


class StockAdjustmentController(APIView):
    """
    Adjust stock for a product (Stock In, Stock Out, or Physical Count Adjustment).
    Executes within an atomic transaction using select_for_update() to guarantee
    concurrency safety and prevent negative stock.
    """
    permission_classes = [IsManagerRole]

    def post(self, request, *args, **kwargs):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_obj = serializer.validated_data["product"]
        adj_type = serializer.validated_data["adjustment_type"]
        qty = serializer.validated_data["quantity"]
        reference = serializer.validated_data.get("reference", "")
        notes = serializer.validated_data.get("notes", "")

        with transaction.atomic():
            # Lock the row for update
            product = Product.objects.select_for_update().get(pk=product_obj.pk)
            previous_stock = product.stock_quantity

            if adj_type == InventoryTransaction.TransactionType.STOCK_IN:
                delta = qty
                new_stock = previous_stock + qty
            elif adj_type == InventoryTransaction.TransactionType.STOCK_OUT:
                if qty > previous_stock:
                    return Response(
                        {
                            "quantity": [
                                f"Cannot remove {qty} units. Current stock is {previous_stock} units."
                            ]
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                delta = -qty
                new_stock = previous_stock - qty
            elif adj_type == InventoryTransaction.TransactionType.ADJUSTMENT:
                delta = qty - previous_stock
                new_stock = qty
            else:
                return Response({"detail": "Invalid adjustment type."}, status=status.HTTP_400_BAD_REQUEST)

            product.stock_quantity = new_stock
            product.refresh_status(save=False)
            product.save(update_fields=["stock_quantity", "status", "updated_at"])

            tx = InventoryTransaction.objects.create(
                product=product,
                transaction_type=adj_type,
                quantity=delta,
                previous_stock=previous_stock,
                new_stock=new_stock,
                reference=reference,
                user=request.user,
                notes=notes,
            )

        output_serializer = InventoryTransactionSerializer(tx)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class InventoryTransactionController(generics.ListAPIView):
    """
    List immutable inventory movement records / audit trail.
    """
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsEmployeeRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["product", "transaction_type"]
    search_fields = ["reference", "notes", "product__name", "product__sku"]
    ordering_fields = ["created_at", "quantity"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return InventoryTransaction.objects.select_related("product", "user").all()


class InventorySummaryController(APIView):
    """
    Aggregates high-level inventory valuation, unit counts, and stock health metrics.
    """
    permission_classes = [IsEmployeeRole]

    def get(self, request, *args, **kwargs):
        products = Product.objects.all()

        total_products = products.count()
        total_units = products.aggregate(total=Sum("stock_quantity"))["total"] or 0

        total_cost = (
            products.aggregate(
                cost=Sum(F("stock_quantity") * F("purchase_price"), output_field=models.DecimalField())
            )["cost"]
            or Decimal("0.00")
        )

        total_retail = (
            products.aggregate(
                retail=Sum(F("stock_quantity") * F("selling_price"), output_field=models.DecimalField())
            )["retail"]
            or Decimal("0.00")
        )

        potential_profit = total_retail - total_cost

        in_stock_count = products.filter(status=Product.Status.IN_STOCK).count()
        low_stock_count = products.filter(status=Product.Status.LOW_STOCK).count()
        out_of_stock_count = products.filter(status=Product.Status.OUT_OF_STOCK).count()

        return Response(
            {
                "total_products": total_products,
                "total_stock_units": total_units,
                "total_cost_valuation": float(round(total_cost, 2)),
                "total_retail_valuation": float(round(total_retail, 2)),
                "potential_profit": float(round(potential_profit, 2)),
                "in_stock_count": in_stock_count,
                "low_stock_count": low_stock_count,
                "out_of_stock_count": out_of_stock_count,
            }
        )


class StockAlertsController(generics.ListAPIView):
    """
    List all products in low_stock or out_of_stock state for quick reordering.
    """
    serializer_class = ProductListSerializer
    permission_classes = [IsEmployeeRole]

    def get_queryset(self):
        return (
            Product.objects.select_related("category")
            .filter(status__in=[Product.Status.LOW_STOCK, Product.Status.OUT_OF_STOCK], is_active=True)
            .order_by("stock_quantity")
        )


# ===========================================================================
# MVC Aliases
# ===========================================================================
StockAdjustmentView = StockAdjustmentController
InventoryTransactionListView = InventoryTransactionController
InventorySummaryView = InventorySummaryController
StockAlertsView = StockAlertsController
