"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]",
        className
      )}
    >
      {/* Soft pastel ambient light orbs */}
      <div className="absolute -top-[240px] left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-indigo-500/8 via-purple-500/6 to-cyan-500/5 blur-[100px] rounded-full" />
      <div className="absolute -top-[180px] right-1/4 w-[400px] h-[300px] bg-gradient-to-bl from-blue-500/6 via-indigo-500/6 to-transparent blur-[80px] rounded-full" />

      {/* Radiant fine laser lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="beam-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0" />
            <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="20%" y1="0" x2="80%" y2="100%" stroke="url(#beam-grad-light)" strokeWidth="1" strokeDasharray="6 6" />
        <line x1="80%" y1="0" x2="20%" y2="100%" stroke="url(#beam-grad-light)" strokeWidth="1" strokeDasharray="6 6" />
      </svg>
    </div>
  );
}
