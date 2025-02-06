from django.db import models
from django.conf import settings
from django.utils.crypto import get_random_string
from django.utils import timezone
import qrcode
import base64
from io import BytesIO

# Stamp Model
class Stamp(models.Model):
    SHAPE_CHOICES = [
        ('Circle', 'Circle'),
        ('Square', 'Square'),
        ('Oval', 'Oval'),
        ('Rectangle', 'Rectangle'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="stamps"
    )
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

# Document Model
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

    serial_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        unique=True,
        help_text="Unique serial number for each stamped doc."
    )
    qr_data = models.TextField(
        blank=True,
        null=True,
        help_text="Stores QR code data as base64 string."
    )

    def __str__(self):
        return f"Document by {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.serial_number:
            self.serial_number = get_random_string(length=8).upper()

        if not self.qr_data:
            self.generate_qr_code()
        
        super().save(*args, **kwargs)

    def generate_qr_code(self):
        """Generate and store QR code as a base64 string."""
        data_to_encode = {
            "document_id": self.id,
            "serial_number": self.serial_number,
            "user": self.user.username
        }
        qr = qrcode.QRCode(version=1, box_size=5, border=2)
        qr.add_data(str(data_to_encode))
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        buffer = BytesIO()
        img.save(buffer, format="PNG")
        self.qr_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
