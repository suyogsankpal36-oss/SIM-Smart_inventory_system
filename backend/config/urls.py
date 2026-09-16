"""
Root URL configuration.
Each app owns its own urls.py; this file just mounts them under /api/.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as e:
        return JsonResponse({"status": "unhealthy", "database": str(e)}, status=503)
    return JsonResponse({"status": "healthy", "database": "connected", "service": "smart-inventory-system"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),

    path("api/auth/", include("apps.accounts.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/inventory/", include("apps.inventory.urls")),
    path("api/customers/", include("apps.customers.urls")),
    path("api/", include("apps.sales.urls")),  # orders/, invoices/
    path("api/expenses/", include("apps.expenses.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
    path("api/settings/", include("apps.settings_app.urls")),
    path("api/suppliers/", include("apps.suppliers.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/audit-logs/", include("apps.audit_logs.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
