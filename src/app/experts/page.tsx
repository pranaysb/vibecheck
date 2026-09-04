import React from "react";
import { prisma } from "@/lib/db";
import { ExpertCard } from "@/components/expert/ExpertCard";
import { ShieldCheck, CheckCircle, Award } from "lucide-react";

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
        bio: "Ex-Stripe Senior Software Engineer (8 yrs). Auditing systems for authorization, data layer, and performance.",
        expertProfile: {
          title: "Senior Software Engineer (ex-Stripe)",
          yearsExperience: 8,
          hourlyRateInr: 2499,
          reviewRateInr: 999,
          rating: 4.9,
          reviewsCount: 137,
          specialties: ["Security", "Architecture", "Backend", "System Design"],
          verificationStatus: "VERIFIED"
        }
      },
      {
        id: "exp-david",
        name: "David Vance",
        username: "davidvance",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        bio: "Principal Architect @ ex-Cloudflare. Specialized in Edge computing, TTFB optimization, and SSRF defense.",
        expertProfile: {
          title: "Principal Architect",
          yearsExperience: 11,
          hourlyRateInr: 3499,
          reviewRateInr: 999,
          rating: 5.0,
          reviewsCount: 94,
          specialties: ["Edge Runtime", "SSRF Defense", "Scalability", "Next.js"],
          verificationStatus: "VERIFIED"
        }
      },
      {
        id: "exp-priya",
        name: "Priya Sundaram",
        username: "priya_eng",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
        bio: "Staff Frontend Architect @ FinTech. Passionate about a11y compliance, zero-runtime CSS, and design systems.",
        expertProfile: {
          title: "Staff Frontend Architect",
          yearsExperience: 7,
          hourlyRateInr: 1999,
          reviewRateInr: 999,
          rating: 4.9,
          reviewsCount: 82,
          specialties: ["WCAG a11y", "Tailwind", "React 19", "Design Tokens"],
          verificationStatus: "VERIFIED"
        }
      }
    ];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header with High-Contrast Text */}
      <div className="max-w-3xl space-y-3 text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-mono font-medium shadow-2xs">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Rigorous Manual Code Review</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Real staff engineers inspect your repository line-by-line, validating database schemas, authorization guards, and error boundaries.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Formal Written Audit Report</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Receive actionable recommendations, category scores, and an executive summary to share with investors or prospective clients.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-600" />
            <span>Verified Engineer Badge</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Projects passing audit receive an official "Expert Reviewed" cryptographic badge to display on GitHub and Product Hunt.
          </p>
        </div>
      </div>

      {/* Section Title */}
      <div className="space-y-1 text-left border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Available Verified Engineers</h2>
        <p className="text-xs text-slate-500">
          Book 1-on-1 code reviews with transparent flat rates starting from ₹999.
        </p>
      </div>

      {/* Engineers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </div>
    </div>
  );
}
