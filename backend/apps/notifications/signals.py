from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.products.models import Product
from .services import NotificationService


@receiver(post_save, sender=Product)
def product_stock_notification_handler(sender, instance, **kwargs):
    """
    Automatically checks stock thresholds whenever a product is created or updated.
    """
    NotificationService.check_product_stock(instance)
