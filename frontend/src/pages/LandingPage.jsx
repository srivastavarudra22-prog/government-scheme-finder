/**
 * @file LandingPage.jsx
 * @description Landing Page reproducing Screen 1 of the provided reference design.
 * 
 * Includes:
 * - Brand Hero with exact headline: "Find Government Schemes You Qualify For"
 * - Main CTA: "Find Government Schemes" (conditionally routes to /find-schemes if authenticated, /login if unauthenticated)
 * - Secondary CTA: "Learn More"
 * - High-fidelity vector illustration matching Screen 1 (man with smartphone, woman with laptop, capitol dome)
 * - 4 Horizontal feature cards: 1000+ Schemes, AI Powered, Personalized, Step-by-Step
 * - Full responsive navigation & supporting sections
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Sparkles, 
  UserCheck, 
  ClipboardList, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  GraduationCap, 
  Tractor, 
  HeartHandshake, 
  Briefcase, 
  ChevronRight,
  ShieldCheck,
  FileText,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  // Main CTA destination based on citizen authentication state
  const mainCtaTarget = isAuthenticated ? '/find-schemes' : '/login';

  // Load sample verified schemes from Supabase
  useEffect(() => {
    async function loadSampleSchemes() {
      try {
        setLoadingSchemes(true);
        const res = await api.schemes.list({ limit: 3, sortBy: 'id' });
        if (res.success && res.data) {
          setFeaturedSchemes(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch sample schemes:', err.message);
      } finally {
        setLoadingSchemes(false);
      }
    }
    loadSampleSchemes();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/results?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(mainCtaTarget, { state: { from: { pathname: '/find-schemes' } } });
    }
  }

  return (
    <div className="bg-white min-h-screen text-slate-800">

      {/* =========================================================================
          HERO SECTION (Faithfully styled to Screen 1 of Reference)
         ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-12 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Find Government <br className="hidden sm:inline" />
                Schemes{' '}
                <span className="text-emerald-600">
                  You
                </span>{' '}
                <br className="hidden sm:inline" />
                Qualify For
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Answer a few simple questions and our AI will find the best government schemes for you.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1">
                {/* Main CTA */}
                <Link
                  to={mainCtaTarget}
                  state={!isAuthenticated ? { from: { pathname: '/find-schemes' } } : undefined}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-sm shadow-emerald-200 hover:shadow-md transition active:scale-[0.99]"
                >
                  <span>Find Government Schemes</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Secondary CTA */}
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-base border border-slate-200 transition"
                >
                  Learn More
                </a>
              </div>

              {/* Instant Search Bar */}
              <form onSubmit={handleSearchSubmit} className="pt-2 max-w-lg mx-auto lg:mx-0">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by scheme name or keywords..."
                    className="w-full pl-11 pr-24 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition"
                  >
                    Search
                  </button>
                </div>
              </form>

            </div>

            {/* Right Column Illustration (Screen 1 Capitol + Citizens with Devices) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-none">
                
                <div className="bg-gradient-to-b from-slate-50 via-sky-50/30 to-emerald-50/40 rounded-3xl p-4 sm:p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden flex items-center justify-center min-h-[280px] sm:min-h-[380px]">
                  
                  {/* SVG Illustration depicting Capitol Dome and Citizens with Devices */}
                  <svg className="w-full h-auto max-h-[360px]" viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    
                    {/* Background Soft Sky Circle */}
                    <circle cx="250" cy="190" r="150" fill="#E2E8F0" fillOpacity="0.45" />

                    {/* Government Capitol / Parliament Building Silhouette */}
                    <g opacity="0.85">
                      {/* Dome Spire */}
                      <rect x="248" y="45" width="4" height="25" fill="#94A3B8" />
                      <circle cx="250" cy="42" r="5" fill="#64748B" />
                      {/* Outer Cupola Dome */}
                      <path d="M200 130 C200 75, 300 75, 300 130 Z" fill="#CBD5E1" />
                      <path d="M215 130 C215 88, 285 88, 285 130 Z" fill="#94A3B8" />
                      {/* Dome Drum & Windows */}
                      <rect x="195" y="130" width="110" height="18" fill="#E2E8F0" />
                      <rect x="210" y="134" width="8" height="10" rx="3" fill="#64748B" />
                      <rect x="230" y="134" width="8" height="10" rx="3" fill="#64748B" />
                      <rect x="250" y="134" width="8" height="10" rx="3" fill="#64748B" />
                      <rect x="270" y="134" width="8" height="10" rx="3" fill="#64748B" />
                      {/* Architrave & Pediment */}
                      <polygon points="170,158 250,140 330,158" fill="#CBD5E1" />
                      <rect x="165" y="158" width="170" height="8" fill="#94A3B8" />
                      {/* Classical Columns */}
                      <rect x="180" y="166" width="10" height="80" fill="#E2E8F0" />
                      <rect x="205" y="166" width="10" height="80" fill="#E2E8F0" />
                      <rect x="230" y="166" width="10" height="80" fill="#E2E8F0" />
                      <rect x="255" y="166" width="10" height="80" fill="#E2E8F0" />
                      <rect x="280" y="166" width="10" height="80" fill="#E2E8F0" />
                      <rect x="305" y="166" width="10" height="80" fill="#E2E8F0" />
                      {/* Building Wings */}
                      <rect x="120" y="180" width="60" height="66" fill="#CBD5E1" opacity="0.8" />
                      <rect x="320" y="180" width="60" height="66" fill="#CBD5E1" opacity="0.8" />
                      {/* Wing windows */}
                      <rect x="135" y="195" width="10" height="14" fill="#94A3B8" />
                      <rect x="155" y="195" width="10" height="14" fill="#94A3B8" />
                      <rect x="335" y="195" width="10" height="14" fill="#94A3B8" />
                      <rect x="355" y="195" width="10" height="14" fill="#94A3B8" />
                      {/* Base Podium & Steps */}
                      <rect x="110" y="246" width="280" height="12" fill="#94A3B8" />
                      <rect x="90" y="258" width="320" height="14" fill="#CBD5E1" />
                      <rect x="70" y="272" width="360" height="14" fill="#E2E8F0" />
                    </g>

                    {/* FOREGROUND CITIZEN 1: Man on the left with Smartphone */}
                    <g id="man-with-phone">
                      {/* Body / Green Sweatshirt */}
                      <path d="M120 400 L120 280 Q120 250 155 245 Q190 250 190 280 L190 400 Z" fill="#059669" />
                      {/* Collar */}
                      <path d="M142 247 Q155 260 168 247" stroke="#047857" strokeWidth="4" fill="none" />
                      {/* Neck */}
                      <rect x="146" y="225" width="18" height="25" rx="3" fill="#FBBF24" opacity="0.85" />
                      {/* Head */}
                      <ellipse cx="155" cy="205" rx="20" ry="24" fill="#FBBF24" opacity="0.9" />
                      {/* Hair */}
                      <path d="M135 200 C135 175, 175 175, 175 195 Q175 185 160 180 Q145 180 135 200 Z" fill="#1E293B" />
                      {/* Ear */}
                      <circle cx="137" cy="205" r="4" fill="#FBBF24" />
                      {/* Left Arm holding phone */}
                      <path d="M175 265 Q195 270 200 240" stroke="#059669" strokeWidth="18" strokeLinecap="round" fill="none" />
                      {/* Hand & Phone */}
                      <rect x="195" y="220" width="15" height="28" rx="3" fill="#1E293B" transform="rotate(10 195 220)" />
                      <rect x="197" y="223" width="11" height="22" rx="2" fill="#38BDF8" transform="rotate(10 195 220)" />
                      <circle cx="197" cy="242" r="6" fill="#FBBF24" opacity="0.9" />
                    </g>

                    {/* FOREGROUND CITIZEN 2: Woman on the right with Laptop */}
                    <g id="woman-with-laptop">
                      {/* Long Hair Back */}
                      <path d="M295 195 C295 170, 345 170, 345 220 C345 260 350 290 340 300 C325 300 295 260 295 195 Z" fill="#1E293B" />
                      {/* Yellow Top */}
                      <path d="M280 400 L280 285 Q280 255 315 250 Q350 255 350 285 L350 400 Z" fill="#F59E0B" />
                      {/* Neck */}
                      <rect x="306" y="230" width="18" height="24" rx="3" fill="#FBBF24" opacity="0.85" />
                      {/* Head */}
                      <ellipse cx="315" cy="210" rx="19" ry="23" fill="#FBBF24" opacity="0.9" />
                      {/* Front Hair Style */}
                      <path d="M298 205 C298 180, 332 180, 332 200 C328 190 310 190 298 205 Z" fill="#1E293B" />
                      {/* Laptop Body & Screen */}
                      <g transform="translate(245, 275)">
                        {/* Open Laptop Screen */}
                        <path d="M15 10 L55 0 L50 45 L10 50 Z" fill="#1E293B" />
                        <path d="M18 13 L52 4 L48 42 L14 47 Z" fill="#0284C7" />
                        {/* Keyboard Base */}
                        <polygon points="5,50 65,45 80,70 15,75" fill="#334155" />
                        {/* Hands typing */}
                        <circle cx="35" cy="52" r="7" fill="#FBBF24" opacity="0.9" />
                        <circle cx="55" cy="48" r="7" fill="#FBBF24" opacity="0.9" />
                      </g>
                    </g>

                    {/* Floating Trust Indicators */}
                    <g transform="translate(320, 70)">
                      <rect width="130" height="42" rx="10" fill="#FFFFFF" filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.06))" />
                      <circle cx="22" cy="21" r="12" fill="#ECFDF5" />
                      <path d="M16 21 L20 25 L28 17" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <text x="42" y="18" fill="#0F172A" fontSize="10" fontWeight="bold">100% Free</text>
                      <text x="42" y="30" fill="#64748B" fontSize="8">Verified Schemes</text>
                    </g>

                  </svg>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          4 FEATURE PILLARS / CARDS (Screen 1 Exact Layout)
         ========================================================================= */}
      <section className="relative z-10 pb-16 sm:pb-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: 1000+ Schemes */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Building2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">1000+ Schemes</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Across India</p>
              </div>
            </div>

            {/* Card 2: AI Powered */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Sparkles className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">AI Powered</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Eligibility Check</p>
              </div>
            </div>

            {/* Card 3: Personalized */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                <UserCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Personalized</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Recommendations</p>
              </div>
            </div>

            {/* Card 4: Step-by-Step */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                <ClipboardList className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Step-by-Step</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Application Guide</p>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          ABOUT SECTION
         ========================================================================= */}
      <section id="about" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                About SchemeFinder
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Bridging Citizens to Welfare Opportunities
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Every year, thousands of government welfare schemes and financial subsidies remain underutilized simply because citizens are unaware of their eligibility or find the application criteria too complex.
              </p>
              <p className="text-base text-slate-600 leading-relaxed">
                SchemeFinder compiles over <strong>4,700 verified schemes</strong> across Central and State ministries into a single, intelligent portal. Our automated matching system analyzes your demographic, educational, and economic background to surface the exact schemes you qualify for in seconds.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4">
                <div className="border-l-2 border-emerald-500 pl-4">
                  <p className="text-2xl font-extrabold text-slate-900">4,732+</p>
                  <p className="text-xs text-slate-500 font-medium">Verified Schemes</p>
                </div>
                <div className="border-l-2 border-emerald-500 pl-4">
                  <p className="text-2xl font-extrabold text-slate-900">36</p>
                  <p className="text-xs text-slate-500 font-medium">States & UTs Covered</p>
                </div>
                <div className="border-l-2 border-emerald-500 pl-4">
                  <p className="text-2xl font-extrabold text-slate-900">100%</p>
                  <p className="text-xs text-slate-500 font-medium">Free Civic Access</p>
                </div>
              </div>
            </div>

            {/* Feature Highlight Graphic */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Why Use SchemeFinder?</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Single Source of Truth</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Directly connected to PostgreSQL official database with regular ministry updates.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Privacy & Security First</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Your personal data is protected with Row Level Security. We never sell citizen profiles.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Document Checklist Assistance</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Never get rejected due to missing paperwork. We list exact documents before you apply.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={mainCtaTarget}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition"
                >
                  <span>Start Finding Schemes</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          HOW IT WORKS SECTION
         ========================================================================= */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">How It Works</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              3 Simple Steps to Discover Your Benefits
            </p>
            <p className="mt-3 text-base text-slate-600">
              No more searching through hundreds of confusing government portals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="relative p-8 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Enter Your Details</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Provide basic demographic criteria such as your age, state of residence, occupation, education, and family income.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-8 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Automated Eligibility Match</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our eligibility engine matches your profile against all active Central and State Government scheme regulations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-8 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Apply with Confidence</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Review your required documents checklist, step-by-step application instructions, and official links.
              </p>
            </div>

          </div>

          <div className="text-center mt-12">
            <Link
              to={mainCtaTarget}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm"
            >
              <span>Check Eligibility Now</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>


      {/* =========================================================================
          POPULAR CATEGORIES
         ========================================================================= */}
      <section className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Scheme Categories</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore by Sector</p>
            <p className="mt-2 text-sm text-slate-600">Find initiatives supporting farmers, students, entrepreneurs, and women.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <Link
              to={`${mainCtaTarget}?category=Education`}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 text-center hover:shadow-sm transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                <GraduationCap className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">Education</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Scholarships & Grants</p>
            </Link>

            <Link
              to={`${mainCtaTarget}?category=Agriculture`}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 text-center hover:shadow-sm transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Tractor className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">Agriculture</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Farming Subsidies</p>
            </Link>

            <Link
              to={`${mainCtaTarget}?category=Healthcare`}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 text-center hover:shadow-sm transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">Healthcare</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Insurance & Medical</p>
            </Link>

            <Link
              to={`${mainCtaTarget}?category=Business`}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 text-center hover:shadow-sm transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Briefcase className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">Business</p>
              <p className="text-[11px] text-slate-500 mt-0.5">MSME & Mudra Loans</p>
            </Link>

            <Link
              to={`${mainCtaTarget}?category=Women`}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 text-center hover:shadow-sm transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">Women & Child</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Welfare & Support</p>
            </Link>

            <Link
              to={`${mainCtaTarget}?category=Social`}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 text-center hover:shadow-sm transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">Social Security</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Pensions & Housing</p>
            </Link>

          </div>

        </div>
      </section>


      {/* =========================================================================
          LIVE DATABASE SAMPLE SECTION
         ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Live Database</h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Featured Verified Schemes
              </p>
            </div>
            <Link
              to={mainCtaTarget}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View all 4,732 schemes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSchemes.length > 0 ? (
              featuredSchemes.map((scheme) => (
                <div 
                  key={scheme.id}
                  className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-between hover:shadow-sm transition"
                >
                  <div className="space-y-3">
                    <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      {scheme.state || 'Central Ministry'}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                      {scheme.scheme_name || scheme.title || 'Government Welfare Scheme'}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3">
                      {scheme.details || scheme.brief_description || scheme.description || 'Eligible citizens can apply for subsidies, grants, or direct benefit transfers.'}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      ID: #{scheme.id}
                    </span>
                    <Link
                      to={isAuthenticated ? `/schemes/${scheme.id}` : '/login'}
                      state={!isAuthenticated ? { from: { pathname: `/schemes/${scheme.id}` } } : undefined}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                    >
                      <span>View Criteria</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">
                  {loadingSchemes ? 'Loading live schemes from Supabase database...' : 'Direct connection to 4,732 schemes established.'}
                </p>
              </div>
            )}
          </div>

        </div>
      </section>


      {/* =========================================================================
          CONTACT & SUPPORT SECTION
         ========================================================================= */}
      <section id="contact" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Have Questions About Eligibility?
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Our AI Scheme Assistant is trained on the latest government notifications, guidelines, and application documents. Sign in to chat directly with our assistant.
          </p>
          <div className="pt-2">
            <Link
              to={mainCtaTarget}
              state={!isAuthenticated ? { from: { pathname: '/chat' } } : undefined}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition"
            >
              <span>Ask the AI Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
