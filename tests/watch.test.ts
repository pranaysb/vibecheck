import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { nextRun, runWatch, watchOutcome, PAUSE_AFTER_FAILURES } from "../src/lib/watch";
import type { CheckResult } from "../src/lib/audit/types";

const c = (id: string, status: CheckResult["status"], severity: CheckResult["severity"] = "medium"): CheckResult => ({ id, category: id.startsWith("perf") ? "performance" : "security", severity, status, method: "http", title: id, detail: "" });

describe("alert decisions", () => {
  test("a stable check going pass → fail alerts, naming it", () => {
    const o = watchOutcome("site.com", [c("sec-csp", "pass"), c("seo-title", "pass")], [c("sec-csp", "fail"), c("seo-title", "pass")]);
    assert.equal(o.alert, true);
    assert.match(o.title, /site\.com: 1 check got worse/);
    assert.match(o.body!, /sec-csp/);
  });

  test("timing checks flipping don't alert on their own; a real score drop does", () => {
    const quiet = watchOutcome("s", [c("perf-lcp", "pass", "high"), c("sec-csp", "pass")], [c("perf-lcp", "warn", "high"), c("sec-csp", "pass")]);
    assert.equal(quiet.worse.length, 0);
    const drop = watchOutcome("s", [c("perf-lcp", "pass", "critical"), c("sec-csp", "pass", "low")], [c("perf-lcp", "fail", "critical"), c("sec-csp", "pass", "low")]);
    assert.equal(drop.alert, true, "score fell well over 5 points");
    assert.match(drop.title, /dropped \d+ points/);
    assert.match(drop.body!, /timing-based checks/);
  });

  test("improvements and unchanged runs stay quiet; warn → fail counts as worse", () => {
    assert.equal(watchOutcome("s", [c("sec-csp", "fail")], [c("sec-csp", "pass")]).alert, false);
    assert.equal(watchOutcome("s", [c("sec-csp", "pass")], [c("sec-csp", "pass")]).alert, false);
    assert.equal(watchOutcome("s", [c("sec-csp", "warn")], [c("sec-csp", "fail")]).alert, true);
    assert.equal(watchOutcome("s", null, [c("sec-csp", "fail")]).alert, false, "nothing to compare with yet");
  });

  test("next run keeps the weekly rhythm and is never in the past", () => {
    const from = new Date("2026-10-01T05:00:00Z");
    assert.equal(nextRun(from, new Date("2026-10-01T05:30:00Z")).toISOString(), "2026-10-08T05:00:00.000Z");
    assert.equal(nextRun(from, new Date("2026-10-20T05:00:00Z")).toISOString(), "2026-10-22T05:00:00.000Z", "missed weeks are skipped, keeping the weekday");
  });
});

describe("running a watch (database)", async () => {
  const dbUp = await prisma.$queryRaw`select 1`.then(() => true).catch(() => false);
  if (!dbUp) {
    test.skip("database not reachable");
    return;
  }
  const tag = `wch-${Date.now()}`;
  after(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: tag } } });
    await prisma.$disconnect();
  });

  test("overlapping runs audit once; repeated failures notify, then pause", async () => {
    const user = await prisma.user.create({ data: { email: `${tag}@vibecheck.test`, name: "Watcher" } });
    // .invalid never resolves, so the audit fails at DNS without touching the network.
    const watch = await prisma.watch.create({ data: { userId: user.id, target: `https://${tag}.invalid/`, label: `${tag}.invalid`, nextRunAt: new Date(Date.now() - 1000) } });

    const [a, b] = await Promise.all([runWatch(watch.id), runWatch(watch.id)]);
    assert.equal([a, b].filter((r) => r.ran).length, 1, "only one of two overlapping runs proceeds");
    assert.match((a.ran ? a : b).error!, /couldn't find|DNS/i);
    let w = await prisma.watch.findUniqueOrThrow({ where: { id: watch.id } });
    assert.ok(w.nextRunAt.getTime() > Date.now() + 6 * 86_400_000, "rescheduled about a week out");
    assert.equal(w.consecutiveFailures, 1);
    assert.equal(await prisma.notification.count({ where: { userId: user.id, title: { contains: "failed" } } }), 1);

    for (let i = 1; i < PAUSE_AFTER_FAILURES; i++) {
      await prisma.watch.update({ where: { id: watch.id }, data: { nextRunAt: new Date(Date.now() - 1000) } });
      await runWatch(watch.id);
    }
    w = await prisma.watch.findUniqueOrThrow({ where: { id: watch.id } });
    assert.ok(w.pausedAt, `paused after ${PAUSE_AFTER_FAILURES} failures`);
    assert.equal(await prisma.notification.count({ where: { userId: user.id, title: { contains: "paused" } } }), 1);
    assert.deepEqual(await runWatch(watch.id), { ran: false }, "a paused watch doesn't run");
  });
});
