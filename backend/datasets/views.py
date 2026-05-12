import csv
import json
import io
from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from django.db.models import Q
from .models import Dataset
from .serializers import DatasetListSerializer, DatasetDetailSerializer, DatasetCreateSerializer

class DatasetListView(generics.ListAPIView):
    serializer_class = DatasetListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Dataset.objects.select_related('uploaded_by').prefetch_related('rating_set', 'comment_set')
        search = self.request.query_params.get('search', '')
        domain = self.request.query_params.get('domain', '')
        sort = self.request.query_params.get('sort', '-created_at')
        author = self.request.query_params.get('author', '')

        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search) | Q(tags__icontains=search))
        if domain:
            qs = qs.filter(domain=domain)
        if author:
            qs = qs.filter(uploaded_by__username__icontains=author)

        sort_map = {
            'popular': '-download_count',
            'oldest': 'created_at',
            'newest': '-created_at',
        }
        qs = qs.order_by(sort_map.get(sort, '-created_at'))
        return qs


class DatasetCreateView(generics.CreateAPIView):
    serializer_class = DatasetCreateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_context(self):
        return {'request': self.request}


class DatasetDetailView(generics.RetrieveDestroyAPIView):
    queryset = Dataset.objects.select_related('uploaded_by').prefetch_related('rating_set', 'comment_set')
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        return DatasetDetailSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.uploaded_by != request.user:
            return Response({'detail': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)
        instance.file.delete(save=False)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DatasetDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            dataset = Dataset.objects.get(pk=pk)
        except Dataset.DoesNotExist:
            raise Http404
        dataset.download_count += 1
        dataset.save(update_fields=['download_count'])
        response = FileResponse(dataset.file.open('rb'), as_attachment=True, filename=dataset.file.name.split('/')[-1])
        return response


class DatasetPreviewView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            dataset = Dataset.objects.get(pk=pk)
        except Dataset.DoesNotExist:
            raise Http404

        try:
            if dataset.file_type == 'csv':
                content = dataset.file.read().decode('utf-8', errors='replace')
                reader = csv.DictReader(io.StringIO(content))
                rows = []
                columns = reader.fieldnames or []
                for i, row in enumerate(reader):
                    if i >= 10:
                        break
                    rows.append(dict(row))

                # Basic stats
                stats = {'total_columns': len(columns), 'preview_rows': len(rows)}
                return Response({'columns': columns, 'rows': rows, 'stats': stats})

            elif dataset.file_type == 'json':
                content = dataset.file.read().decode('utf-8', errors='replace')
                data = json.loads(content)
                if isinstance(data, list):
                    preview = data[:10]
                    columns = list(preview[0].keys()) if preview else []
                    return Response({'columns': columns, 'rows': preview, 'stats': {'total_records': len(data)}})
                return Response({'data': data})

        except Exception as e:
            return Response({'error': str(e)}, status=400)

        return Response({'error': 'Aperçu non disponible pour ce type de fichier.'}, status=400)


class MyDatasetsView(generics.ListAPIView):
    serializer_class = DatasetListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dataset.objects.filter(uploaded_by=self.request.user)
