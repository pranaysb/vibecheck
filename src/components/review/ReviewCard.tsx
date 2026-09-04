"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HelpfulVoteButton } from "./HelpfulVoteButton";
import { formatTimeAgo } from "@/lib/utils";
import { useUser } from "@/lib/auth/UserContext";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  AlertOctagon,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export interface ReviewData {
  id: string;
  projectId: string;
  userId: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
    reputationPoints: number;
    role: string;
  };
  productScore: number;
  designScore: number;
  engineeringScore: number;
  docScore: number;
  wouldShip: "YES" | "ALMOST" | "NOT_YET";
  whatLiked: string;
  whatToImprove: string;
  biggestIssue: string;
  bugReport?: string | null;
  suggestion?: string | null;
  helpfulVotesCount: number;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    user: {
      name: string;
      username: string;
      avatar?: string | null;
      role: string;
    };
  }>;
  createdAt: string | Date;
}

export function ReviewCard({ review }: { review: ReviewData }) {
  const { currentUser } = useUser();
  const [comments, setComments] = useState(review.comments || []);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please log in or switch persona to reply.");
      return;
    }
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          content: replyText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setReplyText("");
        setIsReplying(false);
        toast.success("Reply posted!");
      } else {
        toast.error("Failed to post reply.");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getShipBadge = (val: string) => {
    switch (val) {
      case "YES":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ALMOST":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "NOT_YET":
      default:
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs text-left">
      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/users/${review.author.username}`}>
            <img
              src={review.author.avatar || "/placeholder-avatar.png"}
              alt={review.author.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${review.author.username}`}
                className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors"
              >
                {review.author.name}
              </Link>
              <span className="text-xs text-slate-500 font-mono">@{review.author.username}</span>
              {review.author.role === "EXPERT" && (
                <span className="flex items-center gap-1 text-[10px] text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" /> Verified Expert
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
              <span className="text-slate-700 font-medium">{review.author.reputationPoints.toLocaleString()} reputation pts</span>
              <span>•</span>
              <span>{formatTimeAgo(review.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Would Ship Badge */}
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
            Would Ship?
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getShipBadge(review.wouldShip)}`}>
            {review.wouldShip === "YES" ? "Ship it" : review.wouldShip === "ALMOST" ? "Almost ready" : "Not yet"}
          </span>
        </div>
      </div>

      {/* Structured Category Scores Bar */}
      <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-mono">Product</div>
          <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{review.productScore}/10</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-mono">Design / UX</div>
          <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{review.designScore}/10</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-mono">Engineering</div>
          <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{review.engineeringScore}/10</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-mono">Docs</div>
          <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{review.docScore}/10</div>
        </div>
      </div>

      {/* Detailed Written Feedback */}
      <div className="space-y-3.5 text-xs leading-relaxed">
        <div>
          <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block mb-1">
            What did you like?
          </span>
          <p className="text-slate-700 bg-emerald-50/40 p-3 rounded-xl border border-emerald-200/60 leading-relaxed">
            {review.whatLiked}
          </p>
        </div>

        <div>
          <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block mb-1">
            What could be improved?
          </span>
          <p className="text-slate-700 bg-amber-50/40 p-3 rounded-xl border border-amber-200/60 leading-relaxed">
            {review.whatToImprove}
          </p>
        </div>

        <div>
          <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px] block mb-1 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            Biggest Issue / Blocker:
          </span>
          <p className="text-slate-700 bg-rose-50/40 p-3 rounded-xl border border-rose-200/60 leading-relaxed font-medium">
            {review.biggestIssue}
          </p>
        </div>

        {review.bugReport && (
          <div>
            <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px] block mb-1 flex items-center gap-1">
              <Bug className="w-3.5 h-3.5 text-rose-600" />
              Reproduction Steps / Bug Details:
            </span>
            <pre className="text-slate-800 bg-slate-100 p-3 rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-wrap">
              {review.bugReport}
            </pre>
          </div>
        )}

        {review.suggestion && (
          <div>
            <span className="font-bold text-indigo-800 uppercase tracking-wider text-[10px] block mb-1 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
              Suggested Architecture / UX Solution:
            </span>
            <p className="text-slate-700 bg-indigo-50/40 p-3 rounded-xl border border-indigo-200/60 leading-relaxed">
              {review.suggestion}
            </p>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
        <HelpfulVoteButton
          reviewId={review.id}
          initialVotes={review.helpfulVotesCount} authorId={review.userId}
        />

        <button
          onClick={() => setIsReplying(!isReplying)}
          className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Reply ({comments.length})</span>
        </button>
      </div>

      {/* Reply Thread */}
      {isReplying && (
        <form onSubmit={handlePostReply} className="pt-3 border-t border-slate-100 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a constructive response or clarify details..."
            rows={2}
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReply}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>{isSubmittingReply ? "Posting..." : "Reply"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Comments */}
      {comments.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100">
          {comments.map((c) => (
            <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="font-bold text-slate-900">@{c.user.username}</span>
                <span>{formatTimeAgo(c.createdAt)}</span>
              </div>
              <p className="text-slate-700">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
