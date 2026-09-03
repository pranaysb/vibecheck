"use client";

import React, { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/auth/UserContext";

export function HelpfulVoteButton({
  reviewId,
  initialVotes,
  authorId,
}: {
  reviewId: string;
  initialVotes: number;
  authorId: string;
}) {
  const { currentUser } = useUser();
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleVote = async () => {
    if (!currentUser) {
      toast.error("Please select a persona or log in to vote.");
      return;
    }

    if (currentUser.id === authorId) {
      toast.error("You cannot vote on your own review (anti-abuse protection).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const data = await res.json();
      if (res.ok) {
        setHasVoted(data.isHelpful);
        setVotes(data.helpfulVotesCount);
        if (data.isHelpful) {
          toast.success("Voted helpful! Reviewer earned +10 reputation points.");
        } else {
          toast.info("Helpful vote removed.");
        }
      } else {
        toast.error(data.error || "Failed to vote");
      }
    } catch {
      toast.error("Network error while voting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleVote}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
        hasVoted
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          : "border-white/10 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
      }`}
      title="Was this review helpful?"
    >
      <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? "text-emerald-400 fill-emerald-400/20" : ""}`} />
      <span>Helpful?</span>
      <span className="font-mono font-bold text-slate-200 ml-0.5">{votes}</span>
    </button>
  );
}
