"use client";

import React from "react";
import Link from "next/link";
import { Terminal, ShieldCheck, Globe, Cookie } from "lucide-react";
import { openCookiePreferences } from "@/components/compliance/CookieConsent";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-auto text-neutral-500 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3 pr-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-neutral-900 flex items-center justify-center text-white">
                <Terminal className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="font-semibold text-neutral-900 text-sm tracking-tight">VibeCheck Enterprise</span>
            </div>
            <p className="text-neutral-600 text-xs leading-relaxed max-w-sm">
              Continuous code quality benchmarks, automated SSRF-isolated vulnerability scanning, and human architectural reviews for engineering organizations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse-subtle" />
              <Link href="/status" className="hover:underline">
                All Systems Operational (Live Probes)
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <div className="font-medium text-neutral-900 text-xs uppercase tracking-wider font-mono">Platform</div>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              <li><Link href="/discover" className="hover:text-neutral-900 transition-colors">Directory</Link></li>
              <li><Link href="/challenges" className="hover:text-neutral-900 transition-colors">Engineering Benchmarks</Link></li>
              <li><Link href="/experts" className="hover:text-neutral-900 transition-colors">Staff Architect Reviewers</Link></li>
              <li><Link href="/reviewers" className="hover:text-neutral-900 transition-colors">Peer Consensus Directory</Link></li>
              <li><Link href="/pricing" className="hover:text-neutral-900 transition-colors">Enterprise Pricing & SLA</Link></li>
            </ul>
          </div>

          {/* Developers */}
          <div className="space-y-2.5">
            <div className="font-medium text-neutral-900 text-xs uppercase tracking-wider font-mono">Developers & API</div>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              <li><Link href="/projects/new" className="hover:text-neutral-900 transition-colors">Submit Repository</Link></li>
              <li><Link href="/dashboard" className="hover:text-neutral-900 transition-colors">Tenant Dashboard</Link></li>
              <li><Link href="/projects/campusconnect/analysis" className="hover:text-neutral-900 transition-colors">Automated Security Analysis</Link></li>
              <li><Link href="/expert-reports/campusconnect" className="hover:text-neutral-900 transition-colors">Cryptographic Audit Report</Link></li>
              <li><Link href="/about" className="hover:text-neutral-900 transition-colors">Architecture Overview</Link></li>
            </ul>
          </div>

          {/* Security & Legal */}
          <div className="space-y-2.5">
            <div className="font-medium text-neutral-900 text-xs uppercase tracking-wider font-mono">Compliance & Trust</div>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              <li><Link href="/security" className="hover:text-neutral-900 transition-colors">Security & SOC 2</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-neutral-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-neutral-900 transition-colors">Terms of Service & SLA</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-neutral-900 transition-colors">Cookie Policy</Link></li>
              <li><Link href="/status" className="hover:text-neutral-900 transition-colors">Real-Time Status</Link></li>
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="hover:text-neutral-900 transition-colors text-left flex items-center gap-1 text-neutral-700"
                >
                  <Cookie className="w-3 h-3 text-neutral-500" strokeWidth={1.5} />
                  <span>Cookie Preferences</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-10 pt-6 border-t border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span>
              © {new Date().getFullYear()} VibeCheck. Released under the{" "}
              <a
                href="https://github.com/pranaysb/vibecheck/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-900"
              >
                MIT Open Source License
              </a>
              .
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://vercel.com?utm_source=vibecheck&utm_campaign=oss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-[11px] font-medium"
              aria-label="Powered by Vercel"
            >
              <svg width="12" height="10" viewBox="0 0 76 65" fill="currentColor" aria-hidden="true">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
              <span>Powered by Vercel</span>
            </a>

            <div className="flex items-center gap-1.5 text-neutral-600">
              <Globe className="w-3.5 h-3.5 text-neutral-400" strokeWidth={1.5} />
              <span>Edge Network: Global</span>
            </div>
            <span className="text-neutral-300">•</span>
            <a
              href="https://github.com/pranaysb/vibecheck"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 transition-colors"
            >
              GitHub (v1.4)
            </a>
            <Link href="/privacy-policy" className="hover:text-neutral-900 transition-colors">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-neutral-900 transition-colors">Terms</Link>
            <Link href="/security" className="hover:text-neutral-900 transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
