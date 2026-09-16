from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Expense(models.Model):
    class Category(models.TextChoices):
        RENT = "rent", "Rent"
        SALARY = "salary", "Salary"
        ELECTRICITY = "electricity", "Electricity"
        TRANSPORTATION = "transportation", "Transportation"
        MARKETING = "marketing", "Marketing"
        MAINTENANCE = "maintenance", "Maintenance"
        OTHER = "other", "Other"

    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        CARD = "card", "Card"
        UPI = "upi", "UPI"
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"

    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    date = models.DateField()
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="expenses_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "expenses"
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"{self.get_category_display()} - {self.amount} ({self.date})"
