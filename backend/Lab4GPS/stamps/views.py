from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Stamp, Document
from .serializers import StampSerializer, DocumentSerializer
import qrcode
import base64
from io import BytesIO
import json

class StampViewSet(viewsets.ModelViewSet):
    serializer_class = StampSerializer
    queryset = Stamp.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
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
    def generate_qr(self, request, pk=None):
        """Generates a QR code with document serial number and user info."""
        document = self.get_object()

        data_to_encode = json.dumps({
            "document_id": document.id,
            "serial_number": document.serial_number,
            "user": document.user.username
        })

        qr = qrcode.QRCode(version=1, box_size=5, border=2)
        qr.add_data(data_to_encode)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        document.qr_data = qr_base64
        document.save()

        return Response({"qr_base64": qr_base64}, status=status.HTTP_200_OK)
