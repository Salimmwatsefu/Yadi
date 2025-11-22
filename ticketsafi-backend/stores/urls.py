from django.urls import path
from .views import StoreDetailView, StoreListView, StoreCreateView, StoreUpdateView

urlpatterns = [
    # Organizer Management Routes
    path('manage/', StoreUpdateView.as_view(), name='organizer-store-manage'), # Use PATCH/PUT for existing store
    path('create/', StoreCreateView.as_view(), name='organizer-store-create'),  # Use POST for new store

    # Public Discovery Routes
    path('', StoreListView.as_view(), name='store-list'),
    path('<slug:slug>/', StoreDetailView.as_view(), name='store-detail'),
]