from django.conf import settings
from django.db import models
from django.utils import timezone


class Notification(models.Model):
    """
    In-app notification for stock thresholds, order events, and system alerts.
    Recipient null indicates broadcast to all admins and managers.
    """

    class NotificationType(models.TextChoices):
        LOW_STOCK = "low_stock", "Low Stock"
        OUT_OF_STOCK = "out_of_stock", "Out of Stock"
        SYSTEM = "system", "System Alert"
        SALES = "sales", "Sales Alert"

    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        CRITICAL = "critical", "Critical"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    title = models.CharField(max_length=200)
    message = models.TextField()

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.INFO,
    )

    reference_id = models.CharField(max_length=50, blank=True)
    reference_type = models.CharField(max_length=50, blank=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_read"]),
            models.Index(fields=["notification_type"]),
            models.Index(fields=["severity"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.title}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])
