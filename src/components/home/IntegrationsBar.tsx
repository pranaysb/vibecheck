import React from "react";
import { Terminal, Cpu, Sparkles, Layers, Box, Database, Globe } from "lucide-react";

export function IntegrationsBar() {
  const tools = [
    { name: "Cursor", category: "AI IDE" },
    { name: "Claude Code", category: "Agentic CLI" },
    { name: "Lovable", category: "Fullstack AI" },
    { name: "Bolt.new", category: "In-Browser WebContainers" },
    { name: "v0 by Vercel", category: "Generative UI" },
    { name: "Supabase", category: "Postgres & Auth" },
    { name: "Next.js", category: "React Framework" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
      <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
        Continuous Verification For Code Built With
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {tools.map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all text-xs font-semibold text-slate-800 shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span>{t.name}</span>
            <span className="text-[10px] text-slate-400 font-mono font-normal hidden sm:inline">
              ({t.category})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
