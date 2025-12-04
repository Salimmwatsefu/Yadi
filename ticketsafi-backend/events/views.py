import json
import uuid
from django.db.models import Sum, Avg, Count, F
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from rest_framework import generics, views, status, permissions
from rest_framework.response import Response

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView

from .models import User, Event, Ticket, TicketTier, Payment, OrganizerInvitationCode
from .serializers import EventListSerializer, EventDetailSerializer, EventCreateUpdateSerializer, TicketSerializer, UserSerializer
from .utils import send_ticket_email
from events import models 
from rest_framework.views import APIView
from .services.wallet_client import WalletClient
from django.conf import settings

# --- AUTH RELATED VIEWS ---

# Helper view to redirect Django's built-in password reset link to the React Frontend
def password_reset_confirm_redirect(request, uidb64, token):
    """
    Redirects the email link to the correct Frontend URL depending on the environment.
    """
    if settings.DEBUG:
        # Local Development (Vite)
        domain = "http://localhost:5173"
    else:
        # Production (Ticketing Subdomain)
        domain = "https://tickets.yadi.app"

    frontend_url = f"{domain}/password-reset/confirm/{uidb64}/{token}"
    return redirect(frontend_url)


class GoogleLogin(SocialLoginView):
    # FIX: Use 'adapter_class', NOT 'authentication_backends'
    adapter_class = GoogleOAuth2Adapter


# --- PUBLIC FACING VIEWS ---

