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
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors shadow-xs">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-slate-900 text-base">VibeCheck</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
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
                        ? "text-indigo-600 bg-indigo-50 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
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
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 text-xs text-slate-500 transition-all shadow-xs"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search projects, experts...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2">
            {/* Quick search on mobile/tablet */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
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
              className={`p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors ${
                pathname === "/dashboard" ? "bg-slate-100 text-indigo-600" : ""
              }`}
              title="Creator Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </Link>

            {/* Admin link if role is ADMIN */}
            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </Link>
            )}

            {/* Submit Project CTA */}
            <Link
              href="/projects/new"
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 hover:shadow-md active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit Project</span>
              <span className="sm:hidden">Submit</span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white p-4 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-xl">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/projects/new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Submit New Project</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
