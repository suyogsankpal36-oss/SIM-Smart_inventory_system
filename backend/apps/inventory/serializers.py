from rest_framework import serializers

from .models import InventoryTransaction
from apps.products.models import Product


class InventoryTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    transaction_type_display = serializers.CharField(source="get_transaction_type_display", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = InventoryTransaction
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "transaction_type",
            "transaction_type_display",
            "quantity",
            "previous_stock",
            "new_stock",
            "reference",
            "user",
            "user_name",
            "notes",
            "created_at",
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if not obj.user:
            return "System"
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name or obj.user.username


class StockAdjustmentSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )
    adjustment_type = serializers.ChoiceField(
        choices=[
            (InventoryTransaction.TransactionType.STOCK_IN, "Stock In (+)"),
            (InventoryTransaction.TransactionType.STOCK_OUT, "Stock Out (-)"),
            (InventoryTransaction.TransactionType.ADJUSTMENT, "Physical Count Adjustment (=)"),
        ]
    )
    quantity = serializers.IntegerField(
        min_value=0,
        help_text="Units to add/remove, or the exact physical count if adjustment type is 'adjustment'."
    )
    reference = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default="",
        help_text="e.g. PO-1024, Damage write-off, Audit-2026."
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        product = attrs["product"]
        adj_type = attrs["adjustment_type"]
        qty = attrs["quantity"]

        if adj_type == InventoryTransaction.TransactionType.STOCK_OUT:
            if qty <= 0:
                raise serializers.ValidationError({"quantity": "Quantity must be greater than zero for stock-out."})
            if qty > product.stock_quantity:
                raise serializers.ValidationError(
                    {"quantity": f"Cannot remove {qty} units. Current available stock is only {product.stock_quantity} units."}
                )
        elif adj_type == InventoryTransaction.TransactionType.STOCK_IN:
            if qty <= 0:
                raise serializers.ValidationError({"quantity": "Quantity must be greater than zero for stock-in."})

        return attrs
