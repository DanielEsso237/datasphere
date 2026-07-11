from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0004_dataset_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataset',
            name='contributors',
            field=models.CharField(
                blank=True,
                max_length=1000,
                help_text="Personnes ayant contribué à faire évoluer ce dataset, séparées par des virgules.",
            ),
        ),
    ]