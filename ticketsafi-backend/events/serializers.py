import json
from rest_framework import serializers
from django.db.models import Min
from .models import User, Event, TicketTier, Ticket, Payment
from stores.models import Store

# --- NEW: Simple Serializer for Store Info in Events ---
class SimpleStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name', 'slug', 'logo_image']

class TicketTierSerializer(serializers.ModelSerializer):
    available_qty = serializers.ReadOnlyField()

    class Meta:
        model = TicketTier
        fields = ['id', 'name', 'description', 'price', 'quantity_allocated', 'quantity_sold', 'available_qty']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'avatar_url', 'is_verified', 'wallet_id']

class CustomRegisterSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.ATTENDEE)
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'role']
        extra_kwargs = {'password': {'write_only': True}}
        
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return data

    def save(self, request):
        user = User.objects.create_user(
            username=self.validated_data['username'],
            email=self.validated_data['email'],
            password=self.validated_data['password']
        )
        user.role = self.validated_data.get('role', User.Role.ATTENDEE)
        user.save()
        return user

class EventListSerializer(serializers.ModelSerializer):
    organizer_name = serializers.ReadOnlyField(source='organizer.username')
    lowest_price = serializers.SerializerMethodField()
    
    # UPDATED: Return full store object instead of just slug
    store = SimpleStoreSerializer(read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'start_datetime', 'end_datetime', 'location_name', 
            'poster_image', 'lowest_price', 'category', 'organizer_name', 'store'
        ]

    def get_lowest_price(self, obj):
        min_price = obj.tiers.aggregate(Min('price'))['price__min']
        return min_price if min_price is not None else 0

class EventDetailSerializer(EventListSerializer):
    tiers = TicketTierSerializer(many=True, read_only=True)
    description = serializers.CharField()
    
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

class NestedTicketTierSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    quantity_sold = serializers.IntegerField(read_only=True) 

    class Meta:
        model = TicketTier
        fields = ['id', 'name', 'description', 'price', 'quantity_allocated', 'quantity_sold']

class EventCreateUpdateSerializer(serializers.ModelSerializer):
    tiers = serializers.CharField(write_only=True) 
    
    # Write: Use ID to link
    store = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(), 
        required=False, 
        allow_null=True
    )

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'category', 
            'location_name', 'start_datetime', 'end_datetime', 
            'poster_image', 'is_published', 'tiers', 'store'
        ]
        
    def validate_tiers(self, value):
        try:
            tiers_data = json.loads(value)
        except json.JSONDecodeError:
            raise serializers.ValidationError("Tiers data is not valid JSON.")
        
        serializer = NestedTicketTierSerializer(data=tiers_data, many=True)
        serializer.is_valid(raise_exception=True)
        return tiers_data
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['tiers'] = NestedTicketTierSerializer(instance.tiers.all(), many=True).data
        # Add Store details for the edit form so we can pre-fill correctly
        if instance.store:
             ret['store'] = instance.store.id # Return ID for the select input
        return ret

    def to_internal_value(self, data):
        if hasattr(data, 'dict'):
            data = data.dict()
            
        if 'store' in data and data['store'] == '':
            data['store'] = None

        if 'request' in self.context and self.context['request'].FILES:
            if 'poster_image' in self.context['request'].FILES:
                data['poster_image'] = self.context['request'].FILES['poster_image']

        return super().to_internal_value(data)

    def create(self, validated_data):
        tiers_data = validated_data.pop('tiers')
        event = Event.objects.create(**validated_data)
        
        for tier_data in tiers_data:
            TicketTier.objects.create(event=event, **tier_data)
        
        return event

    def update(self, instance, validated_data):
        tiers_data = validated_data.pop('tiers', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tiers_data is not None:
            tiers_to_keep = []
            for tier_data in tiers_data:
                tier_id = tier_data.pop('id', None)
                if tier_id:
                    try:
                        tier = TicketTier.objects.get(id=tier_id, event=instance)
                        for attr, value in tier_data.items():
                            setattr(tier, attr, value)
                        tier.save()
                        tiers_to_keep.append(tier_id)
                    except TicketTier.DoesNotExist:
                        pass
                else:
                    new_tier = TicketTier.objects.create(event=instance, **tier_data)
                    tiers_to_keep.append(new_tier.id)

            tiers_to_delete = instance.tiers.exclude(id__in=tiers_to_keep)
            for tier in tiers_to_delete:
                if not tier.ticket_set.exists():
                    tier.delete()

        return instance