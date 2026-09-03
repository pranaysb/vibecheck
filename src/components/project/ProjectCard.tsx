"use client";

import React from "react";
import Link from "next/link";
import { VibeScoreBadge } from "./VibeScoreBadge";
import { AIInvolvementBadge } from "./AIInvolvementBadge";
import { getScoreColor } from "@/lib/utils";
import { ShieldCheck, MessageSquare, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
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
    <SpotlightCard
      spotlightColor="rgba(99, 102, 241, 0.08)"
      className="group flex flex-col justify-between border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1"
    >
      <div>
        {/* Top Preview Banner with Soft Minimalist Canvas */}
        <div className="relative h-36 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100/60 border-b border-slate-200/80 p-4 flex flex-col justify-between overflow-hidden">
          {/* Light subtle grid pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-40 group-hover:opacity-60 transition-opacity" />

          <div className="relative z-10 flex items-center justify-between">
            <AIInvolvementBadge involvement={project.aiInvolvement} />
            {project.scoreDelta && project.scoreDelta > 0 ? (
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-full shadow-xs">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>+{project.scoreDelta} on {project.latestVersion || "v2"}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono font-medium">v1 release</span>
            )}
          </div>

          {/* Project Header Preview */}
          <div className="relative z-10 flex items-end justify-between">
            <div className="space-y-1">
              <Link href={`/projects/${project.slug}`}>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  {project.title}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>by</span>
                <Link
                  href={`/users/${project.creator.username}`}
                  className="hover:text-slate-900 font-medium text-slate-600"
                >
                  @{project.creator.username}
                </Link>
              </div>
            </div>

            {/* Vibe Score Display with NumberTicker */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-transform group-hover:scale-105 shadow-xs ${sc.badge}`}
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
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {project.tagline}
          </p>

          {/* Tech Stack Tags */}
          <div className="flex flex-wrap gap-1">
            {project.techStack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-mono font-medium group-hover:border-slate-300 transition-colors"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 font-mono">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Metrics & Actions */}
      <div className="p-5 pt-0">
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            {project.isExpertReviewed && (
              <span className="flex items-center gap-1 text-indigo-700 font-medium" title="Reviewed by verified senior engineer">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Expert</span>
              </span>
            )}
            {project.isSecurityReviewed && (
              <span className="flex items-center gap-1 text-emerald-700 font-medium" title="Critical security checks passed">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Hardened</span>
              </span>
            )}
            {project.reviewsCount !== undefined && (
              <span className="flex items-center gap-1 text-slate-500">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{project.reviewsCount} reviews</span>
              </span>
            )}
          </div>

          <Link
            href={`/projects/${project.slug}`}
            className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
          >
            <span>Check vibe</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </SpotlightCard>
  );
}
