from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "product_count", "created_at")
    search_fields = ("name",)
    list_filter = ("status",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name", "sku", "category", "selling_price", "stock_quantity",
        "minimum_stock", "status", "is_active",
    )
    search_fields = ("name", "sku")
    list_filter = ("status", "category", "is_active")
