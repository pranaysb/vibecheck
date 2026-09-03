import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProjectCard } from "@/components/project/ProjectCard";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Cpu,
  Layers,
  Terminal,
  Zap,
  Check,
  Users,
  Eye,
  Bot,
} from "lucide-react";

export const revalidate = 0;

export default async function LandingPage() {
  // Fetch featured projects for showcase
  const featuredProjects = await prisma.project.findMany({
    where: { isPublished: true, isFeatured: true },
    include: {
      creator: { select: { name: true, username: true, avatar: true } },
      versions: { orderBy: { createdAt: "desc" } },
      reviews: { select: { id: true } },
      expertReviews: { where: { status: "COMPLETED" }, select: { id: true } },
      findings: { select: { id: true, severity: true, status: true } },
    },
    take: 6,
    orderBy: { vibeScore: "desc" },
  });

  const formattedFeatured = featuredProjects.map((p) => {
    const latestV = p.versions[0];
    const totalDelta = p.versions.reduce((sum, v) => sum + v.scoreDelta, 0);
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
      isSecurityReviewed: p.findings.some((f) => f.status === "FIXED"),
      scoreDelta: totalDelta > 0 ? totalDelta : undefined,
      latestVersion: latestV?.versionNumber,
      screenshotUrl: p.screenshotUrl,
    };
  });

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-12 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>The Production Verification Layer for AI-Built Apps</span>
          </div>

          {/* Core Headlines */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-100 font-sans">
              You built it.
            </h1>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-emerald-400 font-sans">
              Now prove it's good.
            </h1>
          </div>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            VibeCheck gives AI-assisted developers honest feedback, automated checks, and expert engineering reviews before they ship.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects/new"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <span>Submit your project</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/discover"
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-white/15 bg-slate-900/60 hover:bg-slate-900 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Explore projects</span>
            </Link>
          </div>

          {/* Realistic Vibe Score Demo Showcase Card */}
          <div className="pt-12 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-white/15 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-md text-left space-y-6 relative group">
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-slate-900 border border-emerald-500/40 text-[11px] font-mono text-emerald-400 font-bold">
                LIVE DEMO BENCHMARK
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Aggregate Rating
                  </span>
                  <h3 className="text-lg font-bold text-slate-100">CampusConnect Vibe Score</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Updated after v3 release (35 automated checks + 4 peer reviews)
                  </div>
                </div>

                <div className="flex items-baseline gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl">
                  <span className="text-4xl sm:text-5xl font-mono font-black text-emerald-400">82</span>
                  <span className="text-slate-400 font-mono text-xs">/ 100</span>
                </div>
              </div>

              {/* Category Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Product</span>
                  <span className="font-mono font-bold text-emerald-400">91</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Design / UX</span>
                  <span className="font-mono font-bold text-emerald-400">86</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Engineering</span>
                  <span className="font-mono font-bold text-amber-400">78</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Security</span>
                  <span className="font-mono font-bold text-amber-400">73</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Performance</span>
                  <span className="font-mono font-bold text-emerald-400">88</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Accessibility</span>
                  <span className="font-mono font-bold text-emerald-400">81</span>
                </div>
              </div>

              {/* What VibeCheck Found */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="text-xs font-semibold text-slate-300">What VibeCheck found:</div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <strong>1</strong> critical issue
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <strong>4</strong> improvements
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <strong>21</strong> strengths
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Loop Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
            How it works
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            The Continuous Vibe Check Loop
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            From your first Cursor or Claude Code prompt to a hardened, verified production release.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          {[
            { step: "01", name: "BUILD", desc: "Build fast with Cursor, Claude Code, Lovable, or v0.", icon: <Cpu className="w-5 h-5 text-purple-400" /> },
            { step: "02", name: "CHECK", desc: "Automated scanner audits headers, a11y, and speed.", icon: <Zap className="w-5 h-5 text-amber-400" /> },
            { step: "03", name: "REVIEW", desc: "Community developers & verified experts stress-test UX.", icon: <Users className="w-5 h-5 text-blue-400" /> },
            { step: "04", name: "IMPROVE", desc: "Fix findings, bump your score, and record evolution.", icon: <TrendingUp className="w-5 h-5 text-emerald-400" /> },
            { step: "05", name: "SHIP", desc: "Deploy with confidence and a verifiable quality badge.", icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" /> },
          ].map((item, idx) => (
            <div
              key={item.name}
              className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-2 relative group hover:border-emerald-500/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-500">{item.step}</span>
                {item.icon}
              </div>
              <div className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                {item.name}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              Trending & Most Improved
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mt-1">Featured Community Projects</h2>
          </div>
          <Link
            href="/discover"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>View all 11+ projects</span>
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
          <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Community Feedback</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real developers review your project across Product, UX, Engineering, and Documentation. Peer reviews include concrete bug reports and actionable suggestions.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Structured 1-10 category breakdowns</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>"Would you ship this?" peer consensus</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Reputation-backed developer profiles</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Automated Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically identify potential engineering, accessibility, performance, and security problems using our safe SSRF-protected scanner.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security headers (CSP, HSTS, X-Frame)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>WCAG accessibility & screen reader checks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secret pattern detection & TTFB metrics</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Expert Engineering Review</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Book verified senior software engineers (ex-Stripe, Staff Architects) for comprehensive written reports covering authorization, scalability, and code structure.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verified industry credentials</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Formal Engineering Review Report</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Transparent pricing from ₹999</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Strong CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-12">
        <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 p-8 sm:p-12 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-sans tracking-tight">
            Stop wondering if your project is good.<br />
            <span className="text-emerald-400">Find out.</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Join hundreds of indie hackers and vibe-coded builders proving their work, catching critical vulnerabilities early, and shipping with confidence.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects/new"
              className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              Submit your project now
            </Link>
            <Link
              href="/discover"
              className="px-6 py-3 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-sm font-semibold hover:bg-slate-800"
            >
              Browse live submissions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
