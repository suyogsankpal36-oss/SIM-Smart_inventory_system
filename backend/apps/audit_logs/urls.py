from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ActivityLogViewSet

router = DefaultRouter()
router.register(r"", ActivityLogViewSet, basename="audit-log")

urlpatterns = [
    path("", include(router.urls)),
]
