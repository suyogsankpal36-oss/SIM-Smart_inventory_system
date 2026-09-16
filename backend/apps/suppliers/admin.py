from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("name", "contact_person", "phone", "email", "city", "payment_terms", "status")
    list_filter = ("status", "payment_terms", "state")
    search_fields = ("name", "contact_person", "phone", "email", "gst_number")
