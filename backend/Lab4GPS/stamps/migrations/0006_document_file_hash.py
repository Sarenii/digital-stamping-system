# Generated by Django 5.1.4 on 2025-02-19 12:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stamps', '0005_remove_document_timestamp'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='file_hash',
            field=models.CharField(blank=True, help_text='Stores SHA256 hash of the file for authenticity checks.', max_length=64, null=True),
        ),
    ]
