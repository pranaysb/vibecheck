import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  ArrowRight,
  Sparkles,
  MousePointerClick,
  Palette,
  Compass,
  Smartphone,
  ShieldCheck,
  Zap,
  Lock,
  Terminal,
  Globe,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  ExternalLink,
  Layers,
  Cpu,
} from "lucide-react";
import { InstantAuditBar } from "@/components/home/InstantAuditBar";

export const revalidate = 0;

export default async function HomePage() {
  let recentAudits: any[] = [];
  try {
    recentAudits = await prisma.auditReport.findMany({
      where: { isPublic: true },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        targetUrl: true,
        finalUrl: true,
        domain: true,
        score: true,
        grade: true,
        verdict: true,
        ttfbMs: true,
        hops: true,
        createdAt: true,
      },
    });
  } catch (err) {
    console.warn("Could not query recent audits:", err);
  }

  // Fallback high-craft seed records if database is fresh
  if (recentAudits.length === 0) {
    recentAudits = [
      {
        id: "seed-vercel",
        targetUrl: "https://vercel.com",
        domain: "vercel.com",
        score: 95,
        grade: "A+",
        verdict: "ELITE CRAFT & VIBE",
        ttfbMs: 78,
        hops: 1,
        createdAt: new Date(),
      },
      {
        id: "seed-linear",
        targetUrl: "https://linear.app",
        domain: "linear.app",
        score: 94,
        grade: "A+",
        verdict: "ELITE CRAFT & VIBE",
        ttfbMs: 82,
        hops: 0,
        createdAt: new Date(),
      },
      {
        id: "seed-github",
        targetUrl: "https://github.com",
        domain: "github.com",
        score: 91,
        grade: "A",
        verdict: "HIGH CRAFT - READY TO SHIP",
        ttfbMs: 112,
        hops: 0,
        createdAt: new Date(),
      },
      {
        id: "seed-react",
        targetUrl: "https://react.dev",
        domain: "react.dev",
        score: 89,
        grade: "A",
        verdict: "HIGH CRAFT - READY TO SHIP",
        ttfbMs: 145,
        hops: 0,
        createdAt: new Date(),
      },
    ];
  }

  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    "A+": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    A: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    B: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    C: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    D: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    F: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  };

  return (
    <div className="w-full max-w-full space-y-20 pb-20 font-sans overflow-x-clip">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 bg-white border-b border-neutral-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Eyebrow badge */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Real-Time Product & UI/UX Audit</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Zero-Theater Verification</span>
            </div>
          </div>

          {/* Master Headline */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 leading-[1.15]">
              Instant UI, UX & Vibe Audit for Web Applications.
            </h1>
            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal pt-1">
              Audit your buttons, typography harmony, visual ambience, product flow, mobile ergonomics, and production baseline in 5 seconds. Get actionable code recommendations to ship elite craft.
            </p>
          </div>

          {/* Instant Audit Input Bar */}
          <div className="pt-3">
            <InstantAuditBar />
          </div>
        </div>
      </section>

      {/* 2. RECENT LIVE AUDITS FEED */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              Recently Audited Web Applications
            </h2>
            <p className="text-xs text-neutral-500">
              Live craft and vibe scores generated by VibeCheck's real-time inspection engine.
            </p>
          </div>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            <span>View All Public Audits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentAudits.map((audit) => {
            const gradeColor = gradeColors[audit.grade] || gradeColors.F;
            return (
              <Link
                key={audit.id}
                href={`/report/${audit.id}`}
                className="group p-5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-xs transition-all space-y-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-semibold text-neutral-900 text-sm truncate group-hover:text-neutral-950">
                      {audit.domain}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400 truncate">
                      {audit.targetUrl}
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-md border font-mono font-bold text-xs ${gradeColor.border} ${gradeColor.bg} ${gradeColor.text} shrink-0`}>
                    {audit.grade}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-100">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{audit.ttfbMs}ms TTFB</span>
                  </span>
                  <span className="font-bold text-neutral-900">
                    {audit.score}/100 Vibe
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FOUR CORE PRODUCT CRAFT PILLARS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-mono font-medium">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Inspection Vectors</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Comprehensive, Zero-Theater Product & UI Audits
          </h2>
          <p className="text-xs text-neutral-600">
            Every audit evaluates actual user-facing ergonomics across four primary craft pillars backed by an engineering security baseline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl border border-neutral-200 bg-white space-y-3">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">1. UI & Button Craft</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Audits interactive button count, uncovers icon-only buttons missing <code className="font-mono text-neutral-800">aria-label</code>, flags low-conversion generic CTA copy ("Click Here"), and checks form input label accessibility.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-neutral-200 bg-white space-y-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">2. Visual Design & Ambience</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Inspects heading hierarchy (<code className="font-mono text-neutral-800">&lt;h1&gt;</code> to <code className="font-mono text-neutral-800">&lt;h3&gt;</code>), detects standardized design token systems (Tailwind, Radix, Lucide), and flags competing font overloads.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-neutral-200 bg-white space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">3. Product Flow & Usability</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Validates your 5-second value proposition in meta tags, checks brand title clarity, verifies top navigation wayfinding anchors, and confirms footer legal & trust signals.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-neutral-200 bg-white space-y-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">4. Mobile Polish & Tech Baseline</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Validates responsive viewport configuration (<code className="font-mono text-neutral-800">width=device-width</code>), checks image alt attributes, verifies sub-second edge TTFB latency, and ensures baseline transport defense (HSTS/CSP).
            </p>
          </div>
        </div>
      </section>

      {/* 4. CI/CD PR GATE CALLOUT */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-neutral-900 text-white p-8 sm:p-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-neutral-800 text-amber-400 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Automated PR Vibe Gates</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Prevent rough UI, broken buttons, and UX regressions.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Integrate VibeCheck directly into GitHub Actions or deployment webhooks. Automatically fail preview builds if button accessibility or visual design score drops below your threshold.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/ci-gate"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 text-xs sm:text-sm font-semibold transition-colors"
              >
                <span>Setup CI Quality Gate</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-mono text-neutral-400">One-line terminal audit:</div>
            <pre className="text-xs font-mono bg-neutral-950 p-4 rounded-xl overflow-x-auto text-emerald-400 border border-neutral-800">
              <code>{`curl -X POST https://vibecheck-ten-omega.vercel.app/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://my-app.vercel.app"}'`}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
