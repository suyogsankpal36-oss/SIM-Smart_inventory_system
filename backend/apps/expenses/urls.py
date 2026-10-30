from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .controllers import ExpenseController

router = DefaultRouter()
router.register(r"", ExpenseController, basename="expense")

urlpatterns = [
    path("", include(router.urls)),
]
