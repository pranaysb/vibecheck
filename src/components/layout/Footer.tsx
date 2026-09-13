"use client";

import React from "react";
import Link from "next/link";
import { Terminal, ShieldCheck, Cookie, ExternalLink } from "lucide-react";
import { openCookiePreferences } from "@/components/compliance/CookieConsent";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200/80 bg-white mt-auto text-neutral-500 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3 pr-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center text-white">
                <Terminal className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <span className="font-semibold text-neutral-900 text-sm tracking-tight">
                VibeCheck
              </span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[10px] font-mono text-neutral-600">
                Open Source
              </span>
            </div>
            <p className="text-neutral-600 text-xs leading-relaxed max-w-md">
              Automated product craft, UI/UX, button accessibility, and visual ambience inspector for modern web applications. Powered by real-time DOM analysis and cryptographic verification.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse-subtle" />
              <Link href="/status" className="hover:underline">
                SSRF Sandbox & Probe Engine: Operational
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <div className="font-semibold text-neutral-900 text-xs uppercase tracking-wider font-mono">
              Platform
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              <li><Link href="/" className="hover:text-neutral-900 transition-colors">Web Inspector</Link></li>
              <li><Link href="/discover" className="hover:text-neutral-900 transition-colors">Live Audits Directory</Link></li>
              <li><Link href="/ci-gate" className="hover:text-neutral-900 transition-colors">CI/CD Gate Automation</Link></li>
              <li><Link href="/security/self-audit" className="hover:text-neutral-900 transition-colors">Self-Audit Report</Link></li>
              <li><Link href="/status" className="hover:text-neutral-900 transition-colors">Engine Status & Uptime</Link></li>
            </ul>
          </div>

          {/* Open Source & Compliance */}
          <div className="space-y-2.5">
            <div className="font-semibold text-neutral-900 text-xs uppercase tracking-wider font-mono">
              Open Source
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              <li>
                <a
                  href="https://github.com/pranaysb/vibecheck"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-900 transition-colors flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/pranaysb/vibecheck/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-900 transition-colors"
                >
                  MIT License
                </a>
              </li>
              <li><Link href="/privacy-policy" className="hover:text-neutral-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-neutral-900 transition-colors">Terms of Service</Link></li>
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

        {/* Bottom Sub-bar with Powered by Vercel */}
        <div className="mt-10 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} VibeCheck. Permissive MIT Open Source.</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://vercel.com?utm_source=vibecheck&utm_campaign=oss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-[11px] font-medium transition-colors border border-neutral-200"
              title="Powered by Vercel"
            >
              <svg className="h-3 w-3 fill-current" viewBox="0 0 1155 1000">
                <path d="m577.3 0 577.4 1000H0z" />
              </svg>
              <span>Powered by Vercel</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
