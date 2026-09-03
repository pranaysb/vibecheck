"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Lock,
  Zap,
  Layers,
} from "lucide-react";

export function HeroProductWindow() {
  const [activeTab, setActiveTab] = useState<"audit" | "review" | "report">("audit");
  const [issueFixed, setIssueFixed] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden text-left transition-all">
      {/* Window Top Chrome Bar */}
      <div className="h-11 px-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400/80 border border-rose-500/20" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80 border border-amber-500/20" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80 border border-emerald-500/20" />
          <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
            vibecheck.dev/app/campusconnect
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Automated Audit</span>
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "review"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Code Review</span>
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "report"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Staff Sign-off</span>
          </button>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hidden sm:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Scan</span>
        </div>
      </div>

      {/* Tab 1: Automated Audit */}
      {activeTab === "audit" && (
        <div className="p-6 sm:p-8 space-y-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">CampusConnect Automated Health Audit</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-medium">
                  v3 Release
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scanned 42 endpoints, 18 HTTP headers, and 6 form routes via isolated headless crawler.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">Overall Vibe Score</div>
                <div className="text-3xl font-extrabold font-mono text-emerald-600">86 <span className="text-xs text-slate-400 font-normal">/ 100</span></div>
              </div>
            </div>
          </div>

          {/* Audit Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  Security & Headers
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">92/100</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Content-Security-Policy active
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Strict HSTS enabled (2 years)
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> X-Frame-Options: DENY
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  Performance & CWV
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">88/100</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> TTFB: 142ms (optimal)
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> LCP: 1.2s (passes CWV)
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Asset compression enabled
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Accessibility (a11y)
                </span>
                <span className="text-xs font-mono font-bold text-amber-600">79/100</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% buttons have aria-label
                </li>
                <li className="flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> 1 low contrast subtitle found
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Form inputs properly labelled
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Code Review & Diffs */}
      {activeTab === "review" && (
        <div className="p-6 sm:p-8 space-y-6 bg-white">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                alt="Sarah Jenkins"
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Sarah Jenkins</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
                    Staff Engineer @ ex-Stripe
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">Peer review on /api/checkout/session</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">Score Impact</div>
              <div className="text-sm font-mono font-bold text-emerald-600">
                {issueFixed ? "+12 points (Score: 88)" : "+0 points (Score: 76)"}
              </div>
            </div>
          </div>

          {/* Interactive Code Diff */}
          <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs overflow-x-auto text-slate-200 space-y-2">
            <div className="text-slate-400 text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>src/app/api/checkout/route.ts</span>
              <span className="text-rose-400">CRITICAL: IDOR vulnerability detected</span>
            </div>
            <div className="text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded">
              - const user = await db.user.findFirst(&#123; where: &#123; id: req.body.userId &#125; &#125;);
            </div>
            <div className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded">
              + const session = await auth();
            </div>
            <div className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded">
              + if (!session) return new Response("Unauthorized", &#123; status: 401 &#125;);
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Action:</span> Verify caller identity from secure session cookie before returning customer orders.
            </div>
            <button
              onClick={() => setIssueFixed(!issueFixed)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                issueFixed
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {issueFixed ? "✓ Resolved & Verified" : "Simulate 'Mark Fixed'"}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Staff Sign-Off Report */}
      {activeTab === "report" && (
        <div className="p-6 sm:p-8 space-y-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">Formal Engineering Review Sign-Off</h4>
              </div>
              <p className="text-xs text-slate-600">
                Project has passed verified manual review for authorization, schema hygiene, and rate-limiting.
              </p>
            </div>
            <div className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold text-center">
              AUDIT PASSED
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Auditor</span>
              <span className="font-semibold text-slate-900">David Vance</span>
              <span className="text-[10px] text-slate-500 block">Principal Architect</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Turnaround</span>
              <span className="font-semibold text-slate-900">28 Hours</span>
              <span className="text-[10px] text-emerald-600 block font-mono">Under SLA</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Security Scope</span>
              <span className="font-semibold text-slate-900">Full API + DB</span>
              <span className="text-[10px] text-slate-500 block">RLS policies verified</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Badge Verification</span>
              <span className="font-semibold text-slate-900">SHA-256 Valid</span>
              <span className="text-[10px] text-indigo-600 block font-mono">0x4f89...e2a1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
