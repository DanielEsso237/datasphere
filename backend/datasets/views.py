import csv, json, io
from datetime import datetime
from django.utils import timezone
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import (
    IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny, IsAdminUser,
)
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from django.contrib.auth import get_user_model
from .models import Dataset
from .serializers import DatasetListSerializer, DatasetDetailSerializer, DatasetCreateSerializer
from notifications.models import Notification

User = get_user_model()

MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']


def _last_n_months(n=6):
    """Retourne une liste de (année, mois) pour les n derniers mois, du plus ancien au plus récent."""
    today = timezone.now()
    y, m = today.year, today.month
    months = []
    for _ in range(n):
        months.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(months))


class DatasetListView(generics.ListAPIView):
    serializer_class = DatasetListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Seuls les datasets approuvés sont visibles publiquement
        qs = Dataset.objects.filter(status='approved').select_related('uploaded_by') \
            .prefetch_related('rating_set', 'comment_set')
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

        sort_map = {'popular': '-download_count', 'oldest': 'created_at', 'newest': '-created_at'}
        return qs.order_by(sort_map.get(sort, '-created_at'))


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

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        is_owner = user.is_authenticated and obj.uploaded_by_id == user.id
        is_admin = user.is_authenticated and user.is_staff
        if obj.status != 'approved' and not is_owner and not is_admin:
            raise Http404
        return obj

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
        is_owner = dataset.uploaded_by_id == request.user.id
        if dataset.status != 'approved' and not is_owner and not request.user.is_staff:
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

        user = request.user
        is_owner = user.is_authenticated and dataset.uploaded_by_id == user.id
        is_admin = user.is_authenticated and user.is_staff
        if dataset.status != 'approved' and not is_owner and not is_admin:
            raise Http404

        try:
            file_type = dataset.file_type
            if file_type == 'other':
                name = dataset.file.name.lower()
                if name.endswith('.csv'): file_type = 'csv'
                elif name.endswith('.json'): file_type = 'json'
                elif name.endswith('.txt'): file_type = 'txt'

            if file_type == 'csv':
                content = dataset.file.read().decode('utf-8', errors='replace')
                reader = csv.DictReader(io.StringIO(content))
                rows = []
                columns = reader.fieldnames or []
                for i, row in enumerate(reader):
                    if i >= 20: break
                    rows.append(dict(row))
                total_rows = sum(1 for _ in csv.reader(io.StringIO(content))) - 1
                return Response({
                    'type': 'table', 'columns': columns, 'rows': rows,
                    'stats': {'total_columns': len(columns), 'preview_rows': len(rows), 'total_rows': max(total_rows, len(rows))},
                })
            elif file_type == 'json':
                content = dataset.file.read().decode('utf-8', errors='replace')
                data = json.loads(content)
                if isinstance(data, list):
                    preview = data[:20]
                    columns = list(preview[0].keys()) if preview else []
                    return Response({
                        'type': 'table', 'columns': columns, 'rows': preview,
                        'stats': {'total_columns': len(columns), 'preview_rows': len(preview), 'total_rows': len(data)},
                    })
                elif isinstance(data, dict):
                    columns = list(data.keys())[:20]
                    rows = [{k: str(data[k])[:100] for k in columns}]
                    return Response({
                        'type': 'table', 'columns': columns, 'rows': rows,
                        'stats': {'total_columns': len(columns), 'preview_rows': 1, 'total_rows': 1},
                    })
            elif file_type == 'txt':
                content = dataset.file.read().decode('utf-8', errors='replace')
                lines = content.splitlines()
                preview_lines = lines[:50]
                return Response({
                    'type': 'text', 'lines': preview_lines,
                    'stats': {'total_lines': len(lines), 'preview_lines': len(preview_lines), 'total_chars': len(content)},
                })
        except Exception as e:
            return Response({'error': str(e)}, status=400)

        return Response({'type': 'unsupported', 'error': 'Aperçu non disponible pour ce type de fichier.'}, status=400)


class MyDatasetsView(generics.ListAPIView):
    serializer_class = DatasetListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Le propriétaire voit tous ses datasets, quel que soit le statut
        return Dataset.objects.filter(uploaded_by=self.request.user)


