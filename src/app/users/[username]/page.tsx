import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  TrendingUp,
  FolderGit2,
  MessageSquare,
  ThumbsUp,
  
  Globe,
  ExternalLink,
} from "lucide-react";
import { getScoreColor } from "@/lib/utils";

export const revalidate = 0;

interface UserPageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: UserPageProps) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: true,
      badges: { include: { badge: true } },
      projects: {
        include: {
          versions: { orderBy: { createdAt: "desc" } },
          reviews: true,
        },
        orderBy: { vibeScore: "desc" },
      },
      reviews: {
        include: { project: true },
        orderBy: { helpfulVotesCount: "desc" },
      },
      expertProfile: true,
    },
  });

  if (!user) notFound();

  const totalHelpful = user.reviews.reduce((sum, r) => sum + r.helpfulVotesCount, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <img
              src={user.avatar || "/placeholder-avatar.png"}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{user.name}</h1>
                {user.role === "EXPERT" && (
                  <span className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">@{user.username}</div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed pt-1">
                {user.bio || user.profile?.bio || "AI-assisted builder on VibeCheck."}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-baseline sm:items-end justify-between gap-1 p-3 rounded-xl bg-slate-950 border border-white/5">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Reputation</span>
            <span className="text-2xl font-black font-mono text-emerald-400">
              {user.reputationPoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">review points</span>
          </div>
        </div>

        {/* Badges Bar */}
        {user.badges.length > 0 && (
          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Earned Badges:</span>
            {user.badges.map((b) => (
              <span
                key={b.badge.id}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-300 font-mono"
              >
                <Award className="w-3 h-3 text-emerald-400" />
                <span>{b.badge.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3 Stats Counters */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1">
          <div className="text-slate-400">Projects Built</div>
          <div className="text-xl font-bold font-mono text-slate-100">{user.projects.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1">
          <div className="text-slate-400">Reviews Given</div>
          <div className="text-xl font-bold font-mono text-slate-100">{user.reviews.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1">
          <div className="text-slate-400">Helpful Votes</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{totalHelpful}</div>
        </div>
      </div>

      {/* Build History */}
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-white/5 pb-3">
          <FolderGit2 className="w-4 h-4 text-emerald-400" /> Build History & Evolution
        </h2>

        {user.projects.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No projects submitted yet.</div>
        ) : (
          <div className="space-y-3">
            {user.projects.map((proj) => {
              const sc = getScoreColor(proj.vibeScore);
              const firstVer = proj.versions[proj.versions.length - 1];
              const scoreJump = firstVer ? proj.vibeScore - firstVer.vibeScore : 0;

              return (
                <div
                  key={proj.id}
                  className="p-4 rounded-lg bg-slate-950/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/projects/${proj.slug}`}
                      className="font-bold text-sm text-slate-100 hover:text-emerald-400"
                    >
                      {proj.title}
                    </Link>
                    <p className="text-slate-400 line-clamp-1">{proj.tagline}</p>
                    <div className="flex gap-1 pt-1">
                      {proj.techStack.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {scoreJump > 0 && firstVer && (
                      <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
                        <span>{firstVer.vibeScore}</span>
                        <span>→</span>
                        <span>{proj.vibeScore}</span>
                        <span className="text-[10px] px-1.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                          +{scoreJump}
                        </span>
                      </div>
                    )}
                    <span className={`px-2.5 py-1 rounded font-mono font-bold border ${sc.badge}`}>
                      {proj.vibeScore} / 100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reviews Given */}
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-white/5 pb-3">
          <MessageSquare className="w-4 h-4 text-blue-400" /> Reviews Contributed ({user.reviews.length})
        </h2>

        <div className="space-y-3">
          {user.reviews.slice(0, 4).map((r) => (
            <div key={r.id} className="p-3 rounded-lg bg-slate-950/60 border border-white/5 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <Link
                  href={`/projects/${r.project.slug}/reviews`}
                  className="font-semibold text-slate-200 hover:text-emerald-400"
                >
                  Reviewed {r.project.title}
                </Link>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> {r.helpfulVotesCount} helpful
                </span>
              </div>
              <p className="text-slate-400 line-clamp-2 italic">"{r.whatLiked}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
