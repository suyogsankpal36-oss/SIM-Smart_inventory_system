from django.contrib import admin

from .models import BusinessSettings


@admin.register(BusinessSettings)
class BusinessSettingsAdmin(admin.ModelAdmin):
    list_display = ("business_name", "currency", "default_tax_rate", "low_stock_threshold")

    def has_add_permission(self, request):
        # Singleton - only allow adding if no row exists yet.
        return not BusinessSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
