from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .controllers import CategoryController, ProductController

router = DefaultRouter()
router.register(r"categories", CategoryController, basename="category")
router.register(r"", ProductController, basename="product")

urlpatterns = [
    path("", include(router.urls)),
]
