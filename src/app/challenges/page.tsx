import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Trophy, Clock, Users, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function ChallengesPage() {
  let challenges: any[] = [];
  try {
    challenges = await prisma.challenge.findMany({
      where: { isActive: true },
      include: {
        submissions: {
          include: {
            project: {
              include: { creator: true },
            },
          },
          orderBy: { rank: "asc" },
        },
      },
    });
  } catch (err) {
    console.warn("Challenges DB fallback:", err);
  }

  if (challenges.length === 0) {
    challenges = [
      {
        id: "c1",
        title: "Build a Productivity Tool with AI",
        description: "Build and submit an AI-assisted productivity application that solves a real everyday bottleneck for developers, students, or knowledge workers.",
        requirements: "Must be built with AI assistance (disclosed). Must have a working live URL. Must achieve a Vibe Score of at least 75.",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        prize: "1-on-1 Engineering Review with Sarah Chen + VibeCheck Spotlight",
        submissionsCount: 128,
        submissions: [
          {
            id: "s1",
            rank: 1,
            project: {
              slug: "campusconnect",
              title: "CampusConnect",
              tagline: "Student peer-to-peer textbook and dorm essentials marketplace.",
              vibeScore: 86,
              creator: { username: "alexrivera" }
            }
          }
        ]
      }
    ];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-mono font-medium">
          <Trophy className="w-3.5 h-3.5 text-purple-400" />
          <span>VibeCheck Sprints & Competitions</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 font-sans tracking-tight mt-2">
          Community Challenges
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Put your AI-assisted build skills to the test. Build, submit, get community peer reviews, and compete for verified engineering audit packages.
        </p>
      </div>

      <div className="space-y-8">
        {challenges.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-100">{c.title}</h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">{c.description}</p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-white/5 text-xs shrink-0">
                <span className="flex items-center gap-1 text-purple-300 font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Ends {formatDate(c.deadline)}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-mono">
                  <Users className="w-3.5 h-3.5" />
                  <span>{c.submissionsCount} submissions</span>
                </span>
              </div>
            </div>

            {/* Requirements & Prize */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-white/5 space-y-1">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Challenge Rules
                </span>
                <p className="text-slate-300 leading-relaxed">{c.requirements}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-500/30 space-y-1">
                <span className="font-semibold text-purple-300 uppercase tracking-wider text-[10px] block flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Grand Prize
                </span>
                <p className="text-slate-200 font-semibold leading-relaxed">{c.prize}</p>
              </div>
            </div>

            {/* Submissions Leaderboard */}
            {c.submissions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Top Submissions Leaderboard
                </h3>
                <div className="space-y-2">
                  {c.submissions.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-lg bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3 text-xs hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-mono font-bold text-amber-400">
                          #{sub.rank || 1}
                        </span>
                        <div>
                          <Link
                            href={`/projects/${sub.project.slug}`}
                            className="font-bold text-slate-200 hover:text-emerald-400"
                          >
                            {sub.project.title}
                          </Link>
                          <div className="text-[11px] text-slate-500">
                            by @{sub.project.creator.username} • {sub.project.tagline}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                          {sub.project.vibeScore} / 100
                        </span>
                        <Link
                          href={`/projects/${sub.project.slug}`}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
