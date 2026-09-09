"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Settings2, Check, X, ChevronRight, Lock } from "lucide-react";

export interface CookiePreferences {
  necessary: boolean; // Always true
  functional: boolean;
  performance: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = "cookie_consent_status";

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    performance: true,
    marketing: false,
    timestamp: "",
  });

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setShowBanner(true);
      } else {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      }
    } catch {
      setShowBanner(true);
    }

    const handleOpenModal = () => setShowModal(true);
    window.addEventListener("open-cookie-preferences", handleOpenModal);
    return () => window.removeEventListener("open-cookie-preferences", handleOpenModal);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      const updated = { ...prefs, timestamp: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPreferences(updated);
    } catch (e) {
      console.warn("Could not save cookie preferences", e);
    }
    setShowBanner(false);
    setShowModal(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      functional: true,
      performance: true,
      marketing: true,
      timestamp: "",
    });
  };

  const handleDeclineNonEssential = () => {
    saveConsent({
      necessary: true,
      functional: false,
      performance: false,
      marketing: false,
      timestamp: "",
    });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Docked Non-blocking Enterprise Banner */}
      {showBanner && !showModal && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-4 inset-x-4 max-w-4xl mx-auto z-50 bg-white border border-neutral-200 rounded-lg p-4 sm:p-5 shadow-sm text-neutral-900 transition-all duration-200"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-neutral-700 shrink-0" strokeWidth={1.5} />
                <h3 className="text-xs font-semibold text-neutral-900 tracking-tight uppercase">
                  Data Privacy & Cookie Compliance
                </h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                VibeCheck uses essential cookies to manage authentication sessions and cryptographic CSRF tokens.
                We also utilize telemetry cookies to monitor server-side TTFB latency and error trace telemetry under GDPR Art. 6(1)(f).
                Review our{" "}
                <Link href="/cookie-policy" className="text-neutral-900 underline underline-offset-2 hover:text-neutral-700">
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-neutral-900 underline underline-offset-2 hover:text-neutral-700">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="h-8 px-3 rounded text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              >
                <Settings2 className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1.5} />
                <span>Customize</span>
              </button>

              <button
                type="button"
                onClick={handleDeclineNonEssential}
                className="h-8 px-3 rounded text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 transition-colors focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              >
                Decline Non-Essential
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="h-8 px-3 rounded text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 focus:outline-none"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs"
        >
          <div className="bg-white border border-neutral-200 rounded-lg max-w-2xl w-full shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-neutral-800" strokeWidth={1.5} />
                <div>
                  <h2 id="cookie-preferences-title" className="text-sm font-semibold text-neutral-900">
                    Cookie & Telemetry Preferences
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Controls aligned with SOC 2 Trust Services Criteria & GDPR Art. 6
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close preferences dialog"
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable Categories Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <p className="text-neutral-600 leading-relaxed">
                Configure your cookie preferences below. Strictly necessary cookies cannot be disabled as they are required for TLS session state, credential hashing, and security protections.
              </p>

              {/* 1. Strictly Necessary */}
              <div className="p-4 rounded-md border border-neutral-200 bg-neutral-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1.5} />
                    <span className="font-semibold text-neutral-900">Strictly Necessary</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700 font-medium">
                      Always Active
                    </span>
                  </div>
                </div>
                <p className="text-neutral-600">
                  Required for user authentication sessions, cross-site request forgery (CSRF) tokens, and enterprise load-balancing.
                </p>
                <div className="text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-200/60">
                  Cookies: <span className="text-neutral-700">vc_session, __Host-csrf, cookie_consent_status</span>
                </div>
              </div>

              {/* 2. Functional */}
              <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">Functional</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                  </label>
                </div>
                <p className="text-neutral-600">
                  Persists workspace selection, table density preferences, and customized code analysis filters.
                </p>
                <div className="text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-100">
                  Cookies: <span className="text-neutral-700">vc_org_id, vc_table_density</span>
                </div>
              </div>

              {/* 3. Performance & Analytics */}
              <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">Performance & Analytics</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.performance}
                      onChange={(e) => setPreferences({ ...preferences, performance: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                  </label>
                </div>
                <p className="text-neutral-600">
                  Aggregates anonymous Time-to-First-Byte (TTFB) telemetry, server API response latency, and component crash traces.
                </p>
                <div className="text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-100">
                  Cookies: <span className="text-neutral-700">_vc_telemetry_id, _vc_ttfb_sample</span>
                </div>
              </div>

              {/* 4. Marketing */}
              <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">Marketing & Partner Attribution</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                  </label>
                </div>
                <p className="text-neutral-600">
                  Measures referral traffic from partner developer platforms and enterprise integration directories.
                </p>
                <div className="text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-100">
                  Cookies: <span className="text-neutral-700">_vc_ref_source</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <Link
                href="/cookie-policy"
                className="text-xs text-neutral-600 underline hover:text-neutral-900"
              >
                View Detailed Cookie Inventory
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeclineNonEssential}
                  className="h-8 px-3 rounded text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300"
                >
                  Decline All Optional
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="h-8 px-4 rounded text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
  }
}
