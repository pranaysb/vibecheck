import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-left">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 mb-2 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-mono text-indigo-600 uppercase font-semibold">Legal & Transparency</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">Last updated: September 2026</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            When you use VibeCheck to audit or review an application, we collect publicly accessible metadata about the target URL (such as HTTP response headers, response latency, TLS certificates, and public markup). We do not inspect private or authenticated intranet resources.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Security & Scanning Crawler Safety</h2>
          <p>
            Our automated scanner operates with strict Server-Side Request Forgery (SSRF) protections. We reject internal IP ranges (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, AWS metadata 169.254.169.254). We identify ourselves via the standard User-Agent: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-xs">VibeCheck-Security-Scanner/1.0</code>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Public Submissions & Reviews</h2>
          <p>
            Submissions submitted publicly on VibeCheck are visible to community reviewers. Project creators maintain full ownership and intellectual property of their codebases. Peer reviews and expert feedback submitted on the platform are licensed under standard community open-attribution terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Contact & Inquiries</h2>
          <p>
            For questions regarding data processing, vulnerability reports, or deletion requests, contact our security and engineering team at <strong className="text-slate-900">security@vibecheck.dev</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
