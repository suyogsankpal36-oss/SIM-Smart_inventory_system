"""
Notifications Controllers (MVC Pattern)
Orchestrates notification dispatch, unread polling, and inbox clearing.
"""
from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.mvc import BaseModelController
from .models import Notification
from .serializers import NotificationSerializer


class NotificationController(BaseModelController):
    """
    Controller for In-app notifications.
    Lists notifications targeted to the authenticated user or broadcast system-wide.
    Provides fast unread-count, mark-as-read, and bulk clear operations.
    """
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ("is_read", "notification_type", "severity")
    search_fields = ("title", "message", "reference_id")
    ordering_fields = ("created_at", "severity", "is_read")

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(Q(recipient=user) | Q(recipient__isnull=True)).order_by("-created_at")

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        """
        GET /api/notifications/unread-count/
        Fast lightweight endpoint for header notification badge.
        """
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        """
        POST /api/notifications/<id>/mark-read/
        Marks a single notification as read.
        """
        notification = self.get_object()
        notification.mark_as_read()
        return Response(self.get_serializer(notification).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        """
        POST /api/notifications/mark-all-read/
        Marks all unread notifications for the user as read.
        """
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now(),
        )
        return Response(
            {"message": f"{updated} notification(s) marked as read."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["delete"], url_path="clear-read")
    def clear_read(self, request):
        """
        DELETE /api/notifications/clear-read/
        Purges all read notifications to keep the inbox tidy.
        """
        count, _ = self.get_queryset().filter(is_read=True).delete()
        return Response(
            {"message": f"{count} read notification(s) cleared."},
            status=status.HTTP_200_OK,
        )


# ===========================================================================
# MVC Aliases
# ===========================================================================
NotificationViewSet = NotificationController
