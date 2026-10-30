"""
Products Views / Presentation Bridge.
Re-exports MVC Controllers from controllers.py for Django routing and test compatibility.
"""
from .controllers import (
    CategoryController,
    ProductController,
    CategoryViewSet,
    ProductViewSet,
)

__all__ = [
    "CategoryController",
    "ProductController",
    "CategoryViewSet",
    "ProductViewSet",
]
