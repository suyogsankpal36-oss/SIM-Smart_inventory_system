from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.expenses.models import Expense
from apps.products.models import Product
from apps.sales.models import Order
from apps.settings_app.models import BusinessSettings
from apps.suppliers.models import Supplier

from .models import ActivityLog
from .services import AuditService

User = get_user_model()


# ---------------- Auth Signals ----------------
@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR") if request else None
    ip = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else (request.META.get("REMOTE_ADDR") if request else None)
    AuditService.log(
        action=ActivityLog.ActionType.LOGIN,
        module=ActivityLog.ModuleType.ACCOUNTS,
        entity_name=f"User: {user.username}",
        entity_id=str(user.id),
        description=f"User '{user.username}' signed in to the application.",
        actor=user,
        ip_address=ip,
    )


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    if user and user.is_authenticated:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR") if request else None
        ip = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else (request.META.get("REMOTE_ADDR") if request else None)
        AuditService.log(
            action=ActivityLog.ActionType.LOGOUT,
            module=ActivityLog.ModuleType.ACCOUNTS,
            entity_name=f"User: {user.username}",
            entity_id=str(user.id),
            description=f"User '{user.username}' signed out.",
            actor=user,
            ip_address=ip,
        )


# ---------------- Product Signals ----------------
@receiver(post_save, sender=Product)
def log_product_save(sender, instance, created, **kwargs):
    if created:
        AuditService.log(
            action=ActivityLog.ActionType.CREATE,
            module=ActivityLog.ModuleType.PRODUCTS,
            entity_name=f"Product: {instance.name}",
            entity_id=str(instance.id),
            description=f"New product '{instance.name}' (SKU: {instance.sku}) added with initial stock {instance.stock_quantity}.",
            changes={
                "selling_price": str(instance.selling_price),
                "purchase_price": str(instance.purchase_price),
                "stock_quantity": instance.stock_quantity,
            },
        )


@receiver(post_delete, sender=Product)
def log_product_delete(sender, instance, **kwargs):
    AuditService.log(
        action=ActivityLog.ActionType.DELETE,
        module=ActivityLog.ModuleType.PRODUCTS,
        entity_name=f"Product: {instance.name}",
        entity_id=str(instance.id),
        description=f"Product '{instance.name}' (SKU: {instance.sku}) was deleted.",
    )


# ---------------- Sales Order Signals ----------------
@receiver(post_save, sender=Order)
def log_order_save(sender, instance, created, **kwargs):
    if created:
        AuditService.log(
            action=ActivityLog.ActionType.CREATE,
            module=ActivityLog.ModuleType.SALES,
            entity_name=f"Order: {instance.order_number}",
            entity_id=str(instance.id),
            description=f"POS Sale {instance.order_number} completed for total amount ₹{instance.total_amount} via {instance.payment_method.upper()}.",
            actor=instance.created_by,
        )


# ---------------- Expense Signals ----------------
@receiver(post_save, sender=Expense)
def log_expense_save(sender, instance, created, **kwargs):
    if created:
        desc = instance.description or instance.get_category_display()
        AuditService.log(
            action=ActivityLog.ActionType.CREATE,
            module=ActivityLog.ModuleType.EXPENSES,
            entity_name=f"Expense: {instance.get_category_display()}",
            entity_id=str(instance.id),
            description=f"Expense '{desc}' of ₹{instance.amount} recorded under {instance.get_category_display()}.",
            actor=instance.created_by,
        )


# ---------------- Supplier Signals ----------------
@receiver(post_save, sender=Supplier)
def log_supplier_save(sender, instance, created, **kwargs):
    if created:
        AuditService.log(
            action=ActivityLog.ActionType.CREATE,
            module=ActivityLog.ModuleType.SUPPLIERS,
            entity_name=f"Supplier: {instance.name}",
            entity_id=str(instance.id),
            description=f"Supplier partner '{instance.name}' added with terms {instance.payment_terms}.",
        )


# ---------------- Business Settings Signals ----------------
@receiver(post_save, sender=BusinessSettings)
def log_settings_save(sender, instance, created, **kwargs):
    if not created:
        AuditService.log(
            action=ActivityLog.ActionType.UPDATE,
            module=ActivityLog.ModuleType.SETTINGS,
            entity_name=f"Settings: {instance.business_name}",
            entity_id=str(instance.id),
            description=f"Business settings updated for '{instance.business_name}'.",
        )
