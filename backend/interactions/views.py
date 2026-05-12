from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from datasets.models import Dataset
from .models import Rating, Comment
from .serializers import RatingSerializer, CommentSerializer

class RateDatasetView(generics.CreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request, 'dataset_id': self.kwargs['pk']}

    def create(self, request, *args, **kwargs):
        try:
            Dataset.objects.get(pk=kwargs['pk'])
        except Dataset.DoesNotExist:
            return Response({'detail': 'Dataset introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rating = serializer.save()
        return Response(RatingSerializer(rating).data, status=status.HTTP_200_OK)


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        return {'request': self.request, 'dataset_id': self.kwargs['pk']}

    def get_queryset(self):
        return Comment.objects.filter(dataset_id=self.kwargs['pk']).select_related('user')


class CommentDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(user=self.request.user)
