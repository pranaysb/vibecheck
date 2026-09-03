"use client";

import React, { useState } from "react";
import { ShieldCheck, Star, Sparkles, ExternalLink } from "lucide-react";
import { formatInr } from "@/lib/utils";
import { RequestReviewModal } from "./RequestReviewModal";
import Link from "next/link";

export interface ExpertCardData {
  id: string; // User ID
  name: string;
  username: string;
  avatar?: string | null;
  bio?: string | null;
  githubUrl?: string | null;
  expertProfile: {
    title: string;
    yearsExperience: number;
    hourlyRateInr: number;
    reviewRateInr: number;
    specialties: string[];
    bio: string;
    rating: number;
    reviewsCount: number;
  };
}

export function ExpertCard({ expert }: { expert: ExpertCardData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={expert.avatar || "/placeholder-avatar.png"}
                alt={expert.name}
                className="w-12 h-12 rounded-full object-cover border border-cyan-500/30"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-100">{expert.name}</h3>
                  <span title="Verified Engineer"><ShieldCheck className="w-4 h-4 text-cyan-400" /></span>
                </div>
                <div className="text-xs text-slate-400">{expert.expertProfile.title}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {expert.expertProfile.yearsExperience} yrs exp • @{expert.username}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-400 font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{expert.expertProfile.rating.toFixed(1)}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {expert.expertProfile.reviewsCount} reviews
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {expert.expertProfile.bio}
          </p>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1">
            {expert.expertProfile.specialties.map((spec) => (
              <span
                key={spec}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-cyan-500/20 text-cyan-300 font-mono"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Per Review</div>
            <div className="text-sm font-mono font-bold text-slate-100">
              {formatInr(expert.expertProfile.reviewRateInr)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/users/${expert.username}`}
              className="px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-medium"
            >
              Profile
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors shadow-sm shadow-cyan-500/20 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Request review</span>
            </button>
          </div>
        </div>
      </div>

      <RequestReviewModal
        expert={{
          id: expert.id,
          name: expert.name,
          title: expert.expertProfile.title,
          reviewRateInr: expert.expertProfile.reviewRateInr,
          specialties: expert.expertProfile.specialties,
          avatar: expert.avatar,
        }}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
