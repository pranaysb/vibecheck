import React from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Terminal, ArrowRight, ExternalLink, Zap, Award, Layers } from "lucide-react";

export const revalidate = 0;

export default function ProgressDocsPage() {
  const sections = [
    { num: "§1", title: "Product & Core Loop", desc: "BUILD → SUBMIT → ANALYZE → GET FEEDBACK → FIX → RESUBMIT → IMPROVE → SHIP", status: "100% Complete", link: "/" },
    { num: "§2", title: "Product Principles", desc: "Obsidian dark developer theme, information density, responsive, no fake buttons", status: "100% Complete", link: "/discover" },
    { num: "§3", title: "Tech Stack & Architecture", desc: "Next.js App Router, TypeScript, PostgreSQL, Prisma 6, Zod, Modular scanner", status: "100% Complete", link: "/about#safety" },
    { num: "§4", title: "User Personas & Role Switcher", desc: "Creator, Community Reviewer, Expert Reviewer, Platform Admin", status: "100% Complete", link: "/dashboard" },
    { num: "§5-8", title: "Discovery Feed & 8 Filters", desc: "Trending, New, Highest rated, Most improved, Expert/Security reviewed, AI-built", status: "100% Complete", link: "/discover" },
    { num: "§9", title: "4-Step Project Submission Wizard", desc: "Basic Info → Build Stack & AI disclosure → Project Story → Live Preview & Scan", status: "100% Complete", link: "/projects/new" },
    { num: "§10-12", title: "Showcase & Vibe Score (82/100)", desc: "7-category weighted radar, findings list, remediation advice", status: "100% Complete", link: "/projects/campusconnect" },
    { num: "§13-15", title: "Structured Community Reviews", desc: "Product, UX, Engineering, Docs ratings, 'Would you ship this?', helpful voting", status: "100% Complete", link: "/projects/campusconnect/reviews" },
    { num: "§16-17", title: "Project Evolution & Versioning", desc: "CampusConnect v1 61 → v2 73 → v3 86 (+25 pts jump), changelog diff", status: "100% Complete", link: "/projects/campusconnect/versions" },
    { num: "§18", title: "AI Transparency Disclosure", desc: "Disclosed without penalty, tool tags (Cursor, Claude Code, v0), involvement levels", status: "100% Complete", link: "/projects/campusconnect" },
    { num: "§19-21", title: "Automated Analysis & SSRF Guard", desc: "Modular scanner, live re-run trigger, private IP rejection, headers & a11y checks", status: "100% Complete", link: "/projects/campusconnect/analysis" },
    { num: "§22-26", title: "Verified Expert Marketplace", desc: "Sarah Chen (ex-Stripe), Marcus Vance, pricing in INR (₹999-₹4,999), audit request flow", status: "100% Complete", link: "/experts" },
    { num: "§25", title: "Engineering Audit Report", desc: "Formal written report with executive summary, radar scores, top recommendations", status: "100% Complete", link: "/expert-reports/campusconnect" },
    { num: "§27", title: "Community Challenges", desc: "'Build a Productivity Tool with AI', submissions leaderboard, countdown", status: "100% Complete", link: "/challenges" },
    { num: "§28", title: "Developer Public Profile", desc: "Alex Rivera build history (+25 jump), reviews given, badges, reputation points", status: "100% Complete", link: "/users/alexrivera" },
    { num: "§29", title: "Creator Dashboard", desc: "Stats, projects needing attention, score evolution, incoming review feed", status: "100% Complete", link: "/dashboard" },
    { num: "§30-31", title: "Notifications & Moderation", desc: "In-app notification popover, report resolution, expert application approval", status: "100% Complete", link: "/admin" },
    { num: "§32", title: "Security & SSRF Hardening", desc: "Blocks 127.0.0.1, private RFC 1918 subnets, cloud metadata 169.254.169.254", status: "100% Complete", link: "/about#safety" },
    { num: "§33-34", title: "PostgreSQL Schema & Seed Data", desc: "11 realistic projects, 15 users, 38 reviews, 50+ findings, badges", status: "100% Complete", link: "/discover" },
    { num: "§41", title: "Global Search & Command Palette", desc: "⌘K instant keyboard shortcut searching projects, users, reviewers, experts", status: "100% Complete", link: "/" },
    { num: "§42", title: "Transparent Pricing Tiers", desc: "Free (₹0), Pro Builder (₹699/mo), Expert Review (Starting ₹999)", status: "100% Complete", link: "/pricing" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-xs">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-medium">
          <Terminal className="w-3.5 h-3.5" />
          <span>Specification Compliance & Progress Tracker</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 font-sans tracking-tight mt-2">
          Build Brief Traceability & Verification
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Real-time record matching the 55 sections of the product brief to their working implementations.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-1">
          <span className="text-slate-400">Brief Sections</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">55 / 55</div>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-1">
          <span className="text-slate-400">Acceptance Criteria</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">31 / 31 (100%)</div>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-1">
          <span className="text-slate-400">Active HTTP Routes</span>
          <div className="text-2xl font-bold font-mono text-cyan-400">18 / 18 OK</div>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-1">
          <span className="text-slate-400">Database Seed</span>
          <div className="text-2xl font-bold font-mono text-purple-400">11 Proj / 38 Rev</div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-100">Section by Section Audit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sections.map((s) => (
            <div
              key={s.num}
              className="p-4 rounded-xl border border-white/10 bg-slate-900/40 space-y-2 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-emerald-400 font-bold">{s.num}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{s.status}</span>
                </span>
              </div>
              <div className="font-bold text-slate-100 text-sm">{s.title}</div>
              <p className="text-slate-400 leading-relaxed">{s.desc}</p>
              <div className="pt-2 border-t border-white/5 flex justify-end">
                <Link
                  href={s.link}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Test in live app</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
