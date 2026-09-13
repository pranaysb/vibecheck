"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Palette,
  MousePointerClick,
  Compass,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Globe,
  Lock,
  Terminal,
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { ReportActions } from "./ReportActions";

export interface VibeCritique {
  id: string;
  pillar: "VISUAL_DESIGN_AMBIENCE" | "UI_BUTTON_CRAFT" | "PRODUCT_FLOW_USABILITY" | "RESPONSIVE_MOBILE" | "TECHNICAL_FOUNDATION";
  title: string;
  impact: "CRITICAL" | "HIGH" | "MEDIUM" | "POLISH" | "EXCELLENT";
  status: "PASSED" | "NEEDS_WORK" | "WARNING";
  summary: string;
  recommendation: string;
  codeSnippet?: string;
  detectedDetail?: string;
}

export interface ProductSnapshot {
  pageTitle: string;
  metaDescription: string;
  ogImage?: string;
  detectedFrameworks: string[];
  buttonCount: number;
  headingsHierarchy: { h1Count: number; h2Count: number; h3Count: number; sampleH1?: string };
  navigationDetected: boolean;
  footerDetected: boolean;
  colorPaletteHints: string[];
  fontFamilies: string[];
  hasHeroCTA: boolean;
}

export interface PillarScores {
  visualDesign: number;
  uiButtonCraft: number;
  productFlow: number;
  responsiveCraft: number;
  technicalFoundation: number;
}

export interface TechnicalFinding {
  id: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  risk: string;
  evidence?: string;
  curlCommand: string;
  remediation: {
    summary: string;
    nextJsConfig?: string;
    vercelConfig?: string;
    nginxConfig?: string;
  };
}

interface VibeReportViewerProps {
  report: {
    id: string;
    targetUrl: string;
    finalUrl: string;
    domain: string;
    ipAddress?: string | null;
    statusCode: number;
    score: number;
    grade: string;
    verdict: string;
    ttfbMs: number;
    hops: number;
    sha256Digest: string;
    createdAt: string | Date;
  };
  scores: PillarScores;
  productSnapshot?: ProductSnapshot | null;
  critiques: VibeCritique[];
  summaryFeedback: string[];
  technicalFindings: TechnicalFinding[];
}

