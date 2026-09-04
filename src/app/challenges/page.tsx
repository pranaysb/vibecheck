import React from "react";
import { prisma } from "@/lib/db";
import { Trophy, Clock, Users, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function ChallengesPage() {
  let challenges: any[] = [];
  try {
    challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        submissions: {
          take: 5,
          include: {
            project: true, user: { select: { name: true, username: true, avatar: true } },
          },
        },
      },
    });
  } catch (err) {
    console.warn("Challenges DB fallback:", err);
  }

  if (challenges.length === 0) {
    challenges = [
      {
        id: "chal-1",
        title: "AI Productivity Tool Sprint #4",
        slug: "ai-productivity-sprint",
        description: "Build an AI-assisted application that saves knowledge workers at least 30 minutes a day. Focus on keyboard ergonomics, sub-200ms interactions, and bulletproof input validation.",
        requirements: "Must be a live public deployment with Next.js/React or Vite. Must score ≥ 80 on automated security and accessibility audit. At least 3 community peer reviews required.",
        prize: "₹50,000 Cash Prize + Verified Staff Engineer Audit package for the top 3 projects.",
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14 days left
        submissionsCount: 128,
        submissions: [
          {
            id: "sub-1",
            title: "DevCanvas",
            slug: "devcanvas",
            vibeScore: 88,
            creator: { name: "Sarah Jenkins", username: "sarah_io", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }
          },
          {
            id: "sub-2",
            title: "FlowState",
            slug: "flowstate-workspace",
            vibeScore: 84,
            creator: { name: "Marcus Dev", username: "marcus_dev", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" }
          },
          {
            id: "sub-3",
            title: "CampusConnect",
            slug: "campusconnect",
            vibeScore: 82,
            creator: { name: "Alex Rivera", username: "alexrivera", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" }
          },
          {
            id: "sub-4",
            title: "ResumeForge AI",
            slug: "resumeforge-ai",
            vibeScore: 78,
            creator: { name: "Aisha Patel", username: "aishapatel", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150" }
          },
          {
            id: "sub-5",
            title: "HabitPulse PWA",
            slug: "habitpulse",
            vibeScore: 76,
            creator: { name: "Elena Rostova", username: "elena_code", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" }
          }
        ]
      }
    ];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-left">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-xs font-mono font-medium shadow-2xs">
          <Trophy className="w-3.5 h-3.5 text-purple-600" />
          <span>VibeCheck Sprints & Competitions</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight mt-2">
          Community Challenges
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed font-normal">
          Put your AI-assisted build skills to the test. Build, submit, get community peer reviews, and compete for verified engineering audit packages.
        </p>
      </div>

      <div className="space-y-8">
        {challenges.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">{c.title}</h2>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{c.description}</p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs shrink-0">
                <span className="flex items-center gap-1 text-purple-700 font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Ends {formatDate(c.deadline)}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-500 font-mono">
                  <Users className="w-3.5 h-3.5" />
                  <span>{c.submissionsCount} submissions</span>
                </span>
              </div>
            </div>

            {/* Rules & Prize */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Challenge Rules
                </span>
                <p className="text-slate-600 leading-relaxed">{c.requirements}</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1.5">
                <span className="font-bold text-purple-700 uppercase tracking-wider text-[10px] block flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Grand Prize
                </span>
                <p className="text-slate-900 font-semibold leading-relaxed">{c.prize}</p>
              </div>
            </div>

            {/* Leaderboard */}
            {c.submissions.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Top Submissions Leaderboard
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Top {c.submissions.length} of {c.submissionsCount}</span>
                </div>

                <div className="space-y-2">
                  {c.submissions.map((sub: any, idx: number) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-3 text-xs hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center font-mono font-bold text-slate-400 text-xs">
                          #{idx + 1}
                        </span>
                        <img
                          src={sub.user?.avatar || "/placeholder-avatar.png"}
                          alt={sub.user?.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <Link
                            href={`/projects/${(sub.project?.slug || sub.slug)}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                          >
                            {(sub.project?.title || sub.title)}
                          </Link>
                          <div className="text-[11px] text-slate-500 font-mono">
                            by @{sub.user?.username}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-700 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs">
                          {(sub.project?.vibeScore || sub.vibeScore)} / 100
                        </span>
                        <Link
                          href={`/projects/${(sub.project?.slug || sub.slug)}`}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-white border border-slate-200 transition-all shadow-2xs"
                        >
                          Inspect
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-2 flex justify-end">
              <Link
                href={`/projects/new?challenge=${c.slug || "ai-productivity"}`}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
              >
                <span>Submit Project to Challenge</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
