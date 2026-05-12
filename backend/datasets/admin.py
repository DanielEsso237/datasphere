from django.contrib import admin
from .models import Dataset

@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ['title', 'domain', 'file_type', 'uploaded_by', 'download_count', 'created_at']
    list_filter = ['domain', 'file_type']
    search_fields = ['title', 'description']
