from rest_framework import serializers

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "address",
            "city",
            "state",
            "postal_code",
            "gst_number",
            "total_purchases",
            "total_amount_spent",
            "last_purchase_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "total_purchases",
            "total_amount_spent",
            "last_purchase_date",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Customer name cannot be blank.")
        return cleaned

    def validate_gst_number(self, value):
        if value:
            return value.strip().upper()
        return ""

    def validate_phone(self, value):
        if value:
            return value.strip()
        return ""

    def validate_email(self, value):
        if value:
            return value.strip().lower()
        return ""


class CustomerDetailSerializer(CustomerSerializer):
    recent_orders = serializers.SerializerMethodField()

    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + ["recent_orders"]

    def get_recent_orders(self, obj):
        orders = obj.orders.order_by("-created_at")[:5]
        return [
            {
                "id": o.id,
                "order_number": o.order_number,
                "total_amount": float(o.total_amount),
                "payment_method": o.payment_method,
                "payment_method_display": o.get_payment_method_display(),
                "status": o.status,
                "status_display": o.get_status_display(),
                "created_at": o.created_at,
            }
            for o in orders
        ]
