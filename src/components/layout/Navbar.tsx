"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/auth/UserContext";
import { RoleSwitcher } from "./RoleSwitcher";
import { NotificationBell } from "./NotificationBell";
import { CommandPalette } from "./CommandPalette";
import { TenantSwitcher } from "./TenantSwitcher";
import { Breadcrumbs } from "./Breadcrumbs";
import {
  Search,
  Plus,
  LayoutDashboard,
  Menu,
  X,
  Terminal,
  ShieldCheck,
  Activity,
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
    { name: "Directory", href: "/discover" },
    { name: "Benchmarks", href: "/challenges" },
    { name: "Staff Experts", href: "/experts" },
    { name: "Reviewers", href: "/reviewers" },
    { name: "Pricing & SLA", href: "/pricing" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-xs transition-colors font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Left: Brand & Tenant Switcher */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2 group" aria-label="VibeCheck Enterprise Home">
              <div className="w-7 h-7 rounded bg-neutral-900 flex items-center justify-center text-white shadow-2xs">
                <Terminal className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="font-semibold tracking-tight text-neutral-900 text-sm">
                VibeCheck
              </span>
            </Link>

            <span className="h-4 w-px bg-neutral-200 hidden sm:block" />

            {/* Workspace / Tenant Switcher */}
            <div className="hidden sm:block">
              <TenantSwitcher />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-2" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? "text-neutral-900 font-semibold bg-neutral-100"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 font-normal"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center search trigger */}
          <div className="hidden md:flex flex-1 max-w-xs">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-8 flex items-center justify-between px-3 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-md text-xs text-neutral-500 transition-colors"
              aria-label="Open Command Palette (Cmd+K)"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-neutral-400" strokeWidth={1.5} />
                <span>Quick search...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono text-neutral-500">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2">
            {/* Real-time System Status indicator */}
            <Link
              href="/status"
              className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono hover:bg-emerald-100/60 transition-colors"
              title="View live uptime & incident log"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse-subtle" />
              <span>Operational</span>
            </Link>

            {/* Quick search on mobile/tablet */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              aria-label="Search"
            >
              <Search className="w-4 h-4" strokeWidth={1.5} />
            </button>

            {/* Notification Bell */}
            <div className="hidden sm:flex">
              <NotificationBell />
            </div>

            {/* Role Switcher */}
            <div className="hidden sm:flex">
              <RoleSwitcher />
            </div>

            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 transition-colors"
              title="Tenant Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-neutral-500" strokeWidth={1.5} />
              <span className="font-medium">Dashboard</span>
            </Link>

            {/* Primary Submit / New Audit CTA */}
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">New Audit</span>
              <span className="sm:hidden">Audit</span>
            </Link>

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-neutral-900" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Breadcrumb sub-strip on non-homepage */}
        {pathname !== "/" && (
          <div className="border-t border-neutral-100 bg-neutral-50/70 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <Breadcrumbs />
            </div>
          </div>
        )}

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-14 z-50 bg-white border-b border-neutral-200 p-6 flex flex-col gap-4 lg:hidden shadow-lg animate-in slide-in-from-top-2">
            <div className="pb-3 border-b border-neutral-100">
              <TenantSwitcher />
            </div>

            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? "bg-neutral-100 text-neutral-900 font-semibold"
                      : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
              >
                Dashboard
              </Link>
              <Link
                href="/status"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
              >
                System Status (99.98%)
              </Link>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-neutral-500 font-medium font-mono">Role Persona:</span>
                <RoleSwitcher />
              </div>
              <Link
                href="/projects/new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 px-3 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium"
              >
                New Audit
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
