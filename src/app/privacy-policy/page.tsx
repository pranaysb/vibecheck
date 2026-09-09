import React from "react";
import Link from "next/link";
import { Shield, Lock, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Enterprise Data Protection — VibeCheck",
  description: "Enterprise privacy statement adhering to GDPR (Regulation EU 2016/679) and CCPA standards.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-neutral-800 text-sm">
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider">
          <Shield className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
          <span>Compliance & Legal Standards</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
          Enterprise Privacy Policy
        </h1>
        <p className="text-xs text-neutral-500 font-mono">
          Document Version 2026.1 • Effective: September 1, 2026 • Last Reviewed: September 9, 2026
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
          <span>1. Data Controller & Governance</span>
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          VibeCheck Enterprise Systems, Inc. ("VibeCheck", "we", "us") acts as the Data Controller under Article 4(7) of the General Data Protection Regulation (GDPR) for platform account and telemetry data, and as a Data Processor under Article 28 for customer repository audits and code scans.
        </p>
        <div className="p-4 rounded-md border border-neutral-200 bg-white font-mono text-xs text-neutral-700 space-y-1">
          <div>Entity: VibeCheck Enterprise Systems, Inc.</div>
          <div>Data Protection Officer (DPO): dpo@vibecheck.dev</div>
          <div>EU Representative Office: 44 Rue de la Loi, 1040 Brussels, Belgium</div>
          <div>US Headquarters: 500 Howard Street, Suite 400, San Francisco, CA 94105</div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          2. Categories of Personal & Technical Data Collected
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          We collect and process only the minimal necessary data vectors required to execute security benchmarks, static analysis, and cryptographic audit proofs:
        </p>
        <div className="border border-neutral-200 rounded-md overflow-hidden bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-medium font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3">Data Category</th>
                <th className="p-3">Specific Elements</th>
                <th className="p-3">Collection Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              <tr>
                <td className="p-3 font-medium text-neutral-900">Identity & Credentials</td>
                <td className="p-3">Name, corporate email, OAuth identifier, workspace role</td>
                <td className="p-3">Authentication, RBAC access control, session state</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-neutral-900">Target Audit Metadata</td>
                <td className="p-3">Public endpoint URL, HTTP response headers, TTFB latency</td>
                <td className="p-3">Remote security validation, CSP/HSTS header compliance</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-neutral-900">Technical Telemetry</td>
                <td className="p-3">IP address (anonymized after 24h), user-agent, error traces</td>
                <td className="p-3">DDoS mitigation, SSRF loop prevention, audit logs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          3. Legal Basis for Processing (GDPR Art. 6 & CCPA)
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
          <li><strong>Contract Performance (Art. 6(1)(b)):</strong> Executing scheduled automated audits, providing score calculations, and delivering expert review deliverables.</li>
          <li><strong>Legitimate Interests (Art. 6(1)(f)):</strong> Maintaining SSRF filtering, defending cloud infrastructure against malicious payloads, and calculating anonymized aggregate performance metrics.</li>
          <li><strong>Legal Obligation (Art. 6(1)(c)):</strong> Retaining fiscal invoices, taxation compliance, and complying with lawful regulatory discovery.</li>
          <li><strong>Consent (Art. 6(1)(a)):</strong> Deploying functional and performance telemetry cookies via our Cookie Consent Engine.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          4. Authorized Infrastructure Sub-processors
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          In compliance with GDPR Article 28, all sub-processors have signed Standard Contractual Clauses (SCCs) and Data Processing Addendums (DPAs):
        </p>
        <div className="border border-neutral-200 rounded-md overflow-hidden bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-medium font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3">Sub-processor</th>
                <th className="p-3">Service Role</th>
                <th className="p-3">Data Location</th>
                <th className="p-3">Compliance Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Neon Inc.</td>
                <td className="p-3">Serverless PostgreSQL Cluster</td>
                <td className="p-3">US-East (AWS us-east-1)</td>
                <td className="p-3 font-mono">SOC 2 Type II, ISO 27001</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Vercel Inc.</td>
                <td className="p-3">Edge Compute & Global CDN</td>
                <td className="p-3">Global Edge Network</td>
                <td className="p-3 font-mono">SOC 2 Type II, GDPR SCC</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Amazon Web Services</td>
                <td className="p-3">Cloud Storage & Audit Archives</td>
                <td className="p-3">US-East (N. Virginia)</td>
                <td className="p-3 font-mono">FedRAMP, SOC 1/2/3</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          5. Data Retention & Cryptographic Deletion
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          Audit reports and scan outputs are stored for the duration of the active workspace subscription plus 90 days. Upon workspace de-provisioning or explicit tenant deletion request, all database records, findings tables, and audit logs are cryptographically erased using zero-fill overwrites within 30 days.
        </p>
      </section>

      <section className="p-4 rounded-md border border-neutral-200 bg-neutral-50 space-y-2">
        <h3 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
          Exercise Your GDPR / CCPA Rights
        </h3>
        <p className="text-xs text-neutral-600">
          To request data export (SAR), rectification, or complete erasure, transmit a signed request to our Data Protection Officer at{" "}
          <span className="font-mono font-medium text-neutral-900">dpo@vibecheck.dev</span>. We respond to all formal requests within 15 business days.
        </p>
      </section>
    </div>
  );
}
