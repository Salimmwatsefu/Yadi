📚 TicketSafi Backend API Documentation

This document outlines the architecture, data models, and API endpoints for the TicketSafi platform. The backend is built on Django 5.0 and Django REST Framework (DRF), utilizing JWT transmitted via secure HttpOnly Cookies for session management.

1. Architecture Overview

Component

Technology

Purpose

Backend

Python (Django 5.0)

Business logic, ticketing integrity, M-Pesa handling.

Database

PostgreSQL (recommended)

ACID compliance for ticket transactions.

Authentication

Django Rest Auth + JWT

Secure, stateless user sessions via HttpOnly Cookies.

Async Tasks

(Celery)

Future use: Handling M-Pesa webhooks, heavy report generation.

Messaging

(Brevo/Gmail SMTP)

Transactional email delivery (Ticket PNG attachment).

2. Authentication & Identity Endpoints

Base URL: /api/auth/

URL Pattern

Method

Description

Authentication

/api/auth/registration/

POST

Register User. Accepts username, email, password, and optional role (ATTENDEE/ORGANIZER).

None

/api/auth/login/

POST

Standard Login. Accepts username OR email and password. Returns JWT via HttpOnly Cookie.

None

/api/auth/logout/

POST

Logout. Blacklists JWT and clears HTTP cookie.

Authenticated

/api/auth/user/

GET

Fetch User Profile. Returns logged-in user data (id, email, role).

Authenticated

/api/auth/google/

POST

Social Login. Accepts Google access_token in body.

None

/api/auth/password/reset/

POST

Initiates password reset email flow. Accepts email.

None

/api/auth/password/reset/confirm/

POST

Confirms reset. Accepts uid, token, new_password1, new_password2.

None

3. Public Endpoints (Fan/Discovery)

Base URL: /api/events/ and /api/tickets/

A. Event Discovery

URL Pattern

Method

Description

Request

Response Example

/api/events/

GET

List Events. Returns all published events. Supports filtering.

Query Params: q, category, date, min_price, max_price.

List of EventListSerializer

/api/events/{id}/

GET

Event Details. Returns full details, including all ticket tiers available for purchase.

None

EventDetailSerializer

B. Purchase & Ticket View

URL Pattern

Method

Description

Request Body

/api/pay/initiate/

POST

Initiate Payment (Guest Checkout). Creates a "shadow user" if email is new. Decrements ticket inventory. Triggers email/PNG ticket delivery.

tier_id, phone_number (2547...), email (if guest), name (if guest)

/api/tickets/

GET

User's Wallet. Lists all tickets owned by the logged-in user (request.user).

None

/api/tickets/{id}/

GET

Ticket Detail. Returns single ticket data for QR code display.

None

4. Protected Endpoints (Organizer & Store Management)

All organizer endpoints require Authentication and assume the user's role is ORGANIZER.

A. Organizer Portal (Events App)

URL Pattern

Method

Description

/api/organizer/dashboard/

GET

Real-Time Stats. Calculates and returns total revenue, tickets sold, and recent events metrics for the organizer.

/api/organizer/events/

GET

My Events List. Lists all events created by the logged-in organizer (including Drafts).

/api/organizer/events/create/

POST

Create New Event. Accepts multipart FormData including poster_image file and JSON string for nested tiers data.

/api/organizer/events/{id}/edit/

PATCH

Update Event. Allows modification of event details and tiers.

/api/organizer/events/{id}/attendees/

GET

Guest List. Returns all purchased tickets for the specific event ({id}). Data is grouped and sensitive IDs are masked.

B. Storefront Management (Stores App)

URL Pattern

Method

Description

/api/stores/create/

POST

Create Store Profile. Creates the initial branded storefront (name, slug, logo, banner).

/api/stores/manage/

GET

Retrieves the organizer's store profile details.

/api/stores/manage/

PATCH

Updates store branding (logo, banner, description).

/api/stores/manage/

DELETE

Removes the store profile.

C. Public Storefront Viewing

URL Pattern

Method

Description

/api/stores/

GET

List All Stores. Discovery of all published organizer storefronts.

/api/stores/{slug}/

GET

Public Store Page. Returns Store branding details PLUS a list of all published events associated with that store.

5. Next Steps for Deployment

Deployment Prep: Replace GMail SMTP with Brevo credentials in .env.

Web Frontend: Build the CreateStorePage.tsx and the public StorePage.tsx using the endpoints in section 4.

Mobile App: Begin development of the React Native Scanner App, utilizing the /api/organizer/events/{id}/attendees/ endpoint for offline data sync.