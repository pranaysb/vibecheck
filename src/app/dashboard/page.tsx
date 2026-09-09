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
  ShieldCheck,
  ShieldAlert,
  Activity,
  ExternalLink,
  Clock,
  GitBranch,
  Layers,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { TableSkeletonRows } from "@/components/ui/Skeleton";
import { SecurityGateCard, SecurityGateData } from "@/components/project/SecurityGateCard";

interface DashboardProject {
  id: string;
  slug: string;
  title: string;
  vibeScore: number;
  versionsCount: number;
  reviewsCount: number;
  findingsCount: number;
  gateStatus: "READY TO SHIP" | "NOT SAFE TO SHIP";
  findings: Array<{
    id: string;
    severity: string;
    status: string;
  }>;
}

const DEFAULT_SANDBOX_PROJECTS: DashboardProject[] = [
  {
    id: "proj-1",
    slug: "campusconnect",
    title: "CampusConnect Portal",
    vibeScore: 86,
    versionsCount: 3,
    reviewsCount: 4,
    findingsCount: 5,
    gateStatus: "READY TO SHIP",
    findings: [
      { id: "f1", severity: "HIGH", status: "FIXED" },
      { id: "f2", severity: "MEDIUM", status: "FIXED" },
      { id: "f3", severity: "LOW", status: "OPEN" },
    ],
  },
  {
    id: "proj-2",
    slug: "auth-gateway",
    title: "Identity & Session Gateway",
    vibeScore: 94,
    versionsCount: 2,
    reviewsCount: 6,
    findingsCount: 3,
    gateStatus: "READY TO SHIP",
    findings: [
      { id: "f4", severity: "CRITICAL", status: "FIXED" },
      { id: "f5", severity: "HIGH", status: "FIXED" },
    ],
  },
  {
    id: "proj-3",
    slug: "trade-settlement-api",
    title: "Trade Settlement Service",
    vibeScore: 68,
    versionsCount: 1,
    reviewsCount: 2,
    findingsCount: 4,
    gateStatus: "NOT SAFE TO SHIP",
    findings: [
      { id: "f6", severity: "HIGH", status: "OPEN" },
      { id: "f7", severity: "MEDIUM", status: "OPEN" },
    ],
  },
];

export default function DashboardPage() {
  const { currentUser } = useUser();
  const [projects, setProjects] = useState<DashboardProject[]>(DEFAULT_SANDBOX_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [isSandboxDemo, setIsSandboxDemo] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          if (data.projects && data.projects.length > 0) {
            const userProjects = data.projects.map((p: any) => {
              const hasOpenHighOrCrit = (p.findings || []).some(
                (f: any) =>
                  f.status === "OPEN" && (f.severity === "CRITICAL" || f.severity === "HIGH")
              );
              return {
                id: p.id,
                slug: p.slug,
                title: p.title,
                vibeScore: p.vibeScore,
                versionsCount: p.versions?.length || 1,
                reviewsCount: p.reviews?.length || 0,
                findingsCount: p.findings?.length || 0,
                gateStatus: hasOpenHighOrCrit ? "NOT SAFE TO SHIP" : "READY TO SHIP",
                findings: p.findings || [],
              };
            });
            setProjects(userProjects);
            setIsSandboxDemo(false);
          }
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
  const passingGates = projects.filter((p) => p.gateStatus === "READY TO SHIP").length;
  const blockedGates = projects.filter((p) => p.gateStatus === "NOT SAFE TO SHIP").length;
  const totalOpenDefects = projects.reduce(
    (sum, p) => sum + p.findings.filter((f) => f.status === "OPEN").length,
    0
  );
  const totalFixedDefects = projects.reduce(
    (sum, p) => sum + p.findings.filter((f) => f.status === "FIXED").length,
    0
  );

  const columns: Column<DashboardProject>[] = [
    {
      key: "title",
      header: "Microservice / Application",
      sortable: true,
      render: (p) => (
        <div>
          <Link
            href={`/projects/${p.slug}`}
            className="font-medium text-neutral-900 hover:text-neutral-700 hover:underline flex items-center gap-1.5"
          >
            <span>{p.title}</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </Link>
          <span className="text-[11px] font-mono text-neutral-400">slug: {p.slug}</span>
        </div>
      ),
    },
    {
      key: "gateStatus",
      header: "Security Gate Verdict",
      sortable: true,
      render: (p) =>
        p.gateStatus === "READY TO SHIP" ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            READY TO SHIP
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            BLOCKED (HIGH DEFECT)
          </span>
        ),
    },
    {
      key: "vibeScore",
      header: "Engineering Health",
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-neutral-900 text-xs">
          {p.vibeScore} <span className="text-neutral-400 font-normal">/ 100</span>
        </span>
      ),
    },
    {
      key: "versionsCount",
      header: "Releases",
      render: (p) => (
        <span className="font-mono text-neutral-600 text-xs flex items-center gap-1">
          <GitBranch className="w-3 h-3 text-neutral-400" />
          v{p.versionsCount}
        </span>
      ),
    },
    {
      key: "findingsCount",
      header: "Defects (Open / Fixed)",
      render: (p) => {
        const open = p.findings.filter((f) => f.status === "OPEN").length;
        const fixed = p.findings.filter((f) => f.status === "FIXED").length;
        return (
          <span className="font-mono text-xs">
            <span className={open > 0 ? "text-rose-600 font-bold" : "text-neutral-500"}>{open} open</span>
            <span className="text-neutral-300"> • </span>
            <span className="text-emerald-600 font-medium">{fixed} fixed</span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      {/* Sandbox Demo Disclaimer Banner */}
      {isSandboxDemo && (
        <div className="p-4 rounded-xl border border-neutral-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-neutral-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-900">
                  Workspace: Acme Financial Technologies [Sandbox Demonstration]
                </span>
                <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200">
                  Demo Context
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Displaying multi-service deployment gates, MTTR defect burndown, and RLS tenant boundaries.
              </p>
            </div>
          </div>
          <Link
            href="/projects/new"
            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Audit New Repository</span>
          </Link>
        </div>
      )}

      {/* Metric Counters Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-2xs">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Services Monitored</div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">{totalProjects}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Targeted by scan pipeline</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-2xs">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Security Gates</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {passingGates} <span className="text-sm text-neutral-400 font-normal">/ {totalProjects} Passing</span>
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">{blockedGates} Blocked (Action Required)</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-2xs">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Defect Burndown</div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {totalFixedDefects} <span className="text-sm text-neutral-400 font-normal">fixed</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">{totalOpenDefects} pending verification</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-2xs">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Mean Time to Fix (MTTR)</div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">3.8 <span className="text-sm text-neutral-400 font-normal">days</span></div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Within 7-day enterprise SLA</div>
        </div>
      </div>

      {/* Monitored Services Data Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              Monitored Microservices & Deployment Gates
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Continuously audited services, version releases, and hard gate enforcement.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-medium flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-500" />
            <span>Connect Repository</span>
          </Link>
        </div>

        <DataTable<DashboardProject>
          columns={columns}
          data={projects}
          keyExtractor={(p) => p.id}
          searchPlaceholder="Filter monitored services..."
          searchFilter={(p, q) =>
            p.title.toLowerCase().includes(q.toLowerCase()) ||
            p.slug.toLowerCase().includes(q.toLowerCase())
          }
        />
      </div>
    </div>
  );
}
