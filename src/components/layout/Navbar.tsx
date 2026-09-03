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
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center text-white transition-all shadow-2xs">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-zinc-950 text-sm font-sans">VibeCheck</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
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
                        ? "text-zinc-950 font-semibold bg-zinc-100"
                        : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
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
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 text-xs text-zinc-500 transition-all shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span>Search projects, experts...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-[10px] font-mono text-zinc-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2">
            {/* Quick search on mobile/tablet */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Role Switcher */}
            <RoleSwitcher />

            {/* Dashboard shortcut */}
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-normal text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              title="Creator Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
            </Link>

            {/* Primary Submit CTA */}
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit Project</span>
              <span className="sm:hidden">Submit</span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-zinc-600 hover:text-zinc-950"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white p-4 space-y-2 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50"
            >
              Dashboard
            </Link>
          </div>
        )}
      </header>

      {/* Global Search Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
