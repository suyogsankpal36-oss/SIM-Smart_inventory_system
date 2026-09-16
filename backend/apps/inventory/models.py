from django.conf import settings
from django.db import models

from apps.products.models import Product


class InventoryTransaction(models.Model):
    """
    Immutable record of every stock movement. Rows are created by
    application logic (stock-in/out endpoints, sales, returns,
    adjustments) — never edited or deleted, so this table doubles as
    the inventory history/audit trail.
    """

    class TransactionType(models.TextChoices):
        STOCK_IN = "stock_in", "Stock In"
        STOCK_OUT = "stock_out", "Stock Out"
        ADJUSTMENT = "adjustment", "Adjustment"
        SALE = "sale", "Sale"
        RETURN = "return", "Return"

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="inventory_transactions")
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)

    quantity = models.IntegerField(help_text="Positive for stock increases, negative for decreases.")
    previous_stock = models.PositiveIntegerField()
    new_stock = models.PositiveIntegerField()

    reference = models.CharField(
        max_length=100, blank=True,
        help_text="e.g. order number, PO number - links this movement back to its source.",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="inventory_transactions"
    )
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "inventory_transactions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product", "-created_at"]),
            models.Index(fields=["transaction_type"]),
        ]

    def __str__(self):
        return f"{self.product.sku} | {self.transaction_type} | {self.quantity:+d}"
