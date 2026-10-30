from django.urls import path
from .controllers import BusinessSettingsController

urlpatterns = [
    path("", BusinessSettingsController.as_view(), name="business-settings"),
]
