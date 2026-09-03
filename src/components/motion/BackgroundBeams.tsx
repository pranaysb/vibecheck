"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]",
        className
      )}
    >
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-emerald-500/15 via-cyan-500/10 to-transparent blur-[120px] rounded-full" />
      <div className="absolute -top-[200px] right-1/4 w-[400px] h-[350px] bg-gradient-to-bl from-purple-500/10 via-emerald-500/10 to-transparent blur-[100px] rounded-full" />

      {/* Radiant laser beam lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="beam-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="20%" y1="0" x2="80%" y2="100%" stroke="url(#beam-grad-1)" strokeWidth="1" strokeDasharray="6 6" />
        <line x1="80%" y1="0" x2="20%" y2="100%" stroke="url(#beam-grad-1)" strokeWidth="1" strokeDasharray="6 6" />
      </svg>
    </div>
  );
}
