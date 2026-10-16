/**
 * @file ProfilePage.jsx
 * @description Citizen Profile Management Page faithfully reproducing Screen 5 of the reference design.
 * 
 * Features:
 * - Direct connection to GET /api/profile and PATCH /api/profile
 * - Database is the single source of truth
 * - Fields: Full Name, Email (read-only), Phone, State, Gender, Age, Occupation, Education, Category
 * - Read-only Email field with security badge (managed by Supabase Auth)
 * - Structured sections matching Screen 5: Personal Information, Location & Contact, Education & Occupation
 * - Client-side validation: Full Name required, Age bounds (0-125), phone format
 * - Save changes with animated loading indicator
 * - Cancel changes reverting to current database values
 * - Success banner and error alert banners
 * - Live profile completion indicator
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Save, 
  RotateCcw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Comprehensive list of Indian States and Union Territories for standardized filtering
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Transgender',
  'Prefer not to say',
];

const CATEGORY_OPTIONS = [
  'General',
  'OBC (Other Backward Class)',
  'SC (Scheduled Caste)',
  'ST (Scheduled Tribe)',
  'EWS (Economically Weaker Section)',
];

const EDUCATION_OPTIONS = [
  'Below 10th',
  '10th Pass (Matriculation)',
  '12th Pass (Higher Secondary)',
  'Diploma / ITI',
  'Graduate / Bachelor\'s Degree',
  'Post Graduate / Master\'s Degree',
  'Doctorate / PhD',
  'Other',
];

const OCCUPATION_OPTIONS = [
  'Student',
  'Farmer / Agriculture',
  'Daily Wage Worker / Laborer',
  'Self-Employed / Business Owner',
  'Private Sector Employee',
  'Government / Public Sector Employee',
  'Unemployed / Job Seeker',
  'Homemaker',
  'Retired / Senior Citizen',
  'Other',
];

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    state: '',
    gender: '',
    age: '',
    occupation: '',
    education: '',
    category: '',
  });

  const [initialData, setInitialData] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch verified profile from database on initial mount
  useEffect(() => {
    let isMounted = true;

    async function loadCitizenProfile() {
      setIsFetching(true);
      try {
        const res = await api.profile.get();
        if (isMounted && res.success && res.profile) {
          const p = res.profile;
          const loaded = {
            fullName: p.full_name || user?.fullName || '',
            phone: p.phone || '',
            state: p.state || '',
            gender: p.gender || '',
            age: p.age !== null && p.age !== undefined ? String(p.age) : '',
            occupation: p.occupation || '',
            education: p.education || '',
            category: p.category || '',
          };
          setFormData(loaded);
          setInitialData(loaded);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to retrieve profile from database.');
        }
      } finally {
        if (isMounted) setIsFetching(false);
      }
    }

    loadCitizenProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle form field change
  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage('');
    setErrorMessage('');
  }

  // Check if form has unsaved modifications
  const hasChanges = initialData
    ? Object.keys(formData).some((key) => formData[key] !== initialData[key])
    : false;

  // Cancel / revert changes back to database values
  function handleCancel() {
    if (initialData) {
      setFormData(initialData);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }

  // Client-side validation
  function validate() {
    if (!formData.fullName.trim()) {
      return 'Full Name is required.';
    }

    if (formData.age !== '') {
      const parsedAge = parseInt(formData.age, 10);
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        return 'Please enter a valid age between 1 and 120.';
      }
    }

    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.trim().replace(/[\s-]/g, '');
      if (!/^\+?[0-9]{10,13}$/.test(cleanPhone)) {
        return 'Please enter a valid phone number (10 digits).';
      }
    }

    return null;
  }

  // Save changes via PATCH /api/profile
  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim() || null,
        state: formData.state || null,
        gender: formData.gender || null,
        age: formData.age !== '' ? parseInt(formData.age, 10) : null,
        occupation: formData.occupation || null,
        education: formData.education || null,
        category: formData.category || null,
      };

      const res = await api.profile.update(payload);
      if (res.success && res.profile) {
        const p = res.profile;
        const updated = {
          fullName: p.full_name || '',
          phone: p.phone || '',
          state: p.state || '',
          gender: p.gender || '',
          age: p.age !== null && p.age !== undefined ? String(p.age) : '',
          occupation: p.occupation || '',
          education: p.education || '',
          category: p.category || '',
        };
        setFormData(updated);
        setInitialData(updated);
        setSuccessMessage('Profile updated successfully! Scheme recommendations updated.');
        await refreshProfile();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // Calculate profile completion percentage
  const profileFields = [
    formData.fullName,
    user?.email,
    formData.phone,
    formData.state,
    formData.gender,
    formData.age,
    formData.occupation,
    formData.education,
    formData.category,
  ];
  const filledCount = profileFields.filter(Boolean).length;
  const completionPercentage = Math.round((filledCount / profileFields.length) * 100);

  // User initials
  const initials = (formData.fullName || user?.email || 'Citizen')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* =========================================================================
          PAGE HEADER (Screen 5 Blueprint)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Update your information to get better scheme recommendations
          </p>
        </div>

        {/* Profile Completion Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            {completionPercentage}%
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-900">Profile Strength</p>
            <p className="text-[10px] text-slate-500">
              {completionPercentage === 100 ? 'Fully Completed' : 'Recommendations Active'}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CITIZEN IDENTITY CARD
         ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-sm shrink-0">
          {initials || 'C'}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {formData.fullName || 'Citizen Account'}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 w-fit mx-auto sm:mx-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Account</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {user?.email || 'citizen@example.com'}
          </p>
          <p className="text-xs text-slate-400 pt-1">
            {formData.state ? `Resident of ${formData.state}` : 'State not selected'} • {formData.occupation || 'Occupation not set'}
          </p>
        </div>
      </div>

      {/* =========================================================================
          ALERTS (Success & Error Messages)
         ========================================================================= */}
      {successMessage && (
        <div 
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Changes Saved</p>
            <p className="mt-0.5 text-emerald-700">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div 
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-900">Update Error</p>
            <p className="mt-0.5 text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROFILE FORM (Screen 5 Blueprint)
         ========================================================================= */}
      {isFetching ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200/80 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-600">Loading citizen profile from database...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* -----------------------------------------------------------------
                SECTION 1: PERSONAL INFORMATION (Screen 5)
               ----------------------------------------------------------------- */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    required
                  />
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="age" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    placeholder="e.g. 21"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="">Select Gender</option>
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Category (Caste / Reservation) */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label htmlFor="category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category (Caste / Social Category)
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="">Select Category</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used to match caste-based welfare schemes and quotas.
                  </p>
                </div>

              </div>
            </div>

            {/* -----------------------------------------------------------------
                SECTION 2: LOCATION & CONTACT DETAILS (Screen 5)
               ----------------------------------------------------------------- */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Location & Contact Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                
                {/* Email (Read-Only) */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                      Email Address
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Auth Verified</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      readOnly
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed select-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tied to Supabase Auth credentials.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    State / Union Territory
                  </label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* -----------------------------------------------------------------
                SECTION 3: EDUCATION & OCCUPATION (Screen 5)
               ----------------------------------------------------------------- */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Education & Occupation
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                
                {/* Occupation */}
                <div>
                  <label htmlFor="occupation" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Occupation / Employment Status
                  </label>
                  <select
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleChange('occupation', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="">Select Occupation</option>
                    {OCCUPATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Education */}
                <div>
                  <label htmlFor="education" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Highest Education Level
                  </label>
                  <select
                    id="education"
                    value={formData.education}
                    onChange={(e) => handleChange('education', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="">Select Education</option>
                    {EDUCATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

          </div>

          {/* =====================================================================
              ACTION FOOTER: SAVE & CANCEL (Screen 5 Blueprint)
             ===================================================================== */}
          <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {hasChanges ? 'You have unsaved changes' : 'Profile up to date in database'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              {/* Save Changes Button */}
              <button
                type="submit"
                disabled={!hasChanges || isSaving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-200 hover:shadow-md transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      )}

    </div>
  );
}
