import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  accent: string;
} {
  if (score >= 85) {
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
      accent: "#10b981",
    };
  }
  if (score >= 70) {
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/40",
      accent: "#f59e0b",
    };
  }
  return {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    accent: "#f43f5e",
  };
}

export function getSeverityBadge(severity: string): {
  label: string;
  className: string;
  dotColor: string;
} {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return {
        label: "Critical",
        className: "bg-rose-500/15 text-rose-300 border-rose-500/40",
        dotColor: "bg-rose-500",
      };
    case "HIGH":
      return {
        label: "High",
        className: "bg-orange-500/15 text-orange-300 border-orange-500/40",
        dotColor: "bg-orange-500",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        className: "bg-amber-500/15 text-amber-300 border-amber-500/40",
        dotColor: "bg-amber-500",
      };
    case "LOW":
    default:
      return {
        label: "Low",
        className: "bg-blue-500/15 text-blue-300 border-blue-500/40",
        dotColor: "bg-blue-500",
      };
  }
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSec < 60) return "just now";
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return formatDate(date);
}
