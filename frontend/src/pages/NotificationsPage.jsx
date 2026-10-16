/**
 * @file NotificationsPage.jsx
 * @description Citizen Notifications Page faithfully reproducing Screen 12 of the reference design.
 * 
 * Features:
 * - Screen 12 layout & design system:
 *   - Header: "Notifications" with subtitle "Stay updated with your applications"
 *   - Category filter pills: All, Applications, Schemes, Profile
 *   - Genuine empty & coming-soon state (strictly no fabricated mock notifications)
 *   - Live connection attempt to backend (gracefully falls back when API not present)
 *   - Feature highlight cards explaining upcoming automated notification channels:
 *     - Application Milestones & Verification Updates
 *     - Personalized Scheme Match Alerts
 *     - Government Deadline & Subsidy Reminders
 *   - Quick-action shortcuts to /applications, /find-schemes, and /profile
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  ArrowRight,
  RefreshCw,
  FileText,
  User,
  ShieldCheck,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if real backend notification API exists
  const checkNotifications = async () => {
    setIsRefreshing(true);
    try {
      // If notification API is added in the future:
      if (api.notifications && typeof api.notifications.list === 'function') {
        const res = await api.notifications.list();
        if (res.success && Array.isArray(res.data)) {
          setNotifications(res.data);
        } else {
          setNotifications([]);
        }
      } else {
        // Backend notification API does not exist currently
        // Per instruction: DO NOT fabricate fake notifications
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* =========================================================================
          PAGE HEADER (Screen 12 Blueprint)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Notifications
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              0 Unread
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Stay updated with your applications and new scheme releases.
          </p>
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={checkNotifications}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-xs font-semibold shadow-2xs"
            title="Check for new updates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Check for Updates</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CATEGORY FILTER PILLS (Screen 12 Theme)
         ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'All', label: 'All', count: 0 },
          { key: 'Applications', label: 'Applications', count: 0 },
          { key: 'Schemes', label: 'New Schemes', count: 0 },
          { key: 'Profile', label: 'Profile', count: 0 },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-800/60 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          PROPER EMPTY & COMING-SOON STATE
          (No fabricated notifications as instructed)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-2xs space-y-6">
        
        {/* Empty Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-xs">
          <Bell className="w-8 h-8 stroke-[1.8]" />
        </div>

        {/* Message */}
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            You're All Caught Up!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            There are no active notifications at the moment. When government welfare programs update your tracked applications or launch new matching benefits, you will receive real-time updates here.
          </p>
        </div>

        {/* Feature Highlights: How Notifications Work */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto pt-4 border-t border-slate-100">
          
          {/* Channel 1: Application Tracking */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Application Milestones
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Updates when your tracked applications move to Under Review, Approved, or Completed.
            </p>
          </div>

          {/* Channel 2: Matching Scheme Releases */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              New Scheme Alerts
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Timely alerts when new central or state schemes matching your citizen demographic are announced.
            </p>
          </div>

          {/* Channel 3: Citizen Profile Reminders */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Profile Recommendations
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Helpful reminders to keep your location, occupation, and category up-to-date for accurate eligibility.
            </p>
          </div>

        </div>

        {/* Navigation Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/applications"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-200 transition"
          >
            <span>View My Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/find-schemes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Discover Eligible Schemes</span>
          </Link>

          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Update Profile</span>
          </Link>
        </div>

      </div>

    </div>
  );
}
