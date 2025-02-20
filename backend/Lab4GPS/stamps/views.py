# views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.temp import NamedTemporaryFile
from pyzbar.pyzbar import decode as qr_decode
from .models import Stamp, Document
from .serializers import StampSerializer, DocumentSerializer
from django.utils.crypto import get_random_string
import json
import qrcode
import base64
from io import BytesIO
from PIL import Image
import hashlib
import fitz  # PyMuPDF

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
    parser_classes = [MultiPartParser, FormParser]  # so we can handle multipart form data

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, stamped=False)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_file = request.FILES.get("file", None)
        if new_file:
            instance.file = new_file

        instance.stamped = True
        if not instance.serial_number:
            instance.serial_number = get_random_string(length=8).upper()

        instance.generate_qr_code()
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ---------------- IMPORTANT: define generate_qr action ----------------
    @action(detail=True, methods=["post"])
    def generate_qr(self, request, pk=None):
        """
        POST /stamps/documents/<pk>/generate_qr/
        Generates or regenerates a QR code for the specified Document.
        """
        document = self.get_object()

        # If needed, ensure it has a serial number:
        if not document.serial_number:
            document.serial_number = get_random_string(length=8).upper()

        # Now generate the QR code.
        document.generate_qr_code()
        document.save()

        return Response({"qr_base64": document.qr_data}, status=status.HTTP_200_OK)
    @action(detail=False, methods=["post"], url_path="verify-document")
    def verify_document(self, request):
        """
        POST /stamps/documents/verify-document/
        
        The user uploads either:
          - an image that possibly has a QR code
          - or a PDF they want to compare in full.
          
        We'll parse the file, attempt to decode QR. If that fails and it's a PDF,
        we do a 'content check' or 'serial check'.
        """
        file_obj = request.FILES.get("file", None)
        if not file_obj:
            return Response({"error": "No file provided for verification."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Let's see if we can guess from the file's content type
        content_type = file_obj.content_type.lower()
        
        # 1) If it's an image => attempt to decode QR
        if "image" in content_type:
            return self._verify_by_qr(file_obj)
        
        # 2) If it's a PDF => attempt to do a doc comparison
        if "pdf" in content_type:
            return self._verify_by_document(file_obj)

        return Response({"error": "Unsupported file type for verification."},
                        status=status.HTTP_400_BAD_REQUEST)

   # stamps/views.py



    @action(detail=False, methods=["post"], url_path="verify-document")
    def verify_document(self, request):
        """
        POST /stamps/documents/verify-document/
        Accepts 'file' in form-data. 
        - If image => decode QR.
        - If PDF => compute hash => see if doc recognized.
        Returns a JSON with {status, isVerified, message}.
        status => 'valid' or 'invalid' or 'error'
        """
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({
                "status": "error",
                "isVerified": False,
                "message": "No file provided for verification."
            }, status=status.HTTP_400_BAD_REQUEST)

        content_type = file_obj.content_type.lower()

        # If it's an image, try to decode a QR
        if "image" in content_type:
            return self._verify_by_qr(file_obj)
        # If it's PDF, do a hash check
        elif "pdf" in content_type:
            return self._verify_by_hash(file_obj)
        else:
            return Response({
                "status": "error",
                "isVerified": False,
                "message": f"Unsupported file type: {content_type}"
            }, status=status.HTTP_400_BAD_REQUEST)

    def _verify_by_qr(self, image_file):
        """
        Attempt to decode the QR code from the given image_file.
        Distinguish between no QR found, or doc not recognized.
        """
        try:
            image_bytes = image_file.read()
            pil_image = Image.open(BytesIO(image_bytes))
            results = qr_decode(pil_image)  # list of detected QR codes

            if not results:
                return Response({
                    "status": "invalid",
                    "isVerified": False,
                    "message": "No QR code recognized in the image. The document might be altered or not stamped with a QR."
                }, status=status.HTTP_200_OK)

            # parse the first recognized QR
            qr_content = results[0].data.decode("utf-8")
            # e.g. {"document_id": 5, "serial_number": "XYZ123", "user": "john"}
            try:
                data = json.loads(qr_content)
            except Exception:
                return Response({
                    "status": "invalid",
                    "isVerified": False,
                    "message": "QR code content is not valid JSON. Possibly corrupted."
                }, status=status.HTTP_200_OK)

            doc_id = data.get("document_id")
            serial_num = data.get("serial_number")
            user_name = data.get("user")

            # If any are missing, treat as invalid
            if not doc_id or not serial_num or not user_name:
                return Response({
                    "status": "invalid",
                    "isVerified": False,
                    "message": "QR code missing required fields. Possibly altered."
                }, status=status.HTTP_200_OK)

            # Attempt to find a doc with that id & serial
            try:
                doc = Document.objects.get(id=doc_id, serial_number=serial_num)
            except Document.DoesNotExist:
                return Response({
                    "status": "invalid",
                    "isVerified": False,
                    "message": ("The QR code references a non-existent or altered document. "
                                "No matching doc in our system.")
                }, status=status.HTTP_200_OK)

            # If the doc is found, do we confirm user_name?
            if doc.user.username.lower() != user_name.lower():
                return Response({
                    "status": "invalid",
                    "isVerified": False,
                    "message": (f"This document's QR references user '{user_name}', but in our system "
                                f"it's owned by '{doc.user.username}'. Possibly altered.")
                }, status=status.HTTP_200_OK)

            # If we get here, success
            created_on = doc.created_at.strftime("%Y-%m-%d %H:%M:%S")
            return Response({
                "status": "valid",
                "isVerified": True,
                "message": f"Authentic document by CS&V. Created on {created_on} by {user_name}."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "status": "error",
                "isVerified": False,
                "message": f"Failed to analyze QR. Error: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)

    def _verify_by_hash(self, pdf_file):
        """
        1) read all bytes -> compute sha256
        2) see if a Document has that hash
        3) if found => valid. else => invalid
        """
        import hashlib
        sha = hashlib.sha256()

        try:
            for chunk in pdf_file.chunks():
                sha.update(chunk)
            uploaded_hash = sha.hexdigest()

            try:
                doc = Document.objects.get(file_hash=uploaded_hash)
            except Document.DoesNotExist:
                # This means the PDF doesn't match any stored doc => altered or unknown
                return Response({
                    "status": "invalid",
                    "isVerified": False,
                    "message": ("No matching document found for this PDF hash. "
                                "The file might be altered or not in our system.")
                }, status=status.HTTP_200_OK)

            # if found => success
            created_on = doc.created_at.strftime("%Y-%m-%d %H:%M:%S")
            user_name = doc.user.username
            return Response({
                "status": "valid",
                "isVerified": True,
                "message": (f"Authentic document by CS&V. Created on {created_on} by {user_name}. "
                            f"All file contents match our records.")
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "status": "error",
                "isVerified": False,
                "message": f"Failed to verify PDF content: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)
