from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    dataset_id = serializers.SerializerMethodField()
    dataset_title = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'dataset_id', 'dataset_title', 'is_read', 'created_at']

    def get_dataset_id(self, obj):
        return obj.dataset_id

    def get_dataset_title(self, obj):
        return obj.dataset.title if obj.dataset_id else None