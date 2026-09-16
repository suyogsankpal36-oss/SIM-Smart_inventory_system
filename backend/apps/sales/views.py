from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Invoice, Order, OrderItem
from .serializers import (
    InvoiceSerializer,
    OrderCancelSerializer,
    OrderSerializer,
    POSCheckoutSerializer,
)
from apps.accounts.permissions import IsEmployeeRole, IsManagerRole
from apps.inventory.models import InventoryTransaction
from apps.products.models import Product
from apps.products.serializers import ProductListSerializer


class POSCheckoutView(APIView):
    """
    Atomic Point of Sale checkout endpoint.
    Verifies stock with select_for_update, decrements inventory, creates
    Order, OrderItems, Invoice, InventoryTransactions, and updates Customer analytics.
    """
    permission_classes = [IsEmployeeRole]

    def post(self, request, *args, **kwargs):
        serializer = POSCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer = serializer.validated_data.get("customer")
        payment_method = serializer.validated_data.get("payment_method", Order.PaymentMethod.CASH)
        order_discount = serializer.validated_data.get("discount", Decimal("0.00"))
        items_data = serializer.validated_data["items"]

        with transaction.atomic():
            subtotal = Decimal("0.00")
            total_tax = Decimal("0.00")
            prepared_items = []

            for item in items_data:
                product_obj = item["product"]
                qty = item["quantity"]
                item_discount = item.get("discount", Decimal("0.00"))

                # Lock product row for safe concurrent modification
                product = Product.objects.select_for_update().get(pk=product_obj.pk)

                if not product.is_active:
                    return Response(
                        {"detail": f"Product '{product.name}' is inactive and cannot be sold."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if product.stock_quantity < qty:
                    return Response(
                        {
                            "detail": (
                                f"Insufficient stock for '{product.name}' ({product.sku}). "
                                f"Available in inventory: {product.stock_quantity} units, requested: {qty} units."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                unit_price = product.selling_price
                line_subtotal = unit_price * qty
                tax_pct = product.tax_rate or Decimal("0.00")
                line_tax = round((line_subtotal * tax_pct) / Decimal("100.00"), 2)
                line_total = max(Decimal("0.00"), line_subtotal - item_discount + line_tax)

                previous_stock = product.stock_quantity
                product.stock_quantity -= qty
                product.refresh_status(save=False)
                product.save(update_fields=["stock_quantity", "status", "updated_at"])

                subtotal += line_subtotal
                total_tax += line_tax
                prepared_items.append(
                    (product, qty, unit_price, line_tax, item_discount, line_total, previous_stock)
                )

            grand_total = max(Decimal("0.00"), subtotal - order_discount + total_tax)

            # Create finalized Order
            order = Order.objects.create(
                customer=customer,
                subtotal=subtotal,
                discount=order_discount,
                tax=total_tax,
                total_amount=grand_total,
                payment_method=payment_method,
                status=Order.Status.COMPLETED,
                created_by=request.user,
            )

            # Create matching tax Invoice
            Invoice.objects.create(
                order=order,
                total_amount=grand_total,
            )

            # Create OrderItems and audit trail InventoryTransactions
            for product, qty, unit_price, line_tax, item_discount, line_total, prev_stock in prepared_items:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=qty,
                    price=unit_price,
                    tax=line_tax,
                    discount=item_discount,
                    total=line_total,
                )

                InventoryTransaction.objects.create(
                    product=product,
                    transaction_type=InventoryTransaction.TransactionType.SALE,
                    quantity=-qty,
                    previous_stock=prev_stock,
                    new_stock=product.stock_quantity,
                    reference=order.order_number,
                    user=request.user,
                    notes=f"POS checkout sale: {order.order_number}",
                )

            # Atomically update Customer denormalized analytics
            if customer:
                customer.total_purchases += 1
                customer.total_amount_spent += grand_total
                customer.last_purchase_date = order.created_at
                customer.save(update_fields=["total_purchases", "total_amount_spent", "last_purchase_date", "updated_at"])

        saved_order = (
            Order.objects.select_related("customer", "created_by", "invoice")
            .prefetch_related("items__product")
            .get(pk=order.pk)
        )
        output_serializer = OrderSerializer(saved_order)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class POSProductCatalogView(APIView):
    """
    Lightweight, fast product listing for the POS terminal.
    """
    permission_classes = [IsEmployeeRole]

    def get(self, request):
        qs = Product.objects.filter(is_active=True).select_related("category")

        barcode = request.query_params.get("barcode")
        if barcode:
            qs = qs.filter(sku__iexact=barcode.strip())
            serializer = ProductListSerializer(qs, many=True)
            return Response(serializer.data)

        category = request.query_params.get("category")
        if category and category != "all":
            qs = qs.filter(category_id=category)

        search = request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(name__icontains=search) | qs.filter(sku__icontains=search)

        qs = qs.order_by("name")[:100]
        serializer = ProductListSerializer(qs, many=True)
        return Response(serializer.data)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve historical sales orders with itemized details and cancellation support.
    """
    queryset = (
        Order.objects.select_related("customer", "created_by", "invoice")
        .prefetch_related("items__product")
        .all()
    )
    serializer_class = OrderSerializer
    permission_classes = [IsEmployeeRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "payment_method", "customer"]
    search_fields = ["order_number", "customer__name", "customer__phone"]
    ordering_fields = ["created_at", "total_amount", "order_number"]
    ordering = ["-created_at"]

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """
        Executive metrics for the orders overview page.
        """
        total = Order.objects.count()
        completed = Order.objects.filter(status=Order.Status.COMPLETED).count()
        cancelled = Order.objects.filter(status=Order.Status.CANCELLED).count()
        revenue = (
            Order.objects.filter(status=Order.Status.COMPLETED).aggregate(s=Sum("total_amount"))["s"]
            or Decimal("0.00")
        )
        return Response(
            {
                "total_orders": total,
                "completed_orders": completed,
                "cancelled_orders": cancelled,
                "total_revenue": float(round(revenue, 2)),
            }
        )

    @action(detail=True, methods=["post"], url_path="cancel", permission_classes=[IsManagerRole])
    def cancel_order(self, request, pk=None):
        """
        Cancels an order, restores product quantities to inventory, logs Return
        audit transactions, and reverses customer spend metrics.
        """
        order = self.get_object()

        if order.status != Order.Status.COMPLETED:
            return Response(
                {"detail": f"Order cannot be cancelled because its status is already '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OrderCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get("reason", "Customer requested cancellation.")

        with transaction.atomic():
            order.status = Order.Status.CANCELLED
            order.save(update_fields=["status", "updated_at"])

            # Reverse inventory deduction for each line item
            for item in order.items.select_related("product").all():
                product = Product.objects.select_for_update().get(pk=item.product.pk)
                prev_stock = product.stock_quantity
                product.stock_quantity += item.quantity
                product.refresh_status(save=False)
                product.save(update_fields=["stock_quantity", "status", "updated_at"])

                InventoryTransaction.objects.create(
                    product=product,
                    transaction_type=InventoryTransaction.TransactionType.RETURN,
                    quantity=item.quantity,
                    previous_stock=prev_stock,
                    new_stock=product.stock_quantity,
                    reference=order.order_number,
                    user=request.user,
                    notes=f"Order cancellation restock: {order.order_number} ({reason})",
                )

            # Revert customer analytics if customer was linked
            if order.customer:
                customer = order.customer
                customer.total_purchases = max(0, customer.total_purchases - 1)
                customer.total_amount_spent = max(Decimal("0.00"), customer.total_amount_spent - order.total_amount)
                customer.save(update_fields=["total_purchases", "total_amount_spent", "updated_at"])

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve invoices with full GST tax breakdown.
    """
    queryset = (
        Invoice.objects.select_related("order__customer", "order__created_by")
        .prefetch_related("order__items__product")
        .all()
    )
    serializer_class = InvoiceSerializer
    permission_classes = [IsEmployeeRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["order__status", "order__payment_method"]
    search_fields = [
        "invoice_number",
        "order__order_number",
        "order__customer__name",
        "order__customer__phone",
    ]
    ordering_fields = ["created_at", "total_amount", "invoice_number"]
    ordering = ["-created_at"]
