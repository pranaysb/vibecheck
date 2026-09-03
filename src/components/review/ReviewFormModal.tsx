"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/auth/UserContext";
import { X, Sparkles, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormModalProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export function ReviewFormModal({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onReviewSubmitted,
}: ReviewFormModalProps) {
  const { currentUser } = useUser();
  const [productScore, setProductScore] = useState(8);
  const [designScore, setDesignScore] = useState(8);
  const [engineeringScore, setEngineeringScore] = useState(8);
  const [docScore, setDocScore] = useState(8);
  const [wouldShip, setWouldShip] = useState<"YES" | "ALMOST" | "NOT_YET">("ALMOST");

  const [whatLiked, setWhatLiked] = useState("");
  const [whatToImprove, setWhatToImprove] = useState("");
  const [biggestIssue, setBiggestIssue] = useState("");
  const [bugReport, setBugReport] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please select a test persona or sign in to submit a review.");
      return;
    }
    if (!whatLiked.trim() || !whatToImprove.trim() || !biggestIssue.trim()) {
      toast.error("Please fill in What you liked, What to improve, and the Biggest issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userId: currentUser.id,
          productScore,
          designScore,
          engineeringScore,
          docScore,
          wouldShip,
          whatLiked,
          whatToImprove,
          biggestIssue,
          bugReport: bugReport || null,
          suggestion: suggestion || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Review submitted! You earned +15 reputation points.");
        if (onReviewSubmitted) onReviewSubmitted();
        onClose();
      } else {
        toast.error(data.error || "Failed to submit review.");
      }
    } catch {
      toast.error("Network error submitting review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-slate-950 shadow-2xl p-6 z-50 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Review: {projectTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reviewing as <strong className="text-slate-200">{currentUser?.name || "Anonymous"}</strong> (@{currentUser?.username || "alexrivera"})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1-10 Ratings Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-900/60 border border-white/5">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Product (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={productScore}
                onChange={(e) => setProductScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 font-mono text-emerald-400 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Design / UX (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={designScore}
                onChange={(e) => setDesignScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 font-mono text-emerald-400 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Engineering (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={engineeringScore}
                onChange={(e) => setEngineeringScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 font-mono text-emerald-400 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Docs (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={docScore}
                onChange={(e) => setDocScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 font-mono text-emerald-400 font-bold"
                required
              />
            </div>
          </div>

          {/* Would You Ship This? */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Would you ship this?</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "YES", label: "Yes, ready to ship", color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" },
                { val: "ALMOST", label: "Almost (needs minor polish)", color: "border-amber-500/40 text-amber-400 bg-amber-500/10" },
                { val: "NOT_YET", label: "Not yet (blockers exist)", color: "border-rose-500/40 text-rose-400 bg-rose-500/10" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setWouldShip(opt.val as any)}
                  className={`p-2 rounded-lg border text-center font-medium transition-all ${
                    wouldShip === opt.val ? opt.color + " ring-1 ring-white/20" : "border-white/10 bg-slate-900/40 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* What Did You Like? */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">What did you like? *</label>
            <textarea
              value={whatLiked}
              onChange={(e) => setWhatLiked(e.target.value)}
              placeholder="The value prop is immediate, fast loading speed, crisp typography..."
              rows={2}
              className="w-full bg-slate-900/80 border border-white/10 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              required
            />
          </div>

          {/* What Should Be Improved? */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">What should be improved? *</label>
            <textarea
              value={whatToImprove}
              onChange={(e) => setWhatToImprove(e.target.value)}
              placeholder="Clarify onboarding steps, debounce search input..."
              rows={2}
              className="w-full bg-slate-900/80 border border-white/10 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              required
            />
          </div>

          {/* Biggest Issue */}
          <div>
            <label className="block text-rose-400 font-semibold mb-1">Biggest issue *</label>
            <textarea
              value={biggestIssue}
              onChange={(e) => setBiggestIssue(e.target.value)}
              placeholder="Missing authorization boundary on private routes, race conditions..."
              rows={2}
              className="w-full bg-slate-900/80 border border-rose-500/30 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
              required
            />
          </div>

          {/* Optional Bug Report & Suggestion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Optional Bug Report</label>
              <textarea
                value={bugReport}
                onChange={(e) => setBugReport(e.target.value)}
                placeholder="Steps to reproduce, console errors..."
                rows={2}
                className="w-full bg-slate-900/80 border border-white/10 rounded-lg p-2 text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Optional Suggestion</label>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Try using tanstack/react-query, add optimistic updates..."
                rows={2}
                className="w-full bg-slate-900/80 border border-white/10 rounded-lg p-2 text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Constructive feedback helps developers ship.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit Review"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
