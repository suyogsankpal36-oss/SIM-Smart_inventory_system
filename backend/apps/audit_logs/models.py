from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """
    Immutable audit log entry recording actions taken across the system.
    """

    class ActionType(models.TextChoices):
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        DELETE = "delete", "Delete"
        LOGIN = "login", "Login"
        LOGOUT = "logout", "Logout"
        PRICE_CHANGE = "price_change", "Price Change"
        STOCK_CHANGE = "stock_change", "Stock Change"

    class ModuleType(models.TextChoices):
        ACCOUNTS = "accounts", "Staff & Security"
        PRODUCTS = "products", "Products & Categories"
        INVENTORY = "inventory", "Inventory"
        SALES = "sales", "Sales & POS"
        CUSTOMERS = "customers", "Customers"
        SUPPLIERS = "suppliers", "Suppliers & Vendors"
        EXPENSES = "expenses", "Expenses"
        SETTINGS = "settings", "Business Settings"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="activity_logs",
    )
    action = models.CharField(
        max_length=20,
        choices=ActionType.choices,
        default=ActionType.UPDATE,
        db_index=True,
    )
    module = models.CharField(
        max_length=50,
        choices=ModuleType.choices,
        default=ModuleType.PRODUCTS,
        db_index=True,
    )
    entity_name = models.CharField(max_length=150, db_index=True)
    entity_id = models.CharField(max_length=50, blank=True)
    description = models.TextField()
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["module", "action"]),
            models.Index(fields=["actor", "-created_at"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {actor_name} -> {self.action.upper()} on {self.entity_name}"
