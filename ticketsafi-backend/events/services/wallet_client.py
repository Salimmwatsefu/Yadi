import requests
from decouple import config  
from rest_framework.exceptions import APIException

class WalletServiceError(APIException):
    status_code = 503
    default_detail = 'Wallet Service Unavailable'

class WalletClient:
    def __init__(self):
        # CORRECT USAGE: Use config(...) directly, not settings.config(...)
        self.base_url = config('WALLET_SERVICE_URL', default='http://localhost:8001/api/service/')
        self.api_key = config('WALLET_SERVICE_KEY')
        
        self.headers = {
            'X-Service-Key': self.api_key,
            'Content-Type': 'application/json'
        }

    def _post(self, endpoint, data):
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.post(url, json=data, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Wallet Service Error: {e}")
            if e.response:
                print(f"Response: {e.response.text}")
            raise WalletServiceError(f"Failed to connect to Wallet System: {str(e)}")

    def onboard_user(self, user):
        """
        Creates a wallet for the user on the remote system.
        """
        payload = {
            "remote_id": str(user.id),
            "email": user.email,
            "phone": user.phone_number or ""
        }
        
        response = self._post('onboard/', payload)
        return response
    


    def get_balance(self, user_id):
        """
        Fetches the balance for a specific user from the Wallet System.
        """
        # We assume the wallet system exposes a balance endpoint
        # endpoint: /api/service/balance/{remote_user_id}/
        return self._get(f"balance/{user_id}/")

    def initiate_withdrawal(self, user_id, amount):
        """
        Requests a payout for the user.
        """
        payload = {
            "remote_user_id": str(user_id),
            "amount": str(amount)
        }
        return self._post('withdraw/', payload)

    def _get(self, endpoint):
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.get(url, headers=self.headers, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Wallet GET Error: {e}")
            # FIXED: Return ALL fields to prevent NaN on frontend
            return {
                "balance": 0.00, 
                "pending_payouts": 0.00,  # <--- Added
                "currency": "KES",
                "is_frozen": False,
                "is_kyc_verified": False
            }
        



    def collect_payment(self, organizer_id, phone, amount, ticket_ref):
        payload = {
            "organizer_id": str(organizer_id),
            "phone": phone,
            "amount": str(amount),
            "reference": ticket_ref
        }
        return self._post('payment/collect/', payload)
    


    def get_kyc_link(self, user_id):
        """
        Asks the wallet for a magic link to the KYC page.
        """
        payload = {"remote_user_id": str(user_id)}
        return self._post('auth/link/', payload)
    

    def get_history(self, user_id, params=None):
        """ Fetches transaction logs with pagination params """
        endpoint = f"history/{user_id}/"
        
        # Append query params if they exist
        if params:
            # A simple way to construct query string
            import urllib.parse
            query_string = urllib.parse.urlencode(params)
            endpoint = f"{endpoint}?{query_string}"
            
        return self._get(endpoint)