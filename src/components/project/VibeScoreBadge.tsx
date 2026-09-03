import React from "react";
import { getScoreColor } from "@/lib/utils";

interface VibeScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg" | "hero";
  showLabel?: boolean;
}

export function VibeScoreBadge({ score, size = "md", showLabel = false }: VibeScoreBadgeProps) {
  const colors = getScoreColor(score);

  if (size === "hero") {
    return (
      <div className="flex items-baseline gap-2">
        <div className={`text-6xl sm:text-7xl font-mono font-black tracking-tight ${colors.text}`}>
          {score}
        </div>
        <div className="text-slate-500 font-mono text-sm uppercase tracking-wider font-semibold">
          / 100
        </div>
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold ${colors.badge}`}>
        <span className="text-xl">{score}</span>
        {showLabel && <span className="text-xs uppercase text-slate-400 font-sans font-medium">Vibe Score</span>}
      </div>
    );
  }

  if (size === "sm") {
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${colors.badge}`}>
        {score}
      </span>
    );
  }

  // Default md
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${colors.badge}`}>
      <span>{score}</span>
      {showLabel && <span className="text-[10px] text-slate-400 font-sans font-normal">/ 100</span>}
    </div>
  );
}
