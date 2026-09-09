"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  GitPullRequest,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  GitCommit,
  Terminal,
  FileCode,
  RefreshCw,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function CIGatePage() {
  const [fixed, setFixed] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const toggleFix = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setFixed(!fixed);
      setIsEvaluating(false);
      if (!fixed) {
        toast.success("Fix committed (8f31a92): CI Gate passed and PR merge unlocked!");
      } else {
        toast.error("Reverted to vulnerable state: Merge blocked by CI Gate.");
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 pb-24 font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-neutral-200 py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Platform</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                  Continuous Integration
                </span>
                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
                  GitHub Check-Run Simulator
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                VibeCheck CI / PR Security Regression Gate
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                Automatically audit every pull request, detect authorization regressions before merge, and block unsafe releases.
              </p>
            </div>

            <button
              onClick={toggleFix}
              disabled={isEvaluating}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono flex items-center gap-2 shadow-2xs transition-colors self-start sm:self-auto ${
                fixed
                  ? "bg-neutral-200 hover:bg-neutral-300 text-neutral-800"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
              <span>{fixed ? "Simulate Reverting Fix" : "Simulate Committing Fix (8f31a92)"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Mock GitHub Pull Request Card */}
        <div className="rounded-xl border border-neutral-300 bg-white shadow-xs overflow-hidden">
          {/* PR Title Header */}
          <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-semibold">
                <GitPullRequest className="w-3.5 h-3.5" />
                Open
              </span>
              <span className="text-neutral-500 font-mono">
                <strong>alexrivera</strong> wants to merge 2 commits into <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">main</code> from <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">feature/orders-api-v2</code>
              </span>
            </div>

            <h2 className="text-lg font-bold text-neutral-900">
              PR #142: Refactor order lookup endpoint to support direct ID querying
            </h2>
          </div>

          {/* PR Body & Diff Preview */}
          <div className="p-5 space-y-4 text-xs">
            <div className="text-neutral-700 space-y-2">
              <p>
                This PR introduces direct order lookups by order ID to reduce latency on customer dashboard rendering.
              </p>
            </div>

            {/* Code Diff Display */}
            <div className="rounded-lg border border-neutral-200 overflow-hidden font-mono text-xs">
              <div className="bg-neutral-100 p-2.5 border-b border-neutral-200 text-neutral-600 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-neutral-800">src/app/api/orders/[id]/route.ts</span>
                <span>{fixed ? "Commit: 8f31a92 (Fixed)" : "Commit: 9a41c2d (Vulnerable)"}</span>
              </div>
              <div className="p-3 bg-neutral-950 text-neutral-200 space-y-1 overflow-x-auto text-[11px]">
                <div className="text-neutral-500">// GET /api/orders/[id]</div>
                <div className="text-neutral-400">export async function GET(req: Request, &#123; params &#125;) &#123;</div>
                <div className="text-neutral-400">  const &#123; id &#125; = await params;</div>
                {!fixed ? (
                  <>
                    <div className="bg-rose-950/80 text-rose-300 px-1 rounded">
                      - // VULNERABLE: Direct lookup without caller identity check (BOLA)
                    </div>
                    <div className="bg-rose-950/80 text-rose-300 px-1 rounded">
                      - const order = await db.order.findUnique(&#123; where: &#123; id &#125; &#125;);
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-emerald-950/80 text-emerald-300 px-1 rounded">
                      + // PROTECTED: Caller identity extracted from session cookie & tenant bounded
                    </div>
                    <div className="bg-emerald-950/80 text-emerald-300 px-1 rounded">
                      + const session = await getVerifiedSession(req);
                    </div>
                    <div className="bg-emerald-950/80 text-emerald-300 px-1 rounded">
                      + if (!session) return new Response("Unauthorized", &#123; status: 401 &#125;);
                    </div>
                    <div className="bg-emerald-950/80 text-emerald-300 px-1 rounded">
                      + const order = await db.order.findFirst(&#123; where: &#123; id, userId: session.userId &#125; &#125;);
                    </div>
                  </>
                )}
                <div className="text-neutral-400">  return Response.json(&#123; order &#125;);</div>
                <div className="text-neutral-400">&#125;</div>
              </div>
            </div>
          </div>

          {/* VibeCheck GitHub Status Check Widget */}
          <div className="p-5 border-t border-neutral-200 bg-neutral-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    fixed ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                  }`}
                >
                  {fixed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <span>VibeCheck Security Gate:</span>
                    <span className={fixed ? "text-emerald-700" : "text-rose-700"}>
                      {fixed ? "READY TO SHIP (All Checks Passed)" : "NOT SAFE TO SHIP (Merge Blocked)"}
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    Evaluation Engine v1.4.2 • Ruleset: owasp-asvs-l2-2026.09
                  </p>
                </div>
              </div>

              {/* Score Delta Indicator */}
              <div className="text-right font-mono text-xs">
                <div className="text-[10px] text-neutral-400 uppercase">Security Score Delta</div>
                {fixed ? (
                  <div className="font-bold text-emerald-700 text-sm">
                    94 ➔ 97 (+3 pts)
                  </div>
                ) : (
                  <div className="font-bold text-rose-700 text-sm">
                    94 ➔ 88 (-6 pts Regression)
                  </div>
                )}
              </div>
            </div>

            {/* Regression Finding Detail (if not fixed) */}
            {!fixed ? (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-mono font-bold">
                      HIGH SEVERITY
                    </span>
                    <span className="font-bold text-rose-950 font-sans">
                      Broken Object-Level Authorization (BOLA / IDOR)
                    </span>
                  </div>
                  <span className="font-mono text-rose-700 text-[11px]">Finding #VC-1842</span>
                </div>

                <p className="text-rose-900 leading-relaxed">
                  Endpoint <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">GET /api/orders/[id]</code> returns sensitive order records without verifying that the requesting user owns the order resource.
                </p>

                <div className="p-3 rounded bg-neutral-900 text-neutral-200 font-mono text-[11px] space-y-1">
                  <div className="text-neutral-500 uppercase text-[10px]">Reproducible Adversarial Evidence:</div>
                  <div className="text-rose-300">GET /api/orders/ord_9841 HTTP/1.1</div>
                  <div className="text-neutral-400">Cookie: session_user=user_attacker_123</div>
                  <div className="text-neutral-500 pt-1">HTTP/1.1 200 OK (Expected 401/403)</div>
                  <div className="text-emerald-400">&#123; "orderId": "ord_9841", "owner": "user_victim_789", "amount": 42000 &#125;</div>
                </div>

                <div className="text-rose-950 font-semibold flex items-center justify-between pt-1">
                  <span>Required Action: Validate caller session against order.userId before returning payload.</span>
                  <button
                    onClick={toggleFix}
                    className="px-3 py-1 rounded bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-mono font-bold"
                  >
                    Apply Fix
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-950 font-sans">
                    0 Critical • 0 High • Zero Regressions Detected
                  </span>
                </div>
                <p className="text-emerald-900">
                  AST static verification confirms caller identity check is enforced via <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">session.userId</code>.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/80 font-mono text-[11px] text-emerald-800">
                  <span>Attestation ID: VC-2026-001842</span>
                  <Link
                    href="/verify/campusconnect"
                    className="underline hover:text-emerald-950 flex items-center gap-1"
                  >
                    <span>View Cryptographic Certificate</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* GitHub Merge Button Simulation */}
            <div className="pt-3 flex items-center justify-between">
              <div className="text-xs text-neutral-500 font-mono">
                {fixed
                  ? "✓ Merging can be performed automatically."
                  : "✖ Merging is blocked until required status checks pass."}
              </div>
              <button
                disabled={!fixed}
                className={`px-4 py-2 rounded-md font-semibold text-xs transition-colors ${
                  fixed
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                }`}
              >
                Squash and merge
              </button>
            </div>
          </div>
        </div>

        {/* How It Works Architecture Box */}
        <div className="p-6 rounded-xl border border-neutral-200 bg-white space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Why the CI Regression Gate Matters</span>
          </h3>
          <p className="text-neutral-600 leading-relaxed">
            When teams build with AI assistants, code generation velocity multiplies. Developers frequently accept generated API handlers that omit ownership checks, introducing critical BOLA / IDOR flaws into production.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-[11px]">
            <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200">
              <span className="text-neutral-500 block">1. PR Trigger</span>
              <span className="font-semibold text-neutral-900 mt-1 block">GitHub Actions Webhook</span>
            </div>
            <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200">
              <span className="text-neutral-500 block">2. AST Analysis</span>
              <span className="font-semibold text-neutral-900 mt-1 block">Inspects Auth Middleware</span>
            </div>
            <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200">
              <span className="text-neutral-500 block">3. Merge Gate</span>
              <span className="font-semibold text-neutral-900 mt-1 block">Blocks Merge on Regression</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
