import { test } from "node:test";
import assert from "node:assert/strict";
import { toJson, toMarkdown, topPriorities } from "../src/lib/audit/report";
import { normalizeProblem } from "../src/lib/ops";
import type { CheckResult } from "../src/lib/audit/types";

const checks: CheckResult[] = [
  { id: "sec-csp", category: "security", severity: "medium", status: "fail", method: "http", title: "Content-Security-Policy", detail: "No CSP header.", fix: "Add one." },
  { id: "sec-https", category: "security", severity: "critical", status: "pass", method: "http", title: "Served over HTTPS", detail: "ok" },
  { id: "a11y-axe", category: "accessibility", severity: "high", status: "warn", method: "browser", title: "WCAG scan | axe", detail: "2 rules", evidence: ["minor · list: `ul` children"] },
  { id: "perf-tbt", category: "performance", severity: "medium", status: "skip", method: "browser", title: "Total Blocking Time (mobile)", detail: "not scored" },
];
const audit = { id: "abc123", label: "example.com", target: "https://example.com/", finalUrl: "https://example.com/", source: "URL", createdAt: new Date("2026-10-15T08:00:00Z"), durationMs: 42000, checks, meta: {} };

test("Markdown export: score, fix-first order, checklists, escaped text, evidence in code spans", () => {
  const out = toMarkdown(audit, "https://vibecheck.example/audits/abc123");
  assert.match(out, /^# VibeCheck audit: example\.com/);
  assert.match(out, /\*\*Score \d+\/100\*\*/);
  assert.ok(out.indexOf("Fix these first") < out.indexOf("## Security"));
  assert.match(out, /- \[ \] \*\*Failed: Content-Security-Policy\*\*/);
  assert.match(out, /WCAG scan \\\| axe/, "pipes are escaped so tables can't break");
  assert.match(out, /`minor · list: 'ul' children`/, "backticks inside evidence can't close the code span");
  assert.match(out, /Not run: Total Blocking Time/);
  assert.match(out, /https:\/\/vibecheck\.example\/methodology/);
});

test("JSON export carries the score, counts and every check", () => {
  const j = toJson(audit, "https://x/audits/abc123");
  assert.equal(j.checks.length, 4);
  assert.equal(j.counts.skip, 1);
  assert.equal(typeof j.score, "number");
  // A medium failure (3 × 1) and a high warning (6 × 0.5) cost the same; ties keep report order.
  assert.deepEqual(topPriorities(checks).map((c) => c.id), ["sec-csp", "a11y-axe"]);
});

test("audit-health grouping strips sites, URLs and numbers so one problem is one row", () => {
  assert.equal(normalizeProblem("stripe.com didn't respond within 10 seconds."), normalizeProblem("www.bbc.co.uk didn't respond within 10 seconds."));
  assert.equal(normalizeProblem("Could not reach example.com: read ECONNRESET"), "Could not reach <site>: read ECONNRESET");
  assert.equal(normalizeProblem("Browser pass failed: page.goto: Timeout 20000ms exceeded at https://a.com/x"), "Browser pass failed: page.goto: Timeout Nms exceeded at <url>");
});
