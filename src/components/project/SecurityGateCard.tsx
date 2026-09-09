"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface SecurityGateData {
  status: "PASSED" | "FAILED";
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  checks: {
    authentication: boolean;
    authorization: boolean;
    secrets: boolean;
    ssrf: boolean;
    dependencies: "PASS" | "WARN" | "FAIL";
  };
  failureReasons?: string[];
  lastAuditDate?: string;
  commitSha?: string;
  auditId?: string;
}

export function SecurityGateCard({
  gate,
  showActions = true,
}: {
  gate: SecurityGateData;
  showActions?: boolean;
}) {
  const isPassing = gate.status === "PASSED";

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        isPassing
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-rose-200 bg-rose-50/40"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isPassing
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}
          >
            {isPassing ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
                Deployment Gate
              </span>
              {gate.auditId && (
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200/70 px-1.5 py-0.5 rounded">
                  {gate.auditId}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <span>Verdict:</span>
              <span
                className={`font-mono font-bold ${
                  isPassing ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {isPassing ? "READY TO SHIP" : "NOT SAFE TO SHIP"}
              </span>
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              {isPassing
                ? "Zero critical or high-severity vulnerabilities detected across tested vectors."
                : "Deployment blocked: High or critical vulnerabilities must be resolved prior to production release."}
            </p>
          </div>
        </div>

        {/* Vulnerability Counter Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div
            className={`px-2.5 py-1 rounded border ${
              gate.criticalCount > 0
                ? "bg-rose-600 text-white border-rose-700 font-bold"
                : "bg-white text-neutral-600 border-neutral-200"
            }`}
          >
            CRITICAL: {gate.criticalCount}
          </div>
          <div
            className={`px-2.5 py-1 rounded border ${
              gate.highCount > 0
                ? "bg-amber-600 text-white border-amber-700 font-bold"
                : "bg-white text-neutral-600 border-neutral-200"
            }`}
          >
            HIGH: {gate.highCount}
          </div>
          <div className="px-2.5 py-1 rounded bg-white text-neutral-600 border border-neutral-200">
            MED: {gate.mediumCount}
          </div>
          <div className="px-2.5 py-1 rounded bg-white text-neutral-600 border border-neutral-200">
            LOW: {gate.lowCount}
          </div>
        </div>
      </div>

      {/* Vector Verification Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs font-mono">
        <div className="flex items-center justify-between p-2 rounded bg-white border border-neutral-200">
          <span className="text-neutral-600">Authn</span>
          {gate.checks.authentication ? (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5" /> PASS
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <X className="w-3.5 h-3.5" /> FAIL
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded bg-white border border-neutral-200">
          <span className="text-neutral-600">Authz/BOLA</span>
          {gate.checks.authorization ? (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5" /> PASS
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <X className="w-3.5 h-3.5" /> FAIL
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded bg-white border border-neutral-200">
          <span className="text-neutral-600">Secrets</span>
          {gate.checks.secrets ? (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5" /> PASS
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <X className="w-3.5 h-3.5" /> FAIL
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded bg-white border border-neutral-200">
          <span className="text-neutral-600">SSRF Guard</span>
          {gate.checks.ssrf ? (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5" /> PASS
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <X className="w-3.5 h-3.5" /> FAIL
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded bg-white border border-neutral-200">
          <span className="text-neutral-600">Deps Risk</span>
          {gate.checks.dependencies === "PASS" && (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5" /> PASS
            </span>
          )}
          {gate.checks.dependencies === "WARN" && (
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> WARN
            </span>
          )}
          {gate.checks.dependencies === "FAIL" && (
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <X className="w-3.5 h-3.5" /> FAIL
            </span>
          )}
        </div>
      </div>

      {/* Failure reasons if any */}
      {!isPassing && gate.failureReasons && gate.failureReasons.length > 0 && (
        <div className="mt-3.5 p-3 rounded-lg bg-rose-100/60 border border-rose-200 text-xs text-rose-900 space-y-1">
          <div className="font-semibold text-rose-950 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            <span>Gate Blocker Findings:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-rose-800">
            {gate.failureReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {showActions && (
        <div className="mt-4 pt-3 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-neutral-500 font-mono">
            {gate.commitSha && <span>Commit: {gate.commitSha.slice(0, 7)} • </span>}
            <span>Threshold: 0 Critical, 0 High</span>
          </div>
          {gate.auditId && (
            <Link
              href={`/verify/${gate.auditId}`}
              className="inline-flex items-center gap-1 font-medium text-neutral-900 hover:text-neutral-700 underline underline-offset-2"
            >
              <span>View Cryptographic Attestation</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
