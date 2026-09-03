"use client";

import React, { useState } from "react";
import { ShieldCheck, Star, Sparkles } from "lucide-react";
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
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 space-y-4 hover:border-white/[0.18] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_20px_40px_-15px_rgba(0,0,0,0.8)] transition-all flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={expert.avatar || "/placeholder-avatar.png"}
                alt={expert.name}
                className="w-12 h-12 rounded-full object-cover border border-white/[0.1]"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white">{expert.name}</h3>
                  <span title="Verified Engineer"><ShieldCheck className="w-4 h-4 text-cyan-400" /></span>
                </div>
                <div className="text-xs text-zinc-500">{expert.expertProfile.title}</div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {expert.expertProfile.yearsExperience} yrs exp • @{expert.username}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-600 font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{expert.expertProfile.rating.toFixed(1)}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {expert.expertProfile.reviewsCount} reviews
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
            {expert.expertProfile.bio}
          </p>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1">
            {expert.expertProfile.specialties.map((spec) => (
              <span
                key={spec}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-zinc-400 font-mono"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono text-[10px]">Per Review</div>
            <div className="text-sm font-mono font-bold text-white">
              {formatInr(expert.expertProfile.reviewRateInr)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/users/${expert.username}`}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/[0.06] text-xs font-medium transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-zinc-600" />
              <span>Request Review</span>
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
