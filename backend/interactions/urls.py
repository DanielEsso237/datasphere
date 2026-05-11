from django.urls import path
from .views import RateDatasetView, CommentListCreateView, CommentDeleteView

urlpatterns = [
    path('datasets/<int:pk>/rate/', RateDatasetView.as_view(), name='rate-dataset'),
    path('datasets/<int:pk>/comments/', CommentListCreateView.as_view(), name='dataset-comments'),
    path('comments/<int:pk>/delete/', CommentDeleteView.as_view(), name='delete-comment'),
]
