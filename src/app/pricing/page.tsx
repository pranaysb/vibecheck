import React from "react";
import Link from "next/link";
import { Check, ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { formatInr } from "@/lib/utils";

export default function PricingPage() {
  const tiers = [
    {
      name: "Community",
      badge: "Free Tier",
      price: 0,
      period: "forever",
      description: "For individual builders and students proving early prototypes.",
      features: [
        "Unlimited public project submissions",
        "Structured community peer reviews (1-10 scores)",
        "Automated HTTP security header scans",
        "Automated accessibility (a11y) checks",
        "Public verifiable version evolution (v1 → v2)",
        "Developer quality badge for GitHub Readme",
      ],
      cta: "Start for free",
      href: "/projects/new",
      popular: false,
    },
    {
      name: "Pro Builder",
      badge: "Most Popular",
      price: 699,
      period: "per month",
      description: "For serious indie hackers and startups shipping commercial products.",
      features: [
        "Everything in Community, plus:",
        "Private & unlisted repository audits",
        "Automated weekly regression scans",
        "Deep AST static hygiene analysis",
        "Priority community reviewer spotlight",
        "Continuous performance & TTFB monitoring",
      ],
      cta: "Upgrade to Pro",
      href: "/projects/new",
      popular: true,
    },
    {
      name: "Expert Audit",
      badge: "Staff Engineer",
      price: 999,
      period: "starting rate",
      description: "For production-bound apps requiring senior engineering sign-off.",
      features: [
        "1-on-1 audit with verified staff engineer",
        "Line-by-line authorization & RLS security review",
        "Formal written Engineering Review Report",
        "Direct architectural & scalability debrief",
        "Official 'Expert Reviewed' cryptographic badge",
        "48-hour guaranteed audit turnaround",
      ],
      cta: "Browse verified engineers",
      href: "/experts",
      popular: false,
    },
  ];

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Linear Ambient Top Spotlight */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(120, 119, 198, 0.25), transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 space-y-16 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-400 text-xs font-mono backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>Developer Pricing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white font-sans">
            Invest in quality before shipping.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed">
            Transparent plans for solo builders, funded indie teams, and commercial startups.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                tier.popular
                  ? "bg-[#111115] border border-white/[0.2] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_25px_50px_-12px_rgba(0,0,0,0.9)] lg:-translate-y-2"
                  : "bg-[#0c0c0e] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_20px_40px_-15px_rgba(0,0,0,0.8)] hover:border-white/[0.16]"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full border border-white/20 bg-zinc-900 text-[10px] font-mono uppercase tracking-widest text-zinc-200 shadow-md">
                  {tier.badge}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">{tier.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{tier.description}</p>
                </div>

                <div className="flex items-baseline gap-1.5 pt-2">
                  <span className="text-4xl font-semibold text-white tracking-tight font-sans">
                    {tier.price === 0 ? "₹0" : formatInr(tier.price)}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">/ {tier.period}</span>
                </div>

                <div className="pt-6 border-t border-white/[0.06] space-y-3">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                    Includes
                  </div>
                  <ul className="space-y-3 text-xs text-zinc-300">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 leading-relaxed">
                        <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href={tier.href}
                  className={`w-full py-2.5 rounded-xl text-xs font-medium text-center transition-all flex items-center justify-center gap-2 ${
                    tier.popular
                      ? "bg-white hover:bg-zinc-200 text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
                      : "bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08]"
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
