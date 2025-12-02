from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.exceptions import ImmediateHttpResponse
from django.shortcuts import redirect
from django.conf import settings
from .models import User, OrganizerInvitationCode
import json

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """
        Invoked just before login/registration. Used here to enforce
        the Organizer Invitation Code check for new users.
        """
        # 1. Check if a user with this email already exists (for linking/login)
        email = sociallogin.account.extra_data.get('email')
        if not email:
            return

        try:
            user = User.objects.get(email=email)
            
            # If user exists (either linked or found by email), proceed to connect/login
            if not sociallogin.is_existing:
                 sociallogin.connect(request, user)

            # SILENT MERGE: Upgrade Guest Accounts
            if getattr(user, 'is_guest', False) or not user.is_active:
                user.is_guest = False
                user.is_active = True
                user.save()
            
            # Allow login to proceed normally for existing users
            return

        except User.DoesNotExist:
            # --- SECURITY CHECK: Block New Organizer Social Registration ---
            requested_role = request.GET.get('role')

            if requested_role == User.Role.ORGANIZER:
                # If a new user is trying to register as an Organizer via social login,
                # they must be redirected to the standard form where the code is mandatory.
                
                if settings.DEBUG:
                    domain = "http://localhost:5173"
                else:
                    domain = "https://tickets.yadi.app"
                
                # Redirect to login/organizer with an error flag
                redirect_url = f"{domain}/login/organizer?social_error=code_required"
                raise ImmediateHttpResponse(redirect(redirect_url))
            
            # If new user requests ATTENDEE, we let the flow proceed to save_user()
            pass


    def save_user(self, request, sociallogin, form=None):
        """
        Invoked when a NEW user is being created via social login.
        This only runs if pre_social_login allowed it (i.e., new ATTENDEE).
        """
        user = super().save_user(request, sociallogin, form)
        
        # 1. Prioritized Check: URL Query Parameters
        requested_role = request.GET.get('role')

        # 2. Assign Role: Force to ATTENDEE if ORGANIZER was requested without a code
        if requested_role == User.Role.ORGANIZER:
            # This is a fallback check; pre_social_login should have prevented this path.
            user.role = User.Role.ATTENDEE
        else:
            user.role = User.Role.ATTENDEE
        
        # Ensure new Google users are not flagged as guests and are active
        user.is_guest = False
        user.is_active = True
        
        user.save()
        return user