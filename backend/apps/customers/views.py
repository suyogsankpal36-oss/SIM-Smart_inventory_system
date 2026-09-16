from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Customer
from .serializers import CustomerDetailSerializer, CustomerSerializer
from apps.accounts.permissions import IsAdminUserRole, IsEmployeeRole, IsManagerRole


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["city", "state"]
    search_fields = ["name", "phone", "email", "city", "gst_number"]
    ordering_fields = ["name", "total_amount_spent", "total_purchases", "last_purchase_date", "created_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CustomerDetailSerializer
        return CustomerSerializer

    def get_permissions(self):
        if self.action in ["destroy"]:
            return [IsAdminUserRole()]
        elif self.action in ["update", "partial_update"]:
            return [IsManagerRole()]
        # All authenticated employees can view, list, create, and search customers
        return [IsEmployeeRole()]

    @action(detail=False, methods=["get"])
    def top(self, request):
        """
        Returns top customers ranked by cumulative expenditure.
        """
        top_customers = self.get_queryset().filter(total_purchases__gt=0).order_by("-total_amount_spent")[:5]
        serializer = self.get_serializer(top_customers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="lookup")
    def lookup(self, request):
        """
        Fast, lightweight customer search endpoint for POS terminal autocomplete.
        Query param `q` matches name or phone.
        """
        query = request.query_params.get("q", "").strip()
        qs = self.get_queryset()
        if query:
            qs = qs.filter(name__icontains=query) | qs.filter(phone__icontains=query)
        qs = qs[:15]
        results = [
            {
                "id": c.id,
                "name": c.name,
                "phone": c.phone,
                "email": c.email,
                "gst_number": c.gst_number,
                "total_purchases": c.total_purchases,
            }
            for c in qs
        ]
        return Response(results)
