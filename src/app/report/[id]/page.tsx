import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Terminal,
  Clock,
  Globe,
  Share2,
  Lock,
  ArrowLeft,
  RotateCcw,
  Zap,
} from "lucide-react";
import { ReportActions } from "./ReportActions";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditReportPage({ params }: PageProps) {
  const { id } = await params;

  let report: any = null;
  try {
    report = await prisma.auditReport.findUnique({
      where: { id },
    });
  } catch (err) {
    console.error("Database query error on report page:", err);
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
          <Terminal className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">Audit Report Not Found</h1>
          <p className="text-sm text-neutral-600 max-w-md mx-auto">
            The requested audit record (ID: <code className="font-mono text-xs">{id}</code>) does not exist or has expired.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Run a New Audit</span>
        </Link>
      </div>
    );
  }

  const findings = Array.isArray(report.findings) ? report.findings : [];
  const passedCount = findings.filter((f: any) => f.status === "PASSED").length;
  const warningCount = findings.filter((f: any) => f.status === "WARNING").length;
  const failedCount = findings.filter((f: any) => f.status === "FAILED").length;
  const criticalCount = findings.filter((f: any) => f.status === "FAILED" && f.severity === "CRITICAL").length;

  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    "A+": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    A: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    B: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    C: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    D: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    F: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  };

  const currentGradeColor = gradeColors[report.grade] || gradeColors.F;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <Link href="/" className="inline-flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Inspector</span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>SSRF Sandboxed Audit</span>
        </div>
      </div>

      {/* Primary Header Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 font-mono text-[11px] font-semibold">
                {report.statusCode} OK
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-xs text-neutral-500 font-mono">
                {new Date(report.createdAt).toLocaleString()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">
              {report.domain}
            </h1>
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono truncate">
              <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <a
                href={report.finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-neutral-700 truncate"
              >
                {report.finalUrl}
              </a>
              <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
            </div>
          </div>

          <ReportActions reportId={report.id} targetUrl={report.targetUrl} sha256={report.sha256Digest} />
        </div>

        {/* Score & Verdict Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Grade Card */}
          <div className={`p-5 rounded-lg border ${currentGradeColor.border} ${currentGradeColor.bg} flex items-center gap-4`}>
            <div className={`text-4xl sm:text-5xl font-extrabold ${currentGradeColor.text} font-mono`}>
              {report.grade}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-500">Security Score</div>
              <div className="text-xl font-bold text-neutral-900 font-mono">{report.score}<span className="text-xs text-neutral-400">/100</span></div>
            </div>
          </div>

          {/* Verdict Card */}
          <div className="p-5 rounded-lg border border-neutral-200 bg-neutral-50/50 space-y-1">
            <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-500">Release Verdict</div>
            <div className="flex items-center gap-2">
              {report.verdict === "READY TO SHIP" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600" />
              )}
              <span className={`text-sm font-bold font-mono ${report.verdict === "READY TO SHIP" ? "text-emerald-800" : "text-rose-800"}`}>
                {report.verdict}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              {report.verdict === "READY TO SHIP"
                ? "Zero critical or high security defects detected."
                : `${criticalCount > 0 ? `${criticalCount} critical defect(s) require` : "Defects require"} immediate remediation.`}
            </p>
          </div>

          {/* TTFB Speed Metric */}
          <div className="p-5 rounded-lg border border-neutral-200 bg-neutral-50/50 space-y-1">
            <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-500">Response TTFB</div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-lg font-bold text-neutral-900 font-mono">{report.ttfbMs}ms</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              {report.ttfbMs < 600 ? "Excellent edge latency." : "High cold-start delay."}
            </p>
          </div>

          {/* Sandboxed Host IP */}
          <div className="p-5 rounded-lg border border-neutral-200 bg-neutral-50/50 space-y-1">
            <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-500">Resolved IP & Hops</div>
            <div className="text-sm font-bold text-neutral-900 font-mono truncate">
              {report.ipAddress || "Public"}
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              {report.hops === 0 ? "0 redirects" : `${report.hops} redirect hop(s)`}
            </p>
          </div>
        </div>

        {/* Cryptographic Digest Footnote */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-neutral-400 bg-neutral-50 p-2.5 rounded-md border border-neutral-200">
          <div className="flex items-center gap-1.5 truncate">
            <Lock className="w-3 h-3 text-neutral-500 shrink-0" />
            <span className="text-neutral-600 font-medium">SHA-256 Audit Digest:</span>
            <span className="text-neutral-800 truncate">{report.sha256Digest}</span>
          </div>
          <span className="shrink-0 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
            Verified Immutable
          </span>
        </div>
      </div>

      {/* Findings Breakdown List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">
            Security & Hygiene Findings ({findings.length})
          </h2>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {passedCount} Passed
            </span>
            {warningCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {warningCount} Warnings
              </span>
            )}
            {failedCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                {failedCount} Failed
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {findings.map((finding: any) => {
            const isPassed = finding.status === "PASSED";
            const isWarning = finding.status === "WARNING";
            const isFailed = finding.status === "FAILED";

            let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
            if (isWarning) badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
            if (isFailed) badgeColor = "bg-rose-50 text-rose-800 border-rose-200";

            return (
              <div
                key={finding.id}
                className={`rounded-lg border bg-white p-5 space-y-3 transition-all ${
                  isFailed ? "border-rose-200 shadow-xs" : isWarning ? "border-amber-200" : "border-neutral-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                    {isFailed && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <h3 className="text-sm font-semibold text-neutral-900">{finding.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${badgeColor}`}>
                      {finding.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[10px] font-mono border border-neutral-200">
                      {finding.severity}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {finding.description}
                </p>

                {finding.risk && (
                  <div className="text-xs text-neutral-700 bg-neutral-50/80 p-2.5 rounded border border-neutral-200/80">
                    <strong className="text-neutral-900 font-medium">Security Impact: </strong>
                    <span>{finding.risk}</span>
                  </div>
                )}

                {/* Evidence block */}
                {finding.evidence && (
                  <div className="text-xs font-mono bg-neutral-900 text-emerald-400 p-2.5 rounded overflow-x-auto">
                    <span className="text-neutral-400 select-none">Evidence: </span>
                    <span>{finding.evidence}</span>
                  </div>
                )}

                {/* Curl reproduction command */}
                {finding.curlCommand && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                      <span>Reproduce with curl:</span>
                    </div>
                    <pre className="text-xs font-mono bg-neutral-950 text-neutral-200 p-2.5 rounded overflow-x-auto selection:bg-neutral-800">
                      <code>{finding.curlCommand}</code>
                    </pre>
                  </div>
                )}

                {/* Remediation config */}
                {finding.remediation && (
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                    <div className="text-xs font-medium text-neutral-900 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Remediation Guidance:</span>
                    </div>
                    <p className="text-xs text-neutral-600">{finding.remediation.summary}</p>
                    {finding.remediation.nextJsConfig && (
                      <pre className="text-xs font-mono bg-neutral-100 text-neutral-800 p-2.5 rounded border border-neutral-200 overflow-x-auto">
                        <code>{finding.remediation.nextJsConfig}</code>
                      </pre>
                    )}
                    {finding.remediation.nginxConfig && (
                      <pre className="text-xs font-mono bg-neutral-100 text-neutral-800 p-2.5 rounded border border-neutral-200 overflow-x-auto">
                        <code>{finding.remediation.nginxConfig}</code>
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Embed Badge & CI/CD Gate Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-neutral-900">
          Embed Audit Badge in your GitHub README
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Showcase verified security status on your repository. The badge updates automatically on every scan.
        </p>

        {/* Live Badge Preview */}
        <div className="flex items-center gap-4 py-2">
          <span className="text-xs text-neutral-500 font-mono">Live Badge:</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/badge/${report.id}`}
            alt={`VibeCheck Security Audit: ${report.grade}`}
            className="h-5"
          />
        </div>

        {/* Markdown Snippet */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-neutral-500">Markdown Badge Code:</div>
          <pre className="text-xs font-mono bg-neutral-900 text-neutral-200 p-3 rounded-lg overflow-x-auto">
            <code>{`[![VibeCheck Audit](https://vibecheck-ten-omega.vercel.app/api/badge/${report.id})](https://vibecheck-ten-omega.vercel.app/report/${report.id})`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
