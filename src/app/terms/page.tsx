import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          <FileText className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-mono text-indigo-600 uppercase font-semibold">Terms of Service</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">Last updated: September 2026</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using VibeCheck (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Authorized Auditing & Scanning</h2>
          <p>
            You agree to submit only URLs and repositories that you own, maintain, or have explicit authorization to inspect. Initiating automated scans against third-party systems without authorization is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Expert Review Marketplace</h2>
          <p>
            Expert audits ordered through VibeCheck are advisory professional reviews performed by independent senior software engineers. While our verified experts conduct rigorous security and architectural evaluations, software audits do not constitute a legal or contractual guarantee against all potential security exploits.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Disclaimer of Warranties</h2>
          <p>
            The service and automated analysis results are provided "as is" and "as available" without warranty of any kind, express or implied. VibeCheck disclaims all warranties including merchantability, fitness for a particular purpose, and non-infringement.
          </p>
        </section>
      </div>
    </div>
  );
}
