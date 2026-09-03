"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function ShimmerBadge({
  children,
  className,
  icon,
}: {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200/90 bg-indigo-50/80 text-indigo-700 text-xs font-mono font-semibold shadow-xs hover:border-indigo-300 transition-all relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent" />
      {icon && <span className="relative z-10 shrink-0">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </div>
  );
}
