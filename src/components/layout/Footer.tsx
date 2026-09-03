import React from "react";
import Link from "next/link";
import { Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#08080a] mt-auto text-zinc-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-zinc-200">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-white text-sm tracking-tight">VibeCheck</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              The feedback, automated analysis, and engineering review platform for AI-assisted developers.
              Don't just vibe code. Vibe check.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SSRF Guard & Analysis Engine: Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2">
            <div className="font-medium text-zinc-300 text-xs uppercase tracking-wider font-mono">Product</div>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li><Link href="/discover" className="hover:text-white transition-colors">Discover Projects</Link></li>
              <li><Link href="/challenges" className="hover:text-white transition-colors">Community Challenges</Link></li>
              <li><Link href="/experts" className="hover:text-white transition-colors">Expert Marketplace</Link></li>
              <li><Link href="/reviewers" className="hover:text-white transition-colors">Top Reviewers</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Creators */}
          <div className="space-y-2">
            <div className="font-medium text-zinc-300 text-xs uppercase tracking-wider font-mono">Developers</div>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li><Link href="/projects/new" className="hover:text-white transition-colors">Submit a Project</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Creator Dashboard</Link></li>
              <li><Link href="/projects/campusconnect/analysis" className="hover:text-white transition-colors">Sample Analysis</Link></li>
              <li><Link href="/expert-reports/campusconnect" className="hover:text-white transition-colors">Sample Expert Report</Link></li>
            </ul>
          </div>

          {/* Platform & Safety */}
          <div className="space-y-2">
            <div className="font-medium text-zinc-300 text-xs uppercase tracking-wider font-mono">Platform</div>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li><Link href="/about" className="hover:text-white transition-colors">Our Philosophy</Link></li>
              <li><Link href="/about#methodology" className="hover:text-white transition-colors">Vibe Score Formula</Link></li>
              <li><Link href="/about#safety" className="hover:text-white transition-colors">SSRF & Sandbox Policy</Link></li>
              <li><Link href="/docs/progress" className="text-zinc-300 hover:text-white underline">Specification Audit</Link></li>
              <li><span className="text-zinc-600">v1.0.0 Production MVP</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div>© {new Date().getFullYear()} VibeCheck. You built it. Now prove it's good.</div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/about" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="https://github.com/pranaysb/vibecheck" className="hover:text-zinc-300 transition-colors">GitHub</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
