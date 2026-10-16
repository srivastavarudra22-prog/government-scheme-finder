import React, { useRef, useEffect } from 'react';
import { Send, Loader2, CornerDownLeft } from 'lucide-react';

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea based on input content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [value]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !disabled && value.trim()) {
        onSubmit(e);
      }
    }
  }

  const isBlank = !value.trim();
  const charCount = value.length;

  return (
    <div className="p-4 bg-white border-t border-slate-200/80">
      <form onSubmit={onSubmit} className="relative">
        <div className="relative rounded-2xl border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white transition shadow-2xs">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || disabled}
            maxLength={1500}
            placeholder="Type your question about eligibility, benefits, or documents..."
            className="w-full resize-none px-4 pt-3.5 pb-10 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-400"
            style={{ minHeight: '52px', maxHeight: '180px' }}
          />

          <div className="absolute left-3 bottom-2.5 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3 text-slate-400" />
              <span>Enter to send</span>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline">Shift + Enter for new line</span>
          </div>

          <div className="absolute right-2.5 bottom-2 flex items-center gap-2">
            <span className={`text-[10px] tabular-nums ${charCount > 1300 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
              {charCount}/1500
            </span>

            <button
              type="submit"
              disabled={isBlank || loading || disabled}
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-colors shadow-2xs disabled:cursor-not-allowed"
              title="Send question"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-2.5">
          AI Assistant provides informational guidance. Please verify official terms on the scheme portal before applying.
        </p>
      </form>
    </div>
  );
}
