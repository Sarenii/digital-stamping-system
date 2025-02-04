from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Stamp, Document
from .serializers import StampSerializer, DocumentSerializer
import qrcode
import base64
from io import BytesIO

class StampViewSet(viewsets.ModelViewSet):
    serializer_class = StampSerializer
    queryset = Stamp.objects.all()

    def get_queryset(self):
        # Filter the stamps by the authenticated user
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the authenticated user with the stamp being created
        serializer.save(user=self.request.user)


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    queryset = Document.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        metadata = {"uploaded_by": self.request.user.username}
        serializer.save(user=self.request.user, metadata=metadata)

    @action(detail=True, methods=["post"])
    def apply_stamp(self, request, pk=None):
        # ... unchanged ...
        pass

    @action(detail=True, methods=["post"])
    def generate_qr(self, request, pk=None):
        """
        Generates a QR code that includes serial_number or any relevant data,
        then stores it in Document.qr_data or returns base64.
        """
        document = self.get_object()
        # Example data we might want to encode
        data_to_encode = {
            "document_id": document.id,
            "serial_number": document.serial_number,
            "user": document.user.username
        }
        # Convert data to string (JSON or just a line)
        import json
        data_str = json.dumps(data_to_encode)

        # Generate QR code using qrcode library
        qr = qrcode.QRCode(version=1, box_size=5, border=2)
        qr.add_data(data_str)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert the image to base64
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        # Optionally store in the model
        document.qr_data = qr_base64
        document.save()

        # Return the base64 string so the frontend can display it
        return Response({"qr_base64": qr_base64}, status=status.HTTP_200_OK)

