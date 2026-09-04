"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/lib/auth/UserContext";
import Link from "next/link";
import {
  FolderGit2,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Award,
} from "lucide-react";
import { getScoreColor } from "@/lib/utils";

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-left">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-mono text-indigo-600 font-semibold uppercase tracking-widest">
            Creator Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Welcome back, {currentUser?.name || "Developer"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-normal">
            Monitoring health, version evolution, and community reviews across your submissions.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Submission</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Your projects</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">{totalProjects}</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
            <span>Reviews received</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">{totalReviews}</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Issues found</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-600">{totalIssuesFound}</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Issues fixed</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">{totalIssuesFixed}</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-xs col-span-2 md:col-span-1">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>Average Vibe Score</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">{avgScore} / 100</div>
        </div>
      </div>

      {/* Projects Needing Attention */}
      {projectsNeedingAttention.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Projects Needing Attention</h2>
          </div>

          <div className="space-y-3">
            {projectsNeedingAttention.map(({ project: p, highCount }) => {
              const sc = getScoreColor(p.vibeScore);
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-white border border-rose-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${p.slug}`} className="font-bold text-sm text-slate-900 hover:text-indigo-600">
                        {p.title}
                      </Link>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${sc.badge}`}>
                        {p.vibeScore}/100
                      </span>
                    </div>
                    <div className="text-xs text-rose-700 font-medium">
                      {highCount > 0 ? `${highCount} high-priority security or performance issues open` : "Score below production benchmark (80)"}
                    </div>
                  </div>

                  <Link
                    href={`/projects/${p.slug}/analysis`}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs self-start sm:self-auto shadow-xs"
                  >
                    Fix Issues
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Your Monitored Projects</h2>
          <span className="text-xs text-slate-500 font-mono">{projects.length} submissions</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 border border-slate-200 rounded-2xl bg-white">
            Loading your projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center space-y-4 border border-slate-200 rounded-2xl bg-white">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">No projects submitted yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Submit your first AI-built application to run automated security scans and get community peer feedback.
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Project</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => {
              const sc = getScoreColor(p.vibeScore);
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/projects/${p.slug}`}
                        className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {p.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        vibecheck.dev/projects/{p.slug}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${sc.badge}`}>
                      {p.vibeScore}/100
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Versions</div>
                      <div className="font-mono font-bold text-slate-900">{p.versionsCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Reviews</div>
                      <div className="font-mono font-bold text-slate-900">{p.reviewsCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Issues</div>
                      <div className="font-mono font-bold text-slate-900">{p.findingsCount}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                    <Link
                      href={`/projects/${p.slug}/analysis`}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Audit Report
                    </Link>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
