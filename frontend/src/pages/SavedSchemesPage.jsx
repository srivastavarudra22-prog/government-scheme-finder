/**
 * @file SavedSchemesPage.jsx
 * @description Authenticated Saved Schemes Page connected to real backend Supabase database.
 * 
 * Features:
 * - Real backend integration:
 *   - GET /api/saved-schemes
 *   - DELETE /api/saved-schemes/:schemeId
 *   - POST /api/saved-schemes/:schemeId (via SchemeDetailsPage / ResultsPage)
 * - Strict Supabase authenticated user association (no permanent localStorage)
 * - Visual design matching application theme:
 *   - Header with total count badge
 *   - In-page search and category filter pills
 *   - Skeleton loading state
 *   - Error alert with retry
 *   - Polished empty state with CTAs to /find-schemes and /results
 *   - Scheme card design with category emblems, metadata badges, benefits highlights,
 *     "View Details", "Apply Officially", and "Remove Scheme" actions
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  Search,
  Trash2,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sprout,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Building2,
  RefreshCw,
  Loader2,
  ShieldCheck,
  MapPin,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { resolveApplicationRedirection } from '../utils/redirectionHelper';

// Category color and icon mapping matching ResultsPage theme
function getCategoryMeta(categoryName) {
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('agri') || cat.includes('farm') || cat.includes('kisan')) {
    return { icon: Sprout, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  }
  if (cat.includes('edu') || cat.includes('student') || cat.includes('scholarship')) {
    return { icon: GraduationCap, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
  }
  if (cat.includes('health') || cat.includes('medic') || cat.includes('ayushman') || cat.includes('bima')) {
    return { icon: HeartPulse, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }
  if (cat.includes('business') || cat.includes('entrepreneur') || cat.includes('loan') || cat.includes('finance')) {
    return { icon: Briefcase, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  }
  return { icon: Building2, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
}

export default function SavedSchemesPage() {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deletingId, setDeletingId] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  // Fetch real saved schemes from backend API
  const fetchSavedSchemes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.savedSchemes.list();
      if (res.success && Array.isArray(res.data)) {
        setSavedItems(res.data);
      } else {
        setSavedItems([]);
        if (res.message) setError(res.message);
      }
    } catch (err) {
      console.error('Failed to load saved schemes:', err);
      setError(err.message || 'Unable to retrieve your saved schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedSchemes();
  }, []);

  // Remove saved scheme via DELETE /api/saved-schemes/:schemeId
  const handleRemoveScheme = async (schemeId, schemeTitle) => {
    if (deletingId) return;
    setDeletingId(schemeId);
    try {
      await api.savedSchemes.remove(schemeId);
      // Remove from local state
      setSavedItems((prev) => prev.filter((item) => item.scheme_id !== schemeId));
      setActionNotice(`Removed "${schemeTitle || 'Scheme'}" from your saved list.`);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err) {
      console.error('Failed to remove saved scheme:', err);
      alert(err.message || 'Failed to remove scheme from your saved list.');
    } finally {
      setDeletingId(null);
    }
  };

  // Derive unique categories for filter pills
  const categories = useMemo(() => {
    const set = new Set();
    savedItems.forEach((item) => {
      if (item.scheme?.primary_category) {
        set.add(item.scheme.primary_category);
      }
    });
    return ['All', ...Array.from(set)];
  }, [savedItems]);

  // Filter items by local search query and category
  const filteredItems = useMemo(() => {
    return savedItems.filter((item) => {
      const scheme = item.scheme || {};
      const matchesCategory =
        selectedCategory === 'All' || scheme.primary_category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const title = (scheme.title || '').toLowerCase();
      const desc = (scheme.description || '').toLowerCase();
      const ministry = (scheme.ministry || '').toLowerCase();
      const state = Array.isArray(scheme.state)
        ? scheme.state.join(' ').toLowerCase()
        : (scheme.state || '').toLowerCase();

      return title.includes(q) || desc.includes(q) || ministry.includes(q) || state.includes(q);
    });
  }, [savedItems, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* =========================================================================
          PAGE HEADER
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Saved Schemes
            </h1>
            {!loading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {savedItems.length} {savedItems.length === 1 ? 'Scheme' : 'Schemes'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Your bookmarked government programs, ready for quick review and official application.
          </p>
        </div>

        {/* Find More Schemes CTA Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchSavedSchemes}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs"
            title="Refresh saved schemes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <Link
            to="/find-schemes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-200 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover More Schemes</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          ACTION NOTICE / TOAST
         ========================================================================= */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice('')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          ERROR ALERT BANNER
         ========================================================================= */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Failed to Load Saved Schemes</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
          <button
            onClick={fetchSavedSchemes}
            className="px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* =========================================================================
          SEARCH & FILTER TOOLBAR (When saved schemes exist)
         ========================================================================= */}
      {!loading && savedItems.length > 0 && (
        <div className="space-y-3">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your saved schemes by title, ministry, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          CONTENT LIST / EMPTY / SKELETON STATES
         ========================================================================= */}
      {loading ? (
        // SKELETON LOADERS
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                <div className="h-5 bg-slate-100 rounded w-20"></div>
              </div>
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : savedItems.length === 0 ? (
        // EMPTY STATE: NO SAVED SCHEMES YET
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Bookmark className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            No Saved Schemes Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            You haven't bookmarked any government schemes. Complete the eligibility check or search our scheme directory to find programs tailored to your profile.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/find-schemes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-200 transition"
            >
              <span>Check Eligibility Wizard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/results"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            >
              <span>Browse All Schemes</span>
            </Link>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        // EMPTY STATE: SEARCH FILTER HAS NO MATCHES
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Matching Saved Schemes</h3>
          <p className="text-xs text-slate-500 mt-1">
            No saved schemes matched "{searchQuery}". Try a different keyword or reset filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        // POPULATED SAVED SCHEMES CARDS
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const scheme = item.scheme || {};
            const schemeId = item.scheme_id || scheme.id;
            const redirection = resolveApplicationRedirection(scheme);
            const catMeta = getCategoryMeta(scheme.primary_category);
            const Icon = catMeta.icon;
            const isDeleting = deletingId === schemeId;

            // Saved timestamp formatting
            const savedDate = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : null;

            // Extract benefits string
            const benefitsText = scheme.benefits
              ? typeof scheme.benefits === 'string'
                ? scheme.benefits
                : JSON.stringify(scheme.benefits)
              : scheme.income_limit_display
              ? `Income criteria: ${scheme.income_limit_display}`
              : 'Financial assistance, grants, or direct benefit transfer available.';

            // Format state string
            const stateString = Array.isArray(scheme.state)
              ? scheme.state.join(', ')
              : scheme.state || 'All India (Central)';

            return (
              <div
                key={item.id || schemeId}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
              >
                {/* Left: Category Emblem + Scheme Details */}
                <div className="flex items-start gap-4 flex-1">
                  
                  {/* Category Emblem */}
                  <div
                    className={`w-12 h-12 rounded-xl ${catMeta.bg} ${catMeta.text} border ${catMeta.border} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition`}
                  >
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>

                  {/* Scheme Information */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    
                    {/* Title and Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/schemes/${schemeId}`}
                        className="text-base sm:text-lg font-bold text-slate-900 hover:text-emerald-600 transition"
                      >
                        {scheme.title || 'Government Welfare Scheme'}
                      </Link>

                      {scheme.govt_tier && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {scheme.govt_tier}
                        </span>
                      )}

                      {scheme.primary_category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {scheme.primary_category}
                        </span>
                      )}
                    </div>

                    {/* Ministry / Beneficiaries Line */}
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                      {scheme.ministry || scheme.beneficiaries || 'Administered by Government of India'}
                    </p>

                    {/* Benefits Highlight */}
                    <div className="pt-1 flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1 line-clamp-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Benefits: {benefitsText}</span>
                      </span>

                      {/* State Coverage */}
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{stateString}</span>
                      </span>

                      {/* Saved Timestamp */}
                      {savedDate && (
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Saved on {savedDate}</span>
                        </span>
                      )}
                    </div>

                  </div>
                </div>

                {/* Right: Actions (View Details, Apply Officially, Remove) */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  
                  {/* View Details Button */}
                  <Link
                    to={`/schemes/${schemeId}`}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-xs border border-slate-200 hover:border-emerald-300 transition"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {/* Apply / Guide Button (if verified target URL exists) */}
                  {redirection.target_url && (
                    <a
                      href={redirection.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition"
                      title={redirection.button_text}
                    >
                      <span>{redirection.is_direct_portal ? 'Apply' : 'Guide'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Remove Saved Scheme Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveScheme(schemeId, scheme.title)}
                    disabled={isDeleting}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition flex items-center gap-1 text-xs font-semibold"
                    title="Remove from saved schemes"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Remove</span>
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
