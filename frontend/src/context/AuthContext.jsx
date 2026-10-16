/**
 * @file AuthContext.jsx
 * @description Authentication State Provider for Government Scheme Finder.
 * 
 * Manages Supabase Auth session token, user identity, database profile synchronization,
 * loading state, login, signup, and logout operations.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify session on initial mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const [meRes, profileRes] = await Promise.all([
          api.auth.getMe(),
          api.profile.get().catch(() => null),
        ]);

        if (!isMounted) return;

        if (meRes.success && meRes.user) {
          setUser(meRes.user);
          setToken(storedToken);
          if (profileRes && profileRes.success && profileRes.profile) {
            setProfile(profileRes.profile);
          } else if (meRes.user?.profile) {
            setProfile(meRes.user.profile);
          }
        } else {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        if (!isMounted) return;
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.session?.access_token) {
      const accessToken = res.session.access_token;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      setUser(res.user);
      if (res.user?.profile) {
        setProfile(res.user.profile);
      }

      // Fetch fresh profile from PostgreSQL profiles table
      try {
        const profileRes = await api.profile.get();
        if (profileRes.success && profileRes.profile) {
          setProfile(profileRes.profile);
        }
      } catch {
        // Fallback to user metadata
      }

      return res;
    }
    throw new Error(res.message || 'Login failed');
  }, []);

  const signup = useCallback(async (email, password, fullName) => {
    const res = await api.auth.signup({ email, password, fullName });
    if (res.success && res.session?.access_token) {
      const accessToken = res.session.access_token;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      setUser(res.user);
      if (res.user?.profile) {
        setProfile(res.user.profile);
      }

      try {
        const profileRes = await api.profile.get();
        if (profileRes.success && profileRes.profile) {
          setProfile(profileRes.profile);
        }
      } catch {
        // Fallback to user metadata
      }
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('token')) {
        await api.auth.logout().catch(() => {});
      }
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.profile.get();
      if (res.success && res.profile) {
        setProfile(res.profile);
      }
      return res;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      throw err;
    }
  }, []);

  const value = {
    user,
    profile,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    signup,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
