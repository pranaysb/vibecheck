import { prisma } from "@/lib/db";
import type { AuditMeta } from "@/lib/audit/types";

export interface AuditHealth {
  total: number;
  failed: number;
  running: number;
  stuck: number;
  browserSkipped: number;
  completed: number;
  p50Ms: number | null;
  p95Ms: number | null;
  /** Failure and browser-skip reasons with site names removed, most common first. */
  problems: { message: string; count: number; latestId: string }[];
}

/** Hostnames, URLs, numbers and ids vary between occurrences of the same problem; strip them to group. */
export function normalizeProblem(message: string): string {
  return message
    .replace(/https?:\/\/\S+/g, "<url>")
    // Hostnames (common TLDs or any two-letter country code), but not code like "page.goto" or "page.screenshot".
    .replace(/\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|app|co|me|ai|xyz|site|tech|info|biz|edu|gov|[a-z]{2})\b/gi, "<site>")
    .replace(/\b\d+(?:\.\d+)?(?=(?:ms|s)?\b)/g, "N")
    .slice(0, 160);
}

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

/** What an operator needs to see at a glance: is the engine working, and if not, why. */
export async function auditHealth(sinceHours = 24, now = new Date()): Promise<AuditHealth> {
  const since = new Date(now.getTime() - sinceHours * 3600_000);
  const audits = await prisma.audit.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true, status: true, error: true, durationMs: true, createdAt: true, meta: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  const durations = audits.filter((a) => a.status === "COMPLETED" && a.durationMs).map((a) => a.durationMs!).sort((a, b) => a - b);
  const problems = new Map<string, { count: number; latestId: string }>();
  const add = (msg: string, id: string) => {
    const key = normalizeProblem(msg);
    const p = problems.get(key) ?? { count: 0, latestId: id };
    p.count++;
    problems.set(key, p);
  };
  let browserSkipped = 0;
  for (const a of audits) {
    if (a.status === "FAILED" && a.error) add(a.error, a.id);
    const browser = (a.meta as AuditMeta | null)?.browser;
    if (a.status === "COMPLETED" && browser && !browser.ran) {
      browserSkipped++;
      if (browser.reason) add(`Browser: ${browser.reason}`, a.id);
    }
  }
  return {
    total: audits.length,
    failed: audits.filter((a) => a.status === "FAILED").length,
    running: audits.filter((a) => a.status === "RUNNING").length,
    stuck: audits.filter((a) => a.status === "RUNNING" && now.getTime() - a.createdAt.getTime() > 10 * 60_000).length,
    browserSkipped,
    completed: audits.filter((a) => a.status === "COMPLETED").length,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    problems: [...problems].map(([message, p]) => ({ message, ...p })).sort((a, b) => b.count - a.count).slice(0, 8),
  };
}
