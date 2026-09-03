"use client";

import React from "react";
import Link from "next/link";
import { AIInvolvementBadge } from "./AIInvolvementBadge";
import { getScoreColor } from "@/lib/utils";
import { ShieldCheck, MessageSquare, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { NumberTicker } from "@/components/motion/NumberTicker";

export interface ProjectCardData {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  vibeScore: number;
  techStack: string[];
  aiInvolvement: string;
  creator: {
    name: string;
    username: string;
    avatar?: string | null;
  };
  reviewsCount?: number;
  isExpertReviewed?: boolean;
  isSecurityReviewed?: boolean;
  scoreDelta?: number;
  latestVersion?: string;
  screenshotUrl?: string | null;
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const sc = getScoreColor(project.vibeScore);

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md transition-all duration-200 overflow-hidden shadow-2xs">
      <div>
        {/* Top Preview Banner */}
        <div className="relative h-36 bg-zinc-50 border-b border-zinc-100 p-4 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-40" />

          <div className="relative z-10 flex items-center justify-between">
            <AIInvolvementBadge involvement={project.aiInvolvement} />
            {project.scoreDelta && project.scoreDelta > 0 ? (
              <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                <span>+{project.scoreDelta} on {project.latestVersion || "v2"}</span>
              </div>
            ) : (
              <span className="text-[10px] text-zinc-400 font-mono">v1 release</span>
            )}
          </div>

          {/* Project Header Preview */}
          <div className="relative z-10 flex items-end justify-between">
            <div className="space-y-1">
              <Link href={`/projects/${project.slug}`}>
                <h3 className="text-base font-semibold text-zinc-950 group-hover:text-zinc-700 transition-colors flex items-center gap-1.5 tracking-tight">
                  {project.title}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span>by</span>
                <Link
                  href={`/users/${project.creator.username}`}
                  className="hover:text-zinc-950 font-mono text-zinc-500 transition-colors"
                >
                  @{project.creator.username}
                </Link>
              </div>
            </div>

            {/* Vibe Score Display */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-transform group-hover:scale-105 shadow-2xs ${sc.badge}`}
            >
              <NumberTicker value={project.vibeScore} />
              {project.scoreDelta && project.scoreDelta > 0 && (
                <span className="text-[10px] font-bold text-emerald-700">
                  (+{project.scoreDelta})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
            {project.tagline}
          </p>

          {/* Tech Stack Tags */}
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md text-zinc-400 font-mono">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Meta & Indicators */}
      <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          {project.isExpertReviewed && (
            <span className="flex items-center gap-1 text-sky-700 font-medium" title="Expert Reviewed">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[10px]">Expert</span>
            </span>
          )}
          {project.isSecurityReviewed && (
            <span className="flex items-center gap-1 text-emerald-700 font-medium" title="Hardened Security">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px]">Hardened</span>
            </span>
          )}
          {project.reviewsCount !== undefined && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
              <MessageSquare className="w-3 h-3" />
              <span>{project.reviewsCount} reviews</span>
            </span>
          )}
        </div>

        <Link
          href={`/projects/${project.slug}`}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors"
        >
          <span>Check vibe</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
