from rest_framework import serializers
from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    payment_terms_display = serializers.CharField(source="get_payment_terms_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    product_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "contact_person",
            "email",
            "phone",
            "gst_number",
            "address",
            "city",
            "state",
            "postal_code",
            "payment_terms",
            "payment_terms_display",
            "status",
            "status_display",
            "notes",
            "product_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_product_count(self, obj):
        if hasattr(obj, "products"):
            return obj.products.count()
        return 0

    def validate_gst_number(self, value):
        if value:
            return value.strip().upper()
        return value

    def validate_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Supplier name is required.")
        return val


class SupplierLookupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "contact_person", "phone", "city"]
