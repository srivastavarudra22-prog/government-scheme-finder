/**
 * @file ApplicationsPage.jsx
 * @description Citizen Application Tracking Page faithfully reproducing Screen 11 of the reference design.
 * 
 * Features:
 * - Direct integration with real backend API:
 *   - GET /api/applications
 *   - POST /api/applications
 *   - PATCH /api/applications/:id
 *   - DELETE /api/applications/:id
 * - Screen 11 layout & styling:
 *   - Header: "My Applications" with total count badge and "+ Track Application" CTA
 *   - Tracking vs Official Portal clear distinction banner
 *   - Status filter tabs: All, Under Review, Applied, Approved, Rejected, Completed, Interested
 *   - Application cards with status badges, Application Reference ID, Applied Date, Notes,
 *     "Apply Officially" external link, "Update Status / Notes", and "Delete"
 *   - Interactive Add Application modal with scheme picker
 *   - Interactive Edit Application modal (update status, reference number, notes, applied date)
 *   - Skeleton loading, error alert with retry, and empty state
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  ExternalLink,
  ArrowRight,
  Search,
  Trash2,
  Edit3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
  X,
  Info,
  Loader2,
  Sprout,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Building2,
  RefreshCw,
  Hash
} from 'lucide-react';
import { api } from '../services/api';
import { resolveApplicationRedirection } from '../utils/redirectionHelper';

const ALLOWED_STATUSES = [
  'Interested',
  'Not Applied',
  'Applied',
  'Under Review',
  'Approved',
  'Rejected',
  'Completed',
];

// Status badge styling map matching application theme
const STATUS_META = {
  'Interested': {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  'Not Applied': {
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
  },
  'Applied': {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  'Under Review': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  'Approved': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'Rejected': {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  'Completed': {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
  },
};

// Category icon helper matching Results & Saved Schemes
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

export default function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Core application data
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');

  // Add Application Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [candidateSchemes, setCandidateSchemes] = useState([]);
  const [schemeSearchTerm, setSchemeSearchTerm] = useState('');
  const [searchingSchemes, setSearchingSchemes] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [newStatus, setNewStatus] = useState('Applied');
  const [newReference, setNewReference] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAppliedAt, setNewAppliedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [addModalError, setAddModalError] = useState('');

  // Edit Application Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [editStatus, setEditStatus] = useState('Applied');
  const [editReference, setEditReference] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAppliedAt, setEditAppliedAt] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  // Action pending states
  const [deletingId, setDeletingId] = useState(null);

  // Fetch applications from real backend
  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.applications.list();
      if (res.success && Array.isArray(res.data)) {
        setApplications(res.data);
      } else {
        setApplications([]);
        if (res.message) setError(res.message);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError(err.message || 'Unable to load your applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Handle URL query ?addSchemeId=123
  useEffect(() => {
    const addSchemeId = searchParams.get('addSchemeId');
    if (addSchemeId) {
      setSelectedSchemeId(addSchemeId);
      setIsAddModalOpen(true);
      // Remove param from URL
      searchParams.delete('addSchemeId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Load candidate schemes when opening Add Modal
  const loadCandidateSchemes = async (query = '') => {
    setSearchingSchemes(true);
    try {
      if (query.trim()) {
        const searchRes = await api.schemes.search(query.trim(), { limit: 15 });
        if (searchRes.success && Array.isArray(searchRes.data)) {
          setCandidateSchemes(searchRes.data);
          return;
        }
      }

      // Default: fetch user's saved schemes first, then top schemes
      const [savedRes, listRes] = await Promise.all([
        api.savedSchemes.list().catch(() => ({ data: [] })),
        api.schemes.list({ limit: 15 }).catch(() => ({ data: [] })),
      ]);

      const list = [];
      const seen = new Set();

      if (savedRes.data) {
        savedRes.data.forEach((s) => {
          const item = s.scheme || s;
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id);
            list.push({ ...item, isSaved: true });
          }
        });
      }

      if (listRes.data) {
        listRes.data.forEach((item) => {
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id);
            list.push(item);
          }
        });
      }

      setCandidateSchemes(list);
    } catch (e) {
      console.warn('Could not load candidate schemes:', e);
    } finally {
      setSearchingSchemes(false);
    }
  };

  const handleOpenAddModal = () => {
    setAddModalError('');
    setIsAddModalOpen(true);
    loadCandidateSchemes();
  };

  // Submit New Application to POST /api/applications
  const handleCreateApplication = async (e) => {
    e.preventDefault();
    if (!selectedSchemeId) {
      setAddModalError('Please select a government scheme to track.');
      return;
    }

    setIsSubmittingNew(true);
    setAddModalError('');

    try {
      const payload = {
        scheme_id: parseInt(selectedSchemeId, 10),
        status: newStatus,
        application_reference: newReference.trim() || null,
        notes: newNotes.trim() || null,
        applied_at: newAppliedAt ? new Date(newAppliedAt).toISOString() : null,
      };

      const res = await api.applications.create(payload);

      if (res.success && res.data) {
        setApplications((prev) => [res.data, ...prev]);
        setIsAddModalOpen(false);
        // Reset form
        setSelectedSchemeId('');
        setNewReference('');
        setNewNotes('');
        setFeedbackNotice(`Tracking started for "${res.data.scheme?.title || 'Scheme'}".`);
        setTimeout(() => setFeedbackNotice(''), 4000);
      } else {
        setAddModalError(res.message || 'Failed to track application.');
      }
    } catch (err) {
      console.error('Error creating application:', err);
      setAddModalError(err.message || 'Error tracking application.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (app) => {
    setEditingApp(app);
    setEditStatus(app.status || 'Applied');
    setEditReference(app.application_reference || '');
    setEditNotes(app.notes || '');
    setEditAppliedAt(
      app.applied_at ? new Date(app.applied_at).toISOString().split('T')[0] : ''
    );
    setEditModalError('');
    setIsEditModalOpen(true);
  };

  // Submit Edit to PATCH /api/applications/:id
  const handleUpdateApplication = async (e) => {
    e.preventDefault();
    if (!editingApp) return;

    setIsSubmittingEdit(true);
    setEditModalError('');

    try {
      const payload = {
        status: editStatus,
        application_reference: editReference.trim() || null,
        notes: editNotes.trim() || null,
        applied_at: editAppliedAt ? new Date(editAppliedAt).toISOString() : null,
      };

      const res = await api.applications.update(editingApp.id, payload);

      if (res.success && res.data) {
        setApplications((prev) =>
          prev.map((app) => (app.id === editingApp.id ? res.data : app))
        );
        setIsEditModalOpen(false);
        setEditingApp(null);
        setFeedbackNotice(`Updated application status to "${res.data.status}".`);
        setTimeout(() => setFeedbackNotice(''), 4000);
      } else {
        setEditModalError(res.message || 'Failed to update application.');
      }
    } catch (err) {
      console.error('Error updating application:', err);
      setEditModalError(err.message || 'Error updating application.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete Application via DELETE /api/applications/:id
  const handleDeleteApplication = async (id, title) => {
    if (!window.confirm(`Are you sure you want to stop tracking your application for "${title}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.applications.delete(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setFeedbackNotice(`Application for "${title}" removed from tracker.`);
      setTimeout(() => setFeedbackNotice(''), 4000);
    } catch (err) {
      console.error('Failed to delete application:', err);
      alert(err.message || 'Failed to remove application.');
    } finally {
      setDeletingId(null);
    }
  };

  // Status counts for Screen 11 tabs
  const statusCounts = useMemo(() => {
    const counts = { All: applications.length };
    ALLOWED_STATUSES.forEach((s) => {
      counts[s] = applications.filter((a) => a.status === s).length;
    });
    return counts;
  }, [applications]);

  // Filtered applications by active status tab and search
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesTab =
        activeStatusTab === 'All' || app.status === activeStatusTab;
      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const title = (app.scheme?.title || '').toLowerCase();
      const ref = (app.application_reference || '').toLowerCase();
      const notes = (app.notes || '').toLowerCase();
      const ministry = (app.scheme?.ministry || '').toLowerCase();

      return title.includes(q) || ref.includes(q) || notes.includes(q) || ministry.includes(q);
    });
  }, [applications, activeStatusTab, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* =========================================================================
          PAGE HEADER (Screen 11 Blueprint)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Applications
            </h1>
            {!loading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {applications.length} Tracked
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Track your scheme applications, status updates, and reference numbers in one place.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchApplications}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs"
            title="Refresh applications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-200 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Track Application</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CRITICAL INFORMATION / DISCLAIMER BANNER
          Clearly distinguishes "Official Portal Submission" vs "Personal Tracking"
         ========================================================================= */}
      <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-sky-950 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sky-900">
            Application Tracking vs. Official Submission
          </p>
          <p className="text-sky-800 leading-relaxed text-xs">
            This dashboard is your <strong>personal tracker</strong> to organize your government applications, record acknowledgement reference IDs, and log progress notes. 
            Tracking an application here <strong>does not submit</strong> documents to government ministries. 
            To submit an official government application, use the <strong>"Apply Officially"</strong> button on each scheme to open the official government portal.
          </p>
        </div>
      </div>

      {/* =========================================================================
          FEEDBACK TOAST NOTICE
         ========================================================================= */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice('')}
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
            <p className="font-semibold text-rose-900">Failed to Load Applications</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
          <button
            onClick={fetchApplications}
            className="px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* =========================================================================
          STATUS TABS & SEARCH BAR (Screen 11 Blueprint)
         ========================================================================= */}
      {!loading && applications.length > 0 && (
        <div className="space-y-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['All', ...ALLOWED_STATUSES].map((tab) => {
              const count = statusCounts[tab] || 0;
              // Don't clutter with 0-count tabs except main ones
              if (tab !== 'All' && count === 0 && !['Applied', 'Under Review', 'Approved'].includes(tab)) {
                return null;
              }

              const isActive = activeStatusTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveStatusTab(tab)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-800/60 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search within tracked applications */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme title, reference number, or notes..."
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
                <div className="h-5 bg-slate-100 rounded w-24"></div>
              </div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        // EMPTY STATE: NO APPLICATIONS TRACKED YET
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <FileText className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            No Applications Tracked Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Keep all your government scheme applications organized in one place. Add reference numbers, monitor status updates, and keep notes on your progress.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-200 transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Track First Application</span>
            </button>
            <Link
              to="/find-schemes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            >
              <span>Discover Schemes to Apply</span>
            </Link>
          </div>
        </div>
      ) : filteredApplications.length === 0 ? (
        // EMPTY STATE: NO SEARCH/FILTER MATCHES
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Matching Applications</h3>
          <p className="text-xs text-slate-500 mt-1">
            No applications found matching "{searchQuery}" in category "{activeStatusTab}".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveStatusTab('All');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        // POPULATED APPLICATION CARDS (Screen 11 Blueprint)
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const scheme = app.scheme || {};
            const redirection = resolveApplicationRedirection(scheme);
            const catMeta = getCategoryMeta(scheme.primary_category);
            const CategoryIcon = catMeta.icon;
            const statusStyle = STATUS_META[app.status] || STATUS_META['Interested'];
            const isDeleting = deletingId === app.id;

            // Formatted applied date
            const appliedDate = app.applied_at
              ? new Date(app.applied_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : null;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
              >
                {/* Left: Category Emblem + Application Details */}
                <div className="flex items-start gap-4 flex-1">
                  
                  {/* Category Emblem */}
                  <div
                    className={`w-12 h-12 rounded-xl ${catMeta.bg} ${catMeta.text} border ${catMeta.border} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition`}
                  >
                    <CategoryIcon className="w-6 h-6 stroke-[2]" />
                  </div>

                  {/* Information Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    
                    {/* Header: Title & Status Badge */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to={`/schemes/${app.scheme_id}`}
                        className="text-base sm:text-lg font-bold text-slate-900 hover:text-emerald-600 transition"
                      >
                        {scheme.title || 'Government Scheme Application'}
                      </Link>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                        <span>{app.status}</span>
                      </span>

                      {scheme.govt_tier && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {scheme.govt_tier}
                        </span>
                      )}
                    </div>

                    {/* Reference ID & Applied Date line (Screen 11) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                      
                      {/* Application Reference ID */}
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span>Application ID:</span>
                        <strong className="text-slate-900 font-bold font-mono">
                          {app.application_reference || 'Not recorded'}
                        </strong>
                      </span>

                      {/* Applied Date */}
                      {appliedDate ? (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Applied on: {appliedDate}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Date not set</span>
                      )}

                    </div>

                    {/* Notes Box (if notes exist) */}
                    {app.notes && (
                      <div className="pt-1">
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 line-clamp-2">
                          <strong className="text-slate-700 font-semibold mr-1">Notes:</strong>
                          {app.notes}
                        </p>
                      </div>
                    )}

                  </div>
                </div>

                {/* Right: Actions Column (Screen 11) */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  
                  {/* Edit / Update Status Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(app)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-xs border border-slate-200 hover:border-emerald-300 transition"
                    title="Update application status or reference"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Update Status</span>
                  </button>

                  {/* Apply / Guide Button (if verified target URL exists) */}
                  {redirection.target_url && (
                    <a
                      href={redirection.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition"
                      title={redirection.button_text}
                    >
                      <span>{redirection.is_direct_portal ? 'Apply Officially' : 'View Guide'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteApplication(app.id, scheme.title || 'Scheme')}
                    disabled={isDeleting}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition"
                    title="Remove from tracking"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ADD APPLICATION MODAL
         ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Track New Application</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{addModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateApplication} className="space-y-4">
              
              {/* Scheme Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Government Scheme *
                </label>
                
                {/* Search input to filter schemes in dropdown */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={schemeSearchTerm}
                    onChange={(e) => {
                      setSchemeSearchTerm(e.target.value);
                      loadCandidateSchemes(e.target.value);
                    }}
                    placeholder="Search scheme name..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={selectedSchemeId}
                  onChange={(e) => setSelectedSchemeId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select a Scheme --</option>
                  {candidateSchemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} {s.isSaved ? '★ Bookmarked' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Choose from your bookmarked schemes or search all available programs.
                </p>
              </div>

              {/* Status Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Application Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ALLOWED_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Application Reference ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Application Reference ID (Optional)
                </label>
                <input
                  type="text"
                  value={newReference}
                  onChange={(e) => setNewReference(e.target.value)}
                  placeholder="e.g. ACK-2026-9812 / PM-APP-7721"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Government portal acknowledgement number or receipt code.
                </p>
              </div>

              {/* Applied Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Applied Date
                </label>
                <input
                  type="date"
                  value={newAppliedAt}
                  onChange={(e) => setNewAppliedAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Personal Notes (Optional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Add notes like documents submitted, office visited, or pending follow-ups..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition disabled:opacity-50"
                >
                  {isSubmittingNew ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Track Application</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT / UPDATE APPLICATION MODAL
         ========================================================================= */}
      {isEditModalOpen && editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Update Application</h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[280px]">
                    {editingApp.scheme?.title || 'Welfare Scheme'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{editModalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateApplication} className="space-y-4">
              
              {/* Status Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Update Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ALLOWED_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Application Reference ID
                </label>
                <input
                  type="text"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  placeholder="e.g. ACK-2026-9812"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Applied Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Applied Date
                </label>
                <input
                  type="date"
                  value={editAppliedAt}
                  onChange={(e) => setEditAppliedAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Personal Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Update notes or application milestone details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition disabled:opacity-50"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
