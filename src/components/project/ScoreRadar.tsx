import React from "react";
import { getScoreColor } from "@/lib/utils";
import { ShieldAlert, Sparkles, Layers, Cpu, Zap, Eye, BookOpen } from "lucide-react";

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
    { name: "Product & Clarity", score: product, icon: <Sparkles className="w-3.5 h-3.5 text-zinc-400" />, weight: "15%" },
    { name: "UX & Interaction", score: ux, icon: <Layers className="w-3.5 h-3.5 text-zinc-400" />, weight: "15%" },
    { name: "Engineering Rigor", score: engineering, icon: <Cpu className="w-3.5 h-3.5 text-zinc-400" />, weight: "20%" },
    { name: "Security & Headers", score: security, icon: <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />, weight: "20%" },
    { name: "Performance & LCP", score: performance, icon: <Zap className="w-3.5 h-3.5 text-zinc-400" />, weight: "15%" },
    { name: "Accessibility (a11y)", score: accessibility, icon: <Eye className="w-3.5 h-3.5 text-zinc-400" />, weight: "10%" },
    { name: "Documentation", score: documentation, icon: <BookOpen className="w-3.5 h-3.5 text-zinc-400" />, weight: "5%" },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-5 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">Category Breakdown</h3>
        <span className="text-[11px] text-zinc-500 font-mono">Weighted aggregate</span>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const sc = getScoreColor(cat.score);
          return (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <span className="font-medium text-zinc-300">{cat.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">({cat.weight})</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className={sc.text}>{cat.score}</span>
                  <span className="text-zinc-600 text-[10px]">/ 100</span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
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
    </div>
  );
}
