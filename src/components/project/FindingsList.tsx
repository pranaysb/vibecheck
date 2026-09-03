"use client";

import React, { useState } from "react";
import { getSeverityBadge, formatDate } from "@/lib/utils";
import { FindingCategory, Severity, FindingStatus, Confidence } from "@prisma/client";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

export interface FindingItem {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  evidence?: string | null;
  recommendation: string;
  confidence: Confidence;
  status: FindingStatus;
  versionDiscovered: string;
  versionFixed?: string | null;
  fixedAt?: string | Date | null;
  createdAt: string | Date;
}

interface FindingsListProps {
  findings: FindingItem[];
  isCreator?: boolean;
  onStatusChange?: (findingId: string, newStatus: FindingStatus) => void;
}

export function FindingsList({ findings: initialFindings, isCreator = false, onStatusChange }: FindingsListProps) {
  const [findings, setFindings] = useState<FindingItem[]>(initialFindings);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggleStatus = async (finding: FindingItem) => {
    const nextStatus = finding.status === "OPEN" ? "FIXED" : "OPEN";
    setUpdatingId(finding.id);

    try {
      const res = await fetch(`/api/findings/${finding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setFindings((prev) =>
          prev.map((f) =>
            f.id === finding.id
              ? { ...f, status: nextStatus, fixedAt: nextStatus === "FIXED" ? new Date() : null }
              : f
          )
        );
        toast.success(nextStatus === "FIXED" ? "Finding marked as fixed!" : "Finding reopened.");
        if (onStatusChange) onStatusChange(finding.id, nextStatus as FindingStatus);
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = findings.filter((f) => {
    if (selectedCategory !== "ALL" && f.category !== selectedCategory) return false;
    if (selectedStatus !== "ALL" && f.status !== selectedStatus) return false;
    return true;
  });

  const criticalCount = findings.filter((f) => f.severity === "CRITICAL" && f.status === "OPEN").length;
  const highCount = findings.filter((f) => f.severity === "HIGH" && f.status === "OPEN").length;
  const fixedCount = findings.filter((f) => f.status === "FIXED").length;

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-bold font-mono">{criticalCount}</span> Critical
          </div>
          <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-md font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="font-bold font-mono">{highCount}</span> High priority
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold font-mono">{fixedCount}</span> Issues resolved
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1 text-[11px] text-zinc-300 font-medium focus:outline-none focus:border-white/20"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open only</option>
            <option value="FIXED">Resolved</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1 text-[11px] text-zinc-300 font-medium focus:outline-none focus:border-white/20"
          >
            <option value="ALL">All categories</option>
            <option value="SECURITY">Security</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="ACCESSIBILITY">Accessibility</option>
            <option value="DEPENDENCY">Dependencies</option>
            <option value="CODE_QUALITY">Code Quality</option>
            <option value="SEO">SEO</option>
          </select>
        </div>
      </div>

      {/* Findings items */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center border border-white/[0.08] rounded-2xl bg-[#0c0c0e] text-xs text-zinc-400">
            No findings match your current filter.
          </div>
        ) : (
          filtered.map((item) => {
            const sev = getSeverityBadge(item.severity);
            const isExpanded = expandedId === item.id;
            const isFixed = item.status === "FIXED";

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all shadow-xs hover:shadow-md ${
                  isFixed
                    ? "border-emerald-200/80 bg-emerald-50/20"
                    : item.severity === "CRITICAL"
                    ? "border-rose-200/90 bg-rose-50/20"
                    : "border-white/[0.08] bg-[#0c0c0e]"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors rounded-2xl"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sev.className}`}>
                        {sev.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 font-mono text-[10px] border border-white/[0.06]">
                        {item.category}
                      </span>
                      {isFixed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" /> Fixed in {item.versionFixed || "latest"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Found in {item.versionDiscovered}</span>
                      )}
                    </div>

                    <h4 className={`text-xs font-bold ${isFixed ? "line-through text-slate-400" : "text-white"}`}>
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-zinc-400 line-clamp-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCreator && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(item);
                        }}
                        disabled={updatingId === item.id}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all shadow-xs ${
                          isFixed
                            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            : "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {isFixed ? "Reopen" : "Mark as fixed"}
                      </button>
                    )}
                    <button className="text-slate-400 p-1 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-2 border-t border-slate-100 space-y-3.5 text-xs animate-in fade-in duration-100">
                    <div>
                      <span className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider block mb-1">
                        Full Description
                      </span>
                      <p className="text-slate-700 text-xs leading-relaxed">{item.description}</p>
                    </div>

                    {item.evidence && (
                      <div>
                        <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                          Evidence / Diagnostic Probe
                        </span>
                        <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 text-[11px] font-mono overflow-x-auto shadow-inner">
                          {item.evidence}
                        </pre>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                      <span className="font-semibold text-indigo-900 text-[11px] uppercase tracking-wider block">
                        Actionable Engineering Recommendation
                      </span>
                      <p className="text-slate-700 text-xs leading-relaxed">{item.recommendation}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Confidence: <strong className="text-slate-700">{item.confidence}</strong></span>
                      <span>Requires verification</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
