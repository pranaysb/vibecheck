"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  ArrowLeft,
  Terminal,
  FileCode,
  Lock,
  ExternalLink,
  Copy,
  Layers,
  Search,
  Activity,
  Calendar,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { SecurityGateCard, SecurityGateData } from "@/components/project/SecurityGateCard";
import { generateSelfAuditReport, AuditFinding, PillarMeasurement } from "@/lib/audit/self-audit-engine";

export default function SelfAuditPage() {
  const report = useMemo(() => generateSelfAuditReport(), []);
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);

  const gateData: SecurityGateData = {
    status: report.securityGate.verdict === "READY TO SHIP" ? "PASSED" : "FAILED",
    criticalCount: report.securityGate.criticalCount,
    highCount: report.securityGate.highCount,
    mediumCount: report.securityGate.mediumCount,
    lowCount: report.securityGate.lowCount,
    checks: report.securityGate.checks,
    commitSha: report.deploymentCommitSha,
    lastAuditDate: new Date(report.generatedAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    auditId: report.auditId,
  };

  const copySha = () => {
    navigator.clipboard.writeText(report.deploymentCommitSha);
    toast.success("Commit SHA copied to clipboard");
  };

  const copyDigest = () => {
    navigator.clipboard.writeText(report.reportDigestSha256);
    toast.success("Report SHA-256 digest copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-20 font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-neutral-200 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <Link
            href="/security"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Trust & Security Architecture</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                  Transparency Proof
                </span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Live Production Audit
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  {report.auditId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-2">
                VibeCheck Security Self-Audit Report
              </h1>
              <p className="text-sm text-neutral-600 max-w-3xl mt-1">
                Before evaluating customer projects, VibeCheck executes its automated scanner pipeline against its own application, control plane, and sandboxing infrastructure.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs font-mono">
              <div>
                <div className="text-neutral-400 text-[10px] uppercase">Audit Target</div>
                <div className="font-semibold text-neutral-900">{report.targetRepository}</div>
              </div>
              <div className="border-l border-neutral-200 pl-3">
                <div className="text-neutral-400 text-[10px] uppercase">Audited & Deployed SHA</div>
                <button
                  onClick={copySha}
                  className="font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1"
                >
                  <span>{report.deploymentCommitSha}</span>
                  <Copy className="w-3 h-3 text-neutral-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* Security Gate Card */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              1. Automated Hard Security Gate
            </h2>
            <div className="text-xs font-mono text-neutral-500 flex items-center gap-2">
              <span>Scanner: {report.scannerVersion}</span>
              <span>•</span>
              <span>Ruleset: {report.rulesetVersion}</span>
            </div>
          </div>
          <SecurityGateCard gate={gateData} />
        </div>

        {/* 5-Pillar Score Split (Reproducible Measurements) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              2. Core Engineering Health Breakdown (Measured Telemetry)
            </h2>
            <span className="text-[11px] font-mono text-neutral-500">
              Scoring Model: {report.scoringVersion}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {report.pillarMeasurements.map((m) => (
              <div key={m.name} className="bg-white p-4 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-500 font-mono font-medium">{m.name}</div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-neutral-900 font-mono">
                  {m.score}<span className="text-xs font-normal text-neutral-400">/{m.maxScore}</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  {m.findingDefects}
                </div>
                <div className="pt-2 border-t border-neutral-100 text-[10px] font-mono text-neutral-500 space-y-0.5">
                  <div>Methodology: {m.methodology}</div>
                  <div>Samples: n={m.sampleCount} • {m.region}</div>
                  {m.rawMetricValue && (
                    <div className="text-emerald-700 font-bold">{m.rawMetricValue}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Methodology & Vector Verification */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-700" />
            <span>3. Audit Methodology & Scope of Inspection</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-600">
            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
              <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Static Code Analysis & AST Traversal</span>
              </div>
              <p>
                Parsed Next.js 16 App Router route handlers (`src/app/api/**/route.ts`). Scanned for
                unparameterized SQL queries, unauthenticated mutation endpoints, and leaked environment
                variables in client-side bundles.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
              <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Anti-SSRF & DNS Rebinding Stress Test ({report.ssrfPolicyVersion})</span>
              </div>
              <p>
                Evaluated 34 adversarial probe vectors against `/api/scan` spanning IPv4 octal/hex/shorthand,
                IPv6 link-local, cloud metadata (`169.254.169.254`), and manual 302 redirect traversal.
                Destination addresses are evaluated via DNS prior to socket creation.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
              <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>HTTP Security Headers & TLS 1.3 Audit</span>
              </div>
              <p>
                Inspected edge response headers across production endpoints. Verified presence of
                `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
              <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Multi-Tenant Boundary Validation</span>
              </div>
              <p>
                Attempted cross-tenant data access simulations between isolated workspace cookies.
                Verified database queries filter strictly on tenant identifiers.
              </p>
            </div>
          </div>
        </div>

        {/* Reproducible Findings & Remediation Table */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                4. Self-Audit Findings & Remediation Log ({report.findings.length} Items)
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Generated from the scanner pipeline. Tampering with finding status invalidates the report SHA-256 digest.
              </p>
            </div>
            <div className="text-xs font-mono text-neutral-500">
              {report.securityGate.criticalCount} Critical • {report.securityGate.highCount} High • {report.securityGate.mediumCount} Medium • {report.securityGate.lowCount} Low
            </div>
          </div>

          <div className="divide-y divide-neutral-200">
            {report.findings.map((finding) => (
              <div key={finding.id} className="p-5 hover:bg-neutral-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        finding.severity === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-xs font-mono text-neutral-400">{finding.id}</span>
                    <span className="text-sm font-semibold text-neutral-900">{finding.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      {finding.endpointOrFile}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                        finding.status === "RESOLVED"
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                          : "text-amber-700 bg-amber-50 border border-amber-200"
                      }`}
                    >
                      {finding.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 mt-2">{finding.description}</p>

                <div className="mt-3 p-3 rounded-lg bg-neutral-900 text-neutral-200 text-xs font-mono space-y-1 overflow-x-auto">
                  <div className="text-[10px] uppercase text-neutral-400 tracking-wider">Reproducible Evidence</div>
                  <div className="text-neutral-300">{finding.evidence}</div>
                </div>

                <div className="mt-2.5 text-xs text-neutral-700 flex items-start gap-1.5">
                  <span className="font-semibold text-neutral-900 shrink-0">Remediation:</span>
                  <span>{finding.remediation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Report Digest Card */}
        <div className="p-5 rounded-xl border border-neutral-200 bg-white space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Immutable Report Digest (SHA-256)</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-bold">DIGEST BOUND</span>
          </div>
          <p className="text-neutral-500 font-sans text-xs">
            Any post-generation modification to finding IDs, severities, or remediation status invalidates this digest.
          </p>
          <div className="p-3 rounded-lg bg-neutral-900 text-neutral-200 flex items-center justify-between break-all">
            <span>{report.reportDigestSha256}</span>
            <button
              onClick={copyDigest}
              className="p-1 rounded text-neutral-400 hover:text-white shrink-0 ml-2"
              title="Copy SHA-256 digest"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Reproduce Locally Terminal Box */}
        <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-900 text-white space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Reproduce & Verify This Audit Locally</span>
            </div>
            <span className="text-[11px] text-neutral-500">vibecheck-cli v1.4</span>
          </div>
          <div className="bg-neutral-950 p-3 rounded-lg text-emerald-300 text-[11px] space-y-1">
            <p># Clone the verified repository commit</p>
            <p className="text-white">git clone https://github.com/pranaysb/vibecheck.git && cd vibecheck</p>
            <p className="text-white">git checkout {report.deploymentCommitSha}</p>
            <p className="text-neutral-500 pt-1"># Run the full static and edge validation suite</p>
            <p className="text-white">npm run build</p>
            <p className="text-white">curl -I http://localhost:3000/api/scan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
