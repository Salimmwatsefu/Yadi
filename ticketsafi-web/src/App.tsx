import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'; // 1. Import Google Provider
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



// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthSelectionPage from './pages/auth/AuthSelectionPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import PasswordResetConfirmPage from './pages/auth/PasswordResetConfirmPage';
import ScannerPage from './pages/scanner/ScannerPage';

import ScannerRoute from './layouts/ScannerRoute';
import TeamPage from './pages/organizer/TeamPage';
import ScrollToTop from './components/ScrollToTop';


const OrganizerRoute = ({ children }: { children: React.ReactNode }) => (
  <OrganizerLayout>{children}</OrganizerLayout>
);

function App() {
  // Replace with your actual Client ID from Google Cloud Console
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    // 2. Wrap everything in GoogleOAuthProvider
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* --- AUTH ROUTES --- */}
             {/* --- AUTH ROUTES --- */}
          <Route path="/auth/select" element={<AuthSelectionPage />} />
          <Route path="/login" element={<AuthSelectionPage />} /> {/* Redirect generic login to selection */}
          
          {/* Parametrized Routes */}
          <Route path="/login/:type" element={<LoginPage />} />
          <Route path="/register/:type" element={<RegisterPage />} />

          

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            {/* This route handles the link sent in email (e.g., /password-reset/confirm/MQ/5z8-...) */}
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

           {/* --- ORGANIZER ROUTES (Organizer Layout) --- */}
        <Route path="/organizer" element={
          <OrganizerRoute>
            <DashboardPage />
          </OrganizerRoute>
        } />
        
        {/* NEW CREATE ROUTE */}
        <Route path="/organizer/create" element={
          <OrganizerRoute>
            <CreateEventPage />
          </OrganizerRoute>
        } />

        <Route path="/organizer/events" element={
          <OrganizerRoute>
            <MyEventsPage /> 
          </OrganizerRoute>
        } />


        <Route path="/organizer/events/:id" element={
              <OrganizerRoute>
                <OrganizerEventDetailsPage />
              </OrganizerRoute>
            } />

        


        <Route path="/organizer/events/:id/edit" element={
              <OrganizerRoute>
                <EditEventPage />
              </OrganizerRoute>
            } />


           <Route path="/organizer/store/create" element={
          <OrganizerRoute>
            <CreateStorePage />
          </OrganizerRoute>
        } />

        <Route path="/organizer/stores" element={<OrganizerRoute><MyStoresPage /></OrganizerRoute>} />

        <Route path="/organizer/store/:id/edit" element={<OrganizerRoute><EditStorePage /></OrganizerRoute>} />

        <Route path="/organizer/team" element={<OrganizerRoute><TeamPage /></OrganizerRoute>} />


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