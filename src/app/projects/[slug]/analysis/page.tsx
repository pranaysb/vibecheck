import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { LiveAnalysisRunner } from "@/components/analysis/LiveAnalysisRunner";
import { ScoreRadar } from "@/components/project/ScoreRadar";
import { FindingsList } from "@/components/project/FindingsList";

export const revalidate = 0;

interface AnalysisPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectAnalysisPage({ params }: AnalysisPageProps) {
  const { slug } = await params;

  let project = null;
  try {
    project = await prisma.project.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: {
        creator: true,
        findings: { orderBy: [{ status: "asc" }, { severity: "asc" }, { createdAt: "desc" }] },
      },
    });
  } catch (err) {
    console.warn("Analysis query error:", err);
  }

  if (!project) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <div>
        <Link
          href={"/projects/" + project.slug}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 mb-2 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {project.title}</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
          <Zap className="w-6 h-6 text-indigo-600" />
          <span>Automated Analysis & Diagnostics</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Automated security headers, performance latency, and WCAG accessibility verification for {project.title}.
        </p>
      </div>

      <LiveAnalysisRunner
        projectId={project.id}
        liveUrl={project.liveUrl}
        githubUrl={project.githubUrl}
        projectTitle={project.title}
        initialScore={project.vibeScore}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ScoreRadar
            product={project.scoreProduct}
            ux={project.scoreUx}
            engineering={project.scoreEngineering}
            security={project.scoreSecurity}
            performance={project.scorePerformance}
            accessibility={project.scoreAccessibility}
            documentation={project.scoreDocumentation}
          />
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Safety & Verification Notice
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              VibeCheck automated analysis performs static, remote-safe checks (TLS encryption, HTTP security headers, payload compression, and accessibility landmarks). Automated scanning does not guarantee an application is free of vulnerabilities and requires manual engineering verification.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Diagnostic Findings ({project.findings.length})
            </h3>
            <FindingsList findings={project.findings as any} isCreator={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
