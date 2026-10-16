import React from 'react';
import { Sparkles, Trash2, ShieldAlert } from 'lucide-react';

/**
 * ChatHeader
 * Header component for AI Chat Assistant reproducing Screen 9 styling.
 */
export default function ChatHeader({ onClear, messageCount, ragStatus }) {
  return (
    <div className="px-5 py-4 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">AI Assistant</h2>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80" title="RAG dataset pipeline is not connected yet">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
              Pre-integration Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            Ask me anything about government schemes!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {messageCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
            title="Reset conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>
    </div>
  );
}
