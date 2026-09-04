"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe, Sparkles, Zap, CheckCircle2, X, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function InstantAuditBar() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let target = url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = "https://" + target;
      setUrl(target);
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      // Direct connection to /api/scan endpoint
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to scan target URL");
      }

      setScanResult(data);
      setIsModalOpen(true);
      toast.success(`Live scan completed! Score: ${data.vibeScore}/100 • TTFB: ${data.ttfbMs}ms`);
    } catch (err: any) {
      toast.error(err.message || "Failed to execute live audit");
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickDemo = (demoUrl: string) => {
    setUrl(demoUrl);
    router.push(`/projects/new?liveUrl=${encodeURIComponent(demoUrl)}`);
  };

  const handleProceedToPublish = () => {
    setIsModalOpen(false);
    router.push(`/projects/new?liveUrl=${encodeURIComponent(scanResult?.targetUrl || url)}`);
  };

  return (
    <>
      <div className="w-full max-w-xl mx-auto space-y-3 text-center">
        <form
          onSubmit={handleAudit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 rounded-xl border border-slate-300 bg-white shadow-lg shadow-slate-900/5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all gap-2 sm:gap-0"
        >
          <div className="pl-3 pr-2 text-slate-400 hidden sm:block">
            <Globe className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter deployed URL (https://myapp.vercel.app)"
            className="flex-1 bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={isScanning}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60"
          >
            {isScanning ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Run Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Or try a demo:
          </span>
          <button
            type="button"
            onClick={() => handleQuickDemo("https://campusconnect-demo.vercel.app")}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-mono transition-colors"
          >
            CampusConnect
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("https://resumeforge-ai.dev")}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-mono transition-colors"
          >
            ResumeForge
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("https://flowstate.dev")}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-mono transition-colors"
          >
            FlowState
          </button>
        </div>
      </div>

      {/* Live Scan Results Modal */}
      {isModalOpen && scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 sm:p-8 z-50 my-8 text-left space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Real Remote Probe Complete</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1.5">
                  Live Audit Results
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Target: <strong className="text-slate-800">{scanResult.targetUrl}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Calculated Vibe Score</div>
                <div className="text-2xl font-extrabold font-mono text-indigo-700 mt-0.5">
                  {scanResult.vibeScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Time-to-First-Byte (TTFB)</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-0.5">
                  {scanResult.ttfbMs} <span className="text-xs text-slate-400 font-normal">ms</span>
                </div>
              </div>
            </div>

            {/* Findings breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono block">
                Security & Header Checks ({scanResult.findings?.length || 0}):
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {scanResult.findings?.map((f: any) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white text-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">{f.title}</div>
                      <div className="text-[11px] text-slate-500">{f.description}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 ${
                        f.passed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {f.passed ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleProceedToPublish}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <span>Submit Project with These Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
