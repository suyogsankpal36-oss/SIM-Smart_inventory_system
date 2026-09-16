from django.core.validators import MinValueValidator
from django.db import models


class BusinessSettings(models.Model):
    """
    Singleton table - the application always has exactly one row here
    (enforced by overriding save()/pk). Holds the business-wide
    configuration referenced throughout the app (currency, tax defaults,
    low-stock threshold, invoice numbering prefix, etc).
    """

    business_name = models.CharField(max_length=200, default="My Business")
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    gst_number = models.CharField(max_length=20, blank=True)
    logo = models.ImageField(upload_to="business/", null=True, blank=True)

    currency = models.CharField(max_length=10, default="INR")
    currency_symbol = models.CharField(max_length=5, default="\u20b9")
    default_tax_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=18.00, validators=[MinValueValidator(0)]
    )
    low_stock_threshold = models.PositiveIntegerField(default=5)
    invoice_prefix = models.CharField(max_length=10, default="INV")

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "business_settings"
        verbose_name_plural = "business settings"

    def __str__(self):
        return self.business_name

    def save(self, *args, **kwargs):
        self.pk = 1  # force a single row
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass  # singleton row is never deleted

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
