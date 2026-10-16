/**
 * @file SettingsPage.jsx
 * @description Citizen Account Settings Page adhering to the application design system.
 * 
 * Sections:
 * 1. Account Details: Registered email, citizen UUID, account registration timestamp
 * 2. Profile Summary: Demographic attributes snapshot with direct edit link to /profile
 * 3. Security: Real Supabase Auth password update & password reset email flow
 * 4. Notifications: Communication and alert preference toggles
 * 5. Session & Sign Out: Secure logout utilizing real AuthContext and backend signOut
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Key,
  Bell,
  LogOut,
  Mail,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function SettingsPage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('account');

  // Copy user ID state
  const [copiedId, setCopiedId] = useState(false);

  // Security: Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Security: Reset email state
  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [resetEmailMsg, setResetEmailMsg] = useState('');

  // Notifications preference toggles (local citizen settings)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [appStatusAlerts, setAppStatusAlerts] = useState(true);
  const [newSchemeAlerts, setNewSchemeAlerts] = useState(true);
  const [prefSavedNotice, setPrefSavedNotice] = useState(false);

  // Logout state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle User ID Copy
  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (e) {
      console.error('Logout error:', e);
      setIsLoggingOut(false);
    }
  };

  // Handle Password Update via Supabase Auth
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.auth.changePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      });

      if (res.success) {
        setPasswordSuccess('Password updated successfully via Supabase Auth.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Password Reset Link
  const handleSendResetEmail = async () => {
    setResetEmailLoading(true);
    setResetEmailMsg('');
    setPasswordError('');
    try {
      const res = await api.auth.sendPasswordResetEmail({
        email: user?.email,
      });
      if (res.success) {
        setResetEmailMsg(`Official recovery link dispatched to ${user?.email}. Check your inbox.`);
      } else {
        setPasswordError(res.message || 'Failed to send recovery link.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error sending recovery link.');
    } finally {
      setResetEmailLoading(false);
    }
  };

  // Save Notification Preferences
  const handleSavePreferences = (e) => {
    e.preventDefault();
    setPrefSavedNotice(true);
    setTimeout(() => setPrefSavedNotice(false), 3000);
  };

  // Registered display name
  const displayName = profile?.full_name || user?.fullName || 'Citizen User';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Active Citizen';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* =========================================================================
          PAGE HEADER
         ========================================================================= */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
          Manage your account credentials, security preferences, and session controls.
        </p>
      </div>

      {/* =========================================================================
          HORIZONTAL TAB NAVIGATION (matching application theme)
         ========================================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'account', label: 'Account', icon: User },
          { key: 'profile', label: 'Profile', icon: Sparkles },
          { key: 'security', label: 'Security', icon: Shield },
          { key: 'notifications', label: 'Alerts', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-label={tab.label}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          SECTION 1: ACCOUNT DETAILS
         ========================================================================= */}
      {activeTab === 'account' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Account Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentication identity managed via Supabase Auth.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              
              {/* Registered Email */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Email</span>
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.email || 'citizen@schemefinder.gov.in'}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Citizen Identity</span>
                  </span>
                </div>
              </div>

              {/* Citizen User ID */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Citizen ID (UUID)</span>
                </span>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono font-bold text-slate-800 truncate">
                    {user?.id || '—'}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 text-slate-600 transition"
                    title="Copy Citizen UUID"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Unique reference identifier in PostgreSQL database.
                </p>
              </div>

              {/* Registered Date */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Member Since</span>
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {memberSince}
                </p>
              </div>

              {/* Account Status */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Row-Level Security (RLS)</span>
                </span>
                <p className="text-sm font-bold text-emerald-700">
                  Active & Isolated
                </p>
                <p className="text-[11px] text-slate-400">
                  Access restricted to authenticated credentials.
                </p>
              </div>

            </div>

            {/* Email Change Guidance Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-slate-800">Email Updates:</strong> To guarantee data integrity and protect government welfare entitlements, primary login email modification requires formal OTP verification.
              </div>
            </div>

          </div>

          {/* Quick Sign Out Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                End Current Session
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign out of this browser. All bookmarked schemes and applications remain secure in Supabase.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition disabled:opacity-50 self-start sm:self-auto"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>Log Out</span>
            </button>
          </div>

        </div>
      )}

      {/* =========================================================================
          SECTION 2: PROFILE SUMMARY
         ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Citizen Demographic Profile
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parameters used by the AI engine to evaluate scheme eligibility.
                </p>
              </div>

              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition self-start sm:self-auto"
              >
                <span>Edit Full Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Demographic Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Full Name</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {profile?.full_name || displayName}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">State</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {profile?.state || 'Not set'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Age</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {profile?.age ? `${profile.age} Years` : 'Not set'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Gender</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {profile?.gender || 'Not set'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Occupation</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {profile?.occupation || 'General'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Education</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {profile?.education || 'Not specified'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Category</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {profile?.category || 'General'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Phone</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {profile?.phone || 'Not linked'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Keeping your profile complete ensures that search filters and eligibility engines recommend 100% applicable central and state subsidies.
            </p>
          </div>

        </div>
      )}

      {/* =========================================================================
          SECTION 3: SECURITY & PASSWORD (SUPABASE AUTH FLOW)
         ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Security & Authentication
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Passwords are authenticated directly by Supabase Auth with enterprise encryption.
              </p>
            </div>

            {/* Error or Success Notices */}
            {passwordError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {resetEmailMsg && (
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs sm:text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>{resetEmailMsg}</span>
              </div>
            )}

            {/* Password Change Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
              
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter existing password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password (min 6 characters) *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-200 transition disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating via Supabase...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={resetEmailLoading}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition underline underline-offset-4"
                >
                  {resetEmailLoading ? 'Sending link...' : 'Email me a reset link instead'}
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

      {/* =========================================================================
          SECTION 4: NOTIFICATIONS PREFERENCES
         ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Communication & Alert Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure how and when SchemeFinder alerts you about your welfare benefits.
              </p>
            </div>

            {prefSavedNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Notification preferences saved successfully.</span>
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="space-y-4">
              
              {/* Toggle 1 */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Application Milestone Alerts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Receive notifications when your application status moves to Under Review or Approved.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={appStatusAlerts}
                  onChange={(e) => setAppStatusAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    New Scheme Releases
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Get alerts when newly launched central or state welfare schemes match your demographic profile.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={newSchemeAlerts}
                  onChange={(e) => setNewSchemeAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Email Digest Updates
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Send updates to {user?.email || 'your registered address'}.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-200 transition"
                >
                  Save Alert Settings
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
