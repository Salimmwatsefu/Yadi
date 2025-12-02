import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'; 
import { AuthProvider } from './context/AuthContext';

import MainLayout from './layouts/MainLayout';
import OrganizerLayout from './layouts/OrganizerLayout';

import HomePage from './pages/HomePage';
import EventDetailsPage from './pages/EventDetailsPage';
import TicketPage from './pages/TicketPage';
import MyTicketsPage from './pages/MyTicketsPage';
import DashboardPage from './pages/organizer/DashboardPage';
import CreateEventPage from './pages/organizer/CreateEventPage'; 
import MyEventsPage from './pages/organizer/MyEventsPage';
import EditEventPage from './pages/organizer/EditEventPage'; 
import OrganizerEventDetailsPage from './pages/organizer/OrganizerEventDetailsPage';
import CreateStorePage from './pages/organizer/CreateStorePage';
import MyStoresPage from './pages/organizer/MyStoresPage';
import StoresListPage from './pages/StoresListPage';
import StorePage from './pages/StorePage';
import EditStorePage from './pages/organizer/EditStorePage';
import PayoutsPage from './pages/organizer/PayoutsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthSelectionPage from './pages/auth/AuthSelectionPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import PasswordResetConfirmPage from './pages/auth/PasswordResetConfirmPage';
import ScannerPage from './pages/scanner/ScannerPage';
import AccountActivationPage from './pages/auth/AccountActivationPage';
import OrganizerGatePage from './pages/auth/OrganizerGatePage';

import ScannerRoute from './layouts/ScannerRoute';
import TeamPage from './pages/organizer/TeamPage';
import ScrollToTop from './components/ScrollToTop';

const OrganizerRoute = ({ children }: { children: React.ReactNode }) => (
  <OrganizerLayout>{children}</OrganizerLayout>
);

function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* --- AUTH ROUTES --- */}
            <Route path="/auth/select" element={<AuthSelectionPage />} />
            <Route path="/login" element={<AuthSelectionPage />} /> 
            
            {/* NEW: Explicit Gate Route (Avoids conflict with Login/Register paths) */}
            <Route path="/organizer/gate/:action" element={<OrganizerGatePage />} />

            {/* Parametrized Login/Register Routes */}
            <Route path="/login/:type" element={<LoginPage />} />
            <Route path="/register/:type" element={<RegisterPage />} />
            
            <Route path="/activate/:uid/:token" element={<AccountActivationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/password-reset/confirm/:uid/:token" element={<PasswordResetConfirmPage />} />

            {/* --- PUBLIC ROUTES --- */}
            <Route path="/" element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            } />
            
            <Route path="/event/:id" element={
              <MainLayout>
                <EventDetailsPage />
              </MainLayout>
            } />

            <Route path="/ticket/:id" element={
              <MainLayout>
                <TicketPage />
              </MainLayout>
            } />

            <Route path="/my-tickets" element={
              <MainLayout>
                <MyTicketsPage />
              </MainLayout>
            } />

            <Route path="/stores" element={<MainLayout><StoresListPage /></MainLayout>} />
            <Route path="/stores/:slug" element={<MainLayout><StorePage /></MainLayout>} />

           {/* --- ORGANIZER ROUTES --- */}
            <Route path="/organizer" element={<OrganizerRoute><DashboardPage /></OrganizerRoute>} />
            <Route path="/organizer/create" element={<OrganizerRoute><CreateEventPage /></OrganizerRoute>} />
            <Route path="/organizer/events" element={<OrganizerRoute><MyEventsPage /></OrganizerRoute>} />
            <Route path="/organizer/events/:id" element={<OrganizerRoute><OrganizerEventDetailsPage /></OrganizerRoute>} />
            <Route path="/organizer/events/:id/edit" element={<OrganizerRoute><EditEventPage /></OrganizerRoute>} />
            <Route path="/organizer/store/create" element={<OrganizerRoute><CreateStorePage /></OrganizerRoute>} />
            <Route path="/organizer/stores" element={<OrganizerRoute><MyStoresPage /></OrganizerRoute>} />
            <Route path="/organizer/store/:id/edit" element={<OrganizerRoute><EditStorePage /></OrganizerRoute>} />
            <Route path="/organizer/team" element={<OrganizerRoute><TeamPage /></OrganizerRoute>} />
            <Route path="/organizer/payouts" element={<OrganizerRoute><PayoutsPage /></OrganizerRoute>} />

            <Route path="/scanner" element={
                  <ScannerRoute>
                    <ScannerPage />
                  </ScannerRoute>
                } />

          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;