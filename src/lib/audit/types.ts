export type Category = "security" | "privacy" | "performance" | "accessibility" | "seo" | "reliability" | "code";
export type Severity = "critical" | "high" | "medium" | "low";
/** `skip` = not applicable or could not run; excluded from the score. */
export type Status = "pass" | "warn" | "fail" | "skip";
export type Method = "http" | "html" | "browser" | "files" | "osv" | "sandbox";

export interface CheckResult {
  id: string;
  category: Category;
  severity: Severity;
  status: Status;
  title: string;
  /** What was measured, in plain words. */
  detail: string;
  /** Raw observations backing the status: header values, file paths, selectors. */
  evidence?: string[];
  fix?: string;
  method: Method;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  security: "Security",
  privacy: "Privacy",
  performance: "Performance",
  accessibility: "Accessibility",
  seo: "Search & sharing",
  reliability: "Reliability",
  code: "Code & dependencies",
};

export const METHOD_LABEL: Record<Method, string> = {
  http: "HTTP request",
  html: "HTML parse",
  browser: "Headless Chromium",
  files: "File scan",
  osv: "OSV.dev database",
  sandbox: "Vercel Sandbox build",
};

export const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 10, high: 6, medium: 3, low: 1 };

/** A failed critical check caps the score here, so a leaked secret can never sit behind a high number. */
export const CRITICAL_CAP = 40;

export interface Score {
  score: number | null;
  earned: number;
  possible: number;
  counts: Record<Status, number>;
  capped: boolean;
}

export function computeScore(checks: CheckResult[]): Score {
  const counts: Record<Status, number> = { pass: 0, warn: 0, fail: 0, skip: 0 };
  let earned = 0;
  let possible = 0;
  let criticalFail = false;
  for (const c of checks) {
    counts[c.status]++;
    if (c.status === "skip") continue;
    const w = SEVERITY_WEIGHT[c.severity];
    possible += w;
    if (c.status === "pass") earned += w;
    else if (c.status === "warn") earned += w / 2;
    else if (c.severity === "critical") criticalFail = true;
  }
  if (possible === 0) return { score: null, earned, possible, counts, capped: false };
  const raw = Math.round((earned / possible) * 100);
  const capped = criticalFail && raw > CRITICAL_CAP;
  return { score: capped ? CRITICAL_CAP : raw, earned, possible, counts, capped };
}

export interface AuditMeta {
  title?: string;
  statusCode?: number;
  ttfbMs?: number;
  resolvedIp?: string;
  redirects?: { url: string; status: number }[];
  responseHeaders?: Record<string, string>;
  browser?: { ran: boolean; reason?: string; requests?: number; transferBytes?: number };
  files?: { total: number; stored: number; bytes: number; root?: string | null; truncated?: boolean };
  github?: { repo: string; ref: string; commitUrl?: string; htmlUrl: string };
  /** Source-only projects are installed and built in a Vercel Sandbox before the site checks run. */
  build?: { ran: boolean; ok?: boolean; reason?: string; packageManager?: string; framework?: string | null; ms?: number; outputDir?: string; mode?: "server" };
  steps?: { label: string; ms: number }[];
  /** Hosting platform recognized from response headers; header fixes are tailored to it. */
  host?: { id: string; name: string; evidence: string };
  crawl?: { throttled?: boolean; unvisited: number; disallowed: number; pages: { url: string; status: number | null; title?: string; error?: string }[] };
}

export type ProgressFn = (label: string) => void;
