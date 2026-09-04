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
              ? {
                  ...f,
                  status: nextStatus as FindingStatus,
                  versionFixed: nextStatus === "FIXED" ? "v2" : null,
                  fixedAt: nextStatus === "FIXED" ? new Date() : null,
                }
              : f
          )
        );
        toast.success(
          nextStatus === "FIXED"
            ? "Issue marked as resolved! Project score recalculated."
            : "Issue reopened."
        );
        if (onStatusChange) onStatusChange(finding.id, nextStatus as FindingStatus);
      } else {
        toast.error("Failed to update status.");
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

  const openCount = findings.filter((f) => f.status === "OPEN").length;
  const fixedCount = findings.filter((f) => f.status === "FIXED").length;

  return (
    <div className="space-y-4 text-left">
      {/* Top summary & filters bar */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{openCount} Open issues</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{fixedCount} Resolved</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open only</option>
            <option value="FIXED">Resolved</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
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
          <div className="p-8 text-center border border-slate-200 rounded-2xl bg-white text-xs text-slate-500">
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
                className={`rounded-2xl border transition-all shadow-xs hover:shadow-sm ${
                  isFixed
                    ? "border-emerald-200 bg-emerald-50/20"
                    : item.severity === "CRITICAL"
                    ? "border-rose-200 bg-rose-50/30"
                    : "border-slate-200 bg-white"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-2xl"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sev.className}`}>
                        {sev.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono border border-slate-200">
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

                    <h4 className={`text-xs font-bold ${isFixed ? "line-through text-slate-400" : "text-slate-900"}`}>
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Mark as Fixed Simulator */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(item);
                      }}
                      disabled={updatingId === item.id}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isFixed
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                      }`}
                    >
                      {updatingId === item.id ? "Updating..." : isFixed ? "Reopen" : "Mark as Fixed"}
                    </button>

                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50 rounded-b-2xl text-xs">
                    {item.evidence && (
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                          Inspection Evidence & Header Context:
                        </span>
                        <pre className="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                          {item.evidence}
                        </pre>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                        Remediation Recommendation:
                      </span>
                      <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                        {item.recommendation}
                      </p>
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
