"use client";

import React, { useState } from "react";
import { Zap, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, AlertTriangle, Layers, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

interface LiveAnalysisRunnerProps {
  projectId: string;
  liveUrl: string;
  githubUrl?: string | null;
  projectTitle: string;
  initialScore: number;
}

export function LiveAnalysisRunner({
  projectId,
  liveUrl,
  githubUrl,
  projectTitle,
  initialScore,
}: LiveAnalysisRunnerProps) {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    try {
      // Connect directly to /api/scan as specified in Phase 3.3
      const scanRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: liveUrl }),
      });

      if (!scanRes.ok) {
        const errData = await scanRes.json();
        throw new Error(errData.error || "Failed to scan target");
      }

      const scanData = await scanRes.json();
      setScanResult(scanData);

      // Persist real scan results via analyze endpoint
      await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          liveUrl,
          githubUrl,
          title: projectTitle,
        }),
      });

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      toast.success(`Automated scan complete! Measured TTFB: ${scanData.ttfbMs}ms • Real Score: ${scanData.vibeScore}/100`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Network error during analysis.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">
              Diagnostic Engine v1.0
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">Automated Security & Performance Audit</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Target URL: <span className="font-mono text-indigo-700 font-semibold">{liveUrl}</span>
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "Scanning Target via /api/scan..." : "Re-run Automated Scan"}</span>
        </button>
      </div>

      {/* Progress / Results Banner */}
      {isScanning && (
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-3 animate-pulse">
          <Zap className="w-4 h-4 text-indigo-600 animate-bounce" />
          <span>Connecting to remote deployment & inspecting CSP, HSTS, XFO headers and TTFB latency...</span>
        </div>
      )}

      {scanResult && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Real Live Scan Findings</span>
            </span>
            <span className="font-mono text-slate-600 font-bold">
              TTFB: {scanResult.ttfbMs}ms • Score: {scanResult.vibeScore}/100
            </span>
          </div>

          <div className="space-y-1.5">
            {scanResult.findings?.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between text-[11px] p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-800">{f.title}</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${f.passed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                  {f.passed ? "PASSED" : "FAILED"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
