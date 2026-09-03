import React from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
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
    <div className="relative min-h-screen pb-24 bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 space-y-16 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-white text-zinc-600 text-xs font-mono shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            <span>Developer Pricing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-zinc-950 font-sans">
            Invest in quality before shipping.
          </h1>

          <p className="text-sm sm:text-base text-zinc-500 font-normal leading-relaxed">
            Transparent plans for solo builders, funded indie teams, and commercial startups.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-200 ${
                tier.popular
                  ? "bg-white border-2 border-zinc-900 shadow-xl lg:-translate-y-2"
                  : "bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 hover:shadow-md"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-mono uppercase tracking-widest font-medium shadow-sm">
                  {tier.badge}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-950 tracking-tight">{tier.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{tier.description}</p>
                </div>

                <div className="flex items-baseline gap-1.5 pt-2">
                  <span className="text-4xl font-semibold text-zinc-950 tracking-tight font-sans">
                    {tier.price === 0 ? "₹0" : formatInr(tier.price)}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">/ {tier.period}</span>
                </div>

                <div className="pt-6 border-t border-zinc-100 space-y-3">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                    Includes
                  </div>
                  <ul className="space-y-3 text-xs text-zinc-600">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 leading-relaxed">
                        <Check className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
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
                      ? "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm hover:shadow-md"
                      : "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 shadow-2xs"
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
