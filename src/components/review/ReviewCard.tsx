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
  CornerDownRight,
  Send,
  Sparkles,
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
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
      case "ALMOST":
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
      case "NOT_YET":
      default:
        return "bg-rose-500/15 text-rose-300 border-rose-500/40";
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5 space-y-4">
      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/users/${review.author.username}`}>
            <img
              src={review.author.avatar || "/placeholder-avatar.png"}
              alt={review.author.name}
              className="w-10 h-10 rounded-full object-cover border border-white/10"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${review.author.username}`}
                className="font-semibold text-sm text-slate-100 hover:text-emerald-400 transition-colors"
              >
                {review.author.name}
              </Link>
              <span className="text-xs text-slate-400 font-mono">@{review.author.username}</span>
              {review.author.role === "EXPERT" && (
                <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-medium px-1.5 py-0.2 rounded border border-cyan-500/30 bg-cyan-500/10">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">{review.author.reputationPoints.toLocaleString()} review points</span>
              <span>•</span>
              <span>{formatTimeAgo(review.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Would Ship Badge */}
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium mb-1">
            Would Ship?
          </span>
          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getShipBadge(review.wouldShip)}`}>
            {review.wouldShip === "YES" ? "Ship it" : review.wouldShip === "ALMOST" ? "Almost ready" : "Not yet"}
          </span>
        </div>
      </div>

      {/* Structured Category Scores Bar */}
      <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-white/5 text-center text-xs">
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Product</div>
          <div className="font-mono font-bold text-slate-200">{review.productScore}/10</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Design / UX</div>
          <div className="font-mono font-bold text-slate-200">{review.designScore}/10</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Engineering</div>
          <div className="font-mono font-bold text-slate-200">{review.engineeringScore}/10</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Docs</div>
          <div className="font-mono font-bold text-slate-200">{review.docScore}/10</div>
        </div>
      </div>

      {/* Detailed Written Feedback */}
      <div className="space-y-3 text-xs leading-relaxed">
        <div>
          <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] block mb-0.5">
            What did you like?
          </span>
          <p className="text-slate-200">{review.whatLiked}</p>
        </div>

        <div>
          <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px] block mb-0.5">
            What should be improved?
          </span>
          <p className="text-slate-200">{review.whatToImprove}</p>
        </div>

        <div>
          <span className="font-semibold text-rose-400 uppercase tracking-wider text-[10px] block mb-0.5 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" /> Biggest Issue
          </span>
          <p className="text-slate-300 bg-rose-950/20 p-2.5 rounded border border-rose-500/20">{review.biggestIssue}</p>
        </div>

        {review.bugReport && (
          <div>
            <span className="font-semibold text-orange-400 uppercase tracking-wider text-[10px] block mb-0.5 flex items-center gap-1">
              <Bug className="w-3 h-3" /> Bug Report
            </span>
            <p className="text-slate-300 bg-slate-950 p-2.5 rounded font-mono text-[11px] border border-white/5">
              {review.bugReport}
            </p>
          </div>
        )}

        {review.suggestion && (
          <div>
            <span className="font-semibold text-blue-400 uppercase tracking-wider text-[10px] block mb-0.5 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> Concrete Suggestion
            </span>
            <p className="text-slate-300">{review.suggestion}</p>
          </div>
        )}
      </div>

      {/* Action footer: Helpful Vote + Reply Toggle */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <HelpfulVoteButton
          reviewId={review.id}
          initialVotes={review.helpfulVotesCount}
          authorId={review.userId}
        />

        <button
          onClick={() => setIsReplying(!isReplying)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Reply ({comments.length})</span>
        </button>
      </div>

      {/* Reply Thread */}
      {(comments.length > 0 || isReplying) && (
        <div className="pt-2 pl-4 border-l-2 border-white/10 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="text-xs space-y-1 bg-slate-950/60 p-3 rounded-lg border border-white/5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  {c.user.name}
                  <span className="text-[10px] text-slate-500 font-mono">@{c.user.username}</span>
                </span>
                <span className="text-slate-500 font-mono">{formatTimeAgo(c.createdAt)}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{c.content}</p>
            </div>
          ))}

          {isReplying && (
            <form onSubmit={handlePostReply} className="space-y-2 pt-1">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write an engineering reply or clarify the implementation..."
                rows={2}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-3 py-1 rounded text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply || !replyText.trim()}
                  className="px-3 py-1 rounded text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>Post Reply</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
