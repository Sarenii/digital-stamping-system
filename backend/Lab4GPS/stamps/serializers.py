from rest_framework import serializers
from .models import Stamp, Document

class StampSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stamp
        exclude = ['user']  

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        exclude = ['user']
