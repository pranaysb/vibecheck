"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/auth/UserContext";
import { RoleSwitcher } from "./RoleSwitcher";
import { NotificationBell } from "./NotificationBell";
import { CommandPalette } from "./CommandPalette";
import {
  ShieldCheck,
  Search,
  Plus,
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
  Award,
  Terminal,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { currentUser } = useUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { name: "Discover", href: "/discover" },
    { name: "Challenges", href: "/challenges" },
    { name: "Experts", href: "/experts" },
    { name: "Reviewers", href: "/reviewers" },
    { name: "Pricing", href: "/pricing" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-100 text-base">VibeCheck</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center search trigger */}
          <div className="hidden lg:flex flex-1 max-w-xs">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-white/10 bg-slate-900/60 hover:bg-slate-900 text-xs text-slate-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Search projects, tech, experts...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2.5">
            {/* Quick search on mobile/tablet */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-800 text-slate-400"
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Center */}
            <NotificationBell />

            {/* Role Switcher for seamless QA */}
            <RoleSwitcher />

            {/* Creator Dashboard */}
            <Link
              href="/dashboard"
              className={`p-2 rounded-md hover:bg-slate-800 text-slate-300 transition-colors ${
                pathname === "/dashboard" ? "bg-slate-800 text-emerald-400" : ""
              }`}
              title="Creator Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </Link>

            {/* Admin link if role is ADMIN */}
            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/25 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </Link>
            )}

            {/* Submit Project CTA */}
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit Project</span>
              <span className="sm:hidden">Submit</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-slate-800 text-slate-400"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950 px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-emerald-400"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-900"
            >
              About VibeCheck
            </Link>
            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-semibold text-purple-400 hover:bg-purple-950/40"
              >
                Admin Control Room
              </Link>
            )}
          </div>
        )}
      </header>

      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
