import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { VibeScoreBadge } from "@/components/project/VibeScoreBadge";
import { ScoreRadar } from "@/components/project/ScoreRadar";
import { AIInvolvementBadge } from "@/components/project/AIInvolvementBadge";
import { FindingsList } from "@/components/project/FindingsList";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ProjectActionBar } from "@/components/project/ProjectActionBar";
import {
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ExternalLink,
  History,
  FileSearch,
  CheckCircle,
  HelpCircle,
  AlertOctagon,
} from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 0;

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: { creator: true },
  });

  if (!project) {
    return { title: "Project Not Found — VibeCheck" };
  }

  return {
    title: `${project.title} — VibeCheck (Score ${project.vibeScore}/100)`,
    description: project.tagline,
    openGraph: {
      title: `${project.title} on VibeCheck — Vibe Score ${project.vibeScore}/100`,
      description: project.tagline,
      type: "website",
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  const project = await prisma.project.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      creator: { select: { id: true, name: true, username: true, avatar: true, reputationPoints: true } },
      versions: { orderBy: { createdAt: "desc" } },
      findings: { orderBy: [{ status: "asc" }, { severity: "asc" }, { createdAt: "desc" }] },
      reviews: {
        include: {
          author: { select: { id: true, name: true, username: true, avatar: true, reputationPoints: true, role: true } },
          comments: {
            include: {
              user: { select: { id: true, name: true, username: true, avatar: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { helpfulVotesCount: "desc" },
      },
      expertReviews: {
        where: { status: "COMPLETED" },
        include: {
          expert: { select: { name: true, username: true, avatar: true } },
          report: true,
        },
      },
    },
  });

  if (!project) notFound();

  const totalScoreDelta = project.versions.reduce((sum, v) => sum + v.scoreDelta, 0);
  const openFindingsCount = project.findings.filter((f) => f.status === "OPEN").length;
  const fixedFindingsCount = project.findings.filter((f) => f.status === "FIXED").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner / Hero Simulator */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] overflow-hidden relative shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_20px_40px_-15px_rgba(0,0,0,0.8)]">
        <div className="h-44 sm:h-52 bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-6 sm:p-8 flex flex-col justify-between border-b border-white/[0.06] relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-25" />

          {/* Sub-navigation tabs */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/projects/${project.slug}`}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/[0.1] border border-white/[0.18] text-white"
              >
                Overview
              </Link>
              <Link
                href={`/projects/${project.slug}/reviews`}
                className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reviews ({project.reviews.length})</span>
              </Link>
              <Link
                href={`/projects/${project.slug}/analysis`}
                className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-1"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Analysis ({openFindingsCount} open)</span>
              </Link>
              <Link
                href={`/projects/${project.slug}/versions`}
                className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({project.versions.length} versions)</span>
              </Link>
            </div>

            {/* Score jump indicator */}
            {totalScoreDelta > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-indigo-600 text-xs font-mono font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{totalScoreDelta} points since v1</span>
              </div>
            )}
          </div>

          {/* Project Header in banner */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white font-sans tracking-tight">
                  {project.title}
                </h1>
                {project.expertReviews.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Expert Reviewed
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed font-normal">
                {project.tagline}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Created by</span>
                <Link
                  href={`/users/${project.creator.username}`}
                  className="font-medium text-zinc-200 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                >
                  <img
                    src={project.creator.avatar || "/placeholder-avatar.png"}
                    alt={project.creator.name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>{project.creator.name}</span>
                  <span className="font-mono text-zinc-500">@{project.creator.username}</span>
                </Link>
              </div>
            </div>

            <VibeScoreBadge score={project.vibeScore} size="hero" showLabel />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 sm:p-6 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <ProjectActionBar project={{ id: project.id, slug: project.slug, title: project.title, liveUrl: project.liveUrl, githubUrl: project.githubUrl, userId: project.creator.id }} />

          {/* Tech stack pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-white/[0.08] text-slate-700 font-mono"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Story, Findings, Evolution, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Transparency Card */}
          <AIInvolvementBadge
            involvement={project.aiInvolvement}
            tools={project.aiTools}
            showDetails
          />

          {/* Project Story Write-up */}
          <div className="rounded-2xl border border-white/[0.08]/90 bg-white p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Project Story & Architecture
            </h2>

            {project.whatBuilt && (
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-700 text-xs uppercase tracking-wider block">
                  What did you build?
                </span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{project.whatBuilt}</p>
              </div>
            )}

            {project.whyBuilt && (
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-700 text-xs uppercase tracking-wider block">
                  Why did you build it?
                </span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{project.whyBuilt}</p>
              </div>
            )}

            {project.problemSolved && (
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-700 text-xs uppercase tracking-wider block">
                  What problem does it solve?
                </span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{project.problemSolved}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06] text-xs">
              {project.difficultParts && (
                <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                  <span className="font-semibold text-amber-400 text-[11px] block">What was difficult?</span>
                  <p className="text-slate-700 leading-relaxed">{project.difficultParts}</p>
                </div>
              )}
              {project.unsureParts && (
                <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                  <span className="font-semibold text-rose-400 text-[11px] block">What are you unsure about?</span>
                  <p className="text-slate-700 leading-relaxed">{project.unsureParts}</p>
                </div>
              )}
            </div>

            {project.feedbackWanted && (
              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1">
                <span className="font-semibold text-emerald-300 text-[11px] uppercase tracking-wider block">
                  Targeted Feedback Requested:
                </span>
                <p className="text-slate-200">{project.feedbackWanted}</p>
              </div>
            )}
          </div>

          {/* Findings & Automated Health Check Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Automated Findings</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Safe static & header inspection results ({fixedFindingsCount} fixed, {openFindingsCount} open).
                </p>
              </div>
              <Link
                href={`/projects/${project.slug}/analysis`}
                className="text-xs text-indigo-600 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>Full analysis deep-dive</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <FindingsList findings={project.findings as any} isCreator={true} />
          </div>

          {/* Version Evolution Section */}
          <div className="rounded-2xl border border-white/[0.08]/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  Project Evolution History
                </h2>
                <p className="text-xs text-zinc-400">Verifiable record of score improvements after feedback.</p>
              </div>
              <Link
                href={`/projects/${project.slug}/versions`}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                View Changelog →
              </Link>
            </div>

            <div className="space-y-3">
              {project.versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-200 px-2 py-0.5 rounded bg-slate-800 border border-white/[0.06]">
                      {ver.versionNumber}
                    </span>
                    <span className="text-slate-700">{ver.changelog}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ver.scoreDelta > 0 && (
                      <span className="text-[11px] font-mono font-bold text-indigo-600 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                        +{ver.scoreDelta}
                      </span>
                    )}
                    <span className="font-mono font-bold text-slate-100">{ver.vibeScore}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Reviews Snippet */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Community Feedback</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {project.reviews.length} structured peer reviews from verified developers.
                </p>
              </div>
              <Link
                href={`/projects/${project.slug}/reviews`}
                className="text-xs text-indigo-600 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>Read all reviews</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {project.reviews.slice(0, 2).map((rev) => (
                <ReviewCard key={rev.id} review={rev as any} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column: Score Radar, Expert Report Snippet, Metadata */}
        <div className="space-y-6">
          {/* Radar Category Breakdown */}
          <ScoreRadar
            product={project.scoreProduct}
            ux={project.scoreUx}
            engineering={project.scoreEngineering}
            security={project.scoreSecurity}
            performance={project.scorePerformance}
            accessibility={project.scoreAccessibility}
            documentation={project.scoreDocumentation}
          />

          {/* Expert Review Report Highlight */}
          {project.expertReviews.length > 0 && project.expertReviews[0].report && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Engineering Audit Report
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {project.expertReviews[0].report.overallScore}/100
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{project.expertReviews[0].report.executiveSummary.slice(0, 180)}..."
              </p>

              <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-xs">
                <span className="text-zinc-400">By Sarah Chen</span>
                <Link
                  href={`/expert-reports/${project.expertReviews[0].id}`}
                  className="font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Read Full Report <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Build Details */}
          <div className="rounded-xl border border-white/[0.08] bg-white p-5 border border-white/[0.08]/90 shadow-xs space-y-3 text-xs">
            <h3 className="font-semibold text-white uppercase tracking-wider text-xs border-b border-white/[0.06] pb-2">
              Build Metadata
            </h3>
            <div className="space-y-2 text-zinc-400">
              <div className="flex justify-between">
                <span>Framework</span>
                <span className="text-slate-200 font-mono">{project.framework || "Next.js"}</span>
              </div>
              <div className="flex justify-between">
                <span>Database</span>
                <span className="text-slate-200 font-mono">{project.database || "PostgreSQL"}</span>
              </div>
              <div className="flex justify-between">
                <span>Hosting</span>
                <span className="text-slate-200 font-mono">{project.hosting || "Vercel"}</span>
              </div>
              <div className="flex justify-between">
                <span>AI Involvement</span>
                <span className="text-slate-200 font-semibold">{project.aiInvolvement}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Versions</span>
                <span className="text-indigo-600 font-mono font-bold">{project.versions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
