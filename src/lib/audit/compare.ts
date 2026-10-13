import type { CheckResult, Status } from "./types";

export interface AuditDiff {
  fixed: CheckResult[];
  regressed: CheckResult[];
  /** Checks whose status changed between warn and fail. */
  changed: { check: CheckResult; from: Status }[];
}

const RANK: Record<Status, number> = { pass: 0, warn: 1, fail: 2, skip: -1 };

/** What changed between two runs of the same target, by check id. Checks that didn't run in either are ignored. */
export function diffAudits(previous: CheckResult[], current: CheckResult[]): AuditDiff {
  const before = new Map(previous.map((c) => [c.id, c.status]));
  const diff: AuditDiff = { fixed: [], regressed: [], changed: [] };
  for (const c of current) {
    const was = before.get(c.id);
    if (was === undefined || was === "skip" || c.status === "skip" || was === c.status) continue;
    if (c.status === "pass") diff.fixed.push(c);
    else if (was === "pass") diff.regressed.push(c);
    else diff.changed.push({ check: c, from: was });
  }
  diff.changed.sort((a, b) => RANK[b.check.status] - RANK[a.check.status]);
  return diff;
}
