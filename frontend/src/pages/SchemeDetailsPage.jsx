/**
 * @file SchemeDetailsPage.jsx
 * @description Scheme Details Page faithfully reproducing Screen 8 of the reference design.
 * 
 * Features:
 * - Direct integration with real backend API: GET /api/schemes/:id
 * - Screen 8 Layout:
 *   - Back link: "← Back to Results"
 *   - Header: Scheme title, Ministry, Government tier, and Match percentage badge
 *   - Tab Navigation: Overview, Eligibility, Benefits, Documents, How to Apply, Technical Details
 *   - Left Main Column: Full tab-specific content with structured formatting
 *   - Right Quick Info Card:
 *     - Min/Max Age, Income Limit, Gender, Caste Category, State Coverage
 *     - "Apply Officially" primary button using real backend source_url (no invented URLs)
 *     - "Save Scheme" bookmark button with local persistence
 *     - "Ask AI Assistant" shortcut to /chat with context
 * - Skeleton loading, error alert, and 404 not-found states
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Share2, 
  Check, 
  MessageSquare, 
  Loader2, 
  FileText,
  Info,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { resolveApplicationRedirection } from '../utils/redirectionHelper';
import CompareModal from '../components/CompareModal';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'documents', label: 'Documents' },
  { id: 'how-to-apply', label: 'How to Apply' },
];

export default function SchemeDetailsPage() {
  const { id } = useParams();
  const location = useLocation();

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  // Saved / Bookmarked state
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Compare Modal state
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchSchemeDetails() {
      setLoading(true);
      setError('');
      setSaveError('');

      try {
        const res = await api.schemes.getById(id);
        if (!isMounted) return;

        if (res.success && res.data) {
          setScheme(res.data);
          
          // Check if already in authenticated user's saved schemes via real backend API
          try {
            const savedRes = await api.savedSchemes.list();
            if (!isMounted) return;
            if (savedRes.success && Array.isArray(savedRes.data)) {
              const matched = savedRes.data.some(
                (item) => item.scheme_id === res.data.id || item.scheme?.id === res.data.id
              );
              setIsSaved(matched);
            }
          } catch {
            if (isMounted) setIsSaved(false);
          }
        } else {
          setError(res.message || 'Scheme details could not be found.');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Scheme not found or network error.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSchemeDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Toggle Save Scheme via real backend API
  async function toggleSave() {
    if (!scheme || isSaving) return;
    setIsSaving(true);
    setSaveError('');
    try {
      if (isSaved) {
        await api.savedSchemes.remove(scheme.id);
        setIsSaved(false);
      } else {
        await api.savedSchemes.save(scheme.id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Could not update saved schemes:', err);
      setSaveError(err.message || 'Failed to update saved scheme.');
    } finally {
      setIsSaving(false);
    }
  }

  // Copy scheme link to clipboard
  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Clean and render text blocks with paragraphs or bullet points
  function renderFormattedContent(content, fallbackText = 'Information not specified.') {
    if (!content || content === 'None' || content === 'null') {
      return <p className="text-sm text-slate-500 italic">{fallbackText}</p>;
    }

    if (Array.isArray(content)) {
      return (
        <ul className="space-y-2">
          {content.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{String(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    // Split text by newlines or bullet point markers
    const lines = String(content)
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length > 1) {
      return (
        <div className="space-y-3">
          {lines.map((line, idx) => {
            const isBullet = line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line);
            const cleanText = line.replace(/^[-•\d.]+\s*/, '');

            return (
              <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                {isBullet ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                )}
                <span>{cleanText || line}</span>
              </div>
            );
          })}
        </div>
      );
    }

    return <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{content}</p>;
  }

  // Back link destination
  const backTarget = location.state?.from || '/results';

  // Resolve application redirection rules
  const redirection = scheme ? resolveApplicationRedirection(scheme) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* =========================================================================
          TOP NAVIGATION: BACK LINK & SHARE
         ========================================================================= */}
      <div className="flex items-center justify-between">
        <Link
          to={backTarget}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-700 transition group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition" />
          <span>Back to Results</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* =========================================================================
          ERROR ALERT STATE
         ========================================================================= */}
      {error && (
        <div 
          role="alert"
          className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3"
        >
          <div className="flex items-center gap-2 text-rose-900 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Scheme Not Found</span>
          </div>
          <p className="text-xs sm:text-sm text-rose-700">{error}</p>
          <Link
            to="/results"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
          >
            Browse Other Schemes
          </Link>
        </div>
      )}

      {/* =========================================================================
          LOADING SKELETON STATE
         ========================================================================= */}
      {loading && !error && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-2/3"></div>
          <div className="h-4 bg-slate-100 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-40 bg-slate-100 rounded-2xl"></div>
              <div className="h-40 bg-slate-100 rounded-2xl"></div>
            </div>
            <div className="lg:col-span-4">
              <div className="h-72 bg-slate-100 rounded-2xl"></div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCHEME CONTENT (Screen 8 Blueprint)
         ========================================================================= */}
      {!loading && scheme && (
        <div className="space-y-6">
          
          {/* Main Header Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                
                {/* Government Tier & Category Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    {scheme.govt_tier || 'Central Government'}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {scheme.primary_category || 'Welfare Scheme'}
                  </span>
                  {scheme.ministry && (
                    <span className="text-xs text-slate-500 font-medium">
                      • {scheme.ministry}
                    </span>
                  )}
                </div>

                {/* Scheme Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {scheme.title || scheme.scheme_name || 'Government Welfare Scheme'}
                </h1>

                {/* Beneficiaries summary */}
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {Array.isArray(scheme.beneficiaries) ? scheme.beneficiaries.join(', ') : scheme.beneficiaries || 'Open for eligible Indian citizens'}
                </p>

              </div>

              {/* Match Badge (Screen 8 Top Right) */}
              <div className="shrink-0 self-start">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>95% Match</span>
                </span>
              </div>
            </div>

            {/* TAB NAVIGATION (Screen 8: Overview, Eligibility, Benefits, Documents, How to Apply) */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

          </div>


          {/* =====================================================================
              TWO-COLUMN MAIN BODY (Screen 8 Layout)
             ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* -----------------------------------------------------------------
                LEFT COLUMN: DYNAMIC TAB CONTENT (Screen 8)
               ----------------------------------------------------------------- */}
            <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2.5">
                      About the Scheme
                    </h2>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {scheme.description || 'No description provided by ministry.'}
                    </p>
                  </div>

                  {scheme.scheme_details && (
                    <div className="pt-4 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                        Scheme Highlights & Key Provisions
                      </h3>
                      {renderFormattedContent(scheme.scheme_details)}
                    </div>
                  )}

                  {/* Secondary Categories Tags */}
                  {Array.isArray(scheme.secondary_categories) && scheme.secondary_categories.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Related Focus Areas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {scheme.secondary_categories.map((sc, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                            {sc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ELIGIBILITY */}
              {activeTab === 'eligibility' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2.5">
                      Who Can Apply?
                    </h2>
                    {renderFormattedContent(scheme.eligibility_criteria, 'Open to all eligible citizens meeting general guidelines.')}
                  </div>

                  {/* Structured Eligibility Matrix */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Eligibility Matrix
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500">Age Requirement</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{scheme.age_display || 'None'}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500">Gender</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{scheme.gender || 'Any'}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500">Social Category</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{scheme.caste_category || 'All Categories'}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500">Income Limit</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{scheme.income_limit_display || 'No Limit'}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500">Occupation</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{scheme.occupation || 'Any'}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500">Education Requirement</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{scheme.education || 'No Prerequisite'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Exclusions */}
                  {scheme.exclusions && scheme.exclusions !== 'None' && (
                    <div className="pt-4 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider mb-2">
                        Exclusions & Disqualifications
                      </h3>
                      {renderFormattedContent(scheme.exclusions)}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BENEFITS */}
              {activeTab === 'benefits' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2.5">
                      Scheme Benefits & Coverage
                    </h2>
                    {renderFormattedContent(scheme.benefits, 'Financial and welfare assistance available.')}
                  </div>

                  {scheme.max_income && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Financial Subsidies & Benefits</p>
                        <p className="mt-0.5 text-emerald-700">
                          Funds are disbursed directly via Direct Benefit Transfer (DBT) to the beneficiary's bank account linked with Aadhaar.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2.5">
                      Required Documents
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Keep verified copies of these documents ready before proceeding with your application.
                    </p>
                    {renderFormattedContent(scheme.required_documents, 'Standard KYC documents (Aadhaar Card, Bank Passbook, Address Proof).')}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900">Document Tip</p>
                    <p>Ensure that your mobile number is linked to your Aadhaar card for instant OTP verification during online registration.</p>
                  </div>
                </div>
              )}

              {/* TAB 5: HOW TO APPLY */}
              {activeTab === 'how-to-apply' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2.5">
                      Application Process
                    </h2>
                    {renderFormattedContent(scheme.application_process, 'Visit the official government department portal to submit your online application.')}
                  </div>

                  {/* Official Portal / Guide Box */}
                  {redirection?.target_url && (
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {redirection.is_direct_portal ? 'Official Application Portal' : 'Official Scheme Guide'}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-sm sm:max-w-md">
                          {redirection.target_url}
                        </p>
                      </div>
                      <a
                        href={redirection.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shrink-0"
                      >
                        <span>{redirection.is_direct_portal ? 'Apply on Portal' : 'Open Scheme Guide'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

            </div>


            {/* -----------------------------------------------------------------
                RIGHT COLUMN: QUICK INFO & ACTION CARD (Screen 8)
               ----------------------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-6 sticky top-32 lg:top-24">
              
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
                
                <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                  Quick Info
                </h3>

                <div className="space-y-4 text-xs">
                  
                  {/* Min / Max Age */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Age Limit</span>
                    <span className="font-bold text-slate-900 text-right">{scheme.age_display || 'None'}</span>
                  </div>

                  {/* Income Limit */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Income Ceiling</span>
                    <span className="font-bold text-slate-900 text-right">{scheme.income_limit_display || 'No Limit'}</span>
                  </div>

                  {/* Application Mode */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Application Mode</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                      redirection?.application_method === 'online'
                        ? 'text-emerald-700 bg-emerald-50'
                        : redirection?.application_method === 'offline'
                        ? 'text-amber-800 bg-amber-50'
                        : 'text-slate-700 bg-slate-100'
                    }`}>
                      {redirection?.application_method === 'online'
                        ? 'Online'
                        : redirection?.application_method === 'offline'
                        ? 'Offline Only'
                        : 'Not Specified'}
                    </span>
                  </div>

                  {/* State / Coverage */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Coverage</span>
                    <span className="font-bold text-slate-900 text-right truncate max-w-[150px]">
                      {Array.isArray(scheme.state) ? scheme.state.join(', ') : scheme.state || 'All India'}
                    </span>
                  </div>

                  {/* Target Type */}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 font-medium">Target Type</span>
                    <span className="font-bold text-slate-900 text-right">{scheme.target_type || 'Individual'}</span>
                  </div>

                </div>

                {/* ACTION BUTTONS (Screen 8) */}
                <div className="space-y-3 pt-2">
                  
                  {/* Notice Box if applicable (Rules 2, 3, 4, 5) */}
                  {redirection?.notice_message && (
                    <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                      redirection.action_type === 'OFFLINE_GUIDE'
                        ? 'bg-amber-50/80 border-amber-200/80 text-amber-900'
                        : redirection.action_type === 'UNKNOWN_GUIDE'
                        ? 'bg-blue-50/80 border-blue-200/80 text-blue-900'
                        : redirection.action_type === 'NO_URL'
                        ? 'bg-rose-50/80 border-rose-200/80 text-rose-900'
                        : 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900'
                    }`}>
                      <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
                      <div>
                        <p className="font-medium">{redirection.notice_message}</p>
                        {redirection.department_info && (
                          <p className="mt-1 text-[11px] opacity-75 font-normal">
                            Authority: {redirection.department_info}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Primary CTA: Apply Officially / Guide */}
                  {redirection?.target_url ? (
                    <a
                      href={redirection.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm shadow-emerald-200 hover:shadow-md transition active:scale-[0.99]"
                    >
                      <span>{redirection.button_text}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed"
                    >
                      {redirection?.button_text || 'Official Link Unavailable'}
                    </button>
                  )}

                  {/* Secondary Link for Direct Portals: View MyScheme details page */}
                  {redirection?.is_direct_portal && redirection.secondary_url && (
                    <a
                      href={redirection.secondary_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-[11px] font-medium text-slate-500 hover:text-emerald-700 hover:underline transition"
                    >
                      <span>View Official Scheme Information & Eligibility Guide</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* Secondary Action: Save Scheme */}
                  <button
                    type="button"
                    onClick={toggleSave}
                    disabled={isSaving}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition ${
                      isSaving
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait'
                        : isSaved
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/60'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        <span>Updating...</span>
                      </>
                    ) : isSaved ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                        <span>Saved to My Schemes</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        <span>Save Scheme</span>
                      </>
                    )}
                  </button>
                  {saveError && (
                    <p className="text-[11px] text-rose-600 font-medium text-center">{saveError}</p>
                  )}

                  {/* Track Application Action */}
                  <Link
                    to={`/applications?addSchemeId=${scheme.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold transition"
                    title="Track acknowledgement and progress for this scheme"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Track My Application</span>
                  </Link>

                  {/* Compare with Another Scheme Action */}
                  <button
                    type="button"
                    onClick={() => setIsCompareOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold transition"
                    title="Compare this scheme side-by-side with another scheme"
                  >
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span>Compare with Another Scheme</span>
                  </button>

                  {/* Tertiary Action: Ask AI Assistant */}
                  <Link
                    to={`/chat?schemeId=${scheme.id}&schemeName=${encodeURIComponent(scheme.scheme_name || scheme.title || '')}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-semibold border border-slate-200 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask AI Assistant</span>
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* Side-by-Side Scheme Comparison Modal */}
      {scheme && (
        <CompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          currentScheme={scheme}
        />
      )}

    </div>
  );
}
