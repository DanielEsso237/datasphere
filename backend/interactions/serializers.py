from rest_framework import serializers
from .models import Rating, Comment
from users.serializers import UserSerializer

class RatingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'user', 'score', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['dataset_id'] = self.context['dataset_id']
        # Upsert: update if exists
        rating, created = Rating.objects.update_or_create(
            user=validated_data['user'],
            dataset_id=validated_data['dataset_id'],
            defaults={'score': validated_data['score']}
        )
        return rating


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['dataset_id'] = self.context['dataset_id']
        return super().create(validated_data)
