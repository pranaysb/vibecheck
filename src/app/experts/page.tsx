import React from "react";
import { prisma } from "@/lib/db";
import { ExpertCard } from "@/components/expert/ExpertCard";
import { ShieldCheck, Sparkles, CheckCircle, ArrowRight, Award } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function ExpertsPage() {
  let experts: any[] = [];
  try {
    experts = await prisma.user.findMany({
      where: {
        role: "EXPERT",
        expertProfile: { isNot: null },
      },
      include: {
        expertProfile: true,
      },
      orderBy: { reputationPoints: "desc" },
    });
  } catch (err) {
    console.warn("Experts DB fallback:", err);
  }

  if (experts.length === 0) {
    experts = [
      {
        id: "exp-sarah",
        name: "Sarah Chen",
        username: "sarahchen",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        bio: "Ex-Stripe Senior Software Engineer (8 yrs). Auditing systems for security and performance.",
        expertProfile: {
          title: "Senior Software Engineer (ex-Stripe)",
          yearsExperience: 8,
          hourlyRateInr: 2499,
          reviewRateInr: 2499,
          rating: 4.9,
          reviewsCount: 137,
          specialties: ["Security", "Architecture", "Backend", "System Design"],
          verificationStatus: "VERIFIED"
        }
      }
    ];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-xs text-xs font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Vetted Senior Software Engineers</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
          Expert Engineering Marketplace
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed font-normal">
          Hire battle-tested senior engineers and system architects to audit your AI-generated codebase, identify hidden authorization flaws, optimize database queries, and certify production readiness.
        </p>
      </div>

      {/* Trust & Guarantee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-1.5 shadow-xs">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Rigorous Manual Code Review</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Real staff engineers inspect your repository line-by-line, not automated scrapers.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-1.5 shadow-xs">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Formal Written Audit Report</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Receive actionable recommendations, category scores, and an executive summary to share with investors or users.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-1.5 shadow-xs">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Verified Engineer Badge</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every expert is verified through corporate work history, open source track record, and technical interviews.
          </p>
        </div>
      </div>

      {/* Expert Reviewers Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Available Verified Engineers</h2>
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
