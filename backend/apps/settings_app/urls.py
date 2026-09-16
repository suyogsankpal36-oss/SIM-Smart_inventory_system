from django.urls import path
from .views import BusinessSettingsView

urlpatterns = [
    path("", BusinessSettingsView.as_view(), name="business-settings"),
]
