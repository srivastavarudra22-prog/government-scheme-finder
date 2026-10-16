/**
 * @file SignupPage.jsx
 * @description Citizen Registration Page faithfully reproducing Screen 2 of the reference design.
 * 
 * Features:
 * - Two-column responsive layout matching Screen 2 (Form on left, Trust & Benefits showcase on right)
 * - Input fields: Full Name, Email Address, Password, Confirm Password
 * - Eye toggle for password visibility
 * - Terms & Conditions agreement checkbox
 * - Client-side validation: Required fields, valid email, minimum length, password match
 * - Server-side handling: Duplicate email (409), rate limit (429), Supabase Auth error propagation
 * - Direct connection to real Supabase Auth backend (/api/auth/signup)
 * - Handling of immediate session login vs. email confirmation pending state
 * - Link to /login
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Mail,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  function validate() {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      return 'Please enter your full name.';
    }

    if (!trimmedEmail) {
      return 'Please enter your email address.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Please create a password.';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      return 'Please confirm your password.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match. Please verify.';
    }

    if (!agreeTerms) {
      return 'Please accept the Terms & Conditions to create an account.';
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setVerificationRequired(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await signup(email.trim(), password, fullName.trim());

      // If active session token returned, redirect straight to dashboard
      if (res.session?.access_token) {
        navigate('/dashboard', { replace: true });
      } else {
        // Email verification is required by Supabase
        setVerificationRequired(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* =====================================================================
              LEFT COLUMN: REGISTRATION FORM (Screen 2 Blueprint)
             ===================================================================== */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              
              {/* Form Header */}
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Create Your Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-normal">
                  Join thousands of users finding the right schemes for themselves.
                </p>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div 
                  role="alert"
                  className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-semibold text-rose-900">Registration Error</p>
                    <p className="mt-0.5 text-rose-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Verification Link Sent Banner (When Supabase email confirmation is enabled) */}
              {verificationRequired ? (
                <div className="mb-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Confirmation Email Sent!</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      We have sent a verification link to <strong className="text-slate-900 font-semibold">{email}</strong>.
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Please check your inbox (and spam folder) and click the link to activate your account before logging in.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm"
                    >
                      <span>Proceed to Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                  
                  {/* Full Name */}
                  <div>
                    <label 
                      htmlFor="signupFullName" 
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="signupFullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label 
                      htmlFor="signupEmail" 
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="signupEmail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label 
                      htmlFor="signupPassword" 
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="signupPassword"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        minLength={6}
                        className="w-full pl-4 pr-11 py-2.5 sm:py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label 
                      htmlFor="signupConfirmPassword" 
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="signupConfirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                        minLength={6}
                        className="w-full pl-4 pr-11 py-2.5 sm:py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      id="agreeTerms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      disabled={loading}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="agreeTerms" className="text-xs text-slate-600 cursor-pointer select-none">
                      I agree to the <span className="text-emerald-700 font-semibold underline">Terms & Conditions</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 sm:py-3.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm shadow-emerald-200 hover:shadow-md active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <span>Sign Up</span>
                    )}
                  </button>

                </form>
              )}

            </div>

            {/* Bottom Login Link */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm text-slate-600">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition"
                >
                  Login
                </Link>
              </p>
            </div>

          </div>


          {/* =====================================================================
              RIGHT COLUMN: TRUST & BENEFITS SHOWCASE (Screen 2 Blueprint)
             ===================================================================== */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-sky-50/40 to-emerald-50/40 p-8 sm:p-10 lg:p-12 border-t lg:border-t-0 lg:border-l border-slate-200/80 flex flex-col justify-center items-center text-center">
            
            {/* Security Badge Illustration matching Screen 2 */}
            <div className="relative mb-8">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-md border border-slate-100 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
                </div>
              </div>
              
              {/* Subtle Document Floating Badge */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Value Proposition List matching Screen 2 */}
            <div className="w-full max-w-xs space-y-4 text-left">
              
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">100% Free</h4>
                  <p className="text-[11px] text-slate-500">No hidden fees or charges</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Secure & Private</h4>
                  <p className="text-[11px] text-slate-500">Citizen data stays encrypted</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">AI Powered</h4>
                  <p className="text-[11px] text-slate-500">Automated eligibility engine</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Accurate Results</h4>
                  <p className="text-[11px] text-slate-500">Matches 4,732+ active schemes</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
