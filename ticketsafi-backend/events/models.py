import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

# --- 1. Custom User Model ---
class User(AbstractUser):
    class Role(models.TextChoices):
        ORGANIZER = 'ORGANIZER', 'Organizer'
        ATTENDEE = 'ATTENDEE', 'Attendee'
        SCANNER = 'SCANNER', 'Gate Scanner'
        ADMIN = 'ADMIN', 'Super Admin'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ATTENDEE)
    phone_number = models.CharField(max_length=15, blank=True, null=True, help_text="Required for M-Pesa")
    
    avatar_url = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    wallet_id = models.UUIDField(null=True, blank=True, unique=True, help_text="Linked Yadi Wallet ID")
    is_guest = models.BooleanField(default=False, help_text="Flag for auto-generated guest accounts")

    def __str__(self):
        return f"{self.username} ({self.role})"

# --- 2. Event Model ---
class Event(models.Model):
    class Category(models.TextChoices):
        CONCERT = 'CONCERT', 'Concert'
        FESTIVAL = 'FESTIVAL', 'Festival'
        NIGHTLIFE = 'NIGHTLIFE', 'Nightlife'
        THEATRE = 'THEATRE', 'Theatre'
        SPORTS = 'SPORTS', 'Sports'
        ARTS = 'ARTS', 'Arts & Culture'
        OTHER = 'OTHER', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    
    location_name = models.CharField(max_length=255)
    location_map_url = models.URLField(blank=True, null=True, help_text="Google Maps Link")

    store = models.ForeignKey(
        'stores.Store', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='events'
    )
    
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    
    poster_image = models.ImageField(upload_to='event_posters/', blank=True, null=True)
    
    is_offline_ready = models.BooleanField(default=False)
    whatsapp_integration_enabled = models.BooleanField(default=False)
    
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    

    def __str__(self):
        return self.title

# --- 3. Ticket Tier (Pricing) ---
class TicketTier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tiers')
    
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    quantity_allocated = models.PositiveIntegerField()
    quantity_sold = models.PositiveIntegerField(default=0)

    def available_qty(self):
        return self.quantity_allocated - self.quantity_sold

    def __str__(self):
        return f"{self.name} - KES {self.price}"

# --- 4. The Ticket (Digital Asset) ---
class Ticket(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active (Unused)'
        CHECKED_IN = 'CHECKED_IN', 'Checked In'
        USED = 'USED', 'Used (Exit)'
        CANCELLED = 'CANCELLED', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tickets')
    tier = models.ForeignKey(TicketTier, on_delete=models.PROTECT)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    
    # --- NEW FIELDS THAT WERE MISSING ---
    attendee_name = models.CharField(max_length=255, blank=True, null=True)
    attendee_email = models.EmailField(blank=True, null=True)
    # ------------------------------------

    qr_code_hash = models.CharField(max_length=255, editable=False) 
    purchase_date = models.DateTimeField(auto_now_add=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='scanned_tickets',
        limit_choices_to={'role': User.Role.SCANNER}
    )

    def save(self, *args, **kwargs):
        if not self.qr_code_hash:
            self.qr_code_hash = f"{self.id}-{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.event.title} - {self.tier.name}"

# --- 5. Payment Transaction ---
class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Confirmation'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    tier = models.ForeignKey(TicketTier, on_delete=models.CASCADE)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    phone_number = models.CharField(max_length=15, help_text="Format: 2547... or 2541...")
    reference_code = models.CharField(max_length=50, unique=True)
    
    checkout_request_id = models.CharField(max_length=100, blank=True, null=True)
    merchant_request_id = models.CharField(max_length=100, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.phone_number} - {self.amount}"

# --- NEW MODEL: Organizer Invitation Code ---
class OrganizerInvitationCode(models.Model):
    code = models.CharField(max_length=20, unique=True, help_text="The secret code for organizer registration.")
    is_active = models.BooleanField(default=True)
    times_used = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.code