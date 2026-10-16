/**
 * @file ChatAssistantPage.jsx
 * @description Citizen AI Chat Assistant Page reproducing Screen 9 of the master template.
 * 
 * ARCHITECTURE & FUTURE RAG READY:
 * - Direct connection to backend chat API (/api/chat/message and /api/chat/status)
 * - Pure service abstraction: No fake scheme answers are generated or fabricated.
 * - Explicit development placeholder indicator during RAG pre-integration phase.
 * - Fully decoupled for future RAG knowledge retrieval, vector search, and LLM responses.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Bot, 
  AlertCircle, 
  RefreshCw, 
  Info,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessageItem from '../components/chat/ChatMessageItem';
import SuggestedQuestions from '../components/chat/SuggestedQuestions';
import ChatInput from '../components/chat/ChatInput';

export default function ChatAssistantPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ragStatus, setRagStatus] = useState(null);

  const messagesEndRef = useRef(null);

  // Pre-populate question if navigated from Scheme Details
  useEffect(() => {
    const schemeName = searchParams.get('schemeName');
    if (schemeName) {
      setInputValue(`What are the eligibility criteria and documents required for ${schemeName}?`);
      // Clean query params so it does not persist on subsequent refreshes
      searchParams.delete('schemeName');
      searchParams.delete('schemeId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Compute user initials for chat bubbles
  const displayName = profile?.full_name || user?.fullName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat system status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await api.chat.getStatus();
        if (isMounted && res.data) {
          setRagStatus(res.data);
        }
      } catch (err) {
        // Non-blocking error check
        console.warn('Chat status check failed:', err.message);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Dispatches citizen message to backend chat endpoint
   */
  async function handleSendMessage(rawText) {
    const text = (rawText || inputValue).trim();
    if (!text || loading) return;

    setError(null);
    const userMsgId = `user-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Backend POST /api/chat/message returns 200 with status: 'NOT_IMPLEMENTED'
      const response = await api.chat.sendMessage({ message: text });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message || 'AI assistant is not connected yet.',
        notice: response.notice || 'Development placeholder: AI/RAG system is not connected yet. Dataset grounding will be enabled in the upcoming RAG integration task.',
        echo: response.data?.echo || text,
        isPlaceholder: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = err.message || 'Failed to communicate with chat service.';
      setError(errMsg);

      const errorBotMessage = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: errMsg,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    handleSendMessage(inputValue);
  }

  function handleSelectSuggestion(suggestionText) {
    handleSendMessage(suggestionText);
  }

  function handleClearChat() {
    setMessages([]);
    setError(null);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-8.5rem)] min-h-[500px] bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      
      {/* Top Header */}
      <ChatHeader
        onClear={handleClearChat}
        messageCount={messages.length}
        ragStatus={ragStatus}
      />

      {/* Main Conversation Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-slate-50/50">
        
        {/* Error notification banner if service fails */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-900 font-semibold text-xs ml-auto"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Empty Conversation State reproducing Screen 9 */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center py-6 px-4">
            <div className="max-w-xl w-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Bot className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                How can I help you today?
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                Ask questions about eligibility criteria, necessary documents, application deadlines, and benefits across 4,700+ central and state schemes.
              </p>

              {/* Architecture Info Notice */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 mb-6 text-left max-w-lg mx-auto shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-amber-900 block mb-0.5">
                      Architecture Status: RAG Pre-integration Mode
                    </span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      This interface is connected to the backend Chat API architecture. In accordance with task specifications, Retrieval-Augmented Generation (RAG) and LLM dataset grounding are scheduled for the next phase. Responses will display explicit development placeholders without fabricating scheme data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Screen 9 Suggested Question Chips */}
              <SuggestedQuestions
                onSelectQuestion={handleSelectSuggestion}
                disabled={loading}
              />
            </div>
          </div>
        ) : (
          /* Populated Conversation List */
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                userInitials={initials}
              />
            ))}

            {/* Typing Indicator while awaiting response */}
            {loading && (
              <div className="flex justify-start items-start gap-2.5 mb-4 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-slate-500 font-medium ml-2">Assistant is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Sticky Input Bar */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleFormSubmit}
        loading={loading}
        disabled={false}
      />
    </div>
  );
}