# ─── ADMIN ─────────────────────────────────────────────

class AdminPendingDatasetsView(generics.ListAPIView):
    serializer_class = DatasetListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Dataset.objects.filter(status='pending').select_related('uploaded_by').order_by('created_at')


class AdminAllDatasetsView(generics.ListAPIView):
    serializer_class = DatasetListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Dataset.objects.select_related('uploaded_by').order_by('-created_at')
        status_param = self.request.query_params.get('status', '')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminReviewDatasetView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            dataset = Dataset.objects.get(pk=pk)
        except Dataset.DoesNotExist:
            raise Http404

        action = request.data.get('action')
        reason = (request.data.get('reason') or '').strip()

        if action not in ('approve', 'reject'):
            return Response({'detail': "Action invalide (attendu 'approve' ou 'reject')."}, status=400)
        if action == 'reject' and not reason:
            return Response({'detail': 'Une raison est requise pour un refus.'}, status=400)

        dataset.status = 'approved' if action == 'approve' else 'rejected'
        dataset.rejection_reason = reason if action == 'reject' else ''
        dataset.reviewed_at = timezone.now()
        dataset.reviewed_by = request.user
        dataset.save()

        if action == 'approve':
            msg = f'Votre dataset "{dataset.title}" a été approuvé et est maintenant public.'
            ntype = 'dataset_approved'
        else:
            msg = f'Votre dataset "{dataset.title}" a été refusé. Raison : {reason}'
            ntype = 'dataset_rejected'

        Notification.objects.create(user=dataset.uploaded_by, type=ntype, message=msg, dataset=dataset)

        return Response(DatasetDetailSerializer(dataset, context={'request': request}).data)


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_datasets = Dataset.objects.count()
        pending = Dataset.objects.filter(status='pending').count()
        approved = Dataset.objects.filter(status='approved').count()
        rejected = Dataset.objects.filter(status='rejected').count()
        total_downloads = Dataset.objects.aggregate(s=Sum('download_count'))['s'] or 0

        by_domain = list(
            Dataset.objects.filter(status='approved')
            .values('domain').annotate(count=Count('id')).order_by('-count')
        )

        status_breakdown = [
            {'status': 'pending', 'label': 'En attente', 'count': pending},
            {'status': 'approved', 'label': 'Approuvé', 'count': approved},
            {'status': 'rejected', 'label': 'Refusé', 'count': rejected},
        ]

        # ── Évolution sur les 6 derniers mois (nouveaux datasets / nouveaux utilisateurs) ──
        months = _last_n_months(6)
        start_year, start_month = months[0]
        period_start = timezone.make_aware(datetime(start_year, start_month, 1))

        dataset_counts = (
            Dataset.objects.filter(created_at__gte=period_start)
            .annotate(month=TruncMonth('created_at'))
            .values('month').annotate(count=Count('id'))
        )
        dataset_map = {(d['month'].year, d['month'].month): d['count'] for d in dataset_counts}

        user_counts = (
            User.objects.filter(date_joined__gte=period_start)
            .annotate(month=TruncMonth('date_joined'))
            .values('month').annotate(count=Count('id'))
        )
        user_map = {(u['month'].year, u['month'].month): u['count'] for u in user_counts}

        monthly_trend = [
            {
                'month': f'{MONTH_LABELS_FR[m - 1]} {y}',
                'datasets': dataset_map.get((y, m), 0),
                'users': user_map.get((y, m), 0),
            }
            for (y, m) in months
        ]

        recent_users = list(
            User.objects.order_by('-date_joined').values('id', 'username', 'email', 'role', 'date_joined')[:5]
        )
        recent_datasets = list(
            Dataset.objects.select_related('uploaded_by').order_by('-created_at')
            .values('id', 'title', 'status', 'created_at', 'uploaded_by__username')[:5]
        )

        return Response({
            'total_users': total_users,
            'total_datasets': total_datasets,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'total_downloads': total_downloads,
            'by_domain': by_domain,
            'status_breakdown': status_breakdown,
            'monthly_trend': monthly_trend,
            'recent_users': recent_users,
            'recent_datasets': recent_datasets,
        })