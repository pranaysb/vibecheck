"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, HelpCircle, ShieldCheck, X, Send } from "lucide-react";
import { toast } from "sonner";
import { formatInr } from "@/lib/utils";

export default function PricingPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("You are on the Pro Builder priority waitlist! We will email you within 24h.");
    setWaitlistSubmitted(true);
    setTimeout(() => {
      setWaitlistOpen(false);
      setWaitlistSubmitted(false);
      setWaitlistEmail("");
    }, 1500);
  };
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const tiers = [
    {
      name: "Community",
      badge: "Free Forever",
      priceMonthly: 0,
      priceAnnual: 0,
      period: "forever",
      description: "For individual builders, students, and open-source creators proving early prototypes.",
      features: [
        "Unlimited public project submissions",
        "Full structured community peer reviews (1-10 scores)",
        "Automated HTTP security header scans",
        "Automated accessibility (a11y) checks",
        "Public verifiable version evolution (v1 → v2)",
        "Embeddable markdown quality badge for GitHub Readme",
      ],
      cta: "Start Free",
      href: "/projects/new",
      popular: false,
    },
    {
      name: "Pro Builder",
      badge: "Most Popular",
      priceMonthly: 699,
      priceAnnual: 559, // ~20% off
      period: "per month",
      description: "For serious indie hackers, agencies, and startups shipping commercial products.",
      features: [
        "Everything in Community, plus:",
        "Private & unlisted repository audits",
        "Automated weekly regression scans",
        "Deep AST static hygiene analysis",
        "Priority community reviewer spotlight",
        "Continuous performance & TTFB monitoring",
        "Private shareable client audit links",
      ],
      cta: "Upgrade to Pro",
      href: "/projects/new",
      popular: true,
    },
    {
      name: "Staff Engineer Audit",
      badge: "Verified Expert",
      priceMonthly: 999,
      priceAnnual: 999,
      period: "starting per audit",
      description: "For production-bound apps requiring manual human architectural & security sign-off.",
      features: [
        "1-on-1 audit with verified ex-Stripe / Meta staff engineer",
        "Line-by-line authorization & RLS security review",
        "Formal written Engineering Review Report",
        "Direct architectural & scalability debrief",
        "Official 'Expert Reviewed' cryptographic badge",
        "48-hour guaranteed audit turnaround",
      ],
      cta: "Browse Verified Engineers",
      href: "/experts",
      popular: false,
    },
  ];

  const faqs = [
    {
      q: "How does the automated VibeCheck scan work?",
      a: "When you submit a live URL, our sandboxed headless crawler analyzes your web application across 35+ automated vectors, including HTTP security headers (CSP, HSTS, X-Frame-Options), WCAG AA color contrast and input labels, SSL certificate validity, and Core Web Vitals (TTFB and LCP).",
    },
    {
      q: "What is the difference between Community reviews and Expert audits?",
      a: "Community reviews are crowdsourced from registered developers in our reputation network who provide 1-10 category breakdowns and bug reports. Expert Audits are formal, paid 1-on-1 reviews conducted by verified staff engineers who inspect your backend architecture and sign off on a cryptographic quality report.",
    },
    {
      q: "Can I audit private repositories or staging environments?",
      a: "Yes! Pro Builder plans include support for private, unlisted project audits where your scores and findings are only visible to you and teammates you explicitly invite.",
    },
    {
      q: "How do I add the VibeCheck badge to my GitHub README?",
      a: "Once your project completes an automated audit, visit your project page and click 'Copy Badge Markdown' in the action bar. It embeds a dynamic SVG badge that reflects your current Vibe Score in real-time.",
    },
  ];

  return (
    <div className="relative min-h-screen pb-24 bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 space-y-20 relative z-10 text-center">
        {/* Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transparent Pricing for Serious Builders</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-sans">
            Invest in code quality before shipping.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Transparent plans for solo builders, funded indie hackers, and high-growth commercial software teams.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="bg-slate-200/70 p-1 rounded-xl flex items-center text-xs font-medium">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-lg transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Annual billing</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch text-left">
          {tiers.map((tier) => {
            const price = billingCycle === "annual" ? tier.priceAnnual : tier.priceMonthly;

            return (
              <div
                key={tier.name}
                className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-200 ${
                  tier.popular
                    ? "bg-white border-2 border-slate-900 shadow-xl lg:-translate-y-2"
                    : "bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-mono uppercase tracking-widest font-semibold shadow-xs">
                    {tier.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">{tier.name}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{tier.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1.5 pt-2">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                      {price === 0 ? "₹0" : formatInr(price)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ {tier.period}</span>
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-3">
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                      Everything included
                    </div>
                    <ul className="space-y-3 text-xs text-slate-600">
                      {tier.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 leading-relaxed">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  {tier.popular ? (
                    <button
                      type="button"
                      onClick={() => setWaitlistOpen(true)}
                      className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                    >
                      <span>{tier.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      href={tier.href}
                      className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-2xs"
                    >
                      <span>{tier.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Frequently Asked Questions */}
        <div className="max-w-4xl mx-auto space-y-8 pt-10 text-left">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
              FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-2"
              >
                <h4 className="font-bold text-slate-900 text-sm">{faq.q}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pro Builder Waitlist Modal */}
      {waitlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs" onClick={() => setWaitlistOpen(false)} />
          <div className="relative w-full max-w-md rounded-lg border border-neutral-200 bg-white shadow-lg p-6 z-50 my-8 text-left space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-800 text-[10px] font-mono font-medium">
                  <ShieldCheck className="w-3 h-3 text-neutral-700" strokeWidth={1.5} />
                  <span>Pro Builder Early Access</span>
                </div>
                <h3 className="text-base font-semibold text-neutral-900 tracking-tight mt-1.5">
                  Request Pro Builder Provisioning
                </h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  We onboard commercial engineering teams in scheduled cohorts. Provide your corporate email for tenant provisioning and SLA onboarding.
                </p>
              </div>
              <button
                onClick={() => setWaitlistOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {waitlistSubmitted ? (
              <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-medium flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2} />
                <span>Priority reservation confirmed. Onboarding details transmitted via email.</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="w-full h-9 bg-white border border-neutral-300 rounded-md px-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-xs"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-9 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-colors focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Request Priority Provisioning</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
