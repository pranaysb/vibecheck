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
      toast.error("Please enter a valid work email address.");
      return;
    }
    toast.success("Added to priority enterprise onboarding queue.");
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
      description: "For individual builders and open-source creators needing baseline remote verification.",
      features: [
        "Unlimited automated remote HTTP probes",
        "OWASP security header audits (CSP, HSTS, X-Frame)",
        "Automated WCAG 2.1 AA accessibility checks",
        "Time-to-First-Byte (TTFB) benchmarking",
        "Public verifiable version evolution (v1 → v2)",
        "Embeddable markdown status badge for GitHub Readme",
      ],
      cta: "Start Free Audit",
      href: "/projects/new",
      popular: false,
    },
    {
      name: "Pro Continuous",
      badge: "Recommended",
      priceMonthly: 1499,
      priceAnnual: 1199,
      period: "per month",
      description: "Continuous automated security regression detection for teams shipping AI-generated code.",
      features: [
        "Everything in Community, plus:",
        "Automated weekly continuous regression scans",
        "Private repository & staging URL evaluation",
        "Hard Security Gate enforcement (block on high/crit)",
        "Webhook & GitHub Actions check-run alerts",
        "Defect lifecycle tracking & MTTR metrics",
        "Tamper-evident verification certificates",
      ],
      cta: "Upgrade to Pro",
      href: "/projects/new",
      popular: true,
    },
    {
      name: "Targeted Security Review",
      badge: "Human-in-the-Loop",
      priceMonthly: 7500,
      priceAnnual: 7500,
      period: "starting per audit",
      description: "In-depth human verification of authorization logic, BOLA/IDOR vectors, and RLS policies.",
      features: [
        "Rigorous verification by seasoned security engineers",
        "BOLA / IDOR endpoint testing & parameter tampering",
        "Postgres Row-Level Security (RLS) policy audit",
        "Reproducible HTTP evidence with request/response dumps",
        "Cryptographically signed attestation report",
        "Direct remediation guidance & 1 re-scan included",
      ],
      cta: "Request Security Audit",
      href: "/experts",
      popular: false,
    },
  ];

  const faqs = [
    {
      q: "What does the automated remote scan verify?",
      a: "Our automated headless probe evaluates live HTTP endpoints across standardized security vectors: Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options clickjacking protection, X-Content-Type-Options, SSL/TLS certificate validity, and Core Web Vitals (TTFB latency).",
    },
    {
      q: "Why is a Targeted Security Review priced at ₹7,500+?",
      a: "Automated remote probes cannot reliably detect business logic flaws, BOLA/IDOR vulnerabilities, or race conditions. A real security audit requires experienced human engineers to inspect API schemas, authorization checks, and database tenant isolation. We do not offer superficial ₹999 automated audits disguised as human reviews.",
    },
    {
      q: "How does the Hard Security Gate work?",
      a: "Pro and Enterprise accounts can integrate VibeCheck into CI/CD. If our engine detects critical or high-severity vulnerabilities (e.g., exposed admin routes, missing auth middleware, or insecure CORS wildcards), the deployment gate verdict switches to 'NOT SAFE TO SHIP' and can block your pipeline.",
    },
    {
      q: "Where can I see VibeCheck's own security audit?",
      a: "We believe in authentic proof over marketing claims. Visit /security/self-audit to review the live, cryptographically signed security self-audit of VibeCheck's own production codebase and infrastructure.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16 text-neutral-900 font-sans">
      {/* Title & Billing Toggle */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
          <span>Transparent & Economically Grounded Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
          Predictable plans for automated and verified code quality.
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xl mx-auto">
          Start free with automated remote probing. Upgrade to continuous regression detection or commission targeted human security reviews when preparing for production.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs font-medium">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              billingCycle === "monthly"
                ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              billingCycle === "annual"
                ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
              tier.popular
                ? "border-2 border-neutral-900 bg-white shadow-xs"
                : "border border-neutral-200 bg-white shadow-2xs"
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                {tier.badge}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">{tier.name}</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed min-h-[36px]">
                  {tier.description}
                </p>
              </div>

              <div className="border-b border-neutral-100 pb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-neutral-900">
                    {formatInr(billingCycle === "annual" ? tier.priceAnnual : tier.priceMonthly)}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    /{tier.period === "forever" ? "forever" : tier.period === "per month" ? "month" : "audit"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  Included Capabilities
                </div>
                <ul className="space-y-2.5 text-xs text-neutral-700">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              {tier.popular ? (
                <button
                  onClick={() => setWaitlistOpen(true)}
                  className="w-full h-10 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href={tier.href}
                  className="w-full h-10 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-900 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Enterprise Custom Block */}
      <div className="p-8 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded font-semibold">
            Enterprise Custom
          </span>
          <h3 className="text-base font-semibold text-neutral-900">
            Need Custom SLA, VPC Isolation, or Dedicated Scan Clusters?
          </h3>
          <p className="text-xs text-neutral-600 max-w-xl">
            We deploy dedicated scan worker pools within your AWS/GCP VPC with custom IP whitelisting,
            compliance exports, and guaranteed 99.95% availability SLAs.
          </p>
        </div>
        <button
          onClick={() => setWaitlistOpen(true)}
          className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shrink-0 shadow-2xs transition-colors"
        >
          Contact Enterprise Architecture
        </button>
      </div>

      {/* FAQs */}
      <div className="space-y-6 pt-6 border-t border-neutral-200">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold text-neutral-900">Frequently Asked Questions</h2>
          <p className="text-xs text-neutral-500">
            Technical and operational details regarding our automated and human verification pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs">
          {faqs.map((f, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-white border border-neutral-200 space-y-1.5 shadow-2xs">
              <h4 className="font-semibold text-neutral-900">{f.q}</h4>
              <p className="text-neutral-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Pro / Enterprise waitlist */}
      {waitlistOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-900" />
                <h3 className="text-sm font-semibold text-neutral-900">Pro Continuous Onboarding</h3>
              </div>
              <button
                onClick={() => setWaitlistOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              We are onboarding teams in weekly batches to guarantee scan worker isolation and low queue latency. Enter your work email to activate your account.
            </p>

            <form onSubmit={handleWaitlistSubmit} className="space-y-3">
              <input
                type="email"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="developer@yourcompany.com"
                className="w-full h-9 px-3 text-xs rounded-md border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWaitlistOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Priority Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
