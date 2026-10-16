import React from 'react';
import { GraduationCap, FileCheck, Award, FileText, ArrowRight } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: GraduationCap,
    category: 'Education',
    question: 'Which schemes can I apply for as a student?',
    color: 'emerald',
  },
  {
    icon: FileCheck,
    category: 'Internships',
    question: 'What documents are required for PM Internship Scheme?',
    color: 'blue',
  },
  {
    icon: Award,
    category: 'Entrepreneurship',
    question: 'What subsidies are available for women entrepreneurs?',
    color: 'purple',
  },
  {
    icon: FileText,
    category: 'Tracking',
    question: 'How do I track my submitted application status?',
    color: 'amber',
  },
];

export default function SuggestedQuestions({ onSelectQuestion, disabled }) {
  return (
    <div className="w-full max-w-2xl mx-auto my-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Suggested Questions
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectQuestion(item.question)}
              className="group text-left p-3.5 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-0.5">
                  {item.category}
                </span>
                <p className="text-xs font-medium text-slate-800 group-hover:text-emerald-950 line-clamp-2">
                  {item.question}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
