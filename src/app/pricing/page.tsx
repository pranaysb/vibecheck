import React from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { formatInr } from "@/lib/utils";

export default function PricingPage() {
  const tiers = [
    {
      name: "Community / Free",
      price: 0,
      period: "forever",
      description: "For solo developers and students proving their early AI builds.",
      features: [
        "Unlimited public project submissions",
        "Full structured community peer reviews",
        "Automated security header & performance checks",
        "Verifiable project version history (v1 → v2)",
        "Public developer reputation profile & badges",
        "Community challenge participation",
      ],
      cta: "Submit Free Project",
      href: "/projects/new",
      popular: false,
    },
    {
      name: "Pro Builder",
      price: 699,
      period: "month",
      description: "For indie founders and consultants shipping commercial apps.",
      features: [
        "Everything in Free, plus:",
        "Private unlisted project analysis",
        "Detailed secret pattern & AST static checks",
        "Automated weekly regression scans",
        "Priority community reviewer spotlight",
        "Detailed traffic and conversion analytics",
      ],
      cta: "Upgrade to Pro",
      href: "/projects/new",
      popular: true,
    },
    {
      name: "Expert Engineering Audit",
      price: 999,
      period: "starting rate",
      description: "For production-bound apps requiring manual senior engineer sign-off.",
      features: [
        "1-on-1 review with verified staff engineer",
        "Line-by-line authorization & RLS audit",
        "Comprehensive written Engineering Review Report",
        "Prioritized top-recommendation remediation list",
        "Official 'Expert Reviewed' quality badge",
        "48-hour guaranteed turnaround",
      ],
      cta: "Browse Verified Engineers",
      href: "/experts",
      popular: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Developer Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-100 font-sans tracking-tight">
          Invest in Code Quality Before Shipping
        </h1>
        <p className="text-sm text-slate-400">
          Transparent plans for solo vibe-coders, funded indie teams, and commercial startups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border p-8 flex flex-col justify-between space-y-6 relative transition-all ${
              tier.popular
                ? "border-emerald-500 bg-slate-900/80 shadow-2xl ring-1 ring-emerald-500"
                : "border-white/10 bg-slate-900/40"
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-8 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] font-mono uppercase tracking-wider">
                Most Popular
              </span>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{tier.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tier.description}</p>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black font-mono text-slate-100">
                  {tier.price === 0 ? "₹0" : formatInr(tier.price)}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {tier.period}</span>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-slate-300">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={tier.href}
              className={`w-full py-2.5 rounded-lg text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                tier.popular
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10"
              }`}
            >
              <span>{tier.cta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
