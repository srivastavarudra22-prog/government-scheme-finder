/**
 * @file FindSchemesPage.jsx
 * @description Eligibility Wizard faithfully reproducing Screen 6 of the reference design.
 * 
 * Features:
 * - 5-Step Wizard matching Screen 6:
 *   1. Personal Details (Age, Gender, State, District, Category, Marital Status)
 *   2. Education & Work (Occupation, Education Level, Employment Sector)
 *   3. Income Details (Annual Family Income in INR, BPL Status)
 *   4. Other Information (Area of Residence, Disability/PwD, Primary Benefit Area)
 *   5. Review (Complete summary of entered parameters before submission)
 * - Pre-populates citizen attributes from real Supabase profile
 * - Uses EXACT backend filter parameter names:
 *   age, state, gender, occupation, education, income, category, area, is_bpl
 * - Submits directly to /results for server-side eligibility determination
 * - Responsive layout, animated steps, step validation, and back/forward navigation
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Briefcase, 
  IndianRupee, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Standard Indian States & UTs matching database
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

// Backend exact options from schemeController
const GENDER_OPTIONS = ['Any', 'Female', 'Male'];

const CASTE_OPTIONS = [
  { label: 'All Categories', value: 'All' },
  { label: 'General', value: 'General' },
  { label: 'OBC (Other Backward Class)', value: 'OBC' },
  { label: 'SC (Scheduled Caste)', value: 'SC' },
  { label: 'ST (Scheduled Tribe)', value: 'ST' },
  { label: 'Minority Community', value: 'Minority' },
];

const OCCUPATION_OPTIONS = [
  'Student',
  'Farmer',
  'Self-Employed / Entrepreneur',
  'Salaried / Private Sector',
  'Government Employee',
  'Artisan / Craftsman',
  'Daily Wage Laborer',
  'Healthcare Worker',
  'Teacher / Educator',
  'Fisherman',
  'Unemployed',
  'Street Vendor',
  'Homemaker',
  'Retired / Senior Citizen',
];

const EDUCATION_OPTIONS = [
  { label: 'No Formal Prerequisite / Any', value: 'None' },
  { label: 'Primary / Elementary (Class 1-8)', value: 'Primary / Elementary' },
  { label: 'Secondary (Class 9-10)', value: 'Secondary (Class 9-10)' },
  { label: 'Higher Secondary (Class 11-12)', value: 'Higher Secondary (Class 11-12)' },
  { label: 'ITI / Vocational Diploma', value: 'ITI / Diploma' },
  { label: 'Undergraduate / Bachelor\'s Degree', value: 'Undergraduate' },
  { label: 'Postgraduate / Master\'s Degree', value: 'Postgraduate' },
  { label: 'Doctorate / PhD', value: 'PhD / Doctorate' },
];

const AREA_OPTIONS = [
  { label: 'Both / Either', value: 'Both' },
  { label: 'Rural Area (Village / Gram Panchayat)', value: 'Rural' },
  { label: 'Urban Area (Municipality / City)', value: 'Urban' },
];

const MARITAL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Widowed',
  'Divorced / Separated',
];

const STEPS = [
  { id: 1, title: 'Personal Details', icon: User },
  { id: 2, title: 'Education & Work', icon: Briefcase },
  { id: 3, title: 'Income Details', icon: IndianRupee },
  { id: 4, title: 'Other Information', icon: HelpCircle },
  { id: 5, title: 'Review', icon: CheckCircle2 },
];

export default function FindSchemesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const initializedRef = useRef(false);

  // Form state holding exact backend parameters
  const [wizardData, setWizardData] = useState(() => ({
    // Step 1: Personal Details
    age: profile?.age !== null && profile?.age !== undefined ? String(profile.age) : '',
    gender: profile?.gender && ['Male', 'Female'].includes(profile.gender) ? profile.gender : 'Any',
    state: profile?.state || '',
    district: '',
    category: profile?.category ? (profile.category.includes('OBC') ? 'OBC' : profile.category.includes('SC') ? 'SC' : profile.category.includes('ST') ? 'ST' : profile.category.includes('General') ? 'General' : 'All') : 'All',
    maritalStatus: 'Single',

    // Step 2: Education & Work
    occupation: profile?.occupation || '',
    education: '',

    // Step 3: Income Details
    income: '',
    is_bpl: 'false',

    // Step 4: Other Information
    area: 'Both',
    hasDisability: 'false',
    primaryCategory: '',
  }));

  // Pre-fill form when profile loads asynchronously
  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      setWizardData((prev) => ({
        ...prev,
        age: profile.age !== null && profile.age !== undefined && !prev.age ? String(profile.age) : prev.age,
        gender: profile.gender && ['Male', 'Female'].includes(profile.gender) && prev.gender === 'Any' ? profile.gender : prev.gender,
        state: profile.state && !prev.state ? profile.state : prev.state,
        occupation: profile.occupation && !prev.occupation ? profile.occupation : prev.occupation,
      }));
    }
  }, [profile]);

  function handleChange(field, value) {
    setWizardData((prev) => ({ ...prev, [field]: value }));
    setStepError('');
  }

  // Validate current step before advancing
  function validateStep(step) {
    if (step === 1) {
      if (!wizardData.age) {
        return 'Please enter your age.';
      }
      const numAge = parseInt(wizardData.age, 10);
      if (isNaN(numAge) || numAge < 1 || numAge > 120) {
        return 'Please enter a valid age between 1 and 120.';
      }
      if (!wizardData.state) {
        return 'Please select your State or Union Territory.';
      }
    }

    if (step === 2) {
      if (!wizardData.occupation) {
        return 'Please select your primary occupation.';
      }
    }

    if (step === 3) {
      if (wizardData.income !== '') {
        const numIncome = parseFloat(wizardData.income);
        if (isNaN(numIncome) || numIncome < 0) {
          return 'Please enter a valid annual income or leave blank for unconstrained.';
        }
      }
    }

    return null;
  }

  function handleNext() {
    const error = validateStep(currentStep);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError('');
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  }

  function handleBack() {
    setStepError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  // Handle final submission to /results
  function handleSubmit(e) {
    if (e) e.preventDefault();

    // Construct URLSearchParams with EXACT backend query parameters
    const params = new URLSearchParams();

    // 1. age
    if (wizardData.age) {
      params.set('age', wizardData.age);
    }

    // 2. state
    if (wizardData.state) {
      params.set('state', wizardData.state);
    }

    // 3. gender
    if (wizardData.gender && wizardData.gender !== 'Any') {
      params.set('gender', wizardData.gender);
    }

    // 4. occupation
    if (wizardData.occupation) {
      params.set('occupation', wizardData.occupation);
    }

    // 5. education
    if (wizardData.education && wizardData.education !== 'None') {
      params.set('education', wizardData.education);
    }

    // 6. income
    if (wizardData.income) {
      params.set('income', wizardData.income);
    }

    // 7. category
    if (wizardData.category && wizardData.category !== 'All') {
      params.set('category', wizardData.category);
    }

    // 8. area
    if (wizardData.area && wizardData.area !== 'Both') {
      params.set('area', wizardData.area);
    }

    // 9. is_bpl
    if (wizardData.is_bpl === 'true') {
      params.set('is_bpl', 'true');
    }

    // 10. primary_category (optional filter)
    if (wizardData.primaryCategory) {
      params.set('primary_category', wizardData.primaryCategory);
    }

    // Navigate to actual /results page
    navigate(`/results?${params.toString()}`);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* =========================================================================
          PAGE HEADER (Screen 6 Blueprint)
         ========================================================================= */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Schemes You Qualify For
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
          Answer a few questions, and let our AI find the best schemes for you.
        </p>
      </div>

      {/* =========================================================================
          STEPPER INDICATOR BAR (Screen 6 Blueprint: 5 Pills Across Top)
         ========================================================================= */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-0">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => {
                    // Only allow clicking to previously completed steps or current
                    if (step.id <= currentStep) {
                      setCurrentStep(step.id);
                      setStepError('');
                    }
                  }}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-white text-emerald-700'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : step.id}
                  </div>
                  <Icon className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
                  {/* On mobile: show label only for active step; on sm+: always show */}
                  <span className={isCurrent ? 'inline' : 'hidden sm:inline'}>{step.title}</span>
                </button>

                {/* Connecting Line */}
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                    currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Alert Banner */}
      {stepError && (
        <div 
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-900">Please check your input</p>
            <p className="mt-0.5 text-rose-700">{stepError}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          WIZARD FORM CARD (Screen 6 Blueprint)
         ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        
        <div className="p-6 sm:p-8 sm:min-h-[380px]">
          
          {/* -------------------------------------------------------------------
              STEP 1: PERSONAL DETAILS (Screen 6)
             ------------------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Step 1: Personal Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Basic demographic parameters needed for central and state scheme eligibility.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Age */}
                <div>
                  <label htmlFor="wizardAge" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="wizardAge"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 21"
                    value={wizardData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Schemes apply age bounds (e.g. 18-35 for youth internships).
                  </p>
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="wizardGender" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="wizardGender"
                    value={wizardData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select Female to include women-exclusive welfare schemes.
                  </p>
                </div>

                {/* State */}
                <div>
                  <label htmlFor="wizardState" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    State / Union Territory <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="wizardState"
                    value={wizardData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    required
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label htmlFor="wizardDistrict" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    District / City <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="wizardDistrict"
                    type="text"
                    placeholder="e.g. Lucknow, Varanasi"
                    value={wizardData.district}
                    onChange={(e) => handleChange('district', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                {/* Category (Caste) */}
                <div>
                  <label htmlFor="wizardCategory" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category (Social Category / Caste)
                  </label>
                  <select
                    id="wizardCategory"
                    value={wizardData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    {CASTE_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Marital Status */}
                <div>
                  <label htmlFor="wizardMarital" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Marital Status
                  </label>
                  <select
                    id="wizardMarital"
                    value={wizardData.maritalStatus}
                    onChange={(e) => handleChange('maritalStatus', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    {MARITAL_STATUS_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>
          )}


          {/* -------------------------------------------------------------------
              STEP 2: EDUCATION & WORK (Screen 6)
             ------------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Step 2: Education & Work
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Helps identify occupational subsidies, employment stipends, and educational grants.
                </p>
              </div>

              <div className="space-y-5">
                
                {/* Occupation */}
                <div>
                  <label htmlFor="wizardOccupation" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Occupation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="wizardOccupation"
                    value={wizardData.occupation}
                    onChange={(e) => handleChange('occupation', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    required
                  >
                    <option value="">Select Occupation</option>
                    {OCCUPATION_OPTIONS.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Matches schemes specific to students, farmers, MSME entrepreneurs, etc.
                  </p>
                </div>

                {/* Highest Education Level */}
                <div>
                  <label htmlFor="wizardEducation" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Highest Education Level
                  </label>
                  <select
                    id="wizardEducation"
                    value={wizardData.education}
                    onChange={(e) => handleChange('education', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="">No Prerequisite / Any</option>
                    {EDUCATION_OPTIONS.map((edu) => (
                      <option key={edu.value} value={edu.value}>{edu.label}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>
          )}


          {/* -------------------------------------------------------------------
              STEP 3: INCOME DETAILS (Screen 6)
             ------------------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Step 3: Income Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Government benefits often specify maximum income caps or BPL eligibility.
                </p>
              </div>

              <div className="space-y-5">
                
                {/* Annual Income */}
                <div>
                  <label htmlFor="wizardIncome" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Annual Family Income (₹ in INR)
                  </label>
                  <div className="relative">
                    <input
                      id="wizardIncome"
                      type="number"
                      placeholder="e.g. 250000"
                      value={wizardData.income}
                      onChange={(e) => handleChange('income', e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Leave blank to view all schemes regardless of income limits.
                  </p>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {[
                      { label: '< ₹1 Lakh', val: '100000' },
                      { label: '₹2.5 Lakhs', val: '250000' },
                      { label: '₹5 Lakhs', val: '500000' },
                      { label: '₹8 Lakhs', val: '800000' },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => handleChange('income', p.val)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition ${
                          wizardData.income === p.val
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BPL Cardholder Toggle */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <span className="block text-xs font-semibold text-slate-900">
                    Do you possess a Below Poverty Line (BPL) or Ration Card?
                  </span>
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="radio"
                        name="is_bpl"
                        value="true"
                        checked={wizardData.is_bpl === 'true'}
                        onChange={(e) => handleChange('is_bpl', e.target.value)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Yes (BPL Cardholder)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="radio"
                        name="is_bpl"
                        value="false"
                        checked={wizardData.is_bpl === 'false'}
                        onChange={(e) => handleChange('is_bpl', e.target.value)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

              </div>
            </div>
          )}


          {/* -------------------------------------------------------------------
              STEP 4: OTHER INFORMATION (Screen 6)
             ------------------------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Step 4: Other Information & Preferences
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Additional parameters to pinpoint specialized and regional benefits.
                </p>
              </div>

              <div className="space-y-5">
                
                {/* Area of Residence */}
                <div>
                  <label htmlFor="wizardArea" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Area of Residence
                  </label>
                  <select
                    id="wizardArea"
                    value={wizardData.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    {AREA_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                {/* Primary Category Preference */}
                <div>
                  <label htmlFor="wizardPrimaryCategory" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Specific Sector of Interest <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    id="wizardPrimaryCategory"
                    value={wizardData.primaryCategory}
                    onChange={(e) => handleChange('primaryCategory', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  >
                    <option value="">All Government Sectors</option>
                    <option value="Scholarship & Education">Scholarship & Education</option>
                    <option value="Farmers & Agriculture">Farmers & Agriculture</option>
                    <option value="Financial Assistance">Financial Assistance & Grants</option>
                    <option value="Business & Entrepreneurship">Business & MSME Loans</option>
                    <option value="Health & Medical">Health & Medical Insurance</option>
                    <option value="Women & Girls">Women & Girls Empowerment</option>
                    <option value="Social Welfare & Other Benefits">Social Welfare & Security</option>
                    <option value="Employment & Jobs">Employment & Skill Development</option>
                  </select>
                </div>

              </div>
            </div>
          )}


          {/* -------------------------------------------------------------------
              STEP 5: REVIEW & SUMMARY (Screen 6)
             ------------------------------------------------------------------- */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Step 5: Review Your Criteria
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify your information before searching the database.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ready to Match</span>
                </div>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Personal Information Summary */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Personal Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-emerald-600 font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <ul className="text-xs space-y-1 text-slate-600">
                    <li><strong>Age:</strong> {wizardData.age} years</li>
                    <li><strong>Gender:</strong> {wizardData.gender}</li>
                    <li><strong>State:</strong> {wizardData.state}</li>
                    {wizardData.district && <li><strong>District:</strong> {wizardData.district}</li>}
                    <li><strong>Category:</strong> {wizardData.category}</li>
                  </ul>
                </div>

                {/* Work & Education Summary */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Work & Education
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-emerald-600 font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <ul className="text-xs space-y-1 text-slate-600">
                    <li><strong>Occupation:</strong> {wizardData.occupation || 'Any'}</li>
                    <li><strong>Education:</strong> {wizardData.education || 'No Prerequisite'}</li>
                  </ul>
                </div>

                {/* Financial Summary */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Financial Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs text-emerald-600 font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <ul className="text-xs space-y-1 text-slate-600">
                    <li>
                      <strong>Annual Income:</strong> {wizardData.income ? `₹${Number(wizardData.income).toLocaleString('en-IN')}` : 'Unconstrained'}
                    </li>
                    <li><strong>BPL Card:</strong> {wizardData.is_bpl === 'true' ? 'Yes' : 'No'}</li>
                  </ul>
                </div>

                {/* Preferences Summary */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Location & Sector
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-xs text-emerald-600 font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <ul className="text-xs space-y-1 text-slate-600">
                    <li><strong>Area:</strong> {wizardData.area}</li>
                    <li><strong>Sector:</strong> {wizardData.primaryCategory || 'All Sectors'}</li>
                  </ul>
                </div>

              </div>

              {/* Backend Match Note */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-slate-700 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold text-emerald-900">Direct Database Matching</p>
                  <p className="mt-0.5 text-slate-600">
                    Clicking the button below passes these parameters directly to our PostgreSQL eligibility engine across all 4,732+ active schemes.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* =====================================================================
            ACTION CONTROLS FOOTER: BACK / NEXT / SUBMIT (Screen 6 Blueprint)
           ===================================================================== */}
        <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200/80 flex items-center justify-between">
          
          {/* Back Button */}
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {/* Next / Submit Button */}
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-200 hover:shadow-md transition active:scale-[0.99]"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-200 hover:shadow-md transition active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Find Eligible Schemes</span>
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
