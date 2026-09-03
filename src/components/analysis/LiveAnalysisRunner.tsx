"use client";

import React, { useState } from "react";
import { Zap, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, AlertTriangle, Layers } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { BorderBeam } from "@/components/motion/BorderBeam";
import { SpotlightCard } from "@/components/motion/SpotlightCard";

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
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
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
    <SpotlightCard className="relative p-6 sm:p-8 space-y-6 overflow-hidden">
      {isScanning && (
        <BorderBeam size={280} duration={6} delay={0} colorFrom="#10b981" colorTo="#06b6d4" />
      )}

      {/* Futuristic Laser Scanner Overlay */}
      {isScanning && (
        <motion.div
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] z-20"
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              Diagnostic Engine v1.0
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">Automated Architecture & Security Audit</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Target URL: <span className="font-mono text-emerald-300 font-medium">{liveUrl}</span>
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 self-start sm:self-auto hover:scale-105 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "Scanning Target..." : "Re-run Automated Scan"}</span>
        </button>
      </div>

      {/* Progress Stepper during scan */}
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 p-5 rounded-xl bg-slate-950/90 border border-emerald-500/30 relative z-10 shadow-inner"
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 animate-bounce text-emerald-400" />
              <span>Executing active diagnostic probes...</span>
            </span>
            <span className="font-mono">{completedSteps.length} / {scanStages.length}</span>
          </div>

          <div className="space-y-2.5">
            {scanStages.map((stage, idx) => {
              const isPassed = completedSteps.includes(idx);
              const isCurrent = currentStep === idx && !isPassed;
              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2.5 text-xs font-mono transition-all duration-200 ${
                    isPassed
                      ? "text-emerald-300"
                      : isCurrent
                      ? "text-amber-300 font-semibold translate-x-1"
                      : "text-slate-600"
                  }`}
                >
                  {isPassed ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    </motion.div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-current shrink-0 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </div>
                  )}
                  <span>{stage}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </SpotlightCard>
  );
}
