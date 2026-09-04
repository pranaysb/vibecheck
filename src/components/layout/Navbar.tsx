"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/auth/UserContext";
import { RoleSwitcher } from "./RoleSwitcher";
import { NotificationBell } from "./NotificationBell";
import { CommandPalette } from "./CommandPalette";
import {
  Search,
  Plus,
  LayoutDashboard,
  Menu,
  X,
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
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/85 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white transition-all shadow-xs">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-slate-900 text-sm font-sans">VibeCheck</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
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
                    className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? "text-indigo-700 font-bold bg-indigo-50 border border-indigo-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-500 transition-all shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search projects, experts...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2">
            {/* Quick search on tablet */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:inline-flex lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell (Hidden on mobile < 640px per Phase 1.5) */}
            <div className="hidden sm:flex">
              <NotificationBell />
            </div>

            {/* Role Switcher (Hidden on mobile < 640px per Phase 1.5) */}
            <div className="hidden sm:flex">
              <RoleSwitcher />
            </div>

            {/* Dashboard shortcut */}
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Creator Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
            </Link>

            {/* Primary Submit CTA */}
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit Project</span>
              <span className="sm:hidden">Submit</span>
            </Link>

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown drawer (Phase 1.2 Remediation) */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-14 z-50 bg-white border-b border-slate-200 p-6 flex flex-col gap-4 md:hidden shadow-2xl animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    pathname.startsWith(link.href)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                Dashboard
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-500 font-medium">Test Persona:</span>
                <RoleSwitcher />
              </div>
              <Link
                href="/projects/new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                + Submit Project Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
