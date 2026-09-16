import logging
from .middleware import get_current_ip, get_current_user
from .models import ActivityLog

logger = logging.getLogger(__name__)


class AuditService:
    @classmethod
    def log(
        cls,
        action,
        module,
        entity_name,
        description,
        entity_id="",
        changes=None,
        actor=None,
        ip_address=None,
    ):
        """
        Records an immutable audit log entry.
        Falls back to thread-local actor and IP address if not explicitly passed.
        Safe against failures (logs warning instead of aborting main operation).
        """
        try:
            if actor is None:
                actor = get_current_user()
            if ip_address is None:
                ip_address = get_current_ip()

            return ActivityLog.objects.create(
                actor=actor,
                action=action,
                module=module,
                entity_name=str(entity_name)[:150],
                entity_id=str(entity_id)[:50],
                description=description,
                changes=changes or {},
                ip_address=ip_address,
            )
        except Exception as e:
            logger.warning(f"Failed to record audit log: {e}")
            return None
