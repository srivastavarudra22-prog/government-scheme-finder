/**
 * @file LoginPage.jsx
 * @description Citizen Login Page faithfully reproducing Screen 3 of the reference design.
 * 
 * Features:
 * - Two-column responsive card layout matching Screen 3 (Form on left, Security assurance on right)
 * - Fields: Email Address, Password
 * - Password visibility toggle (Eye / EyeOff)
 * - "Forgot Password?" helper link
 * - Client-side validation: Required fields and email format
 * - Server-side handling: Invalid credentials (401), unconfirmed email (403), loading states
 * - Protected-route return behavior via location.state.from
 * - Link to /signup
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Lock, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected by ProtectedRoute, capture the return path; default to /dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  function validate() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return 'Please enter your email address.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Please enter your password.';
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      // Seamlessly redirect to the intended protected route or dashboard
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* =====================================================================
              LEFT COLUMN: LOGIN FORM (Screen 3 Blueprint)
             ===================================================================== */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              
              {/* Form Header */}
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome Back!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-normal">
                  Login to continue finding schemes you qualify for.
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
                    <p className="font-semibold text-rose-900">Authentication Error</p>
                    <p className="mt-0.5 text-rose-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                
                {/* Email Address */}
                <div>
                  <label 
                    htmlFor="loginEmail" 
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="loginEmail"
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor="loginPassword" 
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <a 
                      href="#forgot-password"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Password reset instructions will be sent to your registered email address.');
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition"
                    >
                      Forgot Password?
                    </a>
                  </div>
                  
                  <div className="relative">
                    <input
                      id="loginPassword"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 sm:py-3.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm shadow-emerald-200 hover:shadow-md active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>

              </form>

            </div>

            {/* Bottom Signup Link */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm text-slate-600">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition"
                >
                  Sign Up
                </Link>
              </p>
            </div>

          </div>


          {/* =====================================================================
              RIGHT COLUMN: SECURITY ASSURANCE (Screen 3 Blueprint)
             ===================================================================== */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50/40 p-8 sm:p-10 lg:p-12 border-t lg:border-t-0 lg:border-l border-slate-200/80 flex flex-col justify-center items-center text-center">
            
            {/* Circular Green Lock Badge matching Screen 3 */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100/90 text-emerald-700 flex items-center justify-center mb-6 shadow-sm border border-emerald-200/60">
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
            </div>

            {/* Reassurance Copy matching Screen 3 */}
            <p className="text-sm sm:text-base font-semibold text-slate-700 max-w-xs leading-relaxed mb-8">
              Your data is safe with us. <br className="hidden sm:inline" />
              We never share your information.
            </p>

            {/* Security Checklist matching Screen 3 */}
            <div className="w-full max-w-xs space-y-3.5 text-left">
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">Secure</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">Reliable</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">Trusted by Users</span>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
