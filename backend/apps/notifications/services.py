from .models import Notification


class NotificationService:
    @classmethod
    def check_product_stock(cls, product):
        """
        Evaluates a product's current stock against minimum_stock.
        Creates/updates low_stock or out_of_stock alerts or auto-resolves when restocked.
        """
        if not product or not product.pk:
            return None

        ref_id = str(product.pk)
        ref_type = "product"

        # 1. Out of stock
        if product.stock_quantity <= 0:
            existing = Notification.objects.filter(
                reference_id=ref_id,
                reference_type=ref_type,
                is_read=False,
            ).first()

            title = f"Out of Stock: {product.name}"
            message = (
                f"Product '{product.name}' (SKU: {product.sku}) has reached 0 units. "
                "Immediate replenishment required."
            )

            if existing:
                existing.title = title
                existing.message = message
                existing.notification_type = Notification.NotificationType.OUT_OF_STOCK
                existing.severity = Notification.Severity.CRITICAL
                existing.save(update_fields=["title", "message", "notification_type", "severity"])
                return existing
            else:
                return Notification.objects.create(
                    title=title,
                    message=message,
                    notification_type=Notification.NotificationType.OUT_OF_STOCK,
                    severity=Notification.Severity.CRITICAL,
                    reference_id=ref_id,
                    reference_type=ref_type,
                )

        # 2. Low stock
        elif product.stock_quantity <= product.minimum_stock:
            existing = Notification.objects.filter(
                reference_id=ref_id,
                reference_type=ref_type,
                is_read=False,
            ).first()

            title = f"Low Stock Warning: {product.name}"
            message = (
                f"Product '{product.name}' (SKU: {product.sku}) is running low with {product.stock_quantity} "
                f"units remaining (Minimum threshold: {product.minimum_stock})."
            )

            if existing:
                existing.title = title
                existing.message = message
                existing.notification_type = Notification.NotificationType.LOW_STOCK
                existing.severity = Notification.Severity.WARNING
                existing.save(update_fields=["title", "message", "notification_type", "severity"])
                return existing
            else:
                return Notification.objects.create(
                    title=title,
                    message=message,
                    notification_type=Notification.NotificationType.LOW_STOCK,
                    severity=Notification.Severity.WARNING,
                    reference_id=ref_id,
                    reference_type=ref_type,
                )

        # 3. Restocked above threshold: Auto-resolve open stock alerts for this product
        else:
            open_alerts = Notification.objects.filter(
                reference_id=ref_id,
                reference_type=ref_type,
                is_read=False,
                notification_type__in=[
                    Notification.NotificationType.LOW_STOCK,
                    Notification.NotificationType.OUT_OF_STOCK,
                ],
            )
            for alert in open_alerts:
                alert.mark_as_read()
            return None

    @classmethod
    def create_system_alert(cls, title, message, severity=Notification.Severity.INFO, recipient=None):
        return Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=Notification.NotificationType.SYSTEM,
            severity=severity,
        )
