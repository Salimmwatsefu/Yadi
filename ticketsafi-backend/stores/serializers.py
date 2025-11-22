import json
from rest_framework import serializers
from .models import Store
from events.models import User # Need User model for foreign key linking

class StoreSerializer(serializers.ModelSerializer):
    """
    Serializer for Store creation and detail viewing. 
    Handles file upload and nested fields required for organization branding.
    """
    organizer_name = serializers.ReadOnlyField(source='organizer.username')
    
    class Meta:
        model = Store
        fields = [
            'id', 'name', 'slug', 'description', 
            'logo_image', 'banner_image', 
            'instagram_link', 'website_link', 'organizer_name'
        ]
        read_only_fields = ['organizer_name'] 

    # We need to manually handle file/data mixing (multipart form data) validation
    def to_internal_value(self, data):
        # DRF needs to convert QueryDict to a standard dict for list handling
        if hasattr(data, 'dict'):
            data = data.dict()
            
        # Ensure image fields are retained as file objects if present in the request
        if 'request' in self.context and self.context['request'].FILES:
             for field in ['logo_image', 'banner_image']:
                 if field in self.context['request'].FILES:
                     data[field] = self.context['request'].FILES[field]

        return super().to_internal_value(data)