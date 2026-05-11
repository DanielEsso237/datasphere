from django.urls import path
from .views import (
    DatasetListView, DatasetCreateView, DatasetDetailView,
    DatasetDownloadView, DatasetPreviewView, MyDatasetsView
)

urlpatterns = [
    path('', DatasetListView.as_view(), name='dataset-list'),
    path('create/', DatasetCreateView.as_view(), name='dataset-create'),
    path('mine/', MyDatasetsView.as_view(), name='my-datasets'),
    path('<int:pk>/', DatasetDetailView.as_view(), name='dataset-detail'),
    path('<int:pk>/download/', DatasetDownloadView.as_view(), name='dataset-download'),
    path('<int:pk>/preview/', DatasetPreviewView.as_view(), name='dataset-preview'),
]
