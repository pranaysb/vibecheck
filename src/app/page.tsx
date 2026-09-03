import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Users,
  CheckCircle2,
  Check,
  Cpu,
} from "lucide-react";
import { ProjectCard } from "@/components/project/ProjectCard";
import { BackgroundBeams } from "@/components/motion/BackgroundBeams";
import { FlipWords } from "@/components/motion/FlipWords";
import { BorderBeam } from "@/components/motion/BorderBeam";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { InfiniteMarquee } from "@/components/motion/InfiniteMarquee";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ShimmerBadge } from "@/components/motion/ShimmerBadge";

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
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 pb-16 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
        <BackgroundBeams className="opacity-90" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Animated Shimmer Badge */}
          <ShimmerBadge icon={<span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />}>
            <span>The Production Verification Layer for AI-Built Apps</span>
          </ShimmerBadge>

          {/* Core Headlines with Dynamic Motion Word Flipper */}
          <div className="space-y-2 pt-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 font-sans leading-tight">
              You built it with{" "}
              <FlipWords words={["Cursor", "Claude Code", "Lovable", "Bolt.new", "v0", "Replit"]} />
            </h1>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 font-sans">
              Now{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700">
                prove it's good.
              </span>
            </h1>
          </div>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            VibeCheck gives AI-assisted developers honest feedback, automated checks, and expert engineering reviews before they ship.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects/new"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-md shadow-slate-900/10 hover:shadow-xl flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Submit your project</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/discover"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <span>Explore projects</span>
            </Link>
          </div>

          {/* Realistic Vibe Score Demo Showcase Card */}
          <div className="pt-12 max-w-2xl mx-auto">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-2xl shadow-slate-200/60 text-left space-y-6 relative group overflow-hidden">
              <BorderBeam size={280} duration={12} delay={0} colorFrom="#4f46e5" colorTo="#8b5cf6" />
              <div className="absolute -top-3 left-6 px-3.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-mono text-indigo-700 font-bold shadow-xs">
                LIVE DEMO BENCHMARK
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Aggregate Quality Rating
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">CampusConnect Vibe Score</h3>
                  <div className="text-xs text-slate-500 font-mono mt-1">
                    Updated after v3 release (35 automated checks + 4 peer reviews)
                  </div>
                </div>

                <div className="flex items-baseline gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl shadow-xs">
                  <NumberTicker value={82} className="text-4xl sm:text-5xl font-mono font-black text-emerald-700" />
                  <span className="text-slate-400 font-mono text-xs font-semibold">/ 100</span>
                </div>
              </div>

              {/* Category Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Product</span>
                  <span className="font-mono font-bold text-slate-900">91</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Design / UX</span>
                  <span className="font-mono font-bold text-slate-900">86</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Engineering</span>
                  <span className="font-mono font-bold text-slate-900">78</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Security</span>
                  <span className="font-mono font-bold text-slate-900">73</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Performance</span>
                  <span className="font-mono font-bold text-slate-900">88</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Accessibility</span>
                  <span className="font-mono font-bold text-slate-900">81</span>
                </div>
              </div>

              {/* What VibeCheck Found */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-700">What VibeCheck found:</div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-rose-700 font-medium bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <strong>1</strong> critical issue
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700 font-medium bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <strong>4</strong> improvements
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <strong>21</strong> strengths
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Motion Marquee for AI Ecosystem */}
      <section className="border-y border-slate-200/80 bg-white/70 py-3">
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
            { name: "Prisma ORM", category: "Data Layer" },
            { name: "Zod", category: "Runtime Schema" },
          ]}
        />
      </section>

      {/* Core Loop Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <div className="text-xs font-mono text-indigo-600 uppercase tracking-wider font-bold">
            How it works
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            The Continuous Vibe Check Loop
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            From your first Cursor or Claude Code prompt to a hardened, verified production release.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          {[
            { step: "01", name: "BUILD", desc: "Build fast with Cursor, Claude Code, Lovable, or v0.", icon: <Cpu className="w-5 h-5 text-purple-600" /> },
            { step: "02", name: "CHECK", desc: "Automated scanner audits headers, a11y, and speed.", icon: <Zap className="w-5 h-5 text-amber-600" /> },
            { step: "03", name: "REVIEW", desc: "Community developers & verified experts stress-test UX.", icon: <Users className="w-5 h-5 text-indigo-600" /> },
            { step: "04", name: "IMPROVE", desc: "Fix findings, bump your score, and record evolution.", icon: <TrendingUp className="w-5 h-5 text-emerald-600" /> },
            { step: "05", name: "SHIP", desc: "Deploy with confidence and a verifiable quality badge.", icon: <CheckCircle2 className="w-5 h-5 text-cyan-600" /> },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-2 relative group hover:border-indigo-300 hover:shadow-lg transition-all text-left shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400">{item.step}</span>
                {item.icon}
              </div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                {item.name}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-mono text-indigo-600 uppercase tracking-wider font-bold">
              Trending & Most Improved
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
              Featured Community Projects
            </h2>
          </div>
          <Link
            href="/discover"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-7 space-y-4 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Community Feedback</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real developers review your project across Product, UX, Engineering, and Documentation. Peer reviews include concrete bug reports and actionable suggestions.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                <span>Structured 1-10 category breakdowns</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                <span>"Would you ship this?" peer consensus</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                <span>Reputation-backed developer profiles</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-7 space-y-4 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Automated Analysis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatically identify potential engineering, accessibility, performance, and security problems using our safe SSRF-protected scanner.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>Security headers (CSP, HSTS, X-Frame)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>WCAG accessibility & screen reader checks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>Secret pattern detection & TTFB metrics</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-7 space-y-4 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Expert Engineering Review</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Book verified senior software engineers (ex-Stripe, Staff Architects) for comprehensive written reports covering authorization, scalability, and code structure.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-600" />
                <span>Verified industry credentials</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-600" />
                <span>Formal Engineering Review Report</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-600" />
                <span>Transparent pricing from ₹999</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Strong CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-12">
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 p-8 sm:p-14 space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
            Stop wondering if your project is good.<br />
            <span className="text-indigo-600">Find out.</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Join hundreds of indie hackers and vibe-coded builders proving their work, catching critical vulnerabilities early, and shipping with confidence.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects/new"
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-md shadow-slate-900/10 hover:shadow-xl hover:-translate-y-0.5"
            >
              Submit your project now
            </Link>
            <Link
              href="/discover"
              className="px-6 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs hover:-translate-y-0.5"
            >
              Browse live submissions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
