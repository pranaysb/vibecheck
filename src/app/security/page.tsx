import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Server, Cpu, AlertTriangle, Key, ArrowRight, Check } from "lucide-react";

export const metadata = {
  title: "Security & Architecture Standards — VibeCheck",
  description: "Enterprise security architecture, controls mapped to SOC 2 Trust Services Criteria, SSRF defenses, and cryptographic verification.",
};

export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-neutral-800 text-sm font-sans">
      {/* Top Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-700" strokeWidth={1.5} />
          <span>Trust, Assurance & Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
          Enterprise Security Architecture & Controls
        </h1>
        <p className="text-xs text-neutral-500 font-mono">
          Controls Mapped to SOC 2 Trust Services Criteria • Continuous Automated Self-Audit
        </p>
      </div>

      {/* Flagship Live Proof Banner */}
      <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
              Live Transparency
            </span>
            <span className="text-xs font-semibold text-neutral-900">VibeCheck Audits VibeCheck</span>
          </div>
          <p className="text-xs text-neutral-600">
            We do not manufacture credibility with unearned certifications. Instead, we publish continuous,
            cryptographically verifiable self-audits of our own production codebase.
          </p>
        </div>
        <Link
          href="/security/self-audit"
          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
        >
          <span>View Live Self-Audit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Core Architectural Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-1.5">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
            <span>Encryption Standards</span>
          </div>
          <p className="text-xs text-neutral-600">
            All data at rest is encrypted using <strong>AES-256</strong>. In transit, connections require <strong>TLS 1.3</strong> with strict Perfect Forward Secrecy.
          </p>
        </div>

        <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-1.5">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs uppercase tracking-wider">
            <Server className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
            <span>SSRF Sandbox Isolation</span>
          </div>
          <p className="text-xs text-neutral-600">
            Scanning workers execute in ephemeral containers with socket-level IP binding checks, disallowing connection reuse and DNS rebinding to private ranges.
          </p>
        </div>

        <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-1.5">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs uppercase tracking-wider">
            <Key className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
            <span>Tenant Isolation & RLS</span>
          </div>
          <p className="text-xs text-neutral-600">
            Postgres row-level security and tenant-scoped query binders guarantee organization data, scan history, and findings reports cannot cross boundaries.
          </p>
        </div>
      </div>

      {/* Delineating Remote Probe vs Deep Code Audit */}
      <section className="space-y-3 bg-white p-5 rounded-lg border border-neutral-200">
        <h2 className="text-base font-semibold text-neutral-900">
          Scope Delineation: Remote HTTP Probes vs. Deep Code Audits
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Honesty in security tooling is paramount. We explicitly delineate what automated remote URL probing can detect versus what requires deep repository and authenticated API analysis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-3.5 rounded-md bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>What Remote Probes Detect (Instant)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 text-[11px]">
              <li>Missing CSP, HSTS, X-Frame-Options, X-Content-Type headers</li>
              <li>TLS/SSL cipher suites and certificate expirations</li>
              <li>Exposed debugging routes and sensitive file disclosures</li>
              <li>CORS misconfigurations and cookie flag omissions</li>
              <li>Time-to-First-Byte (TTFB) and Core Web Vitals latency</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-md bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>What Deep Audits Verify (Repo + Auth)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 text-[11px]">
              <li>Broken Object-Level Authorization (BOLA / IDOR)</li>
              <li>Multi-tenant Row Level Security (RLS) leakage</li>
              <li>Hardcoded API tokens and secret leaks in git history</li>
              <li>Race conditions and business logic flaw testing</li>
              <li>Privilege escalation across role hierarchies</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SSRF Defense Matrix */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          Server-Side Request Forgery (SSRF) & Rebinding Defense Matrix
        </h2>
        <p className="text-neutral-600 text-xs leading-relaxed">
          When probe jobs are dispatched, workers enforce rigorous socket-level destination re-validation to prevent DNS rebinding and intranet traversal:
        </p>
        <div className="border border-neutral-200 rounded-md overflow-hidden bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-medium font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3">Defense Layer</th>
                <th className="p-3">Specification / Restriction</th>
                <th className="p-3">Mitigated Threat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Connection-Time DNS Re-check</td>
                <td className="p-3 font-mono">Custom agent hooks `lookup` & `createConnection`</td>
                <td className="p-3">Blocks DNS rebinding (TOCTOU attacks redirecting to 127.0.0.1)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Subnet Whitelist / Blacklist</td>
                <td className="p-3 font-mono">Blocks 127.0.0.0/8, 10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12, ::1, fc00::/7</td>
                <td className="p-3">Prevents internal network port scanning & intranet reconnaissance</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Metadata Isolation</td>
                <td className="p-3 font-mono">Explicit drop of 169.254.169.254 & metadata.google.internal</td>
                <td className="p-3">Prevents cloud IAM instance credential exfiltration</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Architectural Separation</td>
                <td className="p-3 font-mono">Control plane dispatches to ephemeral sandboxes with no customer secrets</td>
                <td className="p-3">Limits blast radius in the event of worker process compromise</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Timeout & Size Caps</td>
                <td className="p-3 font-mono">3,000ms hard socket timeout, 5MB body read cap</td>
                <td className="p-3">Guards against Slowloris and volumetric resource exhaustion</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Vulnerability Disclosure */}
      <section className="p-5 rounded-md border border-neutral-200 bg-neutral-50 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
          <span>Coordinated Vulnerability Disclosure Program</span>
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          We welcome security researchers and ethical auditors. If you identify a potential security defect in our platform or APIs:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-600">
          <li>Transmit your PGP-encrypted findings to <span className="font-mono font-semibold text-neutral-900">security@vibecheck.dev</span>.</li>
          <li>Include reproduction steps, request logs, and affected components.</li>
          <li>Allow 5 business days for our security incident response team to triage and acknowledge before public disclosure.</li>
        </ul>
      </section>
    </div>
  );
}
