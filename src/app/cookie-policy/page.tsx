import React from "react";
import Link from "next/link";
import { Shield, Cookie, Settings2 } from "lucide-react";

export const metadata = {
  title: "Cookie Policy — Technical Cookie Inventory — VibeCheck",
  description: "Comprehensive tabular breakdown of all persistent and session cookies deployed across VibeCheck.",
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-neutral-800 text-sm">
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider">
          <Cookie className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
          <span>Technical Cookie Inventory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
          Enterprise Cookie & Storage Policy
        </h1>
        <p className="text-xs text-neutral-500 font-mono">
          Compliance Standard: ePrivacy Directive (Directive 2002/58/EC) & GDPR Art. 5(3) • Updated: September 9, 2026
        </p>
      </div>

      <p className="text-neutral-600 leading-relaxed">
        This document provides a transparent and exhaustive inventory of all HTTP cookies, local storage keys, and session tokens utilized by the VibeCheck platform. Users may inspect, modify, or revoke consent for optional categories at any time via our consent engine.
      </p>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-neutral-900">
          Exhaustive Cookie & Local Storage Register
        </h2>

        <div className="border border-neutral-200 rounded-md overflow-hidden bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-medium font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3">Identifier</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Category</th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Technical Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              <tr>
                <td className="p-3 font-mono font-semibold text-neutral-900">vc_session</td>
                <td className="p-3">vibecheck.dev (First-Party)</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 font-mono text-[10px]">Necessary</span></td>
                <td className="p-3 font-mono">Session (Browser close)</td>
                <td className="p-3">Maintains authenticated user session state over TLS 1.3</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-semibold text-neutral-900">__Host-csrf</td>
                <td className="p-3">vibecheck.dev (First-Party)</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 font-mono text-[10px]">Necessary</span></td>
                <td className="p-3 font-mono">14 Days</td>
                <td className="p-3">Cryptographic token preventing Cross-Site Request Forgery</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-semibold text-neutral-900">cookie_consent_status</td>
                <td className="p-3">LocalStorage (First-Party)</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 font-mono text-[10px]">Necessary</span></td>
                <td className="p-3 font-mono">365 Days</td>
                <td className="p-3">Stores granular user consent preferences for GDPR compliance</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-semibold text-neutral-900">vc_org_id</td>
                <td className="p-3">LocalStorage (First-Party)</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-mono text-[10px]">Functional</span></td>
                <td className="p-3 font-mono">180 Days</td>
                <td className="p-3">Remembers active organization/tenant context in enterprise nav</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-semibold text-neutral-900">vc_table_density</td>
                <td className="p-3">LocalStorage (First-Party)</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-mono text-[10px]">Functional</span></td>
                <td className="p-3 font-mono">180 Days</td>
                <td className="p-3">Retains table display density setting (Compact, Standard, Comfortable)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-semibold text-neutral-900">_vc_telemetry_id</td>
                <td className="p-3">vibecheck.dev (First-Party)</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[10px]">Performance</span></td>
                <td className="p-3 font-mono">30 Days</td>
                <td className="p-3">Samples anonymous API response times and TTFB edge metrics</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-semibold text-neutral-900">_vc_ref_source</td>
                <td className="p-3">vibecheck.dev (First-Party)</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-mono text-[10px]">Marketing</span></td>
                <td className="p-3 font-mono">90 Days</td>
                <td className="p-3">Measures referral conversion from partner developer marketplaces</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