class InvitationCodeCheckView(APIView):
    """
    Public endpoint to check if an Organizer Invitation Code is valid and active.
    Checks hard-coded reusable codes first, then the database.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({"valid": False, "error": "Code required."}, status=status.HTTP_400_BAD_REQUEST)

        # --- HARD-CODED REUSABLE CODES (YADI-ORG-1, YADI-ORG-2) ---
        REUSABLE_CODES = ['YADI-ORG-1', 'YADI-ORG-2']
        if code.upper() in REUSABLE_CODES:
             return Response({"valid": True}, status=status.HTTP_200_OK)
        # -----------------------------------------------------------

        try:
            # Check for a database-managed code 
            OrganizerInvitationCode.objects.get(code__iexact=code, is_active=True)
            return Response({"valid": True}, status=status.HTTP_200_OK)
        except OrganizerInvitationCode.DoesNotExist:
            return Response({"valid": False, "error": "Invalid or expired code."}, status=status.HTTP_404_NOT_FOUND)


class EventListView(generics.ListAPIView):
    """
    Returns all published events, supporting filtering by search, category, date, and price range.
    """
    serializer_class = EventListSerializer

    def get_queryset(self):
        queryset = Event.objects.filter(is_published=True, end_datetime__gt=timezone.now()).order_by('start_datetime')
        
        # Filtering logic
        q = self.request.query_params.get('q')
        category = self.request.query_params.get('category')
        date_str = self.request.query_params.get('date')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if q:
            queryset = queryset.filter(title__icontains=q) | queryset.filter(description__icontains=q)
        
        if category and category != 'All Events':
            queryset = queryset.filter(category=category.upper())

        if date_str:
            try:
                date_obj = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(start_datetime__date=date_obj)
            except ValueError:
                pass 
                
        if min_price:
            # Filter events that have ANY ticket tier >= min_price
            queryset = queryset.filter(tiers__price__gte=min_price).distinct()
        
        if max_price:
            # Filter events that have ANY ticket tier <= max_price
            queryset = queryset.filter(tiers__price__lte=max_price).distinct()

        return queryset


class EventDetailView(generics.RetrieveAPIView):
    """
    Returns details for a single event (used for the public event page).
    """
    queryset = Event.objects.filter(is_published=True)
    serializer_class = EventDetailSerializer
    lookup_field = 'id'


# --- PURCHASE & PAYMENT VIEWS ---

from .services.wallet_client import WalletClient 

class InitiatePaymentView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        
        tier_id = data.get('tier_id')
        phone_number = data.get('phone_number') 
        guest_email = data.get('email')
        guest_name = data.get('name')
        # NEW: Get Quantity (default to 1)
        try:
            quantity = int(data.get('quantity', 1))
        except ValueError:
             return Response({"error": "Invalid quantity."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not tier_id:
            return Response({"error": "Missing tier_id."}, status=status.HTTP_400_BAD_REQUEST)

        tier = get_object_or_404(TicketTier, id=tier_id)

        if request.user.is_authenticated and request.user == tier.event.organizer:
            return Response(
                {"error": "Organizers cannot buy tickets for their own events."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check against total group quantity
        if tier.available_qty() < quantity: 
            return Response({"error": f"Only {tier.available_qty()} tickets are available."}, status=status.HTTP_400_BAD_REQUEST)

        # --- 1. Identify Owner (or create Guest User) ---
        if request.user.is_authenticated:
            owner = request.user
            # FIX: If no specific name provided, use the logged-in user's name
            if not guest_name:
                if owner.first_name:
                    guest_name = f"{owner.first_name} {owner.last_name or ''}".strip()
                else:
                    guest_name = owner.username
        else:
            if not guest_email or not guest_name:
                return Response({"error": "Guest details required."}, status=status.HTTP_400_BAD_REQUEST)
            
            owner_phone = phone_number if phone_number else '254700000000' 

            owner, created = User.objects.get_or_create(
                email=guest_email,
                defaults={
                    'username': f"{guest_name.split(' ')[0].lower()}_{uuid.uuid4().hex[:4]}",
                    'first_name': guest_name,
                    'password': User.objects.make_random_password(),
                    'is_guest': True,
                    'phone_number': owner_phone 
                }
            )
        
        # --- NEW: FREE TICKET FLOW (Price == 0) ---
        if tier.price == 0:
            # Generate a single identifier for the entire group
            group_qr_hash = f"G-{uuid.uuid4().hex}"
            payment_ref = f"FREE-{uuid.uuid4().hex[:12].upper()}"
            
            # Create COMPLETED Payment record (for logging)
            payment = Payment.objects.create(
                user=owner,
                event=tier.event,
                tier=tier,
                amount=0,
                phone_number=owner.phone_number or '254700000000', 
                reference_code=payment_ref,
                status=Payment.Status.COMPLETED 
            )
            
            # Create all N tickets in a loop
            tickets_created = []
            for i in range(quantity):
                # The first ticket will be the one used for the QR image/email.
                # All tickets in the group point to the same group_qr_hash.

                final_name = guest_name
                if quantity > 1:
                    final_name = f"{guest_name} ({i+1}/{quantity})"


                ticket = Ticket.objects.create(
                    event=tier.event,
                    tier=tier,
                    owner=owner,
                    attendee_name=final_name,
                    attendee_email=guest_email or owner.email,
                    qr_code_hash=group_qr_hash # Set the shared hash
                )
                tickets_created.append(ticket)
            
            # Send Email (only need one ticket for the QR image)
            send_ticket_email(tickets_created[0])
            
            # Return success (return ID of the first ticket for the frontend redirect)
            return Response({
                "status": "Booking Confirmed",
                "transaction_ref": payment_ref,
                "ticket_id": str(tickets_created[0].id),
                "quantity": quantity
            }, status=status.HTTP_201_CREATED)

        # --- PAID TICKET FLOW (Restrict Group Purchases) ---
        else:
            if quantity > 1:
                return Response({"error": "Group purchases for paid tickets are not yet supported. Please register one at a time."}, status=status.HTTP_400_BAD_REQUEST)
        
            # --- PAID TICKET FLOW (Single Ticket Logic) ---
            ticket_ref = f"TS-{uuid.uuid4().hex[:12].upper()}"

            # 3. CREATE PAYMENT RECORD FIRST (Pending)
            payment = Payment.objects.create(
                user=owner,
                event=tier.event,
                tier=tier,
                amount=tier.price,
                phone_number=phone_number,
                reference_code=ticket_ref,
                status=Payment.Status.PENDING
            )

            # 4. Call Wallet Service
            try:
                client = WalletClient()
                organizer_id = tier.event.organizer.id
                
                wallet_response = client.collect_payment(
                    organizer_id=organizer_id,
                    phone=phone_number,
                    amount=tier.price,
                    ticket_ref=ticket_ref
                )

                return Response({
                    "status": "Payment Initiated",
                    "transaction_ref": ticket_ref,
                    "mpesa_ref": wallet_response.get('mpesa_ref')
                }, status=status.HTTP_202_ACCEPTED)

            except Exception as e:
                payment.status = Payment.Status.FAILED
                payment.save()
                print(f"Wallet Payment Error: {e}")
                return Response({"error": "Payment service unavailable."}, status=503)


class UserTicketsView(generics.ListAPIView):
    """
    Returns tickets owned by the logged-in user (for the My Wallet page).
    """
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return tickets owned by the current user
        return Ticket.objects.filter(owner=self.request.user).order_by('-purchase_date')


class TicketDetailView(generics.RetrieveAPIView):
    """
    Returns single ticket detail (for the QR page).
    """
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    lookup_field = 'id'


# --- ORGANIZER VIEWS (PROTECTED) ---

class OrganizerDashboardView(views.APIView):
    """
    Returns core dashboard stats for the logged-in organizer.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get all events owned by the user
        events = Event.objects.filter(organizer=user)
        event_ids = events.values_list('id', flat=True)
        
        # Calculate Aggregates
        total_revenue = Payment.objects.filter(
            event__in=event_ids, status=Payment.Status.COMPLETED
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total_tickets = Ticket.objects.filter(event__in=event_ids).count()
        
        # Unique attendees (using email/owner)
        unique_attendees = Ticket.objects.filter(event__in=event_ids).values('owner').distinct().count()
        
        # Average ticket price calculation (rough average across all payments)
        avg_price = total_revenue / total_tickets if total_tickets else 0

        # Recent events performance (last 5)
        recent_events = []
        for event in events.order_by('-start_datetime')[:5]:
            sold_count = event.tickets.count()
            event_revenue = Payment.objects.filter(event=event, status=Payment.Status.COMPLETED).aggregate(Sum('amount'))['amount__sum'] or 0
            
            recent_events.append({
                'id': event.id,
                'title': event.title,
                'date': event.start_datetime,
                'status': 'Active' if event.end_datetime > timezone.now() else 'Past',
                'sold': sold_count,
                'capacity': event.tiers.aggregate(Sum('quantity_allocated'))['quantity_allocated__sum'] or 0,
                'revenue': event_revenue
            })

        return Response({
            'total_revenue': total_revenue,
            'tickets_sold': total_tickets,
            'total_attendees': unique_attendees,
            'avg_ticket_price': round(avg_price, 2),
            'recent_events': recent_events
        })


class OrganizerEventCreateView(generics.CreateAPIView):
    """
    Organizer creates a new event.
    Uses POST /api/organizer/events/create/
    """
    serializer_class = EventCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Attach the organizer (current user) to the event
        serializer.save(organizer=self.request.user, is_published=True) # Publish by default


class OrganizerEventUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """
    Organizer edits an existing event.
    Uses GET/PATCH/DELETE /api/organizer/events/{id}/edit/
    """
    queryset = Event.objects.all()
    serializer_class = EventCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        # Ensure organizer can only access their own events
        return self.queryset.filter(organizer=self.request.user)


class OrganizerEventListView(generics.ListAPIView):
    """
    Lists all events created by the organizer (Drafts + Published).
    Uses GET /api/organizer/events/
    """
    serializer_class = EventListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(organizer=self.request.user).order_by('-start_datetime')


class OrganizerEventAttendeesView(generics.ListAPIView):
    """
    Returns the guest list (all purchased tickets) for a specific event ID.
    Uses GET /api/organizer/events/{id}/attendees/
    """
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        event_id = self.kwargs['id']
        # 1. Verify user is the organizer of this event
        event = get_object_or_404(Event, id=event_id, organizer=self.request.user)
        # 2. Return all tickets for that event
        return Ticket.objects.filter(event=event).order_by('purchase_date')
    


class VerifyTicketView(APIView):
    """
    Endpoint for Gate Scanners to verify tickets, now supporting sequential group scanning.
    POST /api/scanner/verify/
    Payload: { "qr_hash": "..." }
    """
    permission_classes = [permissions.IsAuthenticated] 

    def post(self, request):
        # 1. Permission Check
        if request.user.role not in [User.Role.ORGANIZER, User.Role.SCANNER]:
            return Response({"error": "Unauthorized. Only scanners can verify tickets."}, status=status.HTTP_403_FORBIDDEN)

        qr_hash = request.data.get('qr_hash')
        if not qr_hash:
            return Response({"error": "No QR code provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 2. Lookup ALL Tickets for this Hash/Group
            # Order by purchase_date ensures sequential check-in based on creation order
            group_tickets = Ticket.objects.filter(qr_code_hash=qr_hash).order_by('purchase_date')
            
            if not group_tickets.exists():
                return Response({"error": "Ticket Not Found"}, status=status.HTTP_404_NOT_FOUND)

            # 3. Find the NEXT AVAILABLE ticket (status=ACTIVE) in the group
            ticket_to_check_in = group_tickets.filter(status=Ticket.Status.ACTIVE).first()
            
            if not ticket_to_check_in:
                # All tickets in the group are already checked in
                first_ticket = group_tickets.first()
                return Response({
                    "error": "ALL TICKETS USED",
                    "attendee_name": first_ticket.attendee_name,
                    "tier_name": first_ticket.tier.name,
                    "total_in_group": group_tickets.count(),
                    "checked_in_count": group_tickets.filter(status=Ticket.Status.CHECKED_IN).count()
                }, status=status.HTTP_409_CONFLICT)


            # 4. Check Event Ownership
            if request.user.role == User.Role.ORGANIZER and ticket_to_check_in.event.organizer != request.user:
                 return Response({"error": "This ticket does not belong to your event."}, status=status.HTTP_403_FORBIDDEN)
            
            # 5. SUCCESS: Check In the found ACTIVE ticket
            ticket_to_check_in.status = Ticket.Status.CHECKED_IN
            ticket_to_check_in.checked_in_at = timezone.now()
            ticket_to_check_in.checked_in_by = request.user
            ticket_to_check_in.save()
            
            # 6. Return updated group status
            total_in_group = group_tickets.count()
            checked_in_count = group_tickets.filter(status=Ticket.Status.CHECKED_IN).count()
            
            # Update the ticket page to reflect sequential scanning
            return Response({
                "status": "VALID",
                "attendee_name": ticket_to_check_in.attendee_name,
                "tier_name": ticket_to_check_in.tier.name,
                "event": ticket_to_check_in.event.title,
                "group_status": f"Checked in {checked_in_count} of {total_in_group}"
            }, status=status.HTTP_200_OK)

        except Ticket.DoesNotExist:
            return Response({"error": "Ticket Not Found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
             print(f"VerifyTicketView Error: {e}")
             return Response({"error": "Invalid QR Hash or System Error"}, status=status.HTTP_400_BAD_REQUEST)
    


# --- TEAM MANAGEMENT VIEWS ---

class ScannerListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Logic to get scanners created by this organizer
        # For MVP, just returning all scanners might be a security risk in prod if not filtered.
        # Ideally: User model should have `created_by` field.
        # For now, let's just filter by role=SCANNER. In a real app, filter by `created_by=self.request.user`
        return User.objects.filter(role=User.Role.SCANNER) 

class ScannerCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Check if user is organizer
        if request.user.role != User.Role.ORGANIZER:
            return Response({"error": "Only organizers can create scanners."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')

        if not username or not password:
            return Response({"error": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST)

        # Create User
        user = User.objects.create_user(username=username, email=email, password=password)
        user.role = User.Role.SCANNER
        user.save()

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": "SCANNER"
        }, status=status.HTTP_201_CREATED)
    




class ActivateWalletView(APIView):
    """
    Organizer clicks 'Activate Wallet'.
    We call the Wallet Service, get an ID, and save it.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        if user.role != User.Role.ORGANIZER:
            return Response({"error": "Only organizers can have wallets."}, status=403)

        if user.wallet_id:
            return Response({"message": "Wallet already active", "wallet_id": user.wallet_id}, status=200)

        # 1. Call the Microservice
        client = WalletClient()
        try:
            data = client.onboard_user(user)
            
            # 2. Save the result
            wallet_id = data.get('wallet_id')
            user.wallet_id = wallet_id
            user.save()
            
            return Response({
                "status": "activated",
                "wallet_id": wallet_id
            }, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=503)
        



class OrganizerWalletProxyView(APIView):
    """
    Proxies wallet requests (Balance & Withdraw) from the Frontend 
    to the Wallet Microservice.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Get Balance
        if request.user.role != User.Role.ORGANIZER:
            return Response({"error": "Unauthorized"}, status=403)
            
        client = WalletClient()
        data = client.get_balance(request.user.id)
        return Response(data)

    def post(self, request):
        # 2. Withdraw Funds
        amount = request.data.get('amount')
        if not amount:
            return Response({"error": "Amount required"}, status=400)

        client = WalletClient()
        try:
            result = client.initiate_withdrawal(request.user.id, amount)
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        

    def get(self, request):
        if request.user.role != User.Role.ORGANIZER:
            return Response({"error": "Unauthorized"}, status=403)
            
        client = WalletClient()
        action = request.query_params.get('action')
        
        if action == 'history':
            # Pass all query params (page, page_size) to the client
            # We exclude 'action' itself from the forwarded params
            params = request.query_params.copy()
            if 'action' in params: del params['action']
            
            data = client.get_history(request.user.id, params)
        else:
            data = client.get_balance(request.user.id)
            
        return Response(data)
        



class GetWalletLinkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.ORGANIZER:
            return Response({"error": "Unauthorized"}, status=403)
            
        client = WalletClient()
        try:
            data = client.get_kyc_link(request.user.id)
            return Response(data) # Returns { "magic_link": "..." }
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        


from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from dj_rest_auth.utils import jwt_encode

class ActivateGuestAccountView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')

        if not uidb64 or not token:
            return Response({"error": "Invalid link"}, status=400)

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "User not found"}, status=400)

        if default_token_generator.check_token(user, token):
            # 1. ACTIVATE USER
            user.is_active = True
            user.is_guest = False
            user.save()

            # 2. GENERATE TOKENS
            access_token, refresh_token = jwt_encode(user)
            
            # 3. PREPARE RESPONSE
            data = {
                "message": "Account activated",
                "user": UserSerializer(user).data
            }
            response = Response(data, status=200)

            # 4. SET COOKIES (Crucial for Auto-Login)
            # Fetch cookie settings from project config
            cookie_config = getattr(settings, 'REST_AUTH', {})
            cookie_name = cookie_config.get('JWT_AUTH_COOKIE', 'ticketsafi-auth')
            refresh_cookie_name = cookie_config.get('JWT_AUTH_REFRESH_COOKIE', 'ticketsafi-refresh')
            secure_flag = cookie_config.get('JWT_AUTH_SECURE', True)
            samesite_flag = cookie_config.get('JWT_AUTH_SAMESITE', 'Lax')

            # Set Access Cookie
            response.set_cookie(
                key=cookie_name,
                value=str(access_token),
                httponly=True,
                secure=secure_flag,
                samesite=samesite_flag
            )

            # Set Refresh Cookie
            response.set_cookie(
                key=refresh_cookie_name,
                value=str(refresh_token),
                httponly=True,
                secure=secure_flag,
                samesite=samesite_flag
            )

            return response
        
        return Response({"error": "Invalid or expired token"}, status=400)
    


import csv 
from django.http import HttpResponse

class ExportAttendeesCSVView(views.APIView):
    """
    Exports all attendees for a given event ID to a downloadable CSV file.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        event = get_object_or_404(Event, id=id, organizer=request.user)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{event.title}_Guest_List.csv"'

        writer = csv.writer(response)
        
        # 1. Write Header Row
        writer.writerow([
            'Ticket ID', 'Status', 'Attendee Name', 'Attendee Email', 
            'Ticket Tier', 'Tier Price', 'Purchase Date', 'Checked In At'
        ])

        # 2. Fetch all tickets and write data rows
        tickets = Ticket.objects.filter(event=event).values_list(
            'id', 'status', 'attendee_name', 'attendee_email', 
            'tier__name', 'tier__price', 'purchase_date', 'checked_in_at'
        ).iterator() # Use iterator for memory efficiency on large datasets

        for ticket in tickets:
            writer.writerow(ticket)

        return response