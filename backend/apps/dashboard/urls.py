from django.urls import path
from .controllers import DashboardStatsController

urlpatterns = [
    path("", DashboardStatsController.as_view(), name="dashboard-stats"),
]
