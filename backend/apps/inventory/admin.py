from django.contrib import admin

from .models import InventoryTransaction


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "product", "transaction_type", "quantity", "previous_stock",
        "new_stock", "user", "created_at",
    )
    list_filter = ("transaction_type",)
    search_fields = ("product__name", "product__sku", "reference")
    readonly_fields = [f.name for f in InventoryTransaction._meta.fields]

    def has_change_permission(self, request, obj=None):
        # Transactions are an audit trail - never editable once created.
        return False
