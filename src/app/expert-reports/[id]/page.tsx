import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertOctagon, Share2, Sparkles, Terminal, FileText, Check } from "lucide-react";
import { formatDate, getScoreColor } from "@/lib/utils";

export const revalidate = 0;

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExpertReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  // Query either by expertReviewId or reportId or project slug
  let review = await prisma.expertReview.findFirst({
    where: {
      OR: [
        { id },
        { project: { slug: id } },
      ],
    },
    include: {
      project: true,
      expert: { include: { expertProfile: true } },
      creator: true,
      report: true,
    },
  });

  // If not found, fallback to first completed expert review in database for demo inspection
  if (!review || !review.report) {
    review = await prisma.expertReview.findFirst({
      where: { status: "COMPLETED", report: { isNot: null } },
      include: {
        project: true,
        expert: { include: { expertProfile: true } },
        creator: true,
        report: true,
      },
    });
  }

  if (!review || !review.report) notFound();

  const report = review.report;
  const recommendations: Array<{ title: string; description: string; priority: string }> =
    JSON.parse(report.recommendations || "[]");

  const overallColor = getScoreColor(report.overallScore);

  const categories = [
    { label: "Architecture", score: report.architectureScore },
    { label: "Security", score: report.securityScore },
    { label: "Performance", score: report.performanceScore },
    { label: "Code Quality", score: report.codeQualityScore },
    { label: "Scalability", score: report.scalabilityScore },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href={`/projects/${review.project.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 mb-2 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {review.project.title}</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Official Engineering Review
              </span>
              <span className="text-slate-500 font-mono text-xs">•</span>
              <span className="text-xs text-slate-400 font-mono">{formatDate(report.createdAt)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-sans tracking-tight mt-1">
              Engineering Audit: {review.project.title}
            </h1>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono ${overallColor.badge}`}>
            <span className="text-2xl font-black">{report.overallScore}</span>
            <span className="text-xs uppercase font-sans text-slate-400 font-semibold">/ 100 Overall</span>
          </div>
        </div>
      </div>

      {/* Reviewer Credential Box */}
      <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <img
            src={review.expert.avatar || "/placeholder-avatar.png"}
            alt={review.expert.name}
            className="w-10 h-10 rounded-full object-cover border border-cyan-500/40"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100">{review.expert.name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-slate-400">{review.expert.expertProfile?.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-right">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Verdict</span>
            <span className="font-bold text-emerald-400 font-mono">
              {report.wouldShip === "YES" ? "Ship It (Approved)" : "Almost Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-400" /> Executive Summary
        </h2>
        <blockquote className="border-l-2 border-emerald-500 pl-4 text-slate-200 text-sm leading-relaxed italic">
          "{report.executiveSummary}"
        </blockquote>
      </div>

      {/* Sub-Score Bars */}
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Core Engineering Dimensions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const sc = getScoreColor(cat.score);
            return (
              <div key={cat.label} className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">{cat.label}</span>
                  <span className={`font-mono font-bold ${sc.text}`}>{cat.score}/100</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.score}%`, backgroundColor: sc.accent }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Actionable Recommendations */}
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Top Recommendations Prioritized
        </h2>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={rec.title} className="p-4 rounded-lg bg-slate-950/60 border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-slate-800 text-emerald-400 flex items-center justify-center font-mono text-[11px]">
                    {i + 1}
                  </span>
                  <span>{rec.title}</span>
                </div>
                <span
                  className={`px-2 py-0.2 rounded font-mono text-[10px] font-bold ${
                    rec.priority === "HIGH"
                      ? "text-rose-400 bg-rose-500/10 border border-rose-500/30"
                      : "text-amber-400 bg-amber-500/10 border border-amber-500/30"
                  }`}
                >
                  {rec.priority}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-7">{rec.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
