"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Star, AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminControlPanel({
  initialReports,
  initialExperts,
  initialProjects,
}: {
  initialReports: any[];
  initialExperts: any[];
  initialProjects: any[];
}) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [experts, setExperts] = useState(initialExperts);
  const [projects, setProjects] = useState(initialProjects);
  const [activeTab, setActiveTab] = useState<"REPORTS" | "EXPERTS" | "PROJECTS">("REPORTS");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleResolveReport = async (reportId: string, status: "RESOLVED" | "DISMISSED") => {
    setActionInProgress(reportId);
    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status }),
      });

      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status } : r))
        );
        toast.success(`Report marked as ${status.toLowerCase()}!`);
      } else {
        toast.error("Failed to update report");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleFeatureProject = async (projectId: string, currentFeatured: boolean) => {
    setActionInProgress(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !currentFeatured }),
      });

      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, isFeatured: !currentFeatured } : p))
        );
        toast.success(!currentFeatured ? "Project featured on homepage!" : "Project unfeatured.");
        router.refresh();
      } else {
        toast.error("Failed to update project status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs">
        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === "REPORTS"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Moderation Reports ({reports.filter((r) => r.status === "PENDING").length} pending)
        </button>
        <button
          onClick={() => setActiveTab("EXPERTS")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === "EXPERTS"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Expert Verification ({experts.length})
        </button>
        <button
          onClick={() => setActiveTab("PROJECTS")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === "PROJECTS"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Featured Projects ({projects.filter((p) => p.isFeatured).length})
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === "REPORTS" && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No moderation reports.</div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl border border-white/10 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase">
                      {rep.reason}
                    </span>
                    <span className="text-slate-400 font-mono">Target: {rep.targetType}</span>
                    <span
                      className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        rep.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-300"
                          : rep.status === "RESOLVED"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed pt-1">
                    Details: "{rep.details || "No details provided"}"
                  </p>
                  <div className="text-[11px] text-slate-500">
                    Reported by @{rep.reporter?.username || "user"}
                  </div>
                </div>

                {rep.status === "PENDING" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolveReport(rep.id, "RESOLVED")}
                      disabled={actionInProgress === rep.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, "DISMISSED")}
                      disabled={actionInProgress === rep.id}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Experts Tab */}
      {activeTab === "EXPERTS" && (
        <div className="space-y-3">
          {experts.map((exp) => (
            <div
              key={exp.id}
              className="p-4 rounded-xl border border-white/10 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src={exp.avatar || "/placeholder-avatar.png"}
                  alt={exp.name}
                  className="w-10 h-10 rounded-full object-cover border border-cyan-500/40"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{exp.name}</span>
                    <span className="text-[10px] text-cyan-300 font-mono font-bold px-1.5 py-0.2 rounded border border-cyan-500/30 bg-cyan-500/10">
                      {exp.expertProfile?.verificationStatus || "VERIFIED"}
                    </span>
                  </div>
                  <div className="text-slate-400">{exp.expertProfile?.title} • {exp.expertProfile?.yearsExperience} years exp</div>
                  <div className="text-[11px] text-slate-500 font-mono">@{exp.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  {exp.expertProfile?.reviewsCount || 0} reviews completed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Featured Projects Tab */}
      {activeTab === "PROJECTS" && (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl border border-white/10 bg-slate-900/40 flex items-center justify-between gap-4 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{p.title}</span>
                  <span className="font-mono text-emerald-400 font-bold">{p.vibeScore}/100</span>
                  {p.isFeatured && (
                    <span className="text-[10px] text-amber-300 font-semibold px-2 py-0.2 rounded bg-amber-500/15 border border-amber-500/30">
                      FEATURED
                    </span>
                  )}
                </div>
                <div className="text-slate-400">{p.tagline}</div>
              </div>

              <button
                onClick={() => handleToggleFeatureProject(p.id, p.isFeatured)}
                disabled={actionInProgress === p.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  p.isFeatured
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                    : "border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>{p.isFeatured ? "Unfeature" : "Feature on Homepage"}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
