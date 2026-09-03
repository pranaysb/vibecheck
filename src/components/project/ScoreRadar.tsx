import React from "react";
import { getScoreColor } from "@/lib/utils";
import { Info, ShieldAlert, Sparkles, Layers, Cpu, Zap, Eye, BookOpen } from "lucide-react";

interface CategoryScore {
  name: string;
  score: number;
  icon: React.ReactNode;
  weight: string;
}

interface ScoreRadarProps {
  product: number;
  ux: number;
  engineering: number;
  security: number;
  performance: number;
  accessibility: number;
  documentation: number;
}

export function ScoreRadar({
  product,
  ux,
  engineering,
  security,
  performance,
  accessibility,
  documentation,
}: ScoreRadarProps) {
  const categories: CategoryScore[] = [
    { name: "Product & Clarity", score: product, icon: <Sparkles className="w-3.5 h-3.5 text-blue-400" />, weight: "15%" },
    { name: "UX & Interaction", score: ux, icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />, weight: "15%" },
    { name: "Engineering Rigor", score: engineering, icon: <Cpu className="w-3.5 h-3.5 text-purple-400" />, weight: "20%" },
    { name: "Security & Headers", score: security, icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />, weight: "20%" },
    { name: "Performance & LCP", score: performance, icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, weight: "15%" },
    { name: "Accessibility (a11y)", score: accessibility, icon: <Eye className="w-3.5 h-3.5 text-emerald-400" />, weight: "10%" },
    { name: "Documentation", score: documentation, icon: <BookOpen className="w-3.5 h-3.5 text-slate-400" />, weight: "5%" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Category Breakdown</h3>
        <span className="text-[11px] text-slate-500 font-mono">Weighted aggregate</span>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const sc = getScoreColor(cat.score);
          return (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <span className="font-medium text-slate-300">{cat.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({cat.weight})</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className={sc.text}>{cat.score}</span>
                  <span className="text-slate-600 text-[11px]">/100</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.score}%`,
                    backgroundColor: sc.accent,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-white/5 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p>
          The Vibe Score is an aggregate indicator based on automated checks and community feedback. It is not a guarantee of security or production readiness.
        </p>
      </div>
    </div>
  );
}
