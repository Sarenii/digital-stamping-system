from django.db import models
from django.conf import settings
from django.utils.crypto import get_random_string
from django.utils import timezone
import qrcode
import base64
from io import BytesIO
import hashlib


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
    
    file_hash = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        help_text="Stores SHA256 hash of the file for authenticity checks."
    )

    def __str__(self):
        return f"Document by {self.user.username}"

    def save(self, *args, **kwargs):
        # If there's no serial_number yet, create one
        if not self.serial_number:
            self.serial_number = get_random_string(length=8).upper()

        # If the file changed, compute or update the hash
        super().save(*args, **kwargs)  # Save first so 'file' is accessible
        if self.file:
            self.compute_hash()
            # Also ensure QR is generated
            self.generate_qr_code()
            super().save(update_fields=['file_hash', 'qr_data'])

    def compute_hash(self):
        """
        Reads the file from storage and computes a SHA256 hash, storing it in file_hash.
        """
        sha = hashlib.sha256()
        with self.file.open('rb') as f:
            for chunk in f:
                sha.update(chunk)
        self.file_hash = sha.hexdigest()


    def _generate_unique_serial(self):
        """
        Loops until it finds an 8-char uppercase string not in use.
        If you want a longer or shorter serial, just change length=.
        """
        while True:
            candidate = get_random_string(length=8).upper()
            if not Document.objects.filter(serial_number=candidate).exists():
                return candidate

    def generate_qr_code(self):
        """Generate a QR code with serial_number, user info, etc."""
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