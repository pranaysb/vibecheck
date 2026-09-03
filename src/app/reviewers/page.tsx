import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Award, ShieldCheck, ThumbsUp, MessageSquare, TrendingUp, Bug, Compass, Server } from "lucide-react";

export const revalidate = 0;

export default async function ReviewersPage() {
  const reviewers = await prisma.user.findMany({
    where: {
      OR: [
        { role: "REVIEWER" },
        { reviews: { some: {} } },
      ],
    },
    include: {
      reviews: { select: { id: true, helpfulVotesCount: true } },
      badges: { include: { badge: true } },
    },
    orderBy: { reputationPoints: "desc" },
    take: 20,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 shadow-xs text-xs font-mono font-medium">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Community Reputation Leaderboard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight mt-2">
          Top Reviewers & Quality Hunters
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl font-normal">
          Engineers earning community reputation points by providing rigorous, honest product and engineering feedback.
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>Rank & Reviewer</span>
          <span className="hidden sm:inline">Badges & Focus</span>
          <span>Reputation</span>
        </div>

        <div className="divide-y divide-slate-100">
          {reviewers.map((rev, idx) => {
            const totalHelpful = rev.reviews.reduce((sum, r) => sum + r.helpfulVotesCount, 0);

            return (
              <div
                key={rev.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors text-xs"
              >
                {/* Left: Rank, Avatar, Name */}
                <div className="flex items-center gap-3.5">
                  <span className="w-6 text-center font-mono font-bold text-slate-500 text-sm">
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
                      {rev.role === "EXPERT" && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                    </Link>
                    <div className="text-[11px] text-slate-400 font-mono">
                      @{rev.username} • {rev.reviews.length} reviews given
                    </div>
                  </div>
                </div>

                {/* Middle: Badges */}
                <div className="hidden sm:flex flex-wrap gap-1 max-w-sm">
                  {rev.badges.map((b) => (
                    <span
                      key={b.badge.id}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium font-mono"
                    >
                      {b.badge.name}
                    </span>
                  ))}
                  {rev.badges.length === 0 && (
                    <span className="text-[11px] text-slate-600 italic">Contributor</span>
                  )}
                </div>

                {/* Right: Points */}
                <div className="text-right">
                  <div className="font-mono font-bold text-indigo-600 text-sm">
                    {rev.reputationPoints.toLocaleString()} pts
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-end gap-1">
                    <ThumbsUp className="w-2.5 h-2.5" />
                    <span>{totalHelpful} helpful</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
