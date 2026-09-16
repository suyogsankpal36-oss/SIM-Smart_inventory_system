from rest_framework import parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BusinessSettings
from .serializers import BusinessSettingsSerializer
from apps.accounts.permissions import IsAdminUserRole


class BusinessSettingsView(APIView):
    """
    Singleton BusinessSettings endpoint.
    GET: Accessible to all authenticated users (needed for store receipts, dashboard, and header).
    PUT/PATCH: Restricted to Administrators (IsAdminUserRole).
    """
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get(self, request):
        settings_obj = BusinessSettings.load()
        serializer = BusinessSettingsSerializer(settings_obj, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        settings_obj = BusinessSettings.load()
        serializer = BusinessSettingsSerializer(
            settings_obj, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        return self.patch(request)
