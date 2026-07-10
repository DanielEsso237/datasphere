from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0002_dataset_cover_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataset',
            name='source',
            field=models.CharField(
                blank=True,
                max_length=500,
                help_text="Nom de l'auteur original ou lien vers la source si le dataset ne vient pas de vous.",
            ),
        ),
    ]