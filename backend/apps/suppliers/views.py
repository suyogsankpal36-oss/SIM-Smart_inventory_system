"""
Suppliers Views / Presentation Bridge.
Re-exports MVC Controllers from controllers.py for Django routing and test compatibility.
"""
from .controllers import (
    SupplierController,
    SupplierViewSet,
)

__all__ = [
    "SupplierController",
    "SupplierViewSet",
]
