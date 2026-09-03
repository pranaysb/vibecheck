import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import {
  FolderGit2,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { getScoreColor } from "@/lib/utils";

export const revalidate = 0;

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  // If no user or default, fetch Alex Rivera's projects or all projects for demo
  const userFilter = currentUser ? { userId: currentUser.id } : {};

  let projects = await prisma.project.findMany({
    where: userFilter,
    include: {
      versions: { orderBy: { createdAt: "desc" } },
      findings: true,
      reviews: { include: { author: true } },
      expertReviews: { include: { expert: true, report: true } },
    },
    orderBy: { vibeScore: "desc" },
  });

  // Fallback to all projects if current user hasn't created any yet so dashboard is alive
  if (projects.length === 0) {
    projects = await prisma.project.findMany({
      take: 4,
      include: {
        versions: { orderBy: { createdAt: "desc" } },
        findings: true,
        reviews: { include: { author: true } },
        expertReviews: { include: { expert: true, report: true } },
      },
    });
  }

  // Dashboard calculations
  const totalProjects = projects.length;
  const totalReviews = projects.reduce((acc, p) => acc + p.reviews.length, 0);
  const totalIssuesFound = projects.reduce((acc, p) => acc + p.findings.length, 0);
  const totalIssuesFixed = projects.reduce(
    (acc, p) => acc + p.findings.filter((f) => f.status === "FIXED").length,
    0
  );
  const avgScore = totalProjects
    ? Math.round(projects.reduce((acc, p) => acc + p.vibeScore, 0) / totalProjects)
    : 0;

  // Projects needing attention: projects with open critical or high findings
  const projectsNeedingAttention = projects
    .map((p) => {
      const openCriticalOrHigh = p.findings.filter(
        (f) => f.status === "OPEN" && (f.severity === "CRITICAL" || f.severity === "HIGH")
      );
      return { project: p, highCount: openCriticalOrHigh.length };
    })
    .filter((item) => item.highCount > 0 || item.project.vibeScore < 80);

  // Incoming or outgoing expert reviews
  const expertReviews = await prisma.expertReview.findMany({
    where: currentUser
      ? { OR: [{ creatorId: currentUser.id }, { expertId: currentUser.id }] }
      : {},
    include: { project: true, expert: true, creator: true, report: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-zinc-500 font-medium uppercase tracking-widest">
            Creator Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-0.5 tracking-tight">
            Welcome back, {currentUser?.name || "Developer"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-normal">
            Monitoring health, version evolution, and community reviews across your submissions.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium text-xs transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Submission</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] space-y-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
            <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Your projects</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalProjects}</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] space-y-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reviews received</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalReviews}</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] space-y-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            <span>Issues found</span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{totalIssuesFound}</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] space-y-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Issues fixed</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{totalIssuesFixed}</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] space-y-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] col-span-2 md:col-span-1">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Average Vibe Score</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{avgScore} / 100</div>
        </div>
      </div>

      {/* Projects Needing Attention */}
      {projectsNeedingAttention.length > 0 && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Projects Needing Attention</h2>
          </div>

          <div className="space-y-3">
            {projectsNeedingAttention.map(({ project: p, highCount }) => {
              const sc = getScoreColor(p.vibeScore);
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-[#0c0c0e] border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${p.slug}`} className="font-bold text-sm text-white hover:text-emerald-400">
                        {p.title}
                      </Link>
                      <span className={`px-2 py-0.2 rounded text-xs font-mono font-bold border ${sc.badge}`}>
                        {p.vibeScore}/100
                      </span>
                    </div>
                    <div className="text-xs text-rose-400 font-medium">
                      {highCount > 0 ? `${highCount} high-priority security or performance issues open` : "Score below production benchmark (80)"}
                    </div>
                  </div>

                  <Link
                    href={`/projects/${p.slug}/manage`}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-xs transition-colors self-start sm:self-auto flex items-center gap-1"
                  >
                    <span>Review findings</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Your Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => {
            const sc = getScoreColor(p.vibeScore);
            return (
              <div
                key={p.id}
                className="rounded-xl border border-white/[0.08] bg-slate-900/40 p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/projects/${p.slug}`}
                        className="font-bold text-base text-white hover:text-emerald-400 transition-colors"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{p.tagline}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-mono font-bold border ${sc.badge}`}>
                      {p.vibeScore}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.techStack.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 border border-white/[0.06] text-zinc-500 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">
                    {p.versions.length} {p.versions.length === 1 ? "version" : "versions"} • {p.reviews.length} reviews
                  </span>
                  <Link
                    href={`/projects/${p.slug}/manage`}
                    className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expert Reviews Status */}
      {expertReviews.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Expert Review Requests
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {expertReviews.map((er) => (
              <div
                key={er.id}
                className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{er.project.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                      {er.packageType}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-600 font-mono">
                      {er.status}
                    </span>
                  </div>
                  <div className="text-zinc-500 mt-0.5">
                    Assigned Expert: <strong className="text-slate-200">{er.expert.name}</strong>
                  </div>
                </div>

                {er.report ? (
                  <Link
                    href={`/expert-reports/${er.id}`}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>View Engineering Report</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="text-zinc-500 font-mono italic">Audit in progress</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
