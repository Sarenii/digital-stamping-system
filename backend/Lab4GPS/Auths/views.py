from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import (
    RegisterSerializer,
    VerifyOtpSerializer,
    LoginSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
    UpdateProfilePictureSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    VerifyResetOtpSerializer,
    ResetPasswordSerializer,
)

class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    """
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # Validate request data for required fields
        required_fields = ["first_name", "last_name", "email", "username", "password"]
        missing_fields = [field for field in required_fields if field not in request.data]

        if missing_fields:
            return Response(
                {"error": f"Missing required fields: {', '.join(missing_fields)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Registration successful. OTP sent to your email."},
            status=status.HTTP_201_CREATED,
        )

class VerifyOtpView(generics.GenericAPIView):
    """
    API endpoint to verify OTP for email verification.
    """
    serializer_class = VerifyOtpSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        user.is_verified = True
        user.save()

        return Response(
            {"message": "OTP verified successfully. Account activated."},
            status=status.HTTP_200_OK,
        )

class LoginView(generics.GenericAPIView):
    """
    API endpoint for user login.
    """
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data

        if not user.is_verified:
            return Response(
                {"error": "Your email is not verified. Please verify using OTP."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

class UserProfileView(generics.RetrieveAPIView):
    """
    API endpoint to retrieve the authenticated user's profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class UpdateProfileView(generics.UpdateAPIView):
    """
    API endpoint to update user profile details.
    """
    serializer_class = UpdateProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]  

    def get_object(self):
        return self.request.user

class UpdateProfilePictureView(generics.UpdateAPIView):
    """
    API endpoint to update the user's profile picture.
    """
    serializer_class = UpdateProfilePictureSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.GenericAPIView):
    """
    API endpoint to change the user's password.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )

class ForgotPasswordView(generics.GenericAPIView):
    """
    API endpoint to initiate password reset.
    """
    serializer_class = ForgotPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"message": "OTP sent to your email for password reset."},
            status=status.HTTP_200_OK,
        )

class VerifyResetOtpView(generics.GenericAPIView):
    """
    API endpoint to verify OTP for password reset.
    """
    serializer_class = VerifyResetOtpSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"message": "OTP verified successfully. You can now reset your password."},
            status=status.HTTP_200_OK,
        )

class ResetPasswordView(generics.GenericAPIView):
    """
    API endpoint to reset user password.
    """
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"message": "Password reset successfully. You can now log in."},
            status=status.HTTP_200_OK,
        )
