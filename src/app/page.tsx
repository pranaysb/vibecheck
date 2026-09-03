import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  MessageSquare,
  Users,
  CheckCircle2,
  Check,
  Cpu,
} from "lucide-react";
import { ProjectCard } from "@/components/project/ProjectCard";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { InfiniteMarquee } from "@/components/motion/InfiniteMarquee";

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
        screenshotUrl: "/mockups/campusconnect.png",
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
        screenshotUrl: "/mockups/resumeforge.png",
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
        screenshotUrl: "/mockups/flowstate.png",
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
      screenshotUrl: p.screenshotUrl,
    };
  });

  return (
    <div className="space-y-28 pb-24">
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 overflow-hidden">
        {/* Ambient Top Spotlight (Linear signature) */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none opacity-50"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(120, 119, 198, 0.2), transparent 70%)",
          }}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Minimalist Linear Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-400 text-xs font-mono backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>The Verification Layer for AI-Assisted Software</span>
          </div>

          {/* Core Headlines */}
          <div className="space-y-2 pt-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white font-sans leading-tight">
              You built it with AI.
            </h1>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 font-sans">
              Now prove it's good.
            </h1>
          </div>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Automated security and accessibility auditing, structured developer reviews, and expert engineering sign-off for modern AI-assisted builders.
          </p>

          {/* Primary & Secondary CTAs (Linear Signature) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects/new"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium text-xs transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
            >
              <span>Submit your project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/discover"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-xs font-medium transition-all flex items-center justify-center gap-2"
            >
              <span>Explore projects</span>
            </Link>
          </div>

          {/* Realistic Vibe Score Demo Showcase Card */}
          <div className="pt-12 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-7 sm:p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_25px_50px_-15px_rgba(0,0,0,0.9)] text-left space-y-6 relative overflow-hidden backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                <div>
                  <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                    Benchmark Audit
                  </span>
                  <h3 className="text-lg font-semibold text-white mt-0.5 tracking-tight">CampusConnect Vibe Score</h3>
                  <div className="text-xs text-zinc-500 font-mono mt-1">
                    35 automated checks + 4 peer reviews
                  </div>
                </div>

                <div className="flex items-baseline gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
                  <NumberTicker value={82} className="text-3xl sm:text-4xl font-mono font-bold text-emerald-400" />
                  <span className="text-zinc-500 font-mono text-xs">/ 100</span>
                </div>
              </div>

              {/* Category Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Product</span>
                  <span className="font-mono font-bold text-white">91</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Design / UX</span>
                  <span className="font-mono font-bold text-white">86</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Engineering</span>
                  <span className="font-mono font-bold text-zinc-300">78</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Security</span>
                  <span className="font-mono font-bold text-zinc-300">73</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Performance</span>
                  <span className="font-mono font-bold text-white">88</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <span className="text-zinc-400">Accessibility</span>
                  <span className="font-mono font-bold text-white">81</span>
                </div>
              </div>

              {/* What VibeCheck Found */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <div className="text-xs text-zinc-400 font-medium">Automated Findings:</div>
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <span className="flex items-center gap-1.5 text-rose-400 font-mono text-[11px] bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    1 critical issue
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    4 improvements
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    21 strengths
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subtle Marquee */}
      <section className="border-y border-white/[0.06] bg-white/[0.01] py-3">
        <InfiniteMarquee
          items={[
            { name: "Cursor", category: "AI IDE" },
            { name: "Claude Code", category: "Agentic CLI" },
            { name: "Lovable", category: "Fullstack AI" },
            { name: "Bolt.new", category: "In-Browser Node" },
            { name: "v0 by Vercel", category: "Generative UI" },
            { name: "Replit Agent", category: "Autonomous Dev" },
            { name: "Next.js 15", category: "React Framework" },
            { name: "Supabase", category: "Cloud Postgres" },
            { name: "Tailwind CSS", category: "Modern Styling" },
            { name: "TypeScript", category: "Type Integrity" },
          ]}
        />
      </section>

      {/* Core Loop Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            The Continuous Verification Loop
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            From initial prototype to a hardened, verifiable production release.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { step: "01", name: "BUILD", desc: "Build fast with Cursor, Claude, or Lovable.", icon: <Cpu className="w-4 h-4 text-zinc-300" /> },
            { step: "02", name: "AUDIT", desc: "Automated scan checks headers, security, and a11y.", icon: <Zap className="w-4 h-4 text-zinc-300" /> },
            { step: "03", name: "REVIEW", desc: "Community developers stress-test UX and code.", icon: <Users className="w-4 h-4 text-zinc-300" /> },
            { step: "04", name: "HARDEN", desc: "Fix findings, bump your score, record progress.", icon: <TrendingUp className="w-4 h-4 text-zinc-300" /> },
            { step: "05", name: "SHIP", desc: "Deploy with a verifiable proof-of-quality badge.", icon: <CheckCircle2 className="w-4 h-4 text-zinc-300" /> },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-5 space-y-2 relative group hover:border-white/[0.18] transition-all text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">{item.step}</span>
                {item.icon}
              </div>
              <div className="font-semibold text-xs text-white tracking-wide">
                {item.name}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Community Benchmarks
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mt-1">
              Featured Submissions
            </h2>
          </div>
          <Link
            href="/discover"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>View all projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedFeatured.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {/* Three Pillars: Community, Automated, Expert */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-7 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_20px_40px_-15px_rgba(0,0,0,0.8)]">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">Community Feedback</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real developers review your project across Product, UX, Engineering, and Docs with concrete bug reports and actionable suggestions.
            </p>
            <ul className="space-y-2 text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>Structured 1-10 category breakdowns</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>"Would you ship this?" peer consensus</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>Reputation-backed developer profiles</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-7 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_20px_40px_-15px_rgba(0,0,0,0.8)]">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">Automated Analysis</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Identify engineering, accessibility, and security problems using our safe SSRF-protected static and runtime scanner.
            </p>
            <ul className="space-y-2 text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>Security headers (CSP, HSTS, X-Frame)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>WCAG accessibility & screen reader checks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>Secret pattern detection & TTFB metrics</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-7 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_20px_40px_-15px_rgba(0,0,0,0.8)]">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">Expert Engineering Review</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Book verified senior engineers (ex-Stripe, Staff Architects) for comprehensive written reports on authorization, scalability, and code structure.
            </p>
            <ul className="space-y-2 text-xs text-zinc-400 pt-3 border-t border-white/[0.06]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>Verified industry credentials</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>Formal Engineering Review Report</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>Transparent pricing from ₹999</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Strong CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-12">
        <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c0e] p-8 sm:p-14 space-y-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_25px_50px_-15px_rgba(0,0,0,0.9)]">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white font-sans tracking-tight">
            Stop guessing if your app is ready.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
              Verify before you ship.
            </span>
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Join developers using VibeCheck to audit code, improve scores across versions, and build a verifiable proof-of-quality portfolio.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects/new"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium text-xs shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all"
            >
              Submit your project now
            </Link>
            <Link
              href="/discover"
              className="px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium transition-all"
            >
              Browse live submissions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
