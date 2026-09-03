"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InfiniteMarqueeProps {
  items: Array<{ name: string; category: string; icon?: string }>;
  className?: string;
  reverse?: boolean;
}

export function InfiniteMarquee({ items, className, reverse = false }: InfiniteMarqueeProps) {
  return (
    <div className={cn("relative w-full overflow-hidden py-3", className)}>
      {/* Delicate edge fade masks for light mode */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#fafafa] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#fafafa] to-transparent z-10" />

      <div className={cn("flex gap-3", reverse ? "[animation-direction:reverse]" : "")}>
        <div className="animate-marquee flex gap-3 items-center">
          {items.concat(items).map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 transition-all cursor-default text-xs font-mono shrink-0 shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="font-semibold text-slate-800">{item.name}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
