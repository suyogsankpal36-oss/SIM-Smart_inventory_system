from django.contrib import admin

from .models import Invoice, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "customer", "status", "payment_method", "total_amount", "created_at")
    list_filter = ("status", "payment_method")
    search_fields = ("order_number", "customer__name")
    inlines = [OrderItemInline]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "order", "invoice_date", "total_amount")
    search_fields = ("invoice_number", "order__order_number")
