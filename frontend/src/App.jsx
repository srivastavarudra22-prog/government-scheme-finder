/**
 * @file App.jsx
 * @description Frontend Application Router and Root Provider configuration.
 * 
 * Configures:
 * - Public routes: / (Landing Page with public Navbar & Footer)
 * - Guest-only routes: /login, /signup (guarded by GuestRoute -> redirects to /dashboard)
 * - Protected routes: /dashboard, /profile, /find-schemes, /results, /schemes/:id,
 *   /chat, /saved-schemes, /applications, /notifications, /settings
 *   (guarded by ProtectedRoute and wrapped in AppLayout with dark Left Sidebar)
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import RootLayout from './layouts/RootLayout';
import AppLayout from './layouts/AppLayout';

// Dynamic lazy-loaded pages for optimal route-level bundle splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FindSchemesPage = lazy(() => import('./pages/FindSchemesPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const SchemeDetailsPage = lazy(() => import('./pages/SchemeDetailsPage'));
const ChatAssistantPage = lazy(() => import('./pages/ChatAssistantPage'));
const SavedSchemesPage = lazy(() => import('./pages/SavedSchemesPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-8">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public and Guest-only Routes with Top Navbar & Footer */}
            <Route element={<RootLayout />}>
              <Route path="/" element={<LandingPage />} />
              
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>
              
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Protected Routes with Persistent Dark Sidebar Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/find-schemes" element={<FindSchemesPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/schemes/:id" element={<SchemeDetailsPage />} />
                <Route path="/chat" element={<ChatAssistantPage />} />
                <Route path="/saved-schemes" element={<SavedSchemesPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
