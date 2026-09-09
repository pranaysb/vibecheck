import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Users,
  CheckCircle2,
  Check,
  Lock,
  Cpu,
  FileCode2,
  Eye,
  AlertTriangle,
  Server,
  Activity,
  Terminal,
} from "lucide-react";
import { ProjectCard } from "@/components/project/ProjectCard";
import { HeroProductWindow } from "@/components/home/HeroProductWindow";
import { InstantAuditBar } from "@/components/home/InstantAuditBar";
import { ComparisonTable } from "@/components/home/ComparisonTable";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { IntegrationsBar } from "@/components/home/IntegrationsBar";

export const revalidate = 0;

export default async function HomePage() {
  let featuredProjects: any[] = [];
  try {
    featuredProjects = await prisma.project.findMany({
      where: { isPublished: true },
      take: 6,
      orderBy: { vibeScore: "desc" },
      include: {
        creator: { select: { name: true, username: true, avatar: true } },
        versions: { orderBy: { createdAt: "desc" } },
        reviews: { select: { id: true } },
        expertReviews: { where: { status: "COMPLETED" }, select: { id: true } },
        findings: { select: { id: true, severity: true, status: true } },
      },
    });
  } catch (err) {
    console.warn("DB query fallback on home:", err);
  }

  if (featuredProjects.length === 0) {
    featuredProjects = [
      {
        id: "demo-cc",
        slug: "campusconnect",
        title: "CampusConnect",
        tagline: "Student peer-to-peer textbook and dorm essentials marketplace.",
        vibeScore: 86,
        techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
        aiInvolvement: "HEAVY",
        creator: { name: "Alex Rivera", username: "alexrivera", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
        versions: [{ versionNumber: "v3", scoreDelta: 13 }, { versionNumber: "v2", scoreDelta: 12 }, { versionNumber: "v1", scoreDelta: 0 }],
        reviews: [{ id: "r1" }, { id: "r2" }],
        expertReviews: [{ id: "er1" }],
        findings: [{ id: "f1", status: "FIXED", severity: "HIGH" }],
      },
      {
        id: "demo-rf",
        slug: "resumeforge-ai",
        title: "ResumeForge AI",
        tagline: "Real-time AI resume tailoring and ATS compatibility scoring.",
        vibeScore: 78,
        techStack: ["Next.js", "OpenAI API", "Tailwind CSS", "PostgreSQL"],
        aiInvolvement: "ALMOST_ENTIRELY",
        creator: { name: "Aisha Patel", username: "aishapatel", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150" },
        versions: [{ versionNumber: "v1", scoreDelta: 0 }],
        reviews: [{ id: "r3" }],
        expertReviews: [],
        findings: [{ id: "f2", status: "OPEN", severity: "HIGH" }],
      },
      {
        id: "demo-fs",
        slug: "flowstate-workspace",
        title: "FlowState",
        tagline: "Minimalist, distraction-free markdown scratchpad with local sync.",
        vibeScore: 84,
        techStack: ["React", "Vite", "IndexedDB", "Tailwind CSS"],
        aiInvolvement: "MODERATE",
        creator: { name: "Jordan Taylor", username: "jordantaylor", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
        versions: [{ versionNumber: "v1", scoreDelta: 0 }],
        reviews: [{ id: "r4" }],
        expertReviews: [],
        findings: [],
      },
    ];
  }

  const formattedFeatured = featuredProjects.map((p) => {
    const latestV = p.versions[0];
    const totalDelta = p.versions.reduce((sum: number, v: any) => sum + v.scoreDelta, 0);
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      tagline: p.tagline,
      vibeScore: p.vibeScore,
      techStack: p.techStack,
      aiInvolvement: p.aiInvolvement,
      creator: p.creator,
      reviewsCount: p.reviews.length,
      isExpertReviewed: p.expertReviews.length > 0,
      isSecurityReviewed: p.findings.some((f: any) => f.status === "FIXED"),
      scoreDelta: totalDelta > 0 ? totalDelta : undefined,
      latestVersion: latestV?.versionNumber,
    };
  });

  return (
    <div className="space-y-24 pb-24 bg-[#f8fafc] font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-12 overflow-hidden bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          {/* Eyebrow badge */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse-subtle" />
              <span>Continuous Security & Quality Verification</span>
            </div>
            <Link
              href="/ci-gate"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-800 text-xs font-mono font-medium hover:bg-blue-100 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-700" />
              <span>Interactive CI / PR Gate Demo</span>
              <ArrowRight className="w-3 h-3 text-blue-700" />
            </Link>
            <Link
              href="/security/self-audit"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-mono font-medium hover:bg-emerald-100 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Read VibeCheck's Own Self-Audit Report</span>
              <ArrowRight className="w-3 h-3 text-emerald-700" />
            </Link>
          </div>

          {/* Master Headline */}
          <div className="space-y-3 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-neutral-900 leading-[1.15]">
              Continuous security and engineering quality verification for AI-generated applications.
            </h1>
            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal pt-1">
              Automated anti-SSRF remote probes, AST static analysis, hard security gates, and reproducible cryptographic evidence. Delineate remote HTTP hygiene from deep repository authorization audits.
            </p>
          </div>

          {/* Interactive URL Audit Bar */}
          <div className="pt-2">
            <InstantAuditBar />
          </div>

          {/* Interactive macOS Product Window Preview */}
          <div className="pt-4">
            <HeroProductWindow />
          </div>
        </div>
      </section>

      {/* 2. ECOSYSTEM INTEGRATION BAR */}
      <section>
        <IntegrationsBar />
      </section>

      {/* 3. DEEP DIVE FEATURE 1: AUTOMATED AUDIT ENGINE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
              <Zap className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
              <span>Automated Audit Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
              Mitigate authorization gaps and security defects prior to release.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              When modern code generation velocities increase, subtle vulnerabilities including missing Content-Security-Policy headers, unauthenticated endpoints, and missing frame protections are easily overlooked. Our automated sandbox crawler inspects live deployments across standardized security vectors.
            </p>

            <ul className="space-y-2.5 text-xs text-neutral-700">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span><strong>Zero-Exfiltration SSRF Protection:</strong> Enforces sandboxed probes with strict RFC-1918 private subnet isolation.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span><strong>Security Header Verification:</strong> Audits Content-Security-Policy, HSTS, X-Content-Type-Options, and clickjacking protections.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span><strong>WCAG 2.1 AA Accessibility:</strong> Inspects color contrast ratios, keyboard navigation paths, and form input labels.</span>
              </li>
            </ul>
          </div>

          {/* Visual Showcase Card */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-xs space-y-4 text-left font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <span className="text-neutral-500 font-semibold text-[11px] uppercase tracking-wider">Audit Report Console</span>
              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-medium">35 Checks Passed</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-md bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2} />
                  <span>HSTS (Strict-Transport-Security)</span>
                </span>
                <span className="text-[10px] font-bold">max-age=63072000</span>
              </div>
              <div className="p-2.5 rounded-md bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2} />
                  <span>Frame Protection (X-Frame-Options)</span>
                </span>
                <span className="text-[10px] font-bold">DENY</span>
              </div>
              <div className="p-2.5 rounded-md bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" strokeWidth={1.5} />
                  <span>Missing Content-Security-Policy</span>
                </span>
                <span className="text-[10px] font-bold">Remediation Required</span>
              </div>
              <div className="p-2.5 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-800 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-neutral-700" strokeWidth={2} />
                  <span>Core Web Vitals (TTFB Latency)</span>
                </span>
                <span className="text-[10px] font-bold">142ms TTFB</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DEEP DIVE FEATURE 2: STRUCTURED PEER REVIEWS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visual Showcase Card */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-xs space-y-4 text-left order-2 lg:order-1">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="font-semibold text-xs text-neutral-900">Peer Consensus: 92% "Approve for Production"</span>
              </div>
              <span className="text-xs text-neutral-600 font-mono font-medium">+14 reputation</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-md bg-neutral-50 border border-neutral-200 text-xs">
              <div>
                <div className="text-[10px] text-neutral-500 font-medium uppercase font-mono">Architecture</div>
                <div className="font-mono font-semibold text-neutral-900 text-sm mt-0.5">9/10</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 font-medium uppercase font-mono">Security</div>
                <div className="font-mono font-semibold text-neutral-900 text-sm mt-0.5">8/10</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 font-medium uppercase font-mono">Scalability</div>
                <div className="font-mono font-semibold text-neutral-900 text-sm mt-0.5">9/10</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 font-medium uppercase font-mono">Operations</div>
                <div className="font-mono font-semibold text-neutral-900 text-sm mt-0.5">8/10</div>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-md border border-neutral-200">
              "Robust architecture. Identified one socket connection leak during connection termination, but general fault-tolerance and error boundaries are sound."
            </p>
          </div>

          <div className="space-y-6 text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
              <Users className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
              <span>Peer Review Network</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
              Rigorous, structured code evaluation from verified engineers.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Every peer review adheres to a standardized rubric (Architecture, Security, Reliability, Operations), logs reproducible defect traces, and records verified production readiness assessments.
            </p>

            <ul className="space-y-2.5 text-xs text-neutral-700">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span><strong>Reputation Protocol:</strong> Reviewers accrue reputation points only when repository owners confirm feedback validity.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span><strong>Defect Tracking:</strong> Automatically converts review observations into trackable findings.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span><strong>Staff Architect Audits:</strong> Commission in-depth architecture reviews with cryptographic sign-offs.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. COMPARISON MATRIX */}
      <section>
        <ComparisonTable />
      </section>

      {/* 6. CUSTOMER PROOF & TESTIMONIALS */}
      <section>
        <TestimonialSection />
      </section>

      {/* 7. FEATURED BENCHMARK PROJECTS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-left">
        <div className="flex items-end justify-between border-b border-neutral-200 pb-3">
          <div>
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
              Repository Index
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight mt-0.5">
              Audited Applications
            </h2>
          </div>
          <Link
            href="/discover"
            className="text-xs text-neutral-700 hover:text-neutral-900 flex items-center gap-1 font-medium transition-colors"
          >
            <span>View all records</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedFeatured.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {/* 8. FINAL ENTERPRISE CONVERSION CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 sm:p-12 space-y-5 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs font-mono font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
            <span>Enterprise Quality Assurance</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
            Deploy mission-critical software with verifiable confidence.
          </h2>
          <p className="text-neutral-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-normal">
            Automate pre-deployment security benchmarks, eliminate header misconfigurations, and deliver audit-grade code quality reports.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects/new"
              className="h-10 px-5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Submit Repository for Audit</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            <Link
              href="/pricing"
              className="h-10 px-5 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center"
            >
              <span>Review Enterprise SLA</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
