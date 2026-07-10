from django.conf import settings
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0003_dataset_source'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='dataset',
            name='status',
            field=models.CharField(
                choices=[('pending', 'En attente'), ('approved', 'Approuvé'), ('rejected', 'Refusé')],
                default='pending', max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='dataset',
            name='rejection_reason',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='dataset',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dataset',
            name='reviewed_by',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                related_name='reviewed_datasets', to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
    