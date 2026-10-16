/**
 * @file AppLayout.jsx
 * @description Authenticated Application Shell reproducing the dark sidebar layout seen in Screens 4-12.
 * 
 * Features:
 * - Persistent dark sidebar with SchemeFinder brand and navigation links
 * - Active state indicators matching reference design
 * - Responsive mobile drawer toggle
 * - Top citizen greeting bar with notification bell and user avatar
 * - Integrated logout handler
 */

import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  User, 
  Search, 
  MessageSquare, 
  Bookmark, 
  FileText, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  // Determine user display name and initials
  const displayName = profile?.full_name || user?.fullName || user?.email?.split('@')[0] || 'Citizen';
  const firstName = displayName.split(' ')[0];
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Find Schemes', path: '/find-schemes', icon: Search },
    { name: 'Chat Assistant', path: '/chat', icon: MessageSquare },
    { name: 'Saved Schemes', path: '/saved-schemes', icon: Bookmark },
    { name: 'Applications', path: '/applications', icon: FileText },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800">
      
      {/* =========================================================================
          LEFT SIDEBAR (Screens 4-12 Design Blueprint)
         ========================================================================= */}
      
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between shrink-0 min-h-screen sticky top-0">
        <div>
          {/* Brand Logo */}
          <div className="h-20 flex items-center px-6 border-b border-slate-800/80">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Scheme<span className="text-emerald-400">Finder</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout Button */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header with Hamburger */}
      <div className="lg:hidden bg-slate-900 text-white h-16 px-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold">SchemeFinder</span>
        </Link>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-slate-300 hover:text-white focus:outline-none"
          aria-label="Toggle navigation drawer"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex">
          <div className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 h-full shadow-xl">
            <div>
              <div className="h-14 flex items-center justify-between border-b border-slate-800 px-2 mb-4">
                <span className="font-bold text-white">Menu</span>
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => { setMobileSidebarOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* =========================================================================
          MAIN APPLICATION CONTENT AREA
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Top Citizen Header Bar */}
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-16 lg:top-0 z-30">
          <div>
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Welcome back, {firstName}!</span>
              <span className="text-lg lg:text-xl">👋</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Here's your scheme overview
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
            </Link>

            {/* User Avatar Circle */}
            <Link
              to="/profile"
              className="flex items-center gap-2 pl-2 sm:pl-2.5 border-l border-slate-200 hover:opacity-90 transition"
              title="View profile"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {initials || 'U'}
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto max-w-7xl overflow-x-hidden">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
