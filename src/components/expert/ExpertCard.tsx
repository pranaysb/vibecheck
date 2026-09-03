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
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-4 hover:border-slate-300 hover:shadow-xl transition-all flex flex-col justify-between shadow-xs">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={expert.avatar || "/placeholder-avatar.png"}
                alt={expert.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900">{expert.name}</h3>
                  <span title="Verified Engineer"><ShieldCheck className="w-4 h-4 text-indigo-600" /></span>
                </div>
                <div className="text-xs text-slate-500">{expert.expertProfile.title}</div>
                <div className="text-[11px] text-slate-400 font-mono">
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

          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {expert.expertProfile.bio}
          </p>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1">
            {expert.expertProfile.specialties.map((spec) => (
              <span
                key={spec}
                className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Per Review</div>
            <div className="text-sm font-mono font-bold text-slate-900">
              {formatInr(expert.expertProfile.reviewRateInr)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/users/${expert.username}`}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors shadow-xs"
            >
              Profile
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-indigo-300" />
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
