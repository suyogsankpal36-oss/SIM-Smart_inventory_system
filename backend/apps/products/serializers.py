import random
import string
from decimal import Decimal
from rest_framework import serializers
from django.db import transaction

from .models import Category, Product
from apps.inventory.models import InventoryTransaction


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "status",
            "product_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_product_count(self, obj):
        if hasattr(obj, "num_products"):
            return obj.num_products
        return obj.products.count()

    def validate_name(self, value):
        qs = Category.objects.filter(name__iexact=value.strip())
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A category with this name already exists.")
        return value.strip()


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default="Uncategorized")
    profit_margin_percent = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "category_name",
            "purchase_price",
            "selling_price",
            "tax_rate",
            "stock_quantity",
            "minimum_stock",
            "supplier_name",
            "status",
            "is_active",
            "image",
            "profit_margin_percent",
            "created_at",
            "updated_at",
        ]

    def get_profit_margin_percent(self, obj):
        if obj.purchase_price and obj.purchase_price > 0:
            margin = ((obj.selling_price - obj.purchase_price) / obj.purchase_price) * 100
            return round(float(margin), 2)
        return 0.0


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True, required=False, allow_null=True
    )
    profit_margin_percent = serializers.SerializerMethodField()
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "category_id",
            "description",
            "purchase_price",
            "selling_price",
            "tax_rate",
            "stock_quantity",
            "minimum_stock",
            "supplier_name",
            "status",
            "is_active",
            "image",
            "profit_margin_percent",
            "recent_transactions",
            "created_at",
            "updated_at",
        ]

    def get_profit_margin_percent(self, obj):
        if obj.purchase_price and obj.purchase_price > 0:
            margin = ((obj.selling_price - obj.purchase_price) / obj.purchase_price) * 100
            return round(float(margin), 2)
        return 0.0

    def get_recent_transactions(self, obj):
        txs = obj.inventory_transactions.select_related("user").order_by("-created_at")[:5]
        return [
            {
                "id": tx.id,
                "transaction_type": tx.transaction_type,
                "transaction_type_display": tx.get_transaction_type_display(),
                "quantity": tx.quantity,
                "previous_stock": tx.previous_stock,
                "new_stock": tx.new_stock,
                "reference": tx.reference,
                "user_name": tx.user.get_full_name() or tx.user.username if tx.user else "System",
                "notes": tx.notes,
                "created_at": tx.created_at,
            }
            for tx in txs
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    initial_stock = serializers.IntegerField(
        write_only=True, required=False, default=0, min_value=0,
        help_text="Initial stock units on creation. Creates an automatic stock-in audit entry."
    )
    category_name = serializers.CharField(source="category.name", read_only=True, default="Uncategorized")

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "category_name",
            "description",
            "purchase_price",
            "selling_price",
            "tax_rate",
            "stock_quantity",
            "minimum_stock",
            "supplier_name",
            "status",
            "is_active",
            "image",
            "initial_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "stock_quantity", "status", "created_at", "updated_at"]

    def validate_sku(self, value):
        cleaned = value.strip().upper()
        if not cleaned:
            raise serializers.ValidationError("SKU cannot be blank.")
        qs = Product.objects.filter(sku__iexact=cleaned)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this SKU already exists.")
        return cleaned

    def validate(self, attrs):
        purchase = attrs.get("purchase_price", getattr(self.instance, "purchase_price", None))
        selling = attrs.get("selling_price", getattr(self.instance, "selling_price", None))
        if purchase is not None and selling is not None and selling < purchase:
            if selling < 0 or purchase < 0:
                raise serializers.ValidationError("Prices cannot be negative.")
        return attrs

    def create(self, validated_data):
        initial_stock = validated_data.pop("initial_stock", 0)
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None

        with transaction.atomic():
            validated_data["stock_quantity"] = initial_stock
            product = super().create(validated_data)
            product.refresh_status(save=True)

            if initial_stock > 0:
                InventoryTransaction.objects.create(
                    product=product,
                    transaction_type=InventoryTransaction.TransactionType.STOCK_IN,
                    quantity=initial_stock,
                    previous_stock=0,
                    new_stock=initial_stock,
                    reference="INITIAL-STOCK",
                    user=user,
                    notes="Initial stock quantity recorded on product creation.",
                )

        return product

    def update(self, instance, validated_data):
        validated_data.pop("initial_stock", None)
        product = super().update(instance, validated_data)
        product.refresh_status(save=True)
        return product
