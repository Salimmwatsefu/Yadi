from django.urls import include, path
from .views import ( ActivateGuestAccountView, EventListView, EventDetailView, ExportAttendeesCSVView, GetWalletLinkView, InitiatePaymentView, OrganizerEventUpdateView, OrganizerWalletProxyView, UserTicketsView, TicketDetailView, OrganizerEventCreateView, OrganizerDashboardView, OrganizerEventListView, OrganizerEventAttendeesView, VerifyTicketView,
                     ScannerListView, ScannerCreateView, ActivateWalletView
                    
                    )


urlpatterns = [
 
    path('events/', EventListView.as_view(), name='event-list'),
    path('events/<uuid:id>/', EventDetailView.as_view(), name='event-detail'),

    # Payment Route
    path('pay/initiate/', InitiatePaymentView.as_view(), name='pay-initiate'),

    # --- REMOVED: path('auth/check-code/', ...) ---

    path('tickets/', UserTicketsView.as_view(), name='user-tickets'),
    path('tickets/<uuid:id>/', TicketDetailView.as_view(), name='ticket-detail'),

      # Organizer Routes
    path('organizer/dashboard/', OrganizerDashboardView.as_view(), name='organizer-dashboard'), # <--- The missing link
    path('organizer/events/create/', OrganizerEventCreateView.as_view(), name='organizer-event-create'),
    path('organizer/events/', OrganizerEventListView.as_view(), name='organizer-event-list'),
    # Change <uuid:pk> to <uuid:id>
    path('organizer/events/<uuid:id>/attendees/', OrganizerEventAttendeesView.as_view(), name='organizer-event-attendees'),
    # NEW: Edit/Delete Route
    path('organizer/events/<uuid:id>/edit/', OrganizerEventUpdateView.as_view(), name='organizer-event-edit'),


    path('scanner/verify/', VerifyTicketView.as_view(), name='scanner-verify'),

    path('organizer/team/scanners/', ScannerListView.as_view(), name='scanner-list'),
    path('organizer/team/scanners/create/', ScannerCreateView.as_view(), name='scanner-create'),

   # --- STORES APP ROUTES ---
    path('stores/', include('stores.urls')),


    # Activate wallet
    path('organizer/wallet/activate/', ActivateWalletView.as_view(), name='activate-wallet'),

    path('organizer/wallet/', OrganizerWalletProxyView.as_view(), name='organizer-wallet-proxy'),


    path('organizer/wallet/link/', GetWalletLinkView.as_view(), name='wallet-link'),

    path('auth/guest/activate/', ActivateGuestAccountView.as_view(), name='guest-activate'),

    path('organizer/events/<uuid:id>/export/', ExportAttendeesCSVView.as_view(), name='organizer-event-export'),

    

]