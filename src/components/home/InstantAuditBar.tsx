"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe, Sparkles } from "lucide-react";

export function InstantAuditBar() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    router.push(`/projects/new?liveUrl=${encodeURIComponent(url.trim())}`);
  };

  const handleQuickDemo = (demoUrl: string) => {
    setUrl(demoUrl);
    router.push(`/projects/new?liveUrl=${encodeURIComponent(demoUrl)}`);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3 text-center">
      <form
        onSubmit={handleAudit}
        className="flex items-center p-1.5 rounded-xl border border-slate-300 bg-white shadow-lg shadow-slate-900/5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
      >
        <div className="pl-3 pr-2 text-slate-400">
          <Globe className="w-4 h-4" />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter your deployed URL (e.g. https://myapp.vercel.app)"
          className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <span>Run Audit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Quick Demo Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Or try a demo:
        </span>
        <button
          type="button"
          onClick={() => handleQuickDemo("https://campusconnect-demo.vercel.app")}
          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-mono transition-colors"
        >
          CampusConnect
        </button>
        <button
          type="button"
          onClick={() => handleQuickDemo("https://resumeforge-ai.vercel.app")}
          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-mono transition-colors"
        >
          ResumeForge
        </button>
        <button
          type="button"
          onClick={() => handleQuickDemo("https://flowstate-editor.vercel.app")}
          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-mono transition-colors"
        >
          FlowState
        </button>
      </div>
    </div>
  );
}
