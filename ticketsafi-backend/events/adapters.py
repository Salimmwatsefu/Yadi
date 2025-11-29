from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.exceptions import ImmediateHttpResponse
from django.shortcuts import redirect
from django.conf import settings
from .models import User
import json

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """
        Invoked just after a user successfully authenticates via a social provider,
        but before the login is actually processed.
        
        This is where we intercept 'User already exists' errors and force a link instead.
        """
        # 1. Ignore existing social accounts (they are already linked)
        if sociallogin.is_existing:
            return

        # 2. Check if a user with this email already exists in our DB
        email = sociallogin.account.extra_data.get('email')
        if not email:
            return

        try:
            user = User.objects.get(email=email)
            
            # 3. Connect the social account to the existing user
            # This trusts Google's verification and bypasses the collision error
            sociallogin.connect(request, user)
            
            # 4. SILENT MERGE: Upgrade Guest Accounts
            # If this was a guest account (whether activated or not), 
            # logging in with Google proves ownership, so we fully unlock it.
            if getattr(user, 'is_guest', False) or not user.is_active:
                user.is_guest = False
                user.is_active = True
                user.save()
                print(f"✅ [Adapter] Auto-linked Google to Guest User: {email}")
            else:
                print(f"✅ [Adapter] Auto-linked Google to Existing User: {email}")

        except User.DoesNotExist:
            # If user doesn't exist, we let the normal flow proceed to save_user()
            pass

    def save_user(self, request, sociallogin, form=None):
        """
        Invoked when a NEW user is being created via social login.
        """
        user = super().save_user(request, sociallogin, form)
        
        # 1. Prioritized Check: URL Query Parameters (Safest)
        # Frontend sends: /api/auth/google/?role=ORGANIZER
        requested_role = request.GET.get('role')

        # 2. Fallback: Check DRF parsed data
        if not requested_role and hasattr(request, 'data') and isinstance(request.data, dict):
            requested_role = request.data.get('role')

        # 3. Fallback: Check Body (for raw JSON requests)
        if not requested_role and hasattr(request, 'body') and request.body:
            try:
                body_data = json.loads(request.body.decode('utf-8'))
                requested_role = body_data.get('role')
            except:
                pass

        # 4. Assign Role
        if requested_role in ['ORGANIZER', 'ATTENDEE']:
            user.role = requested_role
        else:
            user.role = 'ATTENDEE'
        
        # Ensure new Google users are not flagged as guests and are active
        user.is_guest = False
        user.is_active = True
        
        user.save()
        return user