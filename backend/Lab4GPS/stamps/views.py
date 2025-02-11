# views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Stamp, Document
from .serializers import StampSerializer, DocumentSerializer
from django.utils.crypto import get_random_string
import json
import qrcode
import base64
from io import BytesIO
from PIL import Image

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

    # On create => just store the raw file, stamped=False
    def perform_create(self, serializer):
        serializer.save(user=self.request.user, stamped=False)

    # On update => store the final stamped PDF, set stamped=True
    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # If there's a 'file' in request.FILES, that means we are updating it with the final stamped PDF.
        new_file = request.FILES.get("file", None)
        if new_file:
            instance.file = new_file

        instance.stamped = True
        if not instance.serial_number:
            instance.serial_number = get_random_string(length=8).upper()

        # Regenerate the QR code
        instance.generate_qr_code()
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
