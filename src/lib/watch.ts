import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { runAudit } from "@/lib/audit/run";
import { diffAudits } from "@/lib/audit/compare";
import { computeScore, type CheckResult } from "@/lib/audit/types";

import { DAILY_RUN_CAP, PAUSE_AFTER_FAILURES, SCORE_DROP_ALERT, WATCH_INTERVAL_DAYS } from "@/lib/watch-config";
export * from "@/lib/watch-config";

/**
 * Checks whose result moves from run to run without the site changing (timing, third-party scripts). They still
 * show in the report's comparison, but don't trigger alerts on their own.
 */
const VOLATILE = new Set(["perf-lcp", "perf-fcp", "perf-tbt", "perf-ttfb", "perf-weight", "perf-cls", "rel-console-errors", "rel-failed-requests"]);

export interface WatchOutcome {
  alert: boolean;
  title: string;
  body?: string;
  scoreBefore: number | null;
  scoreAfter: number | null;
  worse: CheckResult[];
  fixed: CheckResult[];
}

/** Decides whether a re-audit is worth a notification: a newly failing or warning stable check, or a real drop. */
export function watchOutcome(label: string, previous: CheckResult[] | null, current: CheckResult[]): WatchOutcome {
  const scoreAfter = computeScore(current).score;
  if (!previous) return { alert: false, title: `First weekly audit of ${label}: ${scoreAfter ?? "no score"}`, scoreBefore: null, scoreAfter, worse: [], fixed: [] };
  const scoreBefore = computeScore(previous).score;
  const diff = diffAudits(previous, current);
  const worse = [...diff.regressed, ...diff.changed.filter((c) => c.check.status === "fail").map((c) => c.check)].filter((c) => !VOLATILE.has(c.id));
  const drop = scoreBefore !== null && scoreAfter !== null ? scoreBefore - scoreAfter : 0;
  const alert = worse.length > 0 || drop >= SCORE_DROP_ALERT;
  const scoreText = scoreBefore !== null && scoreAfter !== null && scoreBefore !== scoreAfter ? ` (${scoreBefore} → ${scoreAfter})` : "";
  return {
    alert,
    title: worse.length
      ? `${label}: ${worse.length} check${worse.length === 1 ? "" : "s"} got worse${scoreText}`
      : drop >= SCORE_DROP_ALERT
        ? `${label} dropped ${drop} points${scoreText}`
        : `${label} re-audited: no regressions${scoreText}`,
    body: worse.length
      ? `${worse.slice(0, 4).map((c) => c.title).join(", ")}${worse.length > 4 ? ` and ${worse.length - 4} more` : ""}.${diff.fixed.length ? ` ${diff.fixed.length} fixed.` : ""}`
      : drop >= SCORE_DROP_ALERT
        ? "No check newly failed; the drop comes from timing-based checks, which vary between runs. Open the report to compare."
        : undefined,
    scoreBefore,
    scoreAfter,
    worse,
    fixed: diff.fixed,
  };
}

/** The next run time, at least a day out, in whole days from the previous schedule so runs don't drift. */
export function nextRun(from: Date, now = new Date()): Date {
  let next = new Date(from.getTime() + WATCH_INTERVAL_DAYS * 86_400_000);
  while (next.getTime() < now.getTime() + 86_400_000) next = new Date(next.getTime() + WATCH_INTERVAL_DAYS * 86_400_000);
  return next;
}

/** Watches due now, oldest first, capped for one day's run. */
export async function dueWatches(now = new Date(), cap = DAILY_RUN_CAP) {
  return prisma.watch.findMany({ where: { nextRunAt: { lte: now }, pausedAt: null }, orderBy: { nextRunAt: "asc" }, take: cap, select: { id: true } });
}

/**
 * Runs one watch. The schedule is advanced first with a conditional update, so two overlapping cron runs can't
 * audit the same site twice. Never throws: failures are recorded on the watch and reported to its owner.
 */
export async function runWatch(watchId: string, now = new Date()): Promise<{ ran: boolean; auditId?: string; alert?: boolean; error?: string }> {
  const watch = await prisma.watch.findUnique({ where: { id: watchId } });
  if (!watch || watch.pausedAt || watch.nextRunAt > now) return { ran: false };
  const claimed = await prisma.watch.updateMany({ where: { id: watchId, nextRunAt: watch.nextRunAt }, data: { nextRunAt: nextRun(watch.nextRunAt, now), lastRunAt: now } });
  if (claimed.count !== 1) return { ran: false };

  const previous = await prisma.audit.findFirst({
    where: { ownerId: watch.userId, target: watch.target, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    select: { checks: true },
  });
  let auditId: string | undefined;
  let error: string | undefined;
  try {
    await runAudit({ source: "URL", url: watch.target }, watch.userId, (e) => {
      if (e.type === "audit") auditId = e.id;
      if (e.type === "error") error = e.message;
    });
  } catch (err) {
    // The URL was rejected before an audit row existed (e.g. it no longer validates).
    error = (err as Error).message;
  }
  const audit = auditId ? await prisma.audit.findUnique({ where: { id: auditId }, select: { status: true, checks: true, error: true } }) : null;

  if (!audit || audit.status !== "COMPLETED") {
    const failures = watch.consecutiveFailures + 1;
    const pause = failures >= PAUSE_AFTER_FAILURES;
    await prisma.watch.update({ where: { id: watchId }, data: { consecutiveFailures: failures, lastAuditId: auditId ?? watch.lastAuditId, pausedAt: pause ? now : null } });
    const reason = audit?.error ?? error ?? "The audit didn't complete.";
    await notify(
      watch.userId,
      pause ? `Weekly audits of ${watch.label} paused after ${failures} failed runs` : `This week's audit of ${watch.label} failed`,
      auditId ? `/audits/${auditId}` : "/dashboard",
      pause ? `${reason} Resume from your dashboard once the site is reachable.` : reason
    );
    return { ran: true, auditId, error: reason };
  }

  const outcome = watchOutcome(watch.label, (previous?.checks as unknown as CheckResult[] | undefined) ?? null, audit.checks as unknown as CheckResult[]);
  await prisma.watch.update({ where: { id: watchId }, data: { consecutiveFailures: 0, lastAuditId: auditId } });
  if (outcome.alert) await notify(watch.userId, outcome.title, `/audits/${auditId}`, outcome.body);
  return { ran: true, auditId, alert: outcome.alert };
}
