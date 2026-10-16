import React, { useState } from 'react';
import { Sparkles, User, Copy, Check, AlertCircle, Info } from 'lucide-react';

/**
 * Formats ISO or Date timestamp to user-friendly local time
 */
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessageItem({ message, userInitials }) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard failures
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2.5 mb-4 group">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-xl">
          <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
          {message.timestamp && (
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs mb-4">
          {userInitials || <User className="w-4 h-4" />}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-start items-start gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs max-w-[85%] sm:max-w-xl text-sm">
          <p className="font-semibold text-xs text-rose-700 uppercase tracking-wider mb-1">
            Service Error
          </p>
          <p>{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start items-start gap-2.5 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex flex-col items-start max-w-[85%] sm:max-w-2xl">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3.5 shadow-xs text-slate-800 text-sm leading-relaxed">
          {/* Development placeholder indicator */}
          {message.isPlaceholder && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-2.5">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>[Development Placeholder]</span>
            </div>
          )}

          {/* Primary message text */}
          <div className="whitespace-pre-wrap break-words text-slate-800 font-normal">
            {message.content}
          </div>

          {/* Notice callout */}
          {message.notice && (
            <div className="mt-3 p-3 bg-slate-50 border-l-2 border-emerald-500 rounded-r-lg text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-700 block mb-0.5">Architecture Notice:</span>
              {message.notice}
            </div>
          )}

          {/* Echo of citizen query if available */}
          {message.echo && (
            <div className="mt-2 text-[11px] text-slate-400 font-mono">
              Prompt acknowledged: &quot;{message.echo}&quot;
            </div>
          )}
        </div>

        {/* Action bar below message */}
        <div className="flex items-center gap-3 mt-1 px-1">
          {message.timestamp && (
            <span className="text-[10px] text-slate-400">
              {formatTime(message.timestamp)}
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition"
            title="Copy message text"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
