import csv
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUserRole
from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Immutable audit log API.
    Guarded strictly for Administrators (IsAdminUserRole).
    Provides searchable timelines, metric summaries, and CSV report export.
    """

    queryset = ActivityLog.objects.select_related("actor").all().order_by("-created_at")
    serializer_class = ActivityLogSerializer
    permission_classes = (IsAdminUserRole,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ("action", "module", "actor")
    search_fields = (
        "description",
        "entity_name",
        "entity_id",
        "actor__username",
        "actor__first_name",
        "actor__last_name",
        "ip_address",
    )
    ordering_fields = ("created_at", "action", "module")

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """
        GET /api/audit-logs/stats/
        Aggregates summary statistics for dashboard cards.
        """
        now = timezone.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        total_logs = ActivityLog.objects.count()
        today_logs = ActivityLog.objects.filter(created_at__gte=start_of_today).count()

        # Action breakdown
        action_counts = {}
        for choice, _ in ActivityLog.ActionType.choices:
            action_counts[choice] = ActivityLog.objects.filter(action=choice).count()

        # Module breakdown
        module_counts = {}
        for choice, _ in ActivityLog.ModuleType.choices:
            module_counts[choice] = ActivityLog.objects.filter(module=choice).count()

        # Top 5 most active users
        top_actors = []
        actor_groups = (
            ActivityLog.objects.filter(actor__isnull=False)
            .values("actor__id", "actor__username", "actor__first_name", "actor__last_name", "actor__role")
            .order_by()
        )
        # Group in python or via annotations
        from django.db.models import Count
        actor_stats = (
            ActivityLog.objects.filter(actor__isnull=False)
            .values("actor__id", "actor__username", "actor__role")
            .annotate(event_count=Count("id"))
            .order_by("-event_count")[:5]
        )

        return Response(
            {
                "total_logs": total_logs,
                "today_logs": today_logs,
                "action_counts": action_counts,
                "module_counts": module_counts,
                "top_actors": list(actor_stats),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        """
        GET /api/audit-logs/export/
        Streams a CSV file containing all filtered audit records.
        """
        queryset = self.filter_queryset(self.get_queryset())

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        filename = f"audit_trail_{timezone.now():%Y%m%d_%H%M%S}.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow([
            "Timestamp (UTC)",
            "Actor Username",
            "Actor Role",
            "Action",
            "Module",
            "Entity Name",
            "Entity ID",
            "Description",
            "IP Address",
        ])

        for log in queryset.iterator():
            writer.writerow([
                log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                log.actor.username if log.actor else "System",
                log.actor.role if log.actor else "N/A",
                log.get_action_display(),
                log.get_module_display(),
                log.entity_name,
                log.entity_id,
                log.description,
                log.ip_address or "—",
            ])

        return response
