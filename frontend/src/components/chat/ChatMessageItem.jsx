import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, User, Copy, Check, AlertCircle, Info, ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

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

/**
 * Confidence badge with colour coding
 */
function ConfidenceBadge({ confidence }) {
  if (!confidence) return null;
  const styles = {
    high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  const labels = { high: '● High confidence', medium: '◑ Medium confidence', low: '○ Low confidence' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${styles[confidence] || styles.low}`}>
      {labels[confidence] || confidence}
    </span>
  );
}

/**
 * Renders markdown-lite: **bold**, bullet lists, line breaks
 */
function AnswerText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bold (**text**)
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, '') }} />
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </div>
  );
}

export default function ChatMessageItem({ message, userInitials }) {
  const [copied, setCopied] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(true);

  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const hasSources = message.sources && message.sources.length > 0;

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

  // ── Assistant message (placeholder or live RAG) ───────────────────────────
  return (
    <div className="flex justify-start items-start gap-2.5 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex flex-col items-start max-w-[85%] sm:max-w-2xl">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3.5 shadow-xs text-slate-800 text-sm leading-relaxed">

          {/* Development placeholder badge (shown when RAG not yet live) */}
          {message.isPlaceholder && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-2.5">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>[Development Placeholder]</span>
            </div>
          )}

          {/* Confidence badge (shown when RAG is live) */}
          {!message.isPlaceholder && message.confidence && (
            <div className="mb-2.5">
              <ConfidenceBadge confidence={message.confidence} />
            </div>
          )}

          {/* Primary answer text with markdown-lite rendering */}
          <div className="whitespace-pre-wrap break-words text-slate-800 font-normal">
            {!message.isPlaceholder
              ? <AnswerText text={message.content} />
              : message.content
            }
          </div>

          {/* Notice callout (placeholder/setup messages) */}
          {message.notice && (
            <div className="mt-3 p-3 bg-slate-50 border-l-2 border-emerald-500 rounded-r-lg text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-700 block mb-0.5">Notice:</span>
              {message.notice}
            </div>
          )}

          {/* ── RAG Source Citations ──────────────────────────────────────── */}
          {hasSources && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSourcesExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 transition mb-2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sources ({message.sources.length} schemes)</span>
                {sourcesExpanded
                  ? <ChevronUp className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />
                }
              </button>

              {sourcesExpanded && (
                <div className="space-y-1.5">
                  {message.sources.map((src) => (
                    <div key={src.schemeId} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-emerald-50/60 border border-emerald-100 rounded-lg group/src">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                          #{src.schemeId}
                        </span>
                        <span className="text-xs text-slate-700 truncate font-medium">
                          {src.schemeName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {src.similarity && (
                          <span className="text-[10px] text-slate-400 hidden sm:block">
                            {(src.similarity * 100).toFixed(0)}% match
                          </span>
                        )}
                        <Link
                          to={`/schemes/${src.schemeId}`}
                          className="inline-flex items-center gap-0.5 text-[11px] text-emerald-700 hover:text-emerald-900 font-medium hover:underline"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
