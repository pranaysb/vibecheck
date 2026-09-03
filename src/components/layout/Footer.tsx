import React from "react";
import Link from "next/link";
import { Terminal, Shield, CheckCircle, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white mt-auto text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">VibeCheck</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              The feedback, automated analysis, and engineering review platform for AI-assisted developers.
              Don't just vibe code. Vibe check.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SSRF Guard & Analysis Engine: Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Product</div>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/discover" className="hover:text-slate-900 transition-colors">Discover Projects</Link></li>
              <li><Link href="/challenges" className="hover:text-slate-900 transition-colors">Community Challenges</Link></li>
              <li><Link href="/experts" className="hover:text-slate-900 transition-colors">Expert Marketplace</Link></li>
              <li><Link href="/reviewers" className="hover:text-slate-900 transition-colors">Top Reviewers</Link></li>
              <li><Link href="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Creators */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Developers</div>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/projects/new" className="hover:text-slate-900 transition-colors">Submit a Project</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-900 transition-colors">Creator Dashboard</Link></li>
              <li><Link href="/projects/campusconnect/analysis" className="hover:text-slate-900 transition-colors">Sample Analysis</Link></li>
              <li><Link href="/expert-reports/campusconnect" className="hover:text-slate-900 transition-colors">Sample Expert Report</Link></li>
            </ul>
          </div>

          {/* Platform & Safety */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Security & Mission</div>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/about" className="hover:text-slate-900 transition-colors">Our Philosophy</Link></li>
              <li><Link href="/about#methodology" className="hover:text-slate-900 transition-colors">Vibe Score Formula</Link></li>
              <li><Link href="/about#safety" className="hover:text-slate-900 transition-colors">SSRF & Sandbox Policy</Link></li>
              <li><Link href="/docs/progress" className="text-indigo-600 hover:underline font-semibold">Specification & Progress Audit</Link></li>
              <li><span className="text-slate-400">v1.0.0 Production MVP</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>© {new Date().getFullYear()} VibeCheck. Built for the new era of AI developers.</div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-slate-800">Terms of Service</Link>
            <Link href="/about" className="hover:text-slate-800">Privacy Policy</Link>
            <Link href="https://github.com/pranaysb/vibecheck" target="_blank" className="hover:text-slate-800 flex items-center gap-1">
              GitHub <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
