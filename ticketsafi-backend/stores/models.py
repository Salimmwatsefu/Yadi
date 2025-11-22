import uuid
from django.db import models
from events.models import User 

# --- 1. Store (Organizer Microsite) ---
class Store(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organizer = models.OneToOneField(User, on_delete=models.CASCADE, related_name='store')
    
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, help_text="URL-friendly name")
    description = models.TextField(blank=True)
    
    # Branding
    logo_image = models.ImageField(upload_to='store_logos/', blank=True, null=True)
    banner_image = models.ImageField(upload_to='store_banners/', blank=True, null=True)
    
    # Socials (Optional)
    instagram_link = models.URLField(blank=True, null=True)
    website_link = models.URLField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name