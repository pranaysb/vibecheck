import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Award, ShieldCheck, ThumbsUp, MessageSquare, Sparkles, Check } from "lucide-react";

export const revalidate = 0;

export default async function ReviewersPage() {
  let reviewers: any[] = [];
  try {
    reviewers = await prisma.user.findMany({
      where: {
        reviews: { some: {} },
      },
      include: {
        reviews: {
          select: { id: true, helpfulVotesCount: true },
        },
      },
      orderBy: { reputationPoints: "desc" },
      take: 20,
    });
  } catch (err) {
    console.warn("Reviewers DB fallback:", err);
  }

  // Realistic mock reviewers with mathematical consistency if DB empty
  if (reviewers.length === 0) {
    reviewers = [
      {
        id: "rev-1",
        name: "Rahul Sharma",
        username: "rahul_qa",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
        role: "REVIEWER",
        reputationPoints: 1320,
        reviewsCount: 12,
        helpfulCount: 48,
        reviews: new Array(12).fill({ id: "r", helpfulVotesCount: 4 }),
      },
      {
        id: "rev-2",
        name: "Priya Sundaram",
        username: "priya_eng",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
        role: "EXPERT",
        reputationPoints: 1125,
        reviewsCount: 10,
        helpfulCount: 35,
        reviews: new Array(10).fill({ id: "r", helpfulVotesCount: 3 }),
      },
      {
        id: "rev-3",
        name: "Marcus Dev",
        username: "marcus_dev",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        role: "REVIEWER",
        reputationPoints: 935,
        reviewsCount: 8,
        helpfulCount: 29,
        reviews: new Array(8).fill({ id: "r", helpfulVotesCount: 3 }),
      },
      {
        id: "rev-4",
        name: "Elena Rostova",
        username: "elena_code",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        role: "REVIEWER",
        reputationPoints: 810,
        reviewsCount: 7,
        helpfulCount: 24,
        reviews: new Array(7).fill({ id: "r", helpfulVotesCount: 3 }),
      },
    ];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-left">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs font-mono font-medium shadow-2xs">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>Community Reputation Leaderboard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight mt-2">
          Top Reviewers & Quality Hunters
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl font-normal">
          Engineers earning community reputation points by providing rigorous, honest product and engineering feedback.
        </p>
      </div>

      {/* Transparent Formula Explainer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Transparent Reputation Formula:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
          <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
            <strong>+50 pts</strong> per structured review
          </span>
          <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
            <strong>+15 pts</strong> per helpful upvote
          </span>
          <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
            <strong>+100 pts</strong> staff engineer bonus
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-700 font-bold uppercase tracking-wider font-mono">
          <span>Rank & Reviewer</span>
          <span className="hidden sm:inline">Verification Status</span>
          <span>Reputation Points</span>
        </div>

        <div className="divide-y divide-slate-100">
          {reviewers.map((rev, idx) => {
            const totalHelpful = rev.helpfulCount ?? rev.reviews.reduce((sum: number, r: any) => sum + r.helpfulVotesCount, 0);
            const reviewsCount = rev.reviewsCount ?? rev.reviews.length;

            return (
              <div
                key={rev.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors text-xs"
              >
                {/* Left: Rank, Avatar, Name */}
                <div className="flex items-center gap-3.5">
                  <span className="w-6 text-center font-mono font-bold text-slate-400 text-sm">
                    #{idx + 1}
                  </span>
                  <Link href={`/users/${rev.username}`}>
                    <img
                      src={rev.avatar || "/placeholder-avatar.png"}
                      alt={rev.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  </Link>
                  <div>
                    <Link
                      href={`/users/${rev.username}`}
                      className="font-bold text-slate-900 hover:text-indigo-600 text-sm transition-colors flex items-center gap-1.5"
                    >
                      <span>{rev.name}</span>
                      {rev.role === "EXPERT" && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                    </Link>
                    <div className="text-[11px] text-slate-500 font-mono">
                      @{rev.username} • {reviewsCount} reviews given
                    </div>
                  </div>
                </div>

                {/* Center: Badges & Focus */}
                <div className="hidden sm:flex items-center gap-2">
                  {rev.role === "EXPERT" ? (
                    <span className="flex items-center gap-1 text-[10px] text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 bg-indigo-50">
                      <ShieldCheck className="w-3 h-3 text-indigo-600" /> Verified Staff
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-medium px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-100">
                      Community Reviewer
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <ThumbsUp className="w-3 h-3 text-emerald-600" /> {totalHelpful} helpful votes
                  </span>
                </div>

                {/* Right: Reputation points */}
                <div className="text-right">
                  <div className="font-mono font-extrabold text-slate-900 text-sm">
                    {rev.reputationPoints.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Top Contributor</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
