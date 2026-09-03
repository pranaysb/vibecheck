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
      text: "text-emerald-400 font-bold",
      border: "border-emerald-500/20",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      accent: "#10b981",
    };
  }
  if (score >= 70) {
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-400 font-bold",
      border: "border-amber-500/20",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      accent: "#f59e0b",
    };
  }
  return {
    bg: "bg-rose-500/10",
    text: "text-rose-400 font-bold",
    border: "border-rose-500/20",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
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
        className: "bg-rose-500/10 text-rose-400 border-rose-500/20 font-medium",
        dotColor: "bg-rose-500",
      };
    case "HIGH":
      return {
        label: "High",
        className: "bg-orange-500/10 text-orange-400 border-orange-500/20 font-medium",
        dotColor: "bg-orange-500",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium",
        dotColor: "bg-amber-500",
      };
    case "LOW":
    default:
      return {
        label: "Low",
        className: "bg-blue-500/10 text-blue-400 border-blue-500/20 font-medium",
        dotColor: "bg-blue-500",
      };
  }
}

export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function truncate(str: string, length: number): string {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return formatDate(date);
}
