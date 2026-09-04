"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/auth/UserContext";
import { X, Sparkles, Send, AlertCircle, AlertTriangle, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormModalProps {
  projectId: string;
  projectTitle: string;
  projectCreatorId?: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export function ReviewFormModal({
  projectId,
  projectTitle,
  projectCreatorId,
  isOpen,
  onClose,
  onReviewSubmitted,
}: ReviewFormModalProps) {
  const { currentUser, demoUsers, switchUser } = useUser();
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

  const isCreator = Boolean(projectCreatorId && currentUser?.id === projectCreatorId);

  // Find an alternate peer reviewer from demo users
  const alternatePeer = demoUsers.find((u) => u.id !== projectCreatorId && u.role === "REVIEWER") || demoUsers[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please select a test persona or sign in to submit a review.");
      return;
    }
    if (isCreator) {
      toast.error("Creators cannot review their own submissions. Please switch to a peer persona.");
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
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 sm:p-8 z-50 my-8 text-left space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Community Peer Review: {projectTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Active reviewer: <strong className="text-slate-800">{currentUser?.name || "Anonymous"}</strong> (@{currentUser?.username || "developer"})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Self-Review Guard */}
        {isCreator && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Self-Review Protection</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              You are the creator of this project. On VibeCheck, creators cannot review their own submissions to protect platform integrity.
            </p>
            {alternatePeer && (
              <button
                type="button"
                onClick={async () => {
                  await switchUser(alternatePeer.id);
                  toast.success(`Switched to peer reviewer @${alternatePeer.username}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Switch to Reviewer @{alternatePeer.username}</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-700">
          {/* 1-10 Ratings Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Product (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={productScore}
                onChange={(e) => setProductScore(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-indigo-700 font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Design / UX (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={designScore}
                onChange={(e) => setDesignScore(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-indigo-700 font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Engineering (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={engineeringScore}
                onChange={(e) => setEngineeringScore(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-indigo-700 font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Docs (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={docScore}
                onChange={(e) => setDocScore(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-indigo-700 font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Would you ship this? */}
          <div className="space-y-1.5">
            <label className="block text-slate-900 font-bold">Would you ship this application?</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: "YES", label: "Ship it", desc: "Production-ready" },
                { val: "ALMOST", label: "Almost ready", desc: "Minor fixes needed" },
                { val: "NOT_YET", label: "Not yet", desc: "Needs rework" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setWouldShip(item.val as any)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    wouldShip === item.val
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Written Feedback Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-900 font-bold mb-1">What did you like? *</label>
              <textarea
                value={whatLiked}
                onChange={(e) => setWhatLiked(e.target.value)}
                rows={2}
                placeholder="Highlight effective UX patterns, snappy responses, or clear code structure."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-900 font-bold mb-1">What should be improved? *</label>
              <textarea
                value={whatToImprove}
                onChange={(e) => setWhatToImprove(e.target.value)}
                rows={2}
                placeholder="Constructive feedback on friction points, missing loading states, or validation."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-900 font-bold mb-1">What is the biggest issue or blocker? *</label>
              <textarea
                value={biggestIssue}
                onChange={(e) => setBiggestIssue(e.target.value)}
                rows={2}
                placeholder="The single most important flaw to resolve before launch."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Earn +15 reputation points on submit</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isCreator}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
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
