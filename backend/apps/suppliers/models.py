from django.db import models


class Supplier(models.Model):
    class PaymentTerms(models.TextChoices):
        IMMEDIATE = "immediate", "Immediate / Cash"
        NET_15 = "net_15", "Net 15 Days"
        NET_30 = "net_30", "Net 30 Days"
        NET_60 = "net_60", "Net 60 Days"
        ADVANCE = "advance", "Advance Payment"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    name = models.CharField(max_length=200, unique=True)
    contact_person = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20)
    gst_number = models.CharField(max_length=20, blank=True)

    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)

    payment_terms = models.CharField(
        max_length=20, choices=PaymentTerms.choices, default=PaymentTerms.NET_30
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "suppliers"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["status"]),
            models.Index(fields=["city"]),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        if self.gst_number:
            self.gst_number = self.gst_number.strip().upper()
        if self.name:
            self.name = self.name.strip()
