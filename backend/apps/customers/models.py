from django.db import models


class Customer(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    gst_number = models.CharField(max_length=20, blank=True)

    # Denormalized purchase summary fields. These are maintained by the
    # sales app whenever an order is completed/cancelled/returned, so
    # customer lists and profiles don't need an aggregate query every time.
    total_purchases = models.PositiveIntegerField(default=0)
    total_amount_spent = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    last_purchase_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customers"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["phone"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self):
        return self.name
