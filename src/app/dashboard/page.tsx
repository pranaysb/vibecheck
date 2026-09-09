"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/lib/auth/UserContext";
import Link from "next/link";
import {
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Activity,
  ExternalLink,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { TableSkeletonRows } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface DashboardProject {
  id: string;
  slug: string;
  title: string;
  vibeScore: number;
  versionsCount: number;
  reviewsCount: number;
  findingsCount: number;
  findings: Array<{
    id: string;
    severity: string;
    status: string;
  }>;
}

export default function DashboardPage() {
  const { currentUser } = useUser();
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          const userProjects = (data.projects || []).map((p: any) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            vibeScore: p.vibeScore,
            versionsCount: p.versions?.length || 1,
            reviewsCount: p.reviews?.length || 0,
            findingsCount: p.findings?.length || 0,
            findings: p.findings || [],
          }));
          setProjects(userProjects);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  const totalProjects = projects.length;
  const totalReviews = projects.reduce((sum, p) => sum + p.reviewsCount, 0);
  const totalIssuesFound = projects.reduce(
    (sum, p) => sum + p.findings.filter((f) => f.status === "OPEN").length,
    0
  );
  const totalIssuesFixed = projects.reduce(
    (sum, p) => sum + p.findings.filter((f) => f.status === "FIXED").length,
    0
  );
  const avgScore =
    totalProjects > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.vibeScore, 0) / totalProjects)
      : 0;

  const projectsNeedingAttention = projects
    .map((p) => {
      const openHigh = p.findings.filter(
        (f) => f.status === "OPEN" && (f.severity === "CRITICAL" || f.severity === "HIGH")
      ).length;
      return { project: p, highCount: openHigh };
    })
    .filter((item) => item.highCount > 0 || item.project.vibeScore < 80);

  const columns: Column<DashboardProject>[] = [
    {
      key: "title",
      header: "Repository / Application",
      sortable: true,
      width: "35%",
      render: (p) => (
        <div className="space-y-0.5">
          <Link
            href={`/projects/${p.slug}`}
            className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors flex items-center gap-1.5"
          >
            <span>{p.title}</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" strokeWidth={1.5} />
          </Link>
          <div className="text-[11px] text-neutral-400 font-mono">
            vibecheck.dev/projects/{p.slug}
          </div>
        </div>
      ),
    },
    {
      key: "vibeScore",
      header: "Security / Quality Index",
      sortable: true,
      align: "center",
      render: (p) => {
        const isPassed = p.vibeScore >= 80;
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-semibold">
            <span className={`w-1.5 h-1.5 rounded-full ${isPassed ? "bg-emerald-600" : "bg-amber-500"}`} />
            <span className={isPassed ? "text-emerald-800" : "text-amber-800"}>
              {p.vibeScore} / 100
            </span>
          </div>
        );
      },
    },
    {
      key: "versionsCount",
      header: "Releases",
      align: "center",
      sortable: true,
      render: (p) => (
        <span className="font-mono text-xs text-neutral-600">
          v{p.versionsCount}.0
        </span>
      ),
    },
    {
      key: "reviewsCount",
      header: "Peer Reviews",
      align: "center",
      sortable: true,
      render: (p) => (
        <span className="font-mono text-xs text-neutral-600">{p.reviewsCount}</span>
      ),
    },
    {
      key: "findingsCount",
      header: "Open Defects",
      align: "center",
      sortable: true,
      render: (p) => {
        const open = p.findings.filter((f) => f.status === "OPEN").length;
        return (
          <span
            className={`font-mono text-xs px-2 py-0.5 rounded ${
              open > 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "text-neutral-500"
            }`}
          >
            {open}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/projects/${p.slug}/analysis`}
            className="h-7 px-2.5 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-[11px] text-neutral-700 font-medium flex items-center gap-1 transition-colors"
          >
            <Activity className="w-3 h-3 text-neutral-500" strokeWidth={1.5} />
            <span>Audit Probe</span>
          </Link>
          <Link
            href={`/projects/${p.slug}`}
            className="h-7 px-2.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <span>Inspect</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left font-sans">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
            Enterprise Workspace
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mt-0.5 tracking-tight">
            Tenant Telemetry & Repositories
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Monitoring security posture, version evolution, and peer consensus across registered services.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="h-8 px-3 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto focus:ring-2 focus:ring-neutral-900 focus:outline-none"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>New Audit</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1 shadow-2xs">
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-medium">
            <FolderGit2 className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1.5} />
            <span>Services</span>
          </div>
          <div className="text-2xl font-semibold font-mono text-neutral-900">{totalProjects}</div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1 shadow-2xs">
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-medium">
            <MessageSquare className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1.5} />
            <span>Reviews</span>
          </div>
          <div className="text-2xl font-semibold font-mono text-neutral-900">{totalReviews}</div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1 shadow-2xs">
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" strokeWidth={1.5} />
            <span>Open Defects</span>
          </div>
          <div className="text-2xl font-semibold font-mono text-rose-700">{totalIssuesFound}</div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1 shadow-2xs">
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
            <span>Remediated</span>
          </div>
          <div className="text-2xl font-semibold font-mono text-emerald-700">{totalIssuesFixed}</div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1 shadow-2xs col-span-2 md:col-span-1">
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1.5} />
            <span>Average Index</span>
          </div>
          <div className="text-2xl font-semibold font-mono text-neutral-900">{avgScore} / 100</div>
        </div>
      </div>

      {/* Projects Needing Attention Banner */}
      {projectsNeedingAttention.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700" strokeWidth={1.5} />
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">
              Action Required: Priority Security Remediation ({projectsNeedingAttention.length})
            </h2>
          </div>

          <div className="space-y-2">
            {projectsNeedingAttention.map(({ project: p, highCount }) => (
              <div
                key={p.id}
                className="p-3 rounded-md bg-white border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${p.slug}`} className="font-semibold text-neutral-900 hover:text-neutral-700">
                      {p.title}
                    </Link>
                    <span className="px-1.5 py-0.2 rounded text-[11px] font-mono font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {p.vibeScore}/100
                    </span>
                  </div>
                  <div className="text-amber-800 text-[11px]">
                    {highCount > 0 ? `${highCount} high-priority security or performance defects open` : "Quality score below production standard (80)"}
                  </div>
                </div>

                <Link
                  href={`/projects/${p.slug}/analysis`}
                  className="h-7 px-3 rounded bg-amber-800 hover:bg-amber-900 text-white font-medium text-[11px] flex items-center justify-center transition-colors self-start sm:self-auto"
                >
                  Inspect Findings
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitored Repositories Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
            Monitored Services & Repositories
          </h2>
          <span className="text-xs text-neutral-500 font-mono">{projects.length} registered</span>
        </div>

        {loading ? (
          <div className="border border-neutral-200 rounded-lg bg-white">
            <TableSkeletonRows rows={4} cols={5} />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title="No Services Registered"
            description="Submit your first application deployment or repository URL to initiate continuous automated audits."
            action={{
              label: "New Audit",
              onClick: () => (window.location.href = "/projects/new"),
            }}
          />
        ) : (
          <DataTable
            data={projects}
            columns={columns}
            keyExtractor={(p) => p.id}
            searchPlaceholder="Filter monitored services..."
          />
        )}
      </div>
    </div>
  );
}
