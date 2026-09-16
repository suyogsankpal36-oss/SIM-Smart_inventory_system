from decimal import Decimal
from rest_framework import serializers

from .models import Invoice, Order, OrderItem
from apps.customers.models import Customer
from apps.products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "quantity",
            "price",
            "tax",
            "discount",
            "total",
        ]
        read_only_fields = fields


class InvoiceSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_name = serializers.CharField(source="order.customer.name", read_only=True, default="Walk-in Customer")
    customer_phone = serializers.CharField(source="order.customer.phone", read_only=True, default="")
    customer_gst = serializers.CharField(source="order.customer.gst_number", read_only=True, default="")
    customer_address = serializers.CharField(source="order.customer.address", read_only=True, default="")
    customer_city = serializers.CharField(source="order.customer.city", read_only=True, default="")
    customer_state = serializers.CharField(source="order.customer.state", read_only=True, default="")
    payment_method = serializers.CharField(source="order.payment_method", read_only=True)
    payment_method_display = serializers.CharField(source="order.get_payment_method_display", read_only=True)
    subtotal = serializers.DecimalField(source="order.subtotal", max_digits=14, decimal_places=2, read_only=True)
    discount = serializers.DecimalField(source="order.discount", max_digits=14, decimal_places=2, read_only=True)
    tax = serializers.DecimalField(source="order.tax", max_digits=14, decimal_places=2, read_only=True)
    items = OrderItemSerializer(source="order.items", many=True, read_only=True)
    cashier_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "invoice_date",
            "total_amount",
            "order",
            "order_number",
            "customer_name",
            "customer_phone",
            "customer_gst",
            "customer_address",
            "customer_city",
            "customer_state",
            "payment_method",
            "payment_method_display",
            "subtotal",
            "discount",
            "tax",
            "items",
            "cashier_name",
            "created_at",
        ]
        read_only_fields = fields

    def get_cashier_name(self, obj):
        if not obj.order.created_by:
            return "System"
        name = f"{obj.order.created_by.first_name} {obj.order.created_by.last_name}".strip()
        return name or obj.order.created_by.username


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True, default="Walk-in Customer")
    customer_phone = serializers.CharField(source="customer.phone", read_only=True, default="")
    created_by_name = serializers.SerializerMethodField()
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer",
            "customer_name",
            "customer_phone",
            "subtotal",
            "discount",
            "tax",
            "total_amount",
            "payment_method",
            "payment_method_display",
            "status",
            "status_display",
            "items",
            "invoice",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return "System"
        name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return name or obj.created_by.username


class OrderCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(
        required=False, allow_blank=True, default="Customer requested cancellation / refund."
    )


class POSCheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product"
    )
    quantity = serializers.IntegerField(min_value=1, default=1)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), min_value=0)


class POSCheckoutSerializer(serializers.Serializer):
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source="customer", required=False, allow_null=True, default=None
    )
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.CASH
    )
    discount = serializers.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0.00"), min_value=0, required=False
    )
    items = POSCheckoutItemSerializer(many=True, allow_empty=False)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Cart cannot be empty.")
        return value
