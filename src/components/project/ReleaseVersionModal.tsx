"use client";

import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";

interface Finding {
  id: string;
  title: string;
  severity: string;
  category: string;
}

export function ReleaseVersionModal({
  projectId,
  projectSlug,
  openFindings,
  nextVersionNumber,
  isOpen,
  onClose,
}: {
  projectId: string;
  projectSlug: string;
  openFindings: Finding[];
  nextVersionNumber: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [versionNumber, setVersionNumber] = useState(nextVersionNumber);
  const [changelog, setChangelog] = useState("");
  const [selectedFindings, setSelectedFindings] = useState<string[]>(openFindings.map((f) => f.id));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleFinding = (id: string) => {
    if (selectedFindings.includes(id)) {
      setSelectedFindings(selectedFindings.filter((fId) => fId !== id));
    } else {
      setSelectedFindings([...selectedFindings, id]);
    }
  };

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionNumber || !changelog.trim()) {
      toast.error("Version number and changelog are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionNumber,
          changelog: changelog.trim(),
          fixedFindingIds: selectedFindings,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        toast.success(`Released ${versionNumber}! Score improved by +${data.scoreDelta} points.`);
        onClose();
        router.push(`/projects/${projectSlug}/versions`);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to release new version.");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl border border-white/10 bg-slate-950 shadow-2xl p-6 z-50 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">Release New Version & Update Score</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRelease} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Version Identifier</label>
            <input
              type="text"
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="e.g. v2 or v2.1"
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Changelog / Release Summary *</label>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="e.g. Hardened API authorization checks, fixed WCAG color contrast on buttons, optimized hero images..."
              rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {openFindings.length > 0 && (
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">
                Mark Fixed Findings (Increases Vibe Score)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-slate-900/60 border border-white/5">
                {openFindings.map((f) => {
                  const isChecked = selectedFindings.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleFinding(f.id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors ${
                        isChecked ? "bg-emerald-950/20 border border-emerald-500/30 text-emerald-300" : "hover:bg-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="truncate flex-1">{f.title}</span>
                      <span className="font-mono text-[10px] uppercase font-bold text-slate-500 ml-2">
                        {f.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Releasing this version will recompute your Vibe Score and create a notification.</span>
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
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{isSubmitting ? "Publishing..." : "Publish Release"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
