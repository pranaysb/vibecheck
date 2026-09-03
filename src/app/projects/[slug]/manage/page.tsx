import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Settings, Plus, TrendingUp, Sparkles, Shield, AlertTriangle } from "lucide-react";
import { FindingsList } from "@/components/project/FindingsList";
import { ManageProjectClient } from "@/components/project/ManageProjectClient";

export const revalidate = 0;

interface ManagePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectManagePage({ params }: ManagePageProps) {
  const { slug } = await params;

  const project = await prisma.project.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      creator: true,
      versions: { orderBy: { createdAt: "desc" } },
      findings: { orderBy: [{ status: "asc" }, { severity: "asc" }, { createdAt: "desc" }] },
    },
  });

  if (!project) notFound();

  const openFindings = project.findings.filter((f) => f.status === "OPEN");
  const nextVer = `v${project.versions.length + 1}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 mb-2 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {project.title}</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-purple-400" />
              Manage: {project.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Mark diagnostic findings as fixed, release new versions, and elevate your Vibe Score.
            </p>
          </div>

          <ManageProjectClient
            projectId={project.id}
            projectSlug={project.slug}
            openFindings={openFindings}
            nextVersionNumber={nextVer}
          />
        </div>
      </div>

      {/* Findings Management Section */}
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Project Findings & Remediation</h3>
            <p className="text-xs text-slate-400">
              Toggle findings to 'Mark as fixed' after pushing code fixes to your live site or repository.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-400">
            {openFindings.length} open issues
          </span>
        </div>

        <FindingsList findings={project.findings as any} isCreator={true} />
      </div>
    </div>
  );
}
