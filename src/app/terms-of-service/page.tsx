import React from "react";
import Link from "next/link";
import { FileText, ShieldAlert, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Enterprise Agreement — VibeCheck",
  description: "Enterprise Service Level Agreement, Acceptable Use Policy, and Terms of Service.",
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-neutral-800 text-sm">
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
          <span>Contractual Agreement</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
          Master Enterprise Terms of Service
        </h1>
        <p className="text-xs text-neutral-500 font-mono">
          Agreement Version 2026.1 • Effective: September 1, 2026 • Governing Law: State of Delaware
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          1. Service Level Agreement (SLA) & Uptime Commitments
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          VibeCheck guarantees a minimum Monthly Uptime Percentage of <strong>99.95%</strong> for all Enterprise and Pro tier tenants across the Core Scanning Engine, Remote Probe API, and Dashboard access.
        </p>
        <div className="border border-neutral-200 rounded-md overflow-hidden bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-medium font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3">Monthly Uptime Percentage</th>
                <th className="p-3">Service Credit Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              <tr>
                <td className="p-3 font-mono">99.0% - 99.95%</td>
                <td className="p-3 font-mono">10% of monthly subscription fee</td>
              </tr>
              <tr>
                <td className="p-3 font-mono">95.0% - 98.99%</td>
                <td className="p-3 font-mono">25% of monthly subscription fee</td>
              </tr>
              <tr>
                <td className="p-3 font-mono">&lt; 95.0%</td>
                <td className="p-3 font-mono">50% of monthly subscription fee</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          2. Acceptable Use Policy (AUP) & Prohibited Targets
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          Customers warrant that they possess explicit authorization to execute remote audits against any submitted deployment URL or domain. The following actions strictly violate platform use:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-neutral-600 text-xs">
          <li>Initiating audits against domains or infrastructure without verified administrative ownership.</li>
          <li>Circumventing SSRF isolation guards to probe internal subnets (e.g., 10.0.0.0/8, 169.254.169.254, 127.0.0.0/8).</li>
          <li>Utilizing automated audit endpoints to orchestrate volumetric Denial of Service (DoS) attacks.</li>
          <li>Falsifying cryptographic proof signatures or tampering with exported audit reports.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          3. Intellectual Property & Customer Ownership
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          Customer retains full and exclusive ownership of all source code, proprietary algorithms, architecture documentation, and generated audit deliverables. VibeCheck asserts zero copyright or IP claims over customer software inspected by our engine.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          4. Limitation of Liability & Warranty Disclaimer
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          Except in cases of gross negligence or willful misconduct, VibeCheck's total cumulative liability arising from this agreement shall not exceed the total fees paid by Customer during the twelve (12) months preceding the claim.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          5. Binding Arbitration & Class Action Waiver
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          Any dispute, controversy, or claim arising out of or relating to this contract shall be settled by binding arbitration administered by the American Arbitration Association (AAA) in accordance with its Commercial Arbitration Rules, conducted in Wilmington, Delaware.
        </p>
      </section>
    </div>
  );
}
