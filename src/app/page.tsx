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
    <div className="space-y-32 pb-24 bg-[#f8fafc]">
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 sm:pt-24 pb-12 overflow-hidden bg-gradient-to-b from-white via-[#f8fafc] to-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-indigo-200 bg-indigo-50/80 text-indigo-700 text-xs font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>The Continuous Verification Platform for AI-Built Software</span>
          </div>

          {/* Master Headline */}
          <div className="space-y-3 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 font-sans leading-[1.1]">
              Ship AI-assisted software with the confidence of a staff engineer.
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-2">
              Automated security & accessibility scans, structured peer developer feedback, and verified staff engineer sign-off—built specifically for modern AI codebases.
            </p>
          </div>

          {/* Interactive URL Audit Bar */}
          <div className="pt-2">
            <InstantAuditBar />
          </div>

          {/* Interactive macOS Product Window Preview */}
          <div className="pt-8">
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
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              <Zap className="w-3.5 h-3.5" />
              <span>Automated Engine</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Catch authorization holes and security omissions before your users do.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              When AI generates fullstack applications in minutes, subtle vulnerabilities like missing Row-Level Security, open CORS policies, and unprotected API endpoints are routinely introduced. Our headless analysis crawler inspects your live deployment across 35+ automated security and accessibility vectors.
            </p>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero-Exfiltration SSRF Protection:</strong> Runs via sandboxed crawler with strict RFC-1918 private subnet blocking.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Security Header Verification:</strong> Validates Content-Security-Policy, HSTS, X-Content-Type-Options, and referrer leakage.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>WCAG 2.1 AA Accessibility:</strong> Audits color contrast, keyboard focus traps, and form input labels for compliance.</span>
              </li>
            </ul>
          </div>

          {/* Visual Showcase Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 text-left font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-slate-500 font-semibold text-[11px] uppercase">Audit Report Console</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">35 Checks Passed</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-emerald-800 text-[11px] flex items-center justify-between">
                <span>✓ HSTS (Strict-Transport-Security)</span>
                <span className="text-[10px] font-bold">max-age=63072000</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-emerald-800 text-[11px] flex items-center justify-between">
                <span>✓ Frame Protection (X-Frame-Options)</span>
                <span className="text-[10px] font-bold">DENY</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-amber-800 text-[11px] flex items-center justify-between">
                <span>⚠ Missing Content-Security-Policy</span>
                <span className="text-[10px] font-bold">Remediation Suggested</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] flex items-center justify-between">
                <span>✓ Core Web Vitals (LCP / TTFB)</span>
                <span className="text-[10px] font-bold">142ms TTFB • 1.1s LCP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DEEP DIVE FEATURE 2: STRUCTURED PEER REVIEWS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visual Showcase Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 text-left order-2 lg:order-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-xs text-slate-900">Peer Consensus: 92% "Ship it"</span>
              </div>
              <span className="text-xs text-indigo-600 font-mono font-semibold">+14 reputation</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Product</div>
                <div className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">9/10</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Design</div>
                <div className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">8/10</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Engineering</div>
                <div className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">9/10</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Docs</div>
                <div className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">8/10</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50/60 p-3 rounded-lg border border-slate-100">
              "Great UX on mobile. Identified one memory leak on unmounting the WebSockets feed, but overall solid error boundaries. Highly recommend shipping."
            </p>
          </div>

          <div className="space-y-6 text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              <Users className="w-3.5 h-3.5" />
              <span>Peer Review Network</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Honest, structured feedback from engineers who actually read code.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              No generic "great job!" comments. Every peer review follows a rigorous 4-category rubric (Product, UX, Engineering, Docs), provides step-by-step bug reproductions, and records an unequivocal "Would you ship this?" vote.
            </p>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Reputation-Driven Community:</strong> Reviewers gain platform points only when the project creator votes their feedback helpful.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Actionable Findings Tracker:</strong> Convert reviewer suggestions into trackable findings that bump your public Vibe Score when fixed.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Staff Engineer Marketplace:</strong> Book 1-on-1 audits from verified tech leads at Stripe, Meta, and top startups.</span>
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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-left">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-mono text-indigo-600 uppercase tracking-widest font-semibold">
              Live Submissions
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Recent Verified Projects
            </h2>
          </div>
          <Link
            href="/discover"
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold transition-colors"
          >
            <span>View all benchmarks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedFeatured.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {/* 8. FINAL ENTERPRISE CONVERSION CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-8">
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-b from-indigo-50/60 to-white p-8 sm:p-14 space-y-6 shadow-xl shadow-indigo-500/5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 bg-white text-indigo-700 text-xs font-mono font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ready to Verify Your Build?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-sans tracking-tight">
            Stop guessing if your app is ready.<br />
            <span className="text-indigo-600">Prove it before you ship.</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-normal">
            Join thousands of developers using VibeCheck to audit code, fix critical flaws, improve scores across versions, and build an indisputable proof-of-quality portfolio.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects/new"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Submit Project Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold shadow-2xs transition-all"
            >
              <span>View Pricing Plans</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
