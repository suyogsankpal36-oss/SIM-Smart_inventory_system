from decimal import Decimal
from rest_framework import serializers

from .models import BusinessSettings


class BusinessSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessSettings
        fields = [
            "id",
            "business_name",
            "address",
            "phone",
            "email",
            "gst_number",
            "logo",
            "currency",
            "currency_symbol",
            "default_tax_rate",
            "low_stock_threshold",
            "invoice_prefix",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

    def to_internal_value(self, data):
        # If 'logo' is a string, URL, or empty (not an actual uploaded file),
        # remove it so DRF's ImageField does not reject it with 'The submitted data was not a file.'
        if hasattr(data, "copy"):
            data = data.copy()
        elif isinstance(data, dict):
            data = dict(data)

        logo_val = data.get("logo")
        if logo_val is not None and not hasattr(logo_val, "read"):
            data.pop("logo", None)

        return super().to_internal_value(data)


    def validate_gst_number(self, value):
        if value:
            return value.strip().upper()
        return value

    def validate_invoice_prefix(self, value):
        if value:
            return value.strip().upper()
        return "INV"

    def validate_default_tax_rate(self, value):
        if value < Decimal("0.00") or value > Decimal("100.00"):
            raise serializers.ValidationError("Default tax rate must be between 0.00% and 100.00%.")
        return value

    def validate_low_stock_threshold(self, value):
        if value < 1:
            raise serializers.ValidationError("Low stock threshold must be at least 1 unit.")
        return value
