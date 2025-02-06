from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import random

class CustomUser(AbstractUser):
    class Roles(models.TextChoices):
        INDIVIDUAL = 'INDIVIDUAL', 'Individual'
        COMPANY = 'COMPANY', 'Company'
        ADMIN = 'ADMIN', 'Admin'

    email = models.EmailField(unique=True, verbose_name="Email Address")
    is_verified = models.BooleanField(default=False, verbose_name="Is Verified")
    is_company_verified = models.BooleanField(default=False, verbose_name="Is Company Verified")

    otp = models.CharField(max_length=6, blank=True, null=True, verbose_name="One-Time Password (OTP)")
    otp_created_at = models.DateTimeField(blank=True, null=True)

    reset_password_otp = models.CharField(max_length=6, blank=True, null=True, verbose_name="Password Reset OTP")
    reset_password_otp_created_at = models.DateTimeField(blank=True, null=True)

    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True, default="profile_pictures/default.jpg")
    registration_date = models.DateTimeField(default=timezone.now)
    
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.INDIVIDUAL)

    REQUIRED_FIELDS = ["email", "first_name", "last_name"]

    def __str__(self):
        return f"{self.username} ({self.email}) - {self.role}"

    # OTP Methods
    def generate_otp(self):
        """Generate a random 6-digit OTP for email verification."""
        self.otp = str(random.randint(100000, 999999))
        self.otp_created_at = timezone.now()
        self.save()

    def clear_otp(self):
        """Clear OTP after verification."""
        self.otp = None
        self.otp_created_at = None
        self.save()

    def is_otp_expired(self):
        """Check if OTP is expired (valid for 10 minutes)."""
        if self.otp_created_at:
            return timezone.now() > (self.otp_created_at + timedelta(minutes=10))
        return True

    