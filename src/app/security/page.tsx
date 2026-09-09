import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Server, Cpu, AlertTriangle, Key } from "lucide-react";

export const metadata = {
  title: "Security & Compliance — Architecture Standards — VibeCheck",
  description: "Enterprise security architecture, SOC 2 Type II controls, SSRF defenses, and cryptographic verification.",
};

export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-neutral-800 text-sm">
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-700" strokeWidth={1.5} />
          <span>Trust, Assurance & Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
          Enterprise Security Architecture & Compliance
        </h1>
        <p className="text-xs text-neutral-500 font-mono">
          SOC 2 Type II Certified • ISO/IEC 27001 Aligned • Zero-Trust Remote Probes
        </p>
      </div>

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
            Scanning workers operate in ephemeral containers with kernel-level packet filtering, blocking all private IPv4/IPv6 subnets and cloud metadata endpoints.
          </p>
        </div>

        <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-1.5">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs uppercase tracking-wider">
            <Key className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
            <span>Role-Based Access (RBAC)</span>
          </div>
          <p className="text-xs text-neutral-600">
            Granular tenant segregation ensures organization data, scan history, and findings reports cannot cross tenant boundaries.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          Server-Side Request Forgery (SSRF) Defense Matrix
        </h2>
        <p className="text-neutral-600 leading-relaxed">
          When customers submit public URLs for automated security evaluation, our probe workers enforce multi-stage defense-in-depth:
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
                <td className="p-3 font-semibold text-neutral-900">Protocol Whitelist</td>
                <td className="p-3 font-mono">Strictly http: and https: only</td>
                <td className="p-3">Blocks file://, gopher://, dict://, redis:// URI scheme abuse</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Subnet Blacklist</td>
                <td className="p-3 font-mono">Blocks 127.0.0.0/8, 10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12</td>
                <td className="p-3">Prevents internal network port scanning & intranet reconnaissance</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-neutral-900">Metadata Isolation</td>
                <td className="p-3 font-mono">Explicit drop of 169.254.169.254 & metadata.google.internal</td>
                <td className="p-3">Prevents IAM instance credential exfiltration</td>
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
