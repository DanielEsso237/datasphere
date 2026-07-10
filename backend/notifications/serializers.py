from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    dataset_id = serializers.IntegerField(source='dataset.id', read_only=True, allow_null=True)
    dataset_title = serializers.CharField(source='dataset.title', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'dataset_id', 'dataset_title', 'is_read', 'created_at']