"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe, ShieldCheck, Zap, Lock, Terminal, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function InstantAuditBar() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const scanSteps = [
    "Validating SSRF sandbox & fetching live HTML DOM...",
    "Auditing interactive buttons, CTAs & input accessibility...",
    "Evaluating typography harmony, visual hierarchy & ambience...",
    "Analyzing product copy, value proposition & navigation flow...",
    "Testing mobile responsive ergonomics & technical foundation...",
    "Generating verified VibeScore & cryptographic digest...",
  ];

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      let stepIndex = 0;
      setScanStep(scanSteps[0]);
      interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % scanSteps.length;
        setScanStep(scanSteps[stepIndex]);
      }, 700);
    } else {
      setScanStep("");
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let target = url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = "https://" + target;
      setUrl(target);
    }

    setIsScanning(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Inspection failed");
      }

      toast.success(`Audit Complete! Score: ${data.score}/100 (Grade ${data.grade})`);
      // Redirect directly to the full audit report
      router.push(`/report/${data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to audit target URL");
      toast.error(err.message || "Failed to audit target URL");
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickDemo = (demoUrl: string) => {
    setUrl(demoUrl);
  };

  return (
    <div id="inspector" className="w-full max-w-2xl mx-auto space-y-4 text-center px-2 sm:px-0">
      <form
        onSubmit={handleAudit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 rounded-xl border border-neutral-300 bg-white shadow-lg shadow-neutral-900/5 focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10 transition-all gap-2 sm:gap-0"
      >
        <div className="pl-3 pr-2 text-neutral-400 hidden sm:flex items-center">
          <Globe className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter web application URL (e.g., https://my-app.vercel.app)"
          className="flex-1 bg-transparent px-3 py-2 sm:px-1 sm:py-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none min-w-0"
          required
          disabled={isScanning}
        />
        <button
          type="submit"
          disabled={isScanning}
          className="px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-75 cursor-pointer"
        >
          {isScanning ? (
            <>
              <Zap className="w-4 h-4 animate-spin text-amber-400" />
              <span>Auditing...</span>
            </>
          ) : (
            <>
              <span>Inspect Application</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Progress Telemetry during Scan */}
      {isScanning && (
        <div className="p-3 rounded-lg bg-neutral-900 text-white text-xs font-mono flex items-center justify-center gap-2 animate-in fade-in">
          <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-neutral-300">{scanStep}</span>
        </div>
      )}

      {/* Error display */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Demo Target Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500 pt-1">
        <span className="text-[11px] font-mono text-neutral-400">Quick Probes:</span>
        {[
          { label: "vercel.com", url: "https://vercel.com" },
          { label: "github.com", url: "https://github.com" },
          { label: "react.dev", url: "https://react.dev" },
          { label: "linear.app", url: "https://linear.app" },
        ].map((demo) => (
          <button
            key={demo.label}
            type="button"
            onClick={() => handleQuickDemo(demo.url)}
            className="px-2 py-0.5 rounded-md border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-[11px] font-mono transition-colors cursor-pointer"
          >
            {demo.label}
          </button>
        ))}
      </div>
    </div>
  );
}
