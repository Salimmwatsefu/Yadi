from django.urls import include, path
from .views import EventListView, EventDetailView, InitiatePaymentView, OrganizerEventUpdateView, UserTicketsView, TicketDetailView, OrganizerEventCreateView, OrganizerDashboardView, OrganizerEventListView, OrganizerEventAttendeesView



urlpatterns = [
    path('events/', EventListView.as_view(), name='event-list'),
    path('events/<uuid:pk>/', EventDetailView.as_view(), name='event-detail'),

    # Payment Route
    path('pay/initiate/', InitiatePaymentView.as_view(), name='pay-initiate'),

    path('tickets/', UserTicketsView.as_view(), name='user-tickets'),
    path('tickets/<uuid:pk>/', TicketDetailView.as_view(), name='ticket-detail'),

      # Organizer Routes
    path('organizer/dashboard/', OrganizerDashboardView.as_view(), name='organizer-dashboard'), # <--- The missing link
    path('organizer/events/create/', OrganizerEventCreateView.as_view(), name='organizer-event-create'),
    path('organizer/events/', OrganizerEventListView.as_view(), name='organizer-event-list'),
    path('organizer/events/<uuid:pk>/attendees/', OrganizerEventAttendeesView.as_view(), name='organizer-event-attendees'),

    # NEW: Edit/Delete Route
    path('organizer/events/<uuid:pk>/edit/', OrganizerEventUpdateView.as_view(), name='organizer-event-edit'),

   # --- STORES APP ROUTES ---
    path('stores/', include('stores.urls')),

]