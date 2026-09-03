"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 select-none",
              isActive ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                className="absolute inset-0 rounded-lg bg-emerald-400 shadow-sm shadow-emerald-500/20"
              />
            )}
            {tab.icon && <span className="relative z-10">{tab.icon}</span>}
            <span className="relative z-10">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "relative z-10 px-1.5 py-0.2 rounded text-[10px] font-mono",
                  isActive
                    ? "bg-slate-950/20 text-slate-950 font-bold"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
