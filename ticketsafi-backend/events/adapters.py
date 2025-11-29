# ticketsafi-backend/events/adapters.py

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
import json

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form)

        # 1. prioritized Check: URL Query Parameters (Safest)
        # The frontend now sends POST /api/auth/google/?role=ORGANIZER
        requested_role = request.GET.get('role')

        print(f"🔍 [Adapter] Role from Query Params: {requested_role}")

        # 2. Fallback: Check DRF parsed data (if available)
        if not requested_role and hasattr(request, 'data') and isinstance(request.data, dict):
            requested_role = request.data.get('role')
            print(f"🔍 [Adapter] Role from DRF data: {requested_role}")

        # 3. Fallback: Check Body (only if not consumed)
        if not requested_role and hasattr(request, 'body') and request.body:
            try:
                body_data = json.loads(request.body.decode('utf-8'))
                requested_role = body_data.get('role')
                print(f"🔍 [Adapter] Role from JSON Body: {requested_role}")
            except:
                pass

        # 4. Assign
        if requested_role in ['ORGANIZER', 'ATTENDEE']:
            user.role = requested_role
            user.save()
            print(f"✅ [Adapter] SUCCESS: User {user.email} saved as {user.role}")
        else:
            user.role = 'ATTENDEE'
            user.save()
            print(f"⚠️ [Adapter] WARNING: No valid role found. Defaulting to ATTENDEE.")
        
        return user