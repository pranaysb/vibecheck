"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/lib/auth/UserContext";
import { X, ShieldCheck, Check, Sparkles, AlertCircle } from "lucide-react";
import { formatInr } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectOption {
  id: string;
  title: string;
  slug: string;
  vibeScore: number;
}

export function RequestReviewModal({
  expert,
  isOpen,
  onClose,
}: {
  expert: {
    id: string; // user id
    name: string;
    title: string;
    reviewRateInr: number;
    specialties: string[];
    avatar?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}) {
  const { currentUser } = useUser();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<"ESSENTIAL" | "STANDARD" | "DEEP_DIVE">("STANDARD");
  const [selectedFocus, setSelectedFocus] = useState<string[]>(["Security", "Architecture"]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      // Fetch user's own projects
      fetch(`/api/projects`)
        .then((res) => res.json())
        .then((data) => {
          const myProjects = (data.projects || []).filter((p: any) => p.creator.id === currentUser.id);
          // If no projects created by current user, provide all for testing
          const available = myProjects.length > 0 ? myProjects : data.projects || [];
          setProjects(available);
          if (available.length > 0) setSelectedProjectId(available[0].id);
        })
        .catch(console.error);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const focusOptions = ["Security", "Architecture", "Backend", "Frontend", "Performance", "Product", "Full-stack"];

  const packages = [
    {
      id: "ESSENTIAL",
      name: "Essential Review",
      price: 999,
      desc: "High-level architecture audit & top 3 critical blockers checklist.",
    },
    {
      id: "STANDARD",
      name: "Senior Full-Stack Review",
      price: expert.reviewRateInr || 2499,
      desc: "Full code review, auth boundary analysis, scalability audit, and written report.",
      popular: true,
    },
    {
      id: "DEEP_DIVE",
      name: "Deep Architectural Audit",
      price: 4999,
      desc: "In-depth code walkthrough, database query profiling, and 30-min architecture debrief.",
    },
  ];

  const toggleFocus = (focus: string) => {
    if (selectedFocus.includes(focus)) {
      if (selectedFocus.length > 1) {
        setSelectedFocus(selectedFocus.filter((f) => f !== focus));
      }
    } else {
      setSelectedFocus([...selectedFocus, focus]);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please select a test persona or sign in.");
      return;
    }
    if (!selectedProjectId) {
      toast.error("Please select a project to submit for review.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/experts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          expertId: expert.id,
          creatorId: currentUser.id,
          packageType: selectedPackage,
          focusAreas: selectedFocus,
          notes,
        }),
      });

      if (res.ok) {
        toast.success(`Engineering review requested from ${expert.name}!`);
        onClose();
        router.push("/dashboard");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit request.");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPkg = packages.find((p) => p.id === selectedPackage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-slate-950 shadow-2xl p-6 z-50 my-8">
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={expert.avatar || "/placeholder-avatar.png"}
              alt={expert.name}
              className="w-11 h-11 rounded-full object-cover border border-cyan-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{expert.name}</h3>
                <span className="flex items-center gap-1 text-[10px] text-cyan-300 font-semibold px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/10">
                  <ShieldCheck className="w-3 h-3" /> Verified Engineer
                </span>
              </div>
              <p className="text-xs text-slate-400">{expert.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
          {/* Select Project */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Project for Review</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} (Score: {p.vibeScore}/100)
                </option>
              ))}
            </select>
          </div>

          {/* Package Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Select Review Package</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id as any)}
                    className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500"
                        : "border-white/10 bg-slate-900/40 hover:bg-slate-900"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 text-[9px] font-bold">
                        RECOMMENDED
                      </span>
                    )}
                    <div className="font-semibold text-slate-200">{pkg.name}</div>
                    <div className="text-sm font-bold font-mono text-cyan-400 mt-1">
                      {formatInr(pkg.price)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{pkg.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Focus Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Review Focus Areas (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {focusOptions.map((f) => {
                const isSel = selectedFocus.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFocus(f)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      isSel
                        ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                        : "border-white/10 bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              What specific questions or concerns do you have?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please check our authorization checks on API routes, investigate memory usage on large tables, or verify if our database schema will scale to 10k users..."
              rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Summary & Checkout Simulation */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Total Investment:</div>
              <div className="text-base font-mono font-bold text-slate-100">
                {formatInr(currentPkg?.price || 2499)}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 text-right">
              ✓ Turnaround: 48-72 hours<br />
              ✓ Engineering Review Report included
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
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
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Confirm & Request Review"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
