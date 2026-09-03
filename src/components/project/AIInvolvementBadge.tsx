import React from "react";
import { Sparkles, Bot, Cpu } from "lucide-react";

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
        return { label: "Almost entirely AI-assisted", color: "text-purple-300 border-purple-500/30 bg-purple-500/10" };
      case "HEAVY":
        return { label: "Heavy AI involvement", color: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10" };
      case "MODERATE":
        return { label: "Moderate AI assistance", color: "text-blue-300 border-blue-500/30 bg-blue-500/10" };
      case "MINIMAL":
      default:
        return { label: "Minimal AI assistance", color: "text-slate-300 border-slate-700 bg-slate-800/50" };
    }
  };

  const invInfo = formatInvolvement(involvement);

  if (!showDetails) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${invInfo.color}`}>
        <Sparkles className="w-3 h-3" />
        <span>{invInfo.label}</span>
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/60 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-slate-200">AI Transparency Disclosure</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${invInfo.color}`}>
          {invInfo.label}
        </span>
      </div>

      {tools.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-mono">Tools:</span>
          {tools.map((tool) => (
            <span
              key={tool}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300 font-mono"
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
