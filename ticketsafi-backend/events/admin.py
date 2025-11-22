from django.contrib import admin
from .models import User, Event, TicketTier, Ticket

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'phone_number', 'is_verified')
    list_filter = ('role', 'is_verified')
    search_fields = ('email', 'username', 'phone_number')

class TicketTierInline(admin.TabularInline):
    model = TicketTier
    extra = 1

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'start_datetime', 'is_published')
    list_filter = ('is_published', 'start_datetime')
    search_fields = ('title', 'organizer__username')
    inlines = [TicketTierInline]

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'tier', 'owner', 'status', 'purchase_date')
    list_filter = ('status', 'event', 'tier')
    search_fields = ('id', 'owner__email', 'qr_code_hash')
    readonly_fields = ('qr_code_hash', 'purchase_date', 'checked_in_at', 'checked_in_by')