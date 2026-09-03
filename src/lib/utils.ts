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
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs",
      accent: "#059669",
    };
  }
  if (score >= 70) {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700 font-bold",
      border: "border-amber-200",
      badge: "bg-amber-50 text-amber-700 border-amber-200 shadow-2xs",
      accent: "#d97706",
    };
  }
  return {
    bg: "bg-rose-50",
    text: "text-rose-700 font-bold",
    border: "border-rose-200",
    badge: "bg-rose-50 text-rose-700 border-rose-200 shadow-2xs",
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
        className: "bg-rose-50 text-rose-700 border-rose-200 font-medium",
        dotColor: "bg-rose-500",
      };
    case "HIGH":
      return {
        label: "High",
        className: "bg-orange-50 text-orange-700 border-orange-200 font-medium",
        dotColor: "bg-orange-500",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        className: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
        dotColor: "bg-amber-500",
      };
    case "LOW":
    default:
      return {
        label: "Low",
        className: "bg-sky-50 text-sky-700 border-sky-200 font-medium",
        dotColor: "bg-sky-500",
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

export function truncate(str: string, length: number): string {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
