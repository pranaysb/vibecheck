import React from "react";
import { Sparkles, Bot } from "lucide-react";

interface AIInvolvementBadgeProps {
  involvement: string;
  tools?: string[];
  showDetails?: boolean;
}

export function AIInvolvementBadge({
  involvement,
  tools = [],
  showDetails = false,
}: AIInvolvementBadgeProps) {
  const formatInvolvement = (inv: string) => {
    switch (inv.toUpperCase()) {
      case "ALMOST_ENTIRELY":
        return { label: "Almost entirely AI-assisted", color: "text-purple-700 border-purple-200 bg-purple-50" };
      case "HEAVY":
        return { label: "Heavy AI involvement", color: "text-indigo-700 border-indigo-200 bg-indigo-50" };
      case "MODERATE":
        return { label: "Moderate AI assistance", color: "text-blue-700 border-blue-200 bg-blue-50" };
      case "MINIMAL":
      default:
        return { label: "Minimal AI assistance", color: "text-slate-700 border-slate-200 bg-slate-100" };
    }
  };

  const invInfo = formatInvolvement(involvement);

  if (!showDetails) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shadow-xs ${invInfo.color}`}>
        <Sparkles className="w-3 h-3" />
        <span>{invInfo.label}</span>
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-900">AI Transparency Disclosure</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${invInfo.color}`}>
          {invInfo.label}
        </span>
      </div>

      {tools.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 font-mono">Tools:</span>
          {tools.map((tool) => (
            <span
              key={tool}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-mono"
            >
              {tool}
            </span>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-500 italic leading-relaxed pt-1">
        AI assistance is disclosed, not penalized. VibeCheck assesses the code quality, UX, performance, and security of the resulting application.
      </p>
    </div>
  );
}
