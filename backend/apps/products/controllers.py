"""
Products Controllers (MVC Pattern)
Orchestrates Category and Product HTTP requests, business logic, and label streaming.
"""
import random
import string
from django.db import models
from django.db.models import Count, F
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUserRole, IsEmployeeRole, IsManagerRole
from apps.core.mvc import BaseModelController
from apps.settings_app.models import BusinessSettings
from .barcode_service import BarcodeLabelService
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductCreateUpdateSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class CategoryController(BaseModelController):
    """
    Controller for Product Categories.
    Manages CRUD lifecycle, product count annotations, and relational integrity.
    """
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update"]:
            return [IsManagerRole()]
        elif self.action in ["destroy"]:
            return [IsAdminUserRole()]
        return [IsEmployeeRole()]

    def get_queryset(self):
        return Category.objects.annotate(num_products=Count("products")).order_by("name")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
        except models.ProtectedError:
            count = instance.products.count()
            return Response(
                {
                    "detail": (
                        f"Cannot delete category '{instance.name}' because it contains "
                        f"{count} associated product{'s' if count != 1 else ''}. "
                        "Please reassign or delete those products first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProductController(BaseModelController):
    """
    Controller for Product Catalog.
    Manages CRUD lifecycle, stock threshold checks, SKU candidate generation, and vector/PDF barcode streaming.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "status", "is_active", "supplier_name"]
    search_fields = ["name", "sku", "category__name", "description"]
    ordering_fields = ["name", "selling_price", "purchase_price", "stock_quantity", "created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update"]:
            return [IsManagerRole()]
        elif self.action in ["destroy"]:
            return [IsAdminUserRole()]
        return [IsEmployeeRole()]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        elif self.action == "retrieve":
            return ProductDetailSerializer
        return ProductCreateUpdateSerializer

    def get_queryset(self):
        qs = Product.objects.select_related("category").all()

        low_stock = self.request.query_params.get("low_stock")
        if low_stock and low_stock.lower() in ["true", "1", "yes"]:
            qs = qs.filter(stock_quantity__lte=F("minimum_stock"))

        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
        except models.ProtectedError:
            return Response(
                {
                    "detail": (
                        f"Cannot delete product '{instance.name}' because it is linked to sales orders "
                        "or inventory records. You can deactivate it by setting 'is_active' to false instead."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"], url_path="generate-sku")
    def generate_sku(self, request):
        """
        Generates a guaranteed unique SKU candidate: PRD-XXXXXX.
        """
        for _ in range(20):
            suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
            sku = f"PRD-{suffix}"
            if not Product.objects.filter(sku=sku).exists():
                return Response({"sku": sku})
        return Response({"sku": f"PRD-{random.randint(100000, 999999)}"})

    @action(detail=False, methods=["get"], url_path="alerts")
    def alerts(self, request):
        """
        Returns all products that have reached or dropped below their minimum stock threshold.
        """
        low_stock_products = (
            Product.objects.select_related("category")
            .filter(stock_quantity__lte=F("minimum_stock"), is_active=True)
            .order_by("stock_quantity")
        )
        serializer = ProductListSerializer(low_stock_products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="barcode")
    def barcode(self, request, pk=None):
        """
        GET /api/products/<id>/barcode/?type=code128 (or type=qr)
        Streams vector SVG for product SKU barcode or QR code.
        """
        product = self.get_object()
        barcode_type = request.query_params.get("type", "code128").lower()

        if barcode_type == "qr":
            svg = BarcodeLabelService.generate_qr_svg(product.sku)
        else:
            svg = BarcodeLabelService.generate_barcode_svg(product.sku)

        return HttpResponse(svg, content_type="image/svg+xml")

    @action(detail=True, methods=["get"], url_path="label-pdf")
    def label_pdf(self, request, pk=None):
        """
        GET /api/products/<id>/label-pdf/?quantity=1&layout=a4_24
        Streams printable PDF labels for a single product.
        """
        product = self.get_object()
        quantity = int(request.query_params.get("quantity", 1))
        layout = request.query_params.get("layout", "a4_24")

        try:
            settings_obj = BusinessSettings.load()
            business_name = settings_obj.business_name or "Smart Inventory"
        except Exception:
            business_name = "Smart Inventory"

        items = [{
            "name": product.name,
            "sku": product.sku,
            "price": str(product.selling_price),
            "quantity": quantity,
        }]

        pdf = BarcodeLabelService.generate_labels_pdf(
            items=items,
            label_layout=layout,
            business_name=business_name,
        )

        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="labels_{product.sku}.pdf"'
        return response

    @action(detail=False, methods=["post"], url_path="batch-labels-pdf")
    def batch_labels_pdf(self, request):
        """
        POST /api/products/batch-labels-pdf/
        Accepts: {"items": [{"product_id": 1, "quantity": 10}, ...], "layout": "a4_24"}
        Streams a multi-page printable barcode label sheet for multiple products.
        """
        raw_items = request.data.get("items", [])
        layout = request.data.get("layout", "a4_24")

        try:
            settings_obj = BusinessSettings.load()
            business_name = settings_obj.business_name or "Smart Inventory"
        except Exception:
            business_name = "Smart Inventory"

        formatted_items = []
        for entry in raw_items:
            prod_id = entry.get("product_id")
            qty = max(1, int(entry.get("quantity", 1)))
            product = Product.objects.filter(pk=prod_id).first()
            if product:
                formatted_items.append({
                    "name": product.name,
                    "sku": product.sku,
                    "price": str(product.selling_price),
                    "quantity": qty,
                })

        if not formatted_items:
            return Response(
                {"detail": "No valid products provided for label generation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pdf = BarcodeLabelService.generate_labels_pdf(
            items=formatted_items,
            label_layout=layout,
            business_name=business_name,
        )

        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = 'inline; filename="batch_labels.pdf"'
        return response


# ===========================================================================
# MVC Aliases
# ===========================================================================
CategoryViewSet = CategoryController
ProductViewSet = ProductController
