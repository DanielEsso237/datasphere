from rest_framework import serializers
from .models import Dataset
from users.serializers import UserSerializer

class DatasetListSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    avg_rating = serializers.ReadOnlyField()
    ratings_count = serializers.ReadOnlyField()
    comments_count = serializers.ReadOnlyField()
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = [
            'id', 'title', 'description', 'domain', 'file_type',
            'file_size', 'file_size_display', 'tags', 'uploaded_by',
            'download_count', 'avg_rating', 'ratings_count',
            'comments_count', 'created_at'
        ]

    def get_file_size_display(self, obj):
        return obj.get_file_size_display()


class DatasetDetailSerializer(DatasetListSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta(DatasetListSerializer.Meta):
        fields = DatasetListSerializer.Meta.fields + ['file_url', 'updated_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class DatasetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['id', 'title', 'description', 'domain', 'tags', 'file']

    def validate_file(self, value):
        allowed_types = ['text/csv', 'application/json',
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'application/vnd.ms-excel', 'text/plain']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                'Format non supporté. Utilisez CSV, JSON, Excel ou TXT.'
            )
        if value.size > 50 * 1024 * 1024:  # 50MB
            raise serializers.ValidationError('Fichier trop volumineux (max 50MB).')
        return value

    def create(self, validated_data):
        file = validated_data.get('file')
        ext = file.name.split('.')[-1].lower()
        file_type_map = {'csv': 'csv', 'json': 'json', 'xlsx': 'xlsx', 'xls': 'xlsx', 'txt': 'txt'}
        validated_data['file_type'] = file_type_map.get(ext, 'other')
        validated_data['file_size'] = file.size
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)
