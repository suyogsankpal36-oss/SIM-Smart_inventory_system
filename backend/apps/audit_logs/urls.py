from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .controllers import ActivityLogController

router = DefaultRouter()
router.register(r"", ActivityLogController, basename="audit-log")

urlpatterns = [
    path("", include(router.urls)),
]
