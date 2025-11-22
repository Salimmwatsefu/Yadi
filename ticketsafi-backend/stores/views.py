from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q # For searching across fields
from django.utils.text import slugify

from .models import Store
from .serializers import StoreSerializer
from events.models import Event
from events.serializers import EventListSerializer


# --- ORGANIZER MANAGEMENT VIEWS ---

class StoreCreateView(generics.CreateAPIView):
    """
    Endpoint for Organizers to create their first store profile.
    Uses POST /api/stores/create/
    """
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # 1. Check if the user already has a store
        if hasattr(self.request.user, 'store'):
            # Allow creation if the user is an organizer, but raise a 409 conflict
            return Response({"error": "Organizer already has a store."}, status=status.HTTP_409_CONFLICT)
        
        # 2. Auto-set organizer and save
        serializer.save(organizer=self.request.user)

class StoreUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """
    Endpoint for Organizers to view, update, or delete their existing store.
    Uses GET/PATCH/DELETE /api/stores/manage/
    """
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Override get_object to only retrieve the currently logged-in user's store
    def get_object(self):
        try:
            return self.request.user.store
        except Store.DoesNotExist:
            raise generics.exceptions.NotFound("Store profile does not exist for this organizer.")

# --- PUBLIC FACING VIEWS ---

class StoreDetailView(generics.RetrieveAPIView):
    """
    Public endpoint to view a single store and its events (microsite).
    Uses GET /api/stores/<slug>/
    """
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Fetch all published events for this store's organizer
        events = Event.objects.filter(
            organizer=instance.organizer,
            is_published=True,
            end_datetime__gt=timezone.now()
        ).order_by('start_datetime')
        
        # Use the EventListSerializer from the events app
        event_serializer = EventListSerializer(events, many=True, context={'request': request})
        
        # Combine store data and event list
        data = serializer.data
        data['events'] = event_serializer.data
        
        return Response(data)

class StoreListView(generics.ListAPIView):
    """
    Public endpoint to list all existing stores.
    Uses GET /api/stores/
    """
    queryset = Store.objects.all().order_by('name')
    serializer_class = StoreSerializer