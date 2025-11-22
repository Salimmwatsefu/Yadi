from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from events.views import GoogleLogin, password_reset_confirm_redirect

urlpatterns = [
    path('admin/', admin.site.urls),

    path('accounts/', include('allauth.urls')), 
    
    # Auth Routes (Login/Signup)
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('password-reset/confirm/<uidb64>/<token>/', password_reset_confirm_redirect, name='password_reset_confirm'),
    
    # App Routes
    path('api/', include('events.urls')),
    path('api/stores/', include('stores.urls')),
]

# Serve media files (Event Posters) in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)