/**
 * @file CompareModal.jsx
 * @description Side-by-Side Scheme Comparison Modal.
 * 
 * Allows citizens to compare the current scheme against any other scheme in the
 * 4,732-scheme catalog across eligibility criteria, benefits, and application methods.
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Scale, 
  Search, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function CompareModal({ isOpen, onClose, currentScheme }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [compareError, setCompareError] = useState('');

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Debounced search for 2nd scheme
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.schemes.search(searchQuery.trim(), { limit: 5 });
        const list = res.data || [];
        // Filter out current scheme from results
        setSearchResults(list.filter((s) => s.id !== currentScheme?.id));
      } catch (err) {
        console.error('Error searching schemes for comparison:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, currentScheme?.id]);

  // Fetch comparison matrix when a 2nd scheme is chosen
  useEffect(() => {
    if (!selectedScheme || !currentScheme) return;

    let isMounted = true;
    async function fetchComparison() {
      setIsLoadingComparison(true);
      setCompareError('');
      try {
        const res = await api.schemes.compare([currentScheme.id, selectedScheme.id]);
        if (isMounted) {
          setComparisonData(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setCompareError(err.message || 'Failed to generate scheme comparison.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingComparison(false);
        }
      }
    }

    fetchComparison();
    return () => { isMounted = false; };
  }, [selectedScheme, currentScheme]);

  if (!isOpen || !currentScheme) return null;

  const scheme1 = currentScheme;
  const scheme2 = selectedScheme;
  const matrix = comparisonData?.comparisonMatrix;

  function handleSelectScheme(scheme) {
    setSelectedScheme(scheme);
    setSearchQuery('');
    setSearchResults([]);
  }

  function handleResetScheme2() {
    setSelectedScheme(null);
    setComparisonData(null);
    setCompareError('');
    setSearchQuery('');
  }

  // Quick suggestions if no scheme selected yet
  const quickSuggestions = [
    { title: 'PM-KISAN (Kisan Samman Nidhi)', query: 'kisan' },
    { title: 'Post-Matric Scholarship', query: 'scholarship' },
    { title: 'Pradhan Mantri Awas Yojana', query: 'awas' },
    { title: 'Ayushman Bharat (PM-JAY)', query: 'ayushman' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Dialog Shell */}
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="compare-modal-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Compare Schemes Side-by-Side
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluate benefits, eligibility rules, and application procedures
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            aria-label="Close comparison modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Scheme Selector Header Bar */}
        <div className="px-5 sm:px-7 py-3.5 bg-slate-100/60 border-b border-slate-200/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center">
            
            {/* Scheme 1 Summary (Current Scheme) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="min-w-0 pr-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1">
                  Scheme 1 (Current)
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={scheme1.title}>
                  {scheme1.title}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {scheme1.ministry || scheme1.govt_tier || 'Official Scheme'}
                </p>
              </div>
            </div>

            {/* Scheme 2 Selector / Summary */}
            {scheme2 ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="min-w-0 pr-2">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 mb-1">
                    Scheme 2 (Selected)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={scheme2.title}>
                    {scheme2.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {scheme2.ministry || scheme2.govt_tier || 'Official Scheme'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetScheme2}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold shrink-0 transition"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search a second scheme to compare..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-2xs"
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                  )}
                </div>

                {/* Dropdown Results */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectScheme(item)}
                        className="w-full text-left p-3 hover:bg-emerald-50/70 transition flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{item.ministry || item.state || 'All India'}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600 shrink-0 flex items-center gap-1">
                          Select <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* STATE A: No Scheme 2 Selected */}
          {!scheme2 && (
            <div className="py-10 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Select a Scheme to Compare</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Type a scheme keyword above to instantly generate a side-by-side comparison across eligibility, benefits, and requirements.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="pt-2 text-left space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Quick Search Suggestions
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {quickSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSearchQuery(sug.query)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 text-xs text-slate-700 transition"
                    >
                      {sug.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE B: Loading Comparison Matrix */}
          {scheme2 && isLoadingComparison && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Generating side-by-side comparison matrix...</p>
              <p className="text-xs text-slate-400">Comparing criteria across 4,732 government records</p>
            </div>
          )}

          {/* STATE C: Error */}
          {scheme2 && compareError && !isLoadingComparison && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <p>{compareError}</p>
            </div>
          )}

          {/* STATE D: Side-by-Side Comparison Matrix Table */}
          {scheme2 && !isLoadingComparison && !compareError && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full border-collapse text-left text-xs">
                
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px] w-1/4 min-w-[140px]">
                      Comparison Parameter
                    </th>
                    <th className="py-3.5 px-4 font-bold text-emerald-900 text-xs w-[37.5%] min-w-[220px] bg-emerald-50/40 border-l border-slate-200">
                      {scheme1.title}
                    </th>
                    <th className="py-3.5 px-4 font-bold text-sky-900 text-xs w-[37.5%] min-w-[220px] bg-sky-50/40 border-l border-slate-200">
                      {scheme2.title}
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  
                  {/* Category & Tier */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/30">
                      Government Tier & Ministry
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <p className="font-semibold text-slate-900">{scheme1.govt_tier || 'Central'}</p>
                      <p className="text-[11px] text-slate-500">{scheme1.ministry || 'N/A'}</p>
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <p className="font-semibold text-slate-900">{scheme2.govt_tier || 'Central'}</p>
                      <p className="text-[11px] text-slate-500">{scheme2.ministry || 'N/A'}</p>
                    </td>
                  </tr>

                  {/* Primary Category */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/30">
                      Primary Category
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 font-medium text-slate-800">
                        {scheme1.primary_category || 'General Welfare'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 font-medium text-slate-800">
                        {scheme2.primary_category || 'General Welfare'}
                      </span>
                    </td>
                  </tr>

                  {/* State Coverage */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/30">
                      State / Territorial Coverage
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200 font-medium">
                      {Array.isArray(scheme1.state) ? scheme1.state.join(', ') : scheme1.state || 'All India'}
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200 font-medium">
                      {Array.isArray(scheme2.state) ? scheme2.state.join(', ') : scheme2.state || 'All India'}
                    </td>
                  </tr>

                  {/* Benefits */}
                  <tr className="hover:bg-slate-50/50 bg-emerald-50/10">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/30">
                      Benefits & Aid Offered
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      {Array.isArray(scheme1.benefits) ? (
                        <div className="flex flex-wrap gap-1">
                          {scheme1.benefits.map((b, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="line-clamp-3">{scheme1.benefits || 'Financial assistance'}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      {Array.isArray(scheme2.benefits) ? (
                        <div className="flex flex-wrap gap-1">
                          {scheme2.benefits.map((b, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-medium">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="line-clamp-3">{scheme2.benefits || 'Financial assistance'}</p>
                      )}
                    </td>
                  </tr>

                  {/* Age Limits */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/30">
                      Age Eligibility
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200 font-medium">
                      {scheme1.age_display || (scheme1.min_age ? `${scheme1.min_age} - ${scheme1.max_age || 'Above'}` : 'No Age Limit')}
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200 font-medium">
                      {scheme2.age_display || (scheme2.min_age ? `${scheme2.min_age} - ${scheme2.max_age || 'Above'}` : 'No Age Limit')}
                    </td>
                  </tr>

                  {/* Income Limit */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/30">
                      Income Limit
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200 font-medium">
                      {scheme1.income_limit_display || (scheme1.max_income ? `Up to ₹${Number(scheme1.max_income).toLocaleString()}` : 'No Income Ceiling')}
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200 font-medium">
                      {scheme2.income_limit_display || (scheme2.max_income ? `Up to ₹${Number(scheme2.max_income).toLocaleString()}` : 'No Income Ceiling')}
                    </td>
                  </tr>

                  {/* Gender & Caste */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/30">
                      Gender & Social Category
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <p><span className="text-slate-400">Gender:</span> <span className="font-semibold">{scheme1.gender || 'All'}</span></p>
                      <p><span className="text-slate-400">Caste:</span> <span className="font-semibold">{scheme1.caste_category || 'All'}</span></p>
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <p><span className="text-slate-400">Gender:</span> <span className="font-semibold">{scheme2.gender || 'All'}</span></p>
                      <p><span className="text-slate-400">Caste:</span> <span className="font-semibold">{scheme2.caste_category || 'All'}</span></p>
                    </td>
                  </tr>

                  {/* Occupation & Education */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/30">
                      Occupation & Education
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <p><span className="text-slate-400">Occupation:</span> <span className="font-semibold">{scheme1.occupation || 'Any'}</span></p>
                      <p><span className="text-slate-400">Education:</span> <span className="font-semibold">{scheme1.education || 'No Prerequisite'}</span></p>
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <p><span className="text-slate-400">Occupation:</span> <span className="font-semibold">{scheme2.occupation || 'Any'}</span></p>
                      <p><span className="text-slate-400">Education:</span> <span className="font-semibold">{scheme2.education || 'No Prerequisite'}</span></p>
                    </td>
                  </tr>

                  {/* Application Method */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/30">
                      Application Method
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                        scheme1.application_method === 'online'
                          ? 'bg-emerald-100 text-emerald-800'
                          : scheme1.application_method === 'offline'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {scheme1.application_method ? scheme1.application_method.toUpperCase() : 'NOT SPECIFIED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-l border-slate-200">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                        scheme2.application_method === 'online'
                          ? 'bg-emerald-100 text-emerald-800'
                          : scheme2.application_method === 'offline'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {scheme2.application_method ? scheme2.application_method.toUpperCase() : 'NOT SPECIFIED'}
                      </span>
                    </td>
                  </tr>

                  {/* Actions / View Scheme Link */}
                  <tr className="bg-slate-50/80">
                    <td className="py-4 px-4 font-bold text-slate-900 bg-slate-100/50">
                      Direct Scheme Actions
                    </td>
                    <td className="py-4 px-4 border-l border-slate-200">
                      <span className="text-slate-400 text-xs italic">Currently Viewing</span>
                    </td>
                    <td className="py-4 px-4 border-l border-slate-200">
                      <Link
                        to={`/schemes/${scheme2.id}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition"
                      >
                        <span>Open Scheme Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Comparing against official database records (4,732 schemes)
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
}
