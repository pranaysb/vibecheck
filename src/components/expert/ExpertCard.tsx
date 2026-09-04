"use client";

import React, { useState } from "react";
import { ShieldCheck, Star } from "lucide-react";
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
        <div className="space-y-3.5">
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
                <div className="text-xs text-slate-600 font-medium">{expert.expertProfile.title}</div>
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
          <div className="flex flex-wrap gap-1.5 pt-1">
            {expert.expertProfile.specialties.map((spec) => (
              <span
                key={spec}
                className="text-[10px] px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Footer with reconciled From ₹999 pricing */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Audit Rate
            </span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              From ₹999 <span className="text-[11px] text-slate-500 font-normal">/ review</span>
            </span>
            <span className="text-[10px] text-slate-400 block">
              (Essential ₹999 • Full-Stack ₹2,499)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/users/${expert.username}`}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs"
            >
              Profile
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
            >
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
