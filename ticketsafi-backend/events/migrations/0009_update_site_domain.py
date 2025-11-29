# ticketsafi-backend/events/migrations/0007_update_site_domain.py

from django.db import migrations
from django.conf import settings

def update_site_domain(apps, schema_editor):
    Site = apps.get_model('sites', 'Site')  
    site, created = Site.objects.get_or_create(id=1)
    
    # Set this to your FRONTEND domain
    if settings.DEBUG:
        site.domain = 'localhost:5173'
        site.name = 'TicketSafi Local'
    else:
        site.domain = 'tickets.yadi.app'
        site.name = 'TicketSafi'
        
    site.save()

class Migration(migrations.Migration):

    dependencies = [
        # Make sure this points to your last migration file in events
        ('events', '0008_alter_payment_user'), 
        ('sites', '0002_alter_domain_unique'),
      
    ]

    operations = [
        migrations.RunPython(update_site_domain),
    ]