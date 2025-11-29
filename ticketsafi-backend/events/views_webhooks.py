import hmac
import hashlib
from decouple import config
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Payment, Ticket
from .utils import send_ticket_email

class PaymentWebhookView(APIView):
    permission_classes = [permissions.AllowAny] 

    def post(self, request):
        # --- SECURITY CHECK ---
        signature = request.headers.get('X-Yadi-Signature')
        secret = config('WEBHOOK_SECRET').encode('utf-8')
        
        # Calculate what the signature SHOULD be based on the body we received
        expected_signature = hmac.new(secret, request.body, hashlib.sha256).hexdigest()
        
        # Compare securely (prevents timing attacks)
        if not signature or not hmac.compare_digest(signature, expected_signature):
            print("⚠️ Security Alert: Invalid Webhook Signature")
            return Response({"error": "Invalid Signature"}, status=403)
        # ----------------------

        # If we get here, the request is authentic
        data = request.data
        ticket_ref = data.get('reference')
        status_msg = data.get('status')
        
        # ... (Rest of your existing logic: Find Payment, Create Ticket, etc.) ...
        if not ticket_ref:
             return Response({"error": "Reference required"}, status=400)
             
        try:
            payment = Payment.objects.get(reference_code=ticket_ref)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if payment.status == Payment.Status.COMPLETED:
            return Response({"message": "Already processed"}, status=200)

        if status_msg == 'COMPLETED':
            payment.status = Payment.Status.COMPLETED
            payment.save()
            
            ticket = Ticket.objects.create(
                event=payment.event,
                tier=payment.tier,
                owner=payment.user,
                attendee_name=payment.user.first_name or payment.user.username,
                attendee_email=payment.user.email
            )
            send_ticket_email(ticket)
            return Response({"status": "Ticket Created"}, status=200)
            
        elif status_msg == 'FAILED':
            payment.status = Payment.Status.FAILED
            payment.save()
            return Response({"status": "Marked Failed"}, status=200)

        return Response({"error": "Unknown status"}, status=400)