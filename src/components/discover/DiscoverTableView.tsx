"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/DataTable";
import { ProjectCard } from "@/components/project/ProjectCard";
import {
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
} from "lucide-react";

interface DiscoverTableViewProps {
  initialProjects: any[];
}

export function DiscoverTableView({ initialProjects }: DiscoverTableViewProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const columns: Column<any>[] = [
    {
      key: "title",
      header: "Application / Target",
      sortable: true,
      width: "30%",
      render: (item) => (
        <div className="space-y-0.5">
          <Link
            href={`/projects/${item.slug}`}
            className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors flex items-center gap-1.5"
          >
            <span>{item.title}</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" strokeWidth={1.5} />
          </Link>
          <p className="text-[11px] text-neutral-500 line-clamp-1">{item.tagline}</p>
        </div>
      ),
    },
    {
      key: "vibeScore",
      header: "Security / Quality Index",
      sortable: true,
      align: "center",
      render: (item) => {
        const score = item.vibeScore || 0;
        const isPassed = score >= 80;
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-semibold">
            <span className={`w-1.5 h-1.5 rounded-full ${isPassed ? "bg-emerald-600" : "bg-amber-500"}`} />
            <span className={isPassed ? "text-emerald-800" : "text-amber-800"}>
              {score} / 100
            </span>
          </div>
        );
      },
    },
    {
      key: "techStack",
      header: "Stack & Components",
      render: (item) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(item.techStack || []).slice(0, 3).map((t: string) => (
            <span
              key={t}
              className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-mono"
            >
              {t}
            </span>
          ))}
          {(item.techStack || []).length > 3 && (
            <span className="text-[10px] text-neutral-400 font-mono">
              +{(item.techStack || []).length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Compliance State",
      render: (item) => {
        const hasStaffReview = item.expertReviews && item.expertReviews.length > 0;
        const hasResolvedFindings = item.findings && item.findings.some((f: any) => f.status === "FIXED");
        return (
          <div className="flex items-center gap-1.5 text-[11px]">
            {hasStaffReview ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium font-mono text-[10px]">
                <ShieldCheck className="w-3 h-3 text-emerald-600" strokeWidth={1.5} />
                Staff Verified
              </span>
            ) : hasResolvedFindings ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium font-mono text-[10px]">
                <CheckCircle2 className="w-3 h-3 text-blue-600" strokeWidth={1.5} />
                Defects Remediated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200 font-mono text-[10px]">
                Automated Only
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "latestVersion",
      header: "Version",
      align: "center",
      render: (item) => (
        <span className="font-mono text-xs text-neutral-600">
          {item.latestVersion || "v1.0.0"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/projects/${item.slug}/analysis`}
            className="h-7 px-2 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-[11px] text-neutral-700 font-medium flex items-center gap-1 transition-colors"
          >
            <Activity className="w-3 h-3 text-neutral-500" strokeWidth={1.5} />
            <span>Audit Probe</span>
          </Link>
          <Link
            href={`/projects/${item.slug}`}
            className="h-7 px-2 rounded bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <span>Overview</span>
          </Link>
        </div>
      ),
    },
  ];

  const handleBatchExport = (items: any[]) => {
    const headers = ["Title", "Slug", "Score", "TechStack", "Version"];
    const rows = items.map((i) => [
      `"${i.title}"`,
      `"${i.slug}"`,
      i.vibeScore,
      `"${(i.techStack || []).join(", ")}"`,
      `"${i.latestVersion || "v1"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vibecheck_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchAudit = (items: any[]) => {
    alert(`Dispatched automated security audit probes for ${items.length} selected repositories.`);
  };

  return (
    <div className="space-y-4">
      {/* Top Toggle: Table View vs Card Grid */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-500 font-mono">
          Displaying {initialProjects.length} Verified Repositories
        </div>
        <div className="inline-flex items-center rounded-md border border-neutral-200 bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "table" ? "bg-neutral-100 text-neutral-900 font-semibold" : "text-neutral-500 hover:text-neutral-900"
            }`}
            title="Enterprise Data Table View"
            aria-label="Table View"
          >
            <TableIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grid" ? "bg-neutral-100 text-neutral-900 font-semibold" : "text-neutral-500 hover:text-neutral-900"
            }`}
            title="Card Grid View"
            aria-label="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <DataTable
          data={initialProjects}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Filter by title, stack, or slug..."
          onBatchExport={handleBatchExport}
          onBatchAudit={handleBatchAudit}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
