"""
Customers Views / Presentation Bridge.
Re-exports MVC Controllers from controllers.py for Django routing and test compatibility.
"""
from .controllers import (
    CustomerController,
    CustomerViewSet,
)

__all__ = [
    "CustomerController",
    "CustomerViewSet",
]
