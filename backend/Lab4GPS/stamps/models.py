# models.py
from django.db import models
from django.conf import settings  # Import settings to access the custom user model
from django.utils.crypto import get_random_string

# Stamp Model
class Stamp(models.Model):
    SHAPE_CHOICES = [
        ('Circle', 'Circle'),
        ('Square', 'Square'),
        ('Star', 'Star'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stamps")
    shape = models.CharField(max_length=20, choices=SHAPE_CHOICES)
    shape_color = models.CharField(max_length=7)  # HEX color
    text_color = models.CharField(max_length=7)  # HEX color
    date_color = models.CharField(max_length=7)  # HEX color
    date = models.DateField()
    top_text = models.CharField(max_length=100)
    bottom_text = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.shape} Stamp - {self.user.username}"


class Document(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    file = models.FileField(upload_to="documents/")
    metadata = models.JSONField(default=dict)
    stamped = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    version = models.CharField(max_length=100, default="1.0")

    # New fields for Section B
    serial_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Unique serial number for each stamped doc."
    )
    qr_data = models.TextField(
        blank=True,
        null=True,
        help_text="Optionally store base64 or textual QR code data here."
    )

    def __str__(self):
        return f"Document by {self.user.username}"

    def save(self, *args, **kwargs):
        # Assign a serial_number if not present
        if not self.serial_number:
            # Generate random alphanumeric string, e.g. 8 chars
            self.serial_number = get_random_string(length=8).upper()
        super().save(*args, **kwargs)
