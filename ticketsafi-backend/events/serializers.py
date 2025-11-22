import json
from rest_framework import serializers
from .models import User, Event, TicketTier, Ticket, Payment
from stores.models import Store # <--- NEW IMPORT LOCATION

from django.db.models import Min 

class TicketTierSerializer(serializers.ModelSerializer):
    available_qty = serializers.ReadOnlyField()

    class Meta:
        model = TicketTier
        fields = ['id', 'name', 'description', 'price', 'quantity_allocated', 'quantity_sold', 'available_qty']

# Used for fetching user details and nested relations
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'avatar_url', 'is_verified']


class CustomRegisterSerializer(serializers.ModelSerializer):
    # This custom field ensures role is set on registration
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.ATTENDEE)
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'role']
        extra_kwargs = {
            'password': {'write_only': True}
        }
        
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return data

    def save(self, request):
        # Create user without setting role initially
        user = User.objects.create_user(
            username=self.validated_data['username'],
            email=self.validated_data['email'],
            password=self.validated_data['password']
        )
        # Explicitly set the role and save
        user.role = self.validated_data.get('role', User.Role.ATTENDEE)
        user.save()
        return user


class EventListSerializer(serializers.ModelSerializer):
    organizer_name = serializers.ReadOnlyField(source='organizer.username')
    
    # FIX: Define lowest_price as a method field
    lowest_price = serializers.SerializerMethodField() 
    
    # Check if the organizer has a store and return the slug
    store_slug = serializers.SerializerMethodField() 
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'start_datetime', 'end_datetime', 'location_name', 
            'poster_image', 'lowest_price', 'category', 'organizer_name', 'store_slug'
        ]

    # FIX: Implement the method to calculate the lowest price
    def get_lowest_price(self, obj):
        # Finds the minimum price across all ticket tiers for the event
        min_price = obj.tiers.aggregate(Min('price'))['price__min']
        return min_price if min_price is not None else 0
    
    def get_store_slug(self, obj):
        """Returns the slug for the organizer's store, if it exists."""
        try:
            # The Store model is imported from stores.models
            return obj.organizer.store.slug
        except Store.DoesNotExist:
            return None


class EventDetailSerializer(EventListSerializer):
    tiers = TicketTierSerializer(many=True, read_only=True)
    description = serializers.CharField(source='description')
    
    class Meta(EventListSerializer.Meta):
        fields = EventListSerializer.Meta.fields + ['description', 'tiers']


class TicketSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source='event.title')
    event_image = serializers.ReadOnlyField(source='event.poster_image.url')
    event_location = serializers.ReadOnlyField(source='event.location_name')
    event_start_date = serializers.ReadOnlyField(source='event.start_datetime')
    event_end_date = serializers.ReadOnlyField(source='event.end_datetime')
    organizer_name = serializers.ReadOnlyField(source='event.organizer.username')
    tier_name = serializers.ReadOnlyField(source='tier.name')
    tier_price = serializers.ReadOnlyField(source='tier.price')
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'qr_code_hash', 'status', 'purchase_date', 
            'attendee_name', 'attendee_email',
            'event_title', 'event_image', 'event_location', 
            'event_start_date', 'event_end_date', 'organizer_name', 
            'tier_name', 'tier_price'
        ]

# --- Nested Writeable Serializers (for Event Creation/Update) ---

class NestedTicketTierSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    
    class Meta:
        model = TicketTier
        fields = ['id', 'name', 'description', 'price', 'quantity_allocated']

class EventCreateUpdateSerializer(serializers.ModelSerializer):
    tiers = serializers.CharField(write_only=True) # Receives JSON string from frontend

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'category', 
            'location_name', 'start_datetime', 'end_datetime', 
            'poster_image', 'is_published', 'tiers'
        ]
        
    def validate_tiers(self, value):
        # 1. Parse the JSON string back into a Python list
        try:
            tiers_data = json.loads(value)
        except json.JSONDecodeError:
            raise serializers.ValidationError("Tiers data is not valid JSON.")
        
        # 2. Use the nested serializer for validation
        serializer = NestedTicketTierSerializer(data=tiers_data, many=True)
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
             raise serializers.ValidationError({"tiers": e.detail})
        
        return tiers_data
    
    def to_internal_value(self, data):
        # DRF needs to convert QueryDict to a standard dict for nested list handling
        if hasattr(data, 'dict'):
            data = data.dict()
            
        # Ensure image field is retained as a file object if present
        if 'request' in self.context and self.context['request'].FILES:
            if 'poster_image' in self.context['request'].FILES:
                data['poster_image'] = self.context['request'].FILES['poster_image']

        return super().to_internal_value(data)

    def create(self, validated_data):
        tiers_data = validated_data.pop('tiers')
        # Organizer is set from the request user (passed in view)
        event = Event.objects.create(**validated_data)
        
        # Create Tiers
        for tier_data in tiers_data:
            TicketTier.objects.create(event=event, **tier_data)
        
        return event

    def update(self, instance, validated_data):
        tiers_data = validated_data.pop('tiers', None)
        
        # 1. Update Event fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 2. Update/Create Tiers
        if tiers_data is not None:
            tiers_to_keep = []
            for tier_data in tiers_data:
                tier_id = tier_data.pop('id', None)
                if tier_id:
                    # Update existing tier
                    tier = TicketTier.objects.get(id=tier_id, event=instance)
                    for attr, value in tier_data.items():
                        setattr(tier, attr, value)
                    tier.save()
                    tiers_to_keep.append(tier_id)
                else:
                    # Create new tier
                    new_tier = TicketTier.objects.create(event=instance, **tier_data)
                    tiers_to_keep.append(new_tier.id)

            # Delete tiers removed by the organizer
            instance.tiers.exclude(id__in=tiers_to_keep).delete()

        return instance