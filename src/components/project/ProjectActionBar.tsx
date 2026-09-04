"use client";

import React, { useState } from "react";
import { ExternalLink, MessageSquare, Sparkles, Settings, Share2, Check } from "lucide-react";
import { GithubIcon } from "@/components/ui/Icons";
import { ReviewFormModal } from "@/components/review/ReviewFormModal";
import { RequestReviewModal } from "@/components/expert/RequestReviewModal";
import { useUser } from "@/lib/auth/UserContext";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectActionBarProps {
  project: {
    id: string;
    slug: string;
    title: string;
    liveUrl: string;
    githubUrl?: string | null;
    userId: string;
  };
}

export function ProjectActionBar({ project }: ProjectActionBarProps) {
  const { currentUser } = useUser();
  const router = useRouter();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isExpertOpen, setIsExpertOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isCreator = currentUser?.id === project.userId;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Project URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Live Site */}
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open live site</span>
        </a>

        {/* GitHub */}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>View GitHub</span>
          </a>
        )}

        {/* Review Project */}
        <button
          onClick={() => setIsReviewOpen(true)}
          className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          <span>Review project</span>
        </button>

        {/* Request Expert Review */}
        <button
          onClick={() => setIsExpertOpen(true)}
          className="px-3 py-1.5 rounded-lg border border-cyan-300 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Request Expert Review</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs transition-colors shadow-2xs"
          title="Share Project"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
        </button>

        {/* Creator Management Link */}
        {isCreator && (
          <Link
            href={`/projects/${project.slug}/manage`}
            className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Manage Project</span>
          </Link>
        )}
      </div>

      <ReviewFormModal
        projectId={project.id}
        projectTitle={project.title}
        projectCreatorId={project.userId}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onReviewSubmitted={() => router.refresh()}
      />

      <RequestReviewModal
        expert={{
          id: "sarahchen_id",
          name: "Sarah Chen",
          title: "Senior Software Engineer (Ex-Stripe)",
          reviewRateInr: 999,
          specialties: ["Backend", "Security", "System Design"],
        }}
        isOpen={isExpertOpen}
        onClose={() => setIsExpertOpen(false)}
      />
    </>
  );
}
