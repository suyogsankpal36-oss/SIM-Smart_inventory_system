from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "email", "total_purchases", "total_amount_spent", "last_purchase_date")
    search_fields = ("name", "phone", "email", "gst_number")
