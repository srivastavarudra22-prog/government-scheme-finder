/**
 * @file GuestRoute.jsx
 * @description Route guard for guest-only pages (/login, /signup).
 * 
 * If an authenticated citizen visits a guest-only route, redirects them to /dashboard.
 * Displays a minimal loading placeholder while session verification is in progress.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}
