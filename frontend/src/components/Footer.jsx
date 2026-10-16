/**
 * @file Footer.jsx
 * @description Clean, civic portal footer for SchemeFinder.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Scheme<span className="text-emerald-600">Finder</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Empowering Indian citizens with verified access to 4,732+ Central and State Government welfare schemes.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">Discovery</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/find-schemes" className="hover:text-emerald-600 transition">Eligibility Finder</Link></li>
              <li><Link to="/results" className="hover:text-emerald-600 transition">Browse 4,732+ Schemes</Link></li>
              <li><Link to="/chat" className="hover:text-emerald-600 transition">AI Scheme Assistant</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">Citizen Portal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/dashboard" className="hover:text-emerald-600 transition">Dashboard</Link></li>
              <li><Link to="/profile" className="hover:text-emerald-600 transition">My Profile</Link></li>
              <li><Link to="/saved-schemes" className="hover:text-emerald-600 transition">Saved Schemes</Link></li>
              <li><Link to="/applications" className="hover:text-emerald-600 transition">Track Applications</Link></li>
            </ul>
          </div>

          {/* Legal / Project */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">About Platform</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Data synchronized from official portals. For citizen welfare, education, and public awareness.
            </p>
            <p className="text-xs text-slate-400">
              Government Scheme Finder © {new Date().getFullYear()}
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
