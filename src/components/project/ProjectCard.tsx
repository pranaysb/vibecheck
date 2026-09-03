import React from "react";
import Link from "next/link";
import { VibeScoreBadge } from "./VibeScoreBadge";
import { AIInvolvementBadge } from "./AIInvolvementBadge";
import { getScoreColor } from "@/lib/utils";
import { ShieldCheck, MessageSquare, TrendingUp, CheckCircle, ExternalLink } from "lucide-react";

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
    <div className="group rounded-xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-white/20 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Top Preview Banner with Mock Canvas / Screenshot */}
      <div className="relative h-36 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-b border-white/10 p-4 flex flex-col justify-between overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        <div className="relative z-10 flex items-center justify-between">
          <AIInvolvementBadge involvement={project.aiInvolvement} />
          {project.scoreDelta && project.scoreDelta > 0 ? (
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+{project.scoreDelta} on {project.latestVersion || "v2"}</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 font-mono">v1 release</span>
          )}
        </div>

        {/* Project Header Preview */}
        <div className="relative z-10 flex items-end justify-between">
          <div className="space-y-1">
            <Link href={`/projects/${project.slug}`}>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                {project.title}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>by</span>
              <Link href={`/users/${project.creator.username}`} className="hover:text-slate-200 font-medium">
                @{project.creator.username}
              </Link>
            </div>
          </div>

          <VibeScoreBadge score={project.vibeScore} size="md" />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
          {project.tagline}
        </p>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1">
          {project.techStack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-white/5 text-slate-400 font-mono"
            >
              {tech}
            </span>
          ))}
          {project.techStack.length > 4 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 font-mono">
              +{project.techStack.length - 4}
            </span>
          )}
        </div>

        {/* Badges & Trust Footer */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            {project.isExpertReviewed && (
              <span className="flex items-center gap-1 text-cyan-400" title="Reviewed by verified senior engineer">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-medium">Expert reviewed</span>
              </span>
            )}

            {project.isSecurityReviewed && !project.isExpertReviewed && (
              <span className="flex items-center gap-1 text-emerald-400" title="Critical security checks passed">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Security verified</span>
              </span>
            )}

            <span className="flex items-center gap-1 text-slate-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{project.reviewsCount || 0} reviews</span>
            </span>
          </div>

          <Link
            href={`/projects/${project.slug}`}
            className="text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
          >
            Check vibe →
          </Link>
        </div>
      </div>
    </div>
  );
}
