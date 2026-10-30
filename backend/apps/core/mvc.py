"""
Core MVC (Model-View-Controller) Architectural Contracts.

In the Smart Business & Inventory System:
- Model (M): Entity models defined in models.py (Domain entities, validation, state)
- View (V): Serializers & Presenters in serializers.py (Presentation layer, client contracts)
- Controller (C): Controllers in controllers.py (Request lifecycle, orchestration, service delegation)
"""

from rest_framework import generics, viewsets, status
from rest_framework.response import Response


class BaseController(generics.GenericAPIView):
    """
    Base API Controller providing standardized response formatting and lifecycle helpers.
    """
    def success_response(self, data=None, message="Success", status_code=status.HTTP_200_OK):
        payload = {"success": True, "message": message}
        if data is not None:
            payload["data"] = data
        return Response(payload, status=status_code)

    def error_response(self, detail="An error occurred", status_code=status.HTTP_400_BAD_REQUEST):
        return Response({"success": False, "detail": detail}, status=status_code)


class BaseModelController(viewsets.ModelViewSet):
    """
    Base CRUD Model Controller orchestrating domain models, serializers (views), and HTTP verbs.
    """
    pass


class BaseReadOnlyController(viewsets.ReadOnlyModelViewSet):
    """
    Base Read-Only Model Controller for reporting and queries.
    """
    pass


class BasePresenter:
    """
    Base View Presenter for custom presentation formatting before JSON serialization.
    """
    @classmethod
    def present(cls, data):
        return data
