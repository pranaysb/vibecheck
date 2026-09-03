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
      bg: "bg-emerald-50",
      text: "text-emerald-700 font-bold",
      border: "border-emerald-200",
      badge: "bg-emerald-50/90 text-emerald-700 border-emerald-200/90 shadow-sm",
      accent: "#059669",
    };
  }
  if (score >= 70) {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700 font-bold",
      border: "border-amber-200",
      badge: "bg-amber-50/90 text-amber-700 border-amber-200/90 shadow-sm",
      accent: "#d97706",
    };
  }
  return {
    bg: "bg-rose-50",
    text: "text-rose-700 font-bold",
    border: "border-rose-200",
    badge: "bg-rose-50/90 text-rose-700 border-rose-200/90 shadow-sm",
    accent: "#e11d48",
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
        className: "bg-rose-50 text-rose-700 border-rose-200/90 shadow-xs font-semibold",
        dotColor: "bg-rose-500",
      };
    case "HIGH":
      return {
        label: "High",
        className: "bg-orange-50 text-orange-700 border-orange-200/90 shadow-xs font-semibold",
        dotColor: "bg-orange-500",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        className: "bg-amber-50 text-amber-700 border-amber-200/90 shadow-xs font-semibold",
        dotColor: "bg-amber-500",
      };
    case "LOW":
    default:
      return {
        label: "Low",
        className: "bg-blue-50 text-blue-700 border-blue-200/90 shadow-xs font-semibold",
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
