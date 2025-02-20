from rest_framework import serializers
from .models import CustomUser
from django.core.mail import send_mail
import logging
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

class RegisterSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True, error_messages={"blank": "First name is required."})
    last_name = serializers.CharField(required=True, error_messages={"blank": "Last name is required."})
    email = serializers.EmailField(required=True, error_messages={"blank": "Email is required."})
    
    # Only Individual & Company can sign up
    role = serializers.ChoiceField(
        choices=[
            (CustomUser.Roles.INDIVIDUAL, "Individual"),
            (CustomUser.Roles.COMPANY, "Company"),
        ],
        required=True,
        error_messages={"blank": "Role is required."}
    )

    class Meta:
        model = CustomUser
        fields = ('email', 'username', 'password', 'first_name', 'last_name', 'role')
        extra_kwargs = {
            'password': {'write_only': True, 'error_messages': {"blank": "Password is required."}},
            'username': {'required': True, 'error_messages': {"blank": "Username is required."}},
        }

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_role(self, value):
        if value == CustomUser.Roles.ADMIN:
            raise serializers.ValidationError("You cannot register as an admin.")
        return value

    def create(self, validated_data):
        try:
            user = CustomUser.objects.create_user(**validated_data)
            user.generate_otp()

            logger.info(f"User {user.email} registered successfully with OTP {user.otp}.")

            send_mail(
                'Your OTP for Chakan Stamp & Verify',
                f'Your OTP is: {user.otp}',
                'CS&V <no-reply@chakanstamp.com>',
                [user.email],
                fail_silently=False,
            )
            return user
        except Exception as e:
            logger.error(f"Error during user creation: {e}")
            raise serializers.ValidationError("An error occurred during registration. Please try again.")

class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    for_stamping = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data['email'])
            if user.is_otp_expired():
                raise serializers.ValidationError("OTP has expired.")
            if user.otp != data['otp']:
                raise serializers.ValidationError("Invalid OTP.")
            if data.get("for_stamping", False):
                # For stamping verification, set stamp_verified flag.
                if user.role == CustomUser.Roles.INDIVIDUAL:
                    user.stamp_verified = True
            else:
                user.is_verified = True
            user.clear_otp()
            user.save()
            return user
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found.")

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data['email'])
            if not user.check_password(data['password']):
                raise serializers.ValidationError("Invalid email or password.")
            if not user.is_verified:
                raise serializers.ValidationError("Email not verified. Please verify your account.")
            return user
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found.")

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'email', 'username', 'profile_picture', 'is_verified', 'registration_date', 'role', 'stamp_verified')
        read_only_fields = (
            'is_verified', 
            'registration_date', 
            'profile_picture', 
            'role',
            'stamp_verified',  # optionally read-only
        )

class UpdateProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'email', 'username')

    def validate_first_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("First name cannot be empty.")
        return value

    def validate_last_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Last name cannot be empty.")
        return value

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.email = validated_data.get("email", instance.email)
        instance.username = validated_data.get("username", instance.username)
        instance.save()
        return instance

class UpdateProfilePictureSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField()

    class Meta:
        model = CustomUser
        fields = ('profile_picture',)

    def update(self, instance, validated_data):
        instance.profile_picture = validated_data.get('profile_picture')
        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = self.context['request'].user
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError("Old password is incorrect.")
        if data['old_password'] == data['new_password']:
            raise serializers.ValidationError("New password cannot be the same as the old password.")
        return data

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data['email'])
            user.generate_reset_password_otp()
            send_mail(
                'Reset Your Password - CS&V',
                f'Your OTP is: {user.reset_password_otp}',
                'CS&V <sarahmueni5235@gmail.com>',
                [user.email],
                fail_silently=False,
            )
            return data
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")

class VerifyResetOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data['email'])
            if user.is_reset_password_otp_expired():
                raise serializers.ValidationError("OTP has expired.")
            if user.reset_password_otp != data['otp']:
                raise serializers.ValidationError("Invalid OTP.")
            user.clear_reset_password_otp()
            return data
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found.")

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data['email'])
            user.set_password(data['new_password'])
            user.save()
            return data
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found.")
