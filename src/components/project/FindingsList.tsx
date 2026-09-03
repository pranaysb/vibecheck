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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-white/10 bg-slate-900/60 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-bold font-mono">{criticalCount}</span> Critical
          </div>
          <div className="flex items-center gap-1.5 text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="font-bold font-mono">{highCount}</span> High priority
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold font-mono">{fixedCount}</span> Issues resolved
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open only</option>
            <option value="FIXED">Resolved</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
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
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center border border-white/10 rounded-lg bg-slate-900/30 text-xs text-slate-500">
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
                className={`rounded-lg border transition-all ${
                  isFixed
                    ? "border-emerald-500/20 bg-emerald-950/10 opacity-80"
                    : item.severity === "CRITICAL"
                    ? "border-rose-500/40 bg-rose-950/15"
                    : "border-white/10 bg-slate-900/50"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${sev.className}`}>
                        {sev.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-white/5">
                        {item.category}
                      </span>
                      {isFixed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          <Check className="w-2.5 h-2.5" /> Fixed in {item.versionFixed || "latest"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Found in {item.versionDiscovered}</span>
                      )}
                    </div>

                    <h4 className={`text-xs font-semibold ${isFixed ? "line-through text-slate-400" : "text-slate-100"}`}>
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
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
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          isFixed
                            ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        {isFixed ? "Reopen" : "Mark as fixed"}
                      </button>
                    )}
                    <button className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3.5 pb-4 pt-1 border-t border-white/5 space-y-3 text-xs animate-in fade-in duration-100">
                    <div>
                      <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider block mb-1">
                        Full Description
                      </span>
                      <p className="text-slate-300 text-xs leading-relaxed">{item.description}</p>
                    </div>

                    {item.evidence && (
                      <div>
                        <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
                          Evidence / Diagnostic
                        </span>
                        <pre className="p-2.5 rounded bg-black/50 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                          {item.evidence}
                        </pre>
                      </div>
                    )}

                    <div className="p-3 rounded bg-slate-950/80 border border-white/5 space-y-1">
                      <span className="font-semibold text-emerald-400 text-[11px] uppercase tracking-wider block">
                        Actionable Recommendation
                      </span>
                      <p className="text-slate-300 text-xs leading-relaxed">{item.recommendation}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Confidence: <strong className="text-slate-400">{item.confidence}</strong></span>
                      <span>Requires manual verification</span>
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
