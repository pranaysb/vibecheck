import React from "react";
import { prisma } from "@/lib/db";
import { AdminControlPanel } from "@/components/admin/AdminControlPanel";
import { ShieldCheck, Users, FileText, AlertOctagon, Activity } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  const [reports, experts, projects, events, usersCount] = await Promise.all([
    prisma.report.findMany({
      include: {
        reporter: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "EXPERT" },
      include: { expertProfile: true },
    }),
    prisma.project.findMany({
      orderBy: { vibeScore: "desc" },
      select: { id: true, title: true, tagline: true, vibeScore: true, isFeatured: true },
    }),
    prisma.productEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.user.count(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Platform Administration & Safety</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 font-sans tracking-tight mt-2">
          Moderation & Governance Control Room
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Review community dispute reports, manage expert engineer verification, feature submissions, and inspect platform analytics events.
        </p>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1">
          <span className="text-slate-400 font-medium">Total Registered Users</span>
          <div className="text-xl font-bold font-mono text-slate-100">{usersCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1">
          <span className="text-slate-400 font-medium">Total Projects Listed</span>
          <div className="text-xl font-bold font-mono text-slate-100">{projects.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1">
          <span className="text-slate-400 font-medium">Pending Abuse Reports</span>
          <div className="text-xl font-bold font-mono text-rose-400">
            {reports.filter((r) => r.status === "PENDING").length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-1">
          <span className="text-slate-400 font-medium">Verified Experts</span>
          <div className="text-xl font-bold font-mono text-cyan-400">{experts.length}</div>
        </div>
      </div>

      {/* Control Panel Tabs */}
      <AdminControlPanel
        initialReports={reports}
        initialExperts={experts}
        initialProjects={projects}
      />

      {/* System Activity Feed */}
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 space-y-4 text-xs">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Platform Audit Trail (Product Events)
        </h3>
        <div className="space-y-2 font-mono">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="p-2.5 rounded bg-slate-950/60 border border-white/5 flex items-center justify-between text-slate-400 text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{ev.eventName}</span>
                {ev.projectId && <span className="text-slate-500">project: {ev.projectId.slice(0, 8)}...</span>}
              </div>
              <span className="text-slate-600">{new Date(ev.createdAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
