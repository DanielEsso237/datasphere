from django.db import models
from django.conf import settings

class Dataset(models.Model):
    DOMAIN_CHOICES = [
        ('health', 'Santé'),
        ('agriculture', 'Agriculture'),
        ('education', 'Éducation'),
        ('environment', 'Environnement'),
        ('economy', 'Économie'),
        ('technology', 'Technologie'),
        ('social', 'Sciences Sociales'),
        ('physics', 'Physique'),
        ('biology', 'Biologie'),
        ('other', 'Autre'),
    ]

    FILE_TYPE_CHOICES = [
        ('csv', 'CSV'),
        ('json', 'JSON'),
        ('xlsx', 'Excel'),
        ('txt', 'Texte'),
        ('other', 'Autre'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    domain = models.CharField(max_length=50, choices=DOMAIN_CHOICES, default='other')
    file = models.FileField(upload_to='datasets/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES, default='csv')
    file_size = models.BigIntegerField(default=0)  # in bytes
    tags = models.CharField(max_length=500, blank=True, help_text='Comma-separated tags')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    download_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def avg_rating(self):
        ratings = self.rating_set.all()
        if not ratings:
            return 0
        return round(sum(r.score for r in ratings) / len(ratings), 1)

    @property
    def ratings_count(self):
        return self.rating_set.count()

    @property
    def comments_count(self):
        return self.comment_set.count()

    def get_file_size_display(self):
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
