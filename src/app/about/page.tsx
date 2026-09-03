import React from "react";
import Link from "next/link";
import { Terminal, ShieldCheck, Zap, Users, ArrowRight, CheckCircle2, Bot, Lock } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-xs text-xs font-mono font-medium">
          <Terminal className="w-3.5 h-3.5" />
          <span>Our Mission & Manifesto</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-sans tracking-tight">
          Don't just vibe code. <span className="text-indigo-600">Vibe check.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          AI code generation tools like Cursor, Claude Code, Lovable, and Bolt have reduced time-to-first-commit from weeks to hours. But rapid generation has created a quality vacuum.
        </p>
      </div>

      {/* The Problem Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
          The Problem with Pure Vibe-Coding
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          When prototypes look polished in 30 minutes, it is easy to assume they are production-ready. Yet AI-generated codebases frequently exhibit:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
            <span className="font-bold text-rose-400 block">Missing Authorization Boundaries</span>
            <p className="text-slate-600 leading-relaxed">
              API routes that trust user parameters without verifying caller session identity, exposing customer data to IDOR exploits.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
            <span className="font-bold text-orange-400 block">Severe Accessibility Omissions</span>
            <p className="text-slate-600 leading-relaxed">
              Buttons without accessible names, forms missing &lt;label&gt; tags, and disabled pinch-to-zoom that lock out disabled users.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
            <span className="font-bold text-amber-400 block">Performance & Payload Bloat</span>
            <p className="text-slate-600 leading-relaxed">
              Unoptimized full-resolution assets and missing cache headers that tank Largest Contentful Paint (LCP) on mobile devices.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
            <span className="font-bold text-cyan-400 block">No Verifiable Record of Improvement</span>
            <p className="text-slate-600 leading-relaxed">
              Developers fix bugs silently without building a public proof-of-work portfolio demonstrating engineering maturity.
            </p>
          </div>
        </div>
      </div>

      {/* The Core Loop */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900">The VibeCheck Solution</h2>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          VibeCheck provides the missing feedback loop: <strong>BUILD → SUBMIT → ANALYZE → GET FEEDBACK → FIX → RESUBMIT → IMPROVE → SHIP</strong>.
        </p>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Automated Static & Remote Safety Analysis:</strong>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Our scanner inspects TLS protocols, HTTP security headers (CSP, HSTS, X-Frame), accessibility landmarks, and response times in seconds without arbitrary server execution.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Structured Community Reviews:</strong>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Peers evaluate your app on Product, UX, Engineering, and Docs—providing concrete bug reports and voting on whether it is genuinely ready to ship.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Verified Expert Marketplace:</strong>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Connect with verified senior engineers (ex-Stripe, Staff Architects) for comprehensive written code audits and scalability debriefs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SSRF & Sandbox Security Architecture */}
      <div id="safety" className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Scanner Security & Anti-SSRF Architecture
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Treating security as a first-class citizen means protecting our own infrastructure as well as yours. Our URL analysis engine includes hard boundary defenses:
        </p>
        <ul className="space-y-2 text-xs text-slate-700">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Blocks loopback (127.0.0.1, ::1) and RFC 1918 private IP subnets.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Blocks AWS, Azure, and GCP link-local metadata endpoints (169.254.169.254).</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Validates all DNS A/AAAA records prior to dispatching HTTP requests.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enforces strict 4500ms timeouts and 2MB maximum payload caps.</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Ready to test your project?</h3>
          <p className="text-xs text-slate-600">Join the next generation of verified builders.</p>
        </div>
        <Link
          href="/projects/new"
          className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
        >
          Submit Project
        </Link>
      </div>
    </div>
  );
}
