import React from "react";
import { prisma } from "@/lib/db";
import { ExpertCard } from "@/components/expert/ExpertCard";
import { ShieldCheck, Sparkles, CheckCircle, ArrowRight, Award } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function ExpertsPage() {
  const experts = await prisma.user.findMany({
    where: {
      role: "EXPERT",
      expertProfile: { isNot: null },
    },
    include: {
      expertProfile: true,
    },
    orderBy: { reputationPoints: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Vetted Senior Software Engineers</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-sans tracking-tight">
          Expert Engineering Marketplace
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Hire battle-tested senior engineers and system architects to audit your AI-generated codebase, identify hidden authorization flaws, optimize database queries, and certify production readiness.
        </p>
      </div>

      {/* Trust & Guarantee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1.5">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Rigorous Manual Code Review</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Real staff engineers inspect your repository line-by-line, not automated scrapers.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1.5">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Formal Written Audit Report</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Receive actionable recommendations, category scores, and an executive summary to share with investors or users.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1.5">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Verified Engineer Badge</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every expert is verified through corporate work history, open source track record, and technical interviews.
          </p>
        </div>
      </div>

      {/* Expert Reviewers Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Available Verified Engineers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.map((exp) => (
            <ExpertCard
              key={exp.id}
              expert={{
                id: exp.id,
                name: exp.name,
                username: exp.username,
                avatar: exp.avatar,
                bio: exp.bio,
                githubUrl: exp.githubUrl,
                expertProfile: exp.expertProfile! as any,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
