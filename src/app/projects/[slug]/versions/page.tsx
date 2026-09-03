import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, History, TrendingUp, CheckCircle, ArrowDown, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

interface VersionsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectVersionsPage({ params }: VersionsPageProps) {
  const { slug } = await params;

  const project = await prisma.project.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      creator: true,
      versions: { orderBy: { createdAt: "desc" } },
      findings: { where: { status: "FIXED" } },
    },
  });

  if (!project) notFound();

  const totalDelta = project.versions.reduce((sum, v) => sum + v.scoreDelta, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 mb-2 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {project.title}</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-2.5">
              <History className="w-6 h-6 text-emerald-400" />
              Project Evolution Timeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Verifiable proof of how {project.title} improved across releases.
            </p>
          </div>

          {totalDelta > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm self-start sm:self-auto">
              <TrendingUp className="w-4 h-4" />
              <span>+{totalDelta} Total Score Improvement</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Progression Stepper */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-white/10 before:z-0">
        {project.versions.map((ver, idx) => {
          const findingsFixedInThisVer = project.findings.filter((f) => f.versionFixed === ver.versionNumber);
          const isLatest = idx === 0;

          return (
            <div key={ver.id} className="relative z-10 flex items-start gap-4">
              {/* Version Pill Circle */}
              <div
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-bold shrink-0 border ${
                  isLatest
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900 text-slate-300 border-white/10"
                }`}
              >
                <span className="text-xs">{ver.versionNumber}</span>
                <span className="text-[10px] font-normal opacity-80">{ver.vibeScore}</span>
              </div>

              {/* Version Content Card */}
              <div className="flex-1 rounded-xl border border-white/10 bg-slate-900/50 p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{ver.versionNumber} Release</span>
                    {ver.scoreDelta > 0 && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30">
                        +{ver.scoreDelta} points
                      </span>
                    )}
                    {isLatest && (
                      <span className="px-2 py-0.2 rounded text-[10px] font-semibold text-emerald-300 border border-emerald-500/40 bg-emerald-500/10">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{formatDate(ver.createdAt)}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{ver.changelog}</p>

                {findingsFixedInThisVer.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Resolved in this version ({findingsFixedInThisVer.length}):
                    </span>
                    <div className="space-y-1">
                      {findingsFixedInThisVer.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{f.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({f.category})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