export function VibeReportViewer({
  report,
  scores,
  productSnapshot,
  critiques,
  summaryFeedback,
  technicalFindings,
}: VibeReportViewerProps) {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [showTechDrilldown, setShowTechDrilldown] = useState(false);

  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    "A+": { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/30" },
    A: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/30" },
    B: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/30" },
    C: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/30" },
    D: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/30" },
    F: { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/30" },
  };

  const currentGradeColor = gradeColors[report.grade] || gradeColors.F;

  // Filter critiques
  const filteredCritiques = critiques.filter((c) => {
    if (activeTab !== "ALL" && c.pillar !== activeTab) return false;
    if (statusFilter === "NEEDS_WORK" && c.status === "PASSED") return false;
    if (statusFilter === "PASSED" && c.status !== "PASSED") return false;
    return true;
  });

  const needsWorkCount = critiques.filter((c) => c.status === "NEEDS_WORK" || c.status === "WARNING").length;
  const passedCount = critiques.filter((c) => c.status === "PASSED").length;

  const handleCopyCode = (id: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    toast.success("Snippet copied to clipboard!");
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans overflow-x-clip">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-neutral-900 transition-colors font-medium"
        >
          <span>← Back to Vibe Inspector</span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Product & UI/UX Audit Live</span>
        </div>
      </div>

      {/* 2. HERO AUDIT SCORE CARD */}
      <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-neutral-900 text-white font-mono text-[11px] font-semibold">
                HTTP {report.statusCode}
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs text-neutral-500 font-mono">
                {new Date(report.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs font-mono text-neutral-500">
                TTFB: {report.ttfbMs}ms
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight truncate">
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

        {/* Master Score Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Main VibeScore Card */}
          <div
            className={`p-6 rounded-xl border ${currentGradeColor.border} bg-neutral-950 text-white flex items-center gap-5 shadow-xs`}
          >
            <div className={`text-5xl font-black ${currentGradeColor.text} font-mono tracking-tight`}>
              {report.grade}
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>VibeScore</span>
              </div>
              <div className="text-2xl font-black font-mono">
                {report.score}
                <span className="text-xs text-neutral-400 font-normal">/100</span>
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">Weighted Craft Index</div>
            </div>
          </div>

          {/* Product Verdict Card */}
          <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1.5 flex flex-col justify-center">
            <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-500">
              Product Verdict
            </div>
            <div className="flex items-center gap-2">
              {report.score >= 80 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-bold font-mono text-neutral-900 truncate">
                {report.verdict}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              {needsWorkCount === 0
                ? "Immaculate craft. Zero priority UI defects detected."
                : `${needsWorkCount} actionable craft item(s) recommended for polish.`}
            </p>
          </div>

          {/* Interactive Controls & Buttons */}
          <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1.5 flex flex-col justify-center">
            <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-500">
              Interactive Surface
            </div>
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-neutral-700" />
              <span className="text-lg font-bold text-neutral-900 font-mono">
                {productSnapshot?.buttonCount ?? 0} Controls
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              {productSnapshot?.hasHeroCTA
                ? "Primary Call-To-Action above fold."
                : "No prominent Call-To-Action detected."}
            </p>
          </div>

          {/* Speed & Edge Health */}
          <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1.5 flex flex-col justify-center">
            <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-500">
              Perceived Speed
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-lg font-bold text-neutral-900 font-mono">
                {report.ttfbMs}ms TTFB
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              {report.ttfbMs < 400 ? "Sub-second instant load." : "Noticeable cold start delay."}
            </p>
          </div>
        </div>

        {/* Cryptographic Proof Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-neutral-500 bg-neutral-100/70 p-3 rounded-lg border border-neutral-200">
          <div className="flex items-center gap-2 truncate">
            <Lock className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            <span className="text-neutral-700 font-semibold">Integrity SHA-256:</span>
            <span className="text-neutral-900 truncate font-mono">{report.sha256Digest}</span>
          </div>
          <span className="shrink-0 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-[10px]">
            Verified Immutable
          </span>
        </div>
      </div>

      {/* 3. CRAFT PILLAR METERS */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
            5 Core Pillars of Product & UI/UX Craft
          </h2>
          <p className="text-xs text-neutral-500">
            Weighted evaluation scoring buttons, visual ambience, product flow, mobile ergonomics, and baseline infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Pillar 1: Visual Design */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                <span>Visual Design</span>
              </span>
              <span className="font-mono font-bold text-neutral-900">{scores.visualDesign}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${scores.visualDesign}%` }}
              />
            </div>
            <div className="text-[10px] text-neutral-500 flex justify-between">
              <span>Ambience & hierarchy</span>
              <span className="font-mono text-neutral-400">30% wt</span>
            </div>
          </div>

          {/* Pillar 2: UI & Buttons */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-sky-500" />
                <span>Buttons & UI</span>
              </span>
              <span className="font-mono font-bold text-neutral-900">{scores.uiButtonCraft}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-600 transition-all duration-500"
                style={{ width: `${scores.uiButtonCraft}%` }}
              />
            </div>
            <div className="text-[10px] text-neutral-500 flex justify-between">
              <span>CTAs, icons & forms</span>
              <span className="font-mono text-neutral-400">25% wt</span>
            </div>
          </div>

          {/* Pillar 3: Product Flow */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-500" />
                <span>Product Flow</span>
              </span>
              <span className="font-mono font-bold text-neutral-900">{scores.productFlow}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${scores.productFlow}%` }}
              />
            </div>
            <div className="text-[10px] text-neutral-500 flex justify-between">
              <span>Value prop & clarity</span>
              <span className="font-mono text-neutral-400">25% wt</span>
            </div>
          </div>

          {/* Pillar 4: Responsive & Mobile */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                <span>Mobile Craft</span>
              </span>
              <span className="font-mono font-bold text-neutral-900">{scores.responsiveCraft}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-600 transition-all duration-500"
                style={{ width: `${scores.responsiveCraft}%` }}
              />
            </div>
            <div className="text-[10px] text-neutral-500 flex justify-between">
              <span>Viewport & alt tags</span>
              <span className="font-mono text-neutral-400">10% wt</span>
            </div>
          </div>

          {/* Pillar 5: Technical Foundation */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>Tech Baseline</span>
              </span>
              <span className="font-mono font-bold text-neutral-900">{scores.technicalFoundation}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-600 transition-all duration-500"
                style={{ width: `${scores.technicalFoundation}%` }}
              />
            </div>
            <div className="text-[10px] text-neutral-500 flex justify-between">
              <span>Latency & transport</span>
              <span className="font-mono text-neutral-400">10% wt</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRODUCT SNAPSHOT INSPECTOR */}
      {productSnapshot && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-700" />
              <span>Extracted Product DOM Metadata</span>
            </h2>
            <span className="text-xs font-mono text-neutral-400">Real Scanned HTML</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="font-mono text-neutral-400 text-[10px] uppercase">Page Title Tag</div>
              <div className="font-medium text-neutral-900 truncate">
                {productSnapshot.pageTitle || "None detected"}
              </div>
            </div>

            <div className="space-y-1 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="font-mono text-neutral-400 text-[10px] uppercase">5-Second Value Pitch (Meta Description)</div>
              <div className="font-medium text-neutral-700 line-clamp-2">
                {productSnapshot.metaDescription || "No meta description declared."}
              </div>
            </div>

            <div className="space-y-1 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="font-mono text-neutral-400 text-[10px] uppercase">Detected Design Frameworks</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {productSnapshot.detectedFrameworks.length > 0 ? (
                  productSnapshot.detectedFrameworks.map((fw) => (
                    <span
                      key={fw}
                      className="px-2 py-0.5 rounded bg-neutral-200/70 text-neutral-800 font-mono text-[11px] font-medium"
                    >
                      {fw}
                    </span>
                  ))
                ) : (
                  <span className="text-neutral-500 italic">Custom CSS / Non-standard</span>
                )}
              </div>
            </div>

            <div className="space-y-1 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="font-mono text-neutral-400 text-[10px] uppercase">Heading Distribution</div>
              <div className="flex items-center gap-3 pt-1 font-mono text-neutral-700">
                <span>H1: <strong>{productSnapshot.headingsHierarchy.h1Count}</strong></span>
                <span>•</span>
                <span>H2: <strong>{productSnapshot.headingsHierarchy.h2Count}</strong></span>
                <span>•</span>
                <span>H3: <strong>{productSnapshot.headingsHierarchy.h3Count}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE CRITIQUE CARDS & FILTER TABS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Actionable UI, Button & Vibe Critiques ({filteredCritiques.length})
            </h2>
            <p className="text-xs text-neutral-500">
              Specific product feedback with recommended code fixes to elevate craft.
            </p>
          </div>

          {/* Status quick toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-medium shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === "ALL" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              All ({critiques.length})
            </button>
            <button
              onClick={() => setStatusFilter("NEEDS_WORK")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === "NEEDS_WORK"
                  ? "bg-rose-50 text-rose-800 border border-rose-200 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Attention ({needsWorkCount})
            </button>
            <button
              onClick={() => setStatusFilter("PASSED")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === "PASSED"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              High Craft ({passedCount})
            </button>
          </div>
        </div>

        {/* Pillar filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium no-scrollbar">
          {[
            { id: "ALL", label: "All Feedback", icon: Sparkles },
            { id: "VISUAL_DESIGN_AMBIENCE", label: "Visual & Ambience", icon: Palette },
            { id: "UI_BUTTON_CRAFT", label: "Buttons & UI", icon: MousePointerClick },
            { id: "PRODUCT_FLOW_USABILITY", label: "Product & Usability", icon: Compass },
            { id: "RESPONSIVE_MOBILE", label: "Mobile Polish", icon: Smartphone },
            { id: "TECHNICAL_FOUNDATION", label: "Tech Baseline", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-neutral-900 text-white font-semibold"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Critiques List */}
        <div className="space-y-3.5">
          {filteredCritiques.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-semibold text-neutral-900">No issues matching this filter</div>
              <p className="text-xs text-neutral-500">Every craft signal passed with high marks!</p>
            </div>
          ) : (
            filteredCritiques.map((critique) => {
              const isPassed = critique.status === "PASSED";
              const isWarning = critique.status === "WARNING";
              const isNeedsWork = critique.status === "NEEDS_WORK";

              let impactBadge = "bg-neutral-100 text-neutral-700 border-neutral-200";
              if (critique.impact === "CRITICAL") impactBadge = "bg-rose-50 text-rose-800 border-rose-200";
              else if (critique.impact === "HIGH") impactBadge = "bg-rose-50 text-rose-800 border-rose-200";
              else if (critique.impact === "MEDIUM") impactBadge = "bg-amber-50 text-amber-800 border-amber-200";
              else if (critique.impact === "EXCELLENT") impactBadge = "bg-emerald-50 text-emerald-800 border-emerald-200";

              return (
                <div
                  key={critique.id}
                  className={`rounded-xl border bg-white p-5 sm:p-6 space-y-3 transition-all ${
                    isNeedsWork
                      ? "border-rose-200/90 shadow-xs"
                      : isWarning
                      ? "border-amber-200"
                      : "border-neutral-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                      {isNeedsWork && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <h3 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
                        {critique.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${impactBadge}`}>
                        {critique.impact}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          isPassed
                            ? "bg-emerald-50 text-emerald-800"
                            : isWarning
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {critique.status === "PASSED" ? "High Craft" : critique.status === "WARNING" ? "Polish" : "Needs Work"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    {critique.summary}
                  </p>

                  {/* Recommendation block */}
                  <div className="text-xs text-neutral-800 bg-neutral-50 p-3 rounded-lg border border-neutral-200/80 space-y-1">
                    <div className="font-semibold text-neutral-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Recommended Action:</span>
                    </div>
                    <p className="text-neutral-600 leading-relaxed">{critique.recommendation}</p>
                  </div>

                  {/* Code snippet if present */}
                  {critique.codeSnippet && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Code className="w-3.5 h-3.5 text-neutral-600" />
                          <span>Implementation Fix:</span>
                        </span>
                        <button
                          onClick={() => handleCopyCode(critique.id, critique.codeSnippet!)}
                          className="hover:text-neutral-900 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedCodeId === critique.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy snippet</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs font-mono bg-neutral-950 text-neutral-200 p-3 rounded-lg overflow-x-auto border border-neutral-800">
                        <code>{critique.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. SUPPORTING TECHNICAL & SECURITY BASELINE (EXPANDABLE) */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
        <button
          onClick={() => setShowTechDrilldown(!showTechDrilldown)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neutral-700" />
              <h3 className="text-sm font-bold text-neutral-900 group-hover:text-neutral-950">
                Technical Foundation & Security Transport Hygiene
              </h3>
            </div>
            <p className="text-xs text-neutral-500">
              {technicalFindings.length} automated defensive probes (CSP, HSTS, XFO, public .env & .git checks).
            </p>
          </div>

          <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200 transition-colors">
            {showTechDrilldown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTechDrilldown && (
          <div className="pt-4 border-t border-neutral-100 space-y-3 animate-in fade-in">
            {technicalFindings.map((finding) => (
              <div
                key={finding.id}
                className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-neutral-900 flex items-center gap-2">
                    {finding.status === "PASSED" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span>{finding.title}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      finding.status === "PASSED" ? "bg-emerald-100/70 text-emerald-800" : "bg-amber-100/70 text-amber-800"
                    }`}
                  >
                    {finding.status}
                  </span>
                </div>
                <p className="text-neutral-600">{finding.description}</p>
                {finding.curlCommand && (
                  <pre className="text-[11px] font-mono bg-neutral-900 text-emerald-400 p-2 rounded overflow-x-auto">
                    <code>{finding.curlCommand}</code>
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. README EMBED BADGE & GITHUB INTEGRATION */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-neutral-900 tracking-tight">
          Embed Verified VibeScore Badge in GitHub README
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Prove your product craft, button usability, and visual ambience to contributors and visitors. The SVG shield updates automatically on every scan.
        </p>

        {/* Live SVG Badge Preview */}
        <div className="flex items-center gap-4 py-2">
          <span className="text-xs text-neutral-500 font-mono">Live Shield:</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/badge/${report.id}`}
            alt={`VibeCheck Audit: ${report.grade} (${report.score}/100)`}
            className="h-5"
          />
        </div>

        {/* Markdown Snippet */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-neutral-500">Markdown Badge Code:</div>
          <pre className="text-xs font-mono bg-neutral-950 text-neutral-200 p-3 rounded-lg overflow-x-auto border border-neutral-800">
            <code>{`[![VibeCheck Product & UI Audit](https://vibecheck-ten-omega.vercel.app/api/badge/${report.id})](https://vibecheck-ten-omega.vercel.app/report/${report.id})`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
