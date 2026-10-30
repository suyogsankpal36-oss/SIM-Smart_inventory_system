"""
Suppliers Controllers (MVC Pattern)
Orchestrates Supplier vendor directory lifecycle, autocomplete lookups, and terms.
"""
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUserRole, IsEmployeeRole, IsManagerRole
from apps.core.mvc import BaseModelController
from .models import Supplier
from .serializers import SupplierLookupSerializer, SupplierSerializer


class SupplierController(BaseModelController):
    """
    Controller for Suppliers and Vendors.
    - Cashiers/Employees: can view directory and perform lookup.
    - Managers/Admins: can create and update suppliers.
    - Admins: can delete suppliers.
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "payment_terms", "city", "state"]
    search_fields = ["name", "contact_person", "phone", "email", "gst_number"]
    ordering_fields = ["name", "created_at", "status"]
    ordering = ["name"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdminUserRole()]
        elif self.action in ["create", "update", "partial_update"]:
            return [IsManagerRole()]
        return [IsEmployeeRole()]

    @action(detail=False, methods=["get"], url_path="lookup")
    def lookup(self, request):
        """
        Fast autocomplete endpoint for selecting suppliers in product creation.
        """
        query = request.query_params.get("q", "").strip()
        qs = self.get_queryset().filter(status=Supplier.Status.ACTIVE)
        if query:
            qs = qs.filter(
                Q(name__icontains=query)
                | Q(contact_person__icontains=query)
                | Q(phone__icontains=query)
            )
        qs = qs[:20]
        serializer = SupplierLookupSerializer(qs, many=True)
        return Response(serializer.data)


# ===========================================================================
# MVC Aliases
# ===========================================================================
SupplierViewSet = SupplierController
