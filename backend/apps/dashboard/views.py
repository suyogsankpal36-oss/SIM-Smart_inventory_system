"""
Dashboard Views / Presentation Bridge.
Re-exports MVC Controllers from controllers.py for Django routing and test compatibility.
"""
from .controllers import (
    DashboardStatsController,
    DashboardStatsView,
)

__all__ = [
    "DashboardStatsController",
    "DashboardStatsView",
]
