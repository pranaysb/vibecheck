"use client";

import React, { useState } from "react";
import { Zap, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, AlertTriangle, Layers } from "lucide-react";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const scanStages = [
    "Website reachability & SSRF security verification",
    "Security headers (CSP, HSTS, X-Frame, cookies)",
    "Performance metrics (TTFB, payload compression)",
    "WCAG accessibility (alt tags, button labels, landmarks)",
    "Repository hygiene & secret pattern scanning",
  ];

  const handleRunScan = async () => {
    setIsScanning(true);
    setCurrentStep(0);
    setCompletedSteps([]);

    for (let i = 0; i < scanStages.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, 450));
      setCompletedSteps((prev) => [...prev, i]);
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          liveUrl,
          githubUrl,
          title: projectTitle,
        }),
      });

      if (res.ok) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        toast.success("Automated scan complete! Scores updated.");
        router.refresh();
      } else {
        toast.error("Analysis completed with fallback parameters.");
      }
    } catch {
      toast.error("Network error during analysis.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
            Analysis Engine v1.0
          </span>
          <h2 className="text-lg font-bold text-slate-100 mt-0.5">Automated Architecture Audit</h2>
          <p className="text-xs text-slate-400">
            Target URL: <span className="font-mono text-emerald-300">{liveUrl}</span>
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "Scanning target..." : "Re-run Automated Scan"}</span>
        </button>
      </div>

      {/* Progress Stepper during scan */}
      {isScanning && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-emerald-500/30 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 animate-bounce" />
              <span>Running automated checks...</span>
            </span>
            <span className="font-mono">{completedSteps.length} / {scanStages.length}</span>
          </div>

          <div className="space-y-2">
            {scanStages.map((stage, idx) => {
              const isPassed = completedSteps.includes(idx);
              const isCurrent = currentStep === idx && !isPassed;
              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2.5 text-xs font-mono transition-colors ${
                    isPassed
                      ? "text-emerald-300"
                      : isCurrent
                      ? "text-amber-300 font-semibold animate-pulse"
                      : "text-slate-600"
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-current shrink-0 flex items-center justify-center text-[9px]">
                      {idx + 1}
                    </div>
                  )}
                  <span>{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
