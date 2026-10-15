import { test } from "node:test";
import assert from "node:assert/strict";
import { cpuSlowdownFor, mobilePerfChecks, timeToInteractive, totalBlockingTime } from "../src/lib/audit/browser";

test("TTI waits for both CPU and network quiet", () => {
  const tasks: [number, number][] = [[1500, 500]]; // ends 2000
  assert.equal(timeToInteractive(1000, tasks, [], 20_000), 2000, "CPU quiet from 2000");
  const busy: [number, number][] = [[1000, 6500], [1000, 6500], [1000, 6500]];
  assert.equal(timeToInteractive(1000, [...tasks, [6000, 300]], busy, 20_000), 6300, "3 in flight until 6500 rules out 2000; quiet after the 6000–6300 task");
  assert.equal(timeToInteractive(1000, tasks, [], 6_500), null, "window not fully observed yet");
});

test("TBT counts the part of each long task beyond 50 ms, clipped to FCP–TTI", () => {
  assert.equal(totalBlockingTime(1000, 5000, [[1500, 300], [2000, 40], [900, 200]]), 250 + 0 + 50, "900–1100 clips to 1000–1100 → 100 − 50");
  assert.equal(totalBlockingTime(1000, 2000, [[3000, 900]]), 0, "after TTI");
});

test("throttled results grade on Lighthouse's mobile boundaries; a no-paint timeout fails LCP", () => {
  const [lcp, fcp, tbt] = mobilePerfChecks({ lcp: 2400, fcp: 2000, tbt: 700, loadMs: 5000 });
  assert.deepEqual([lcp.status, fcp.status, tbt.status], ["pass", "warn", "fail"]);
  assert.equal(mobilePerfChecks({ lcp: 2504, fcp: 1803, tbt: 0, loadMs: 1 })[1].status, "pass", "1803 ms shows as 1.80s");
  const timedOut = mobilePerfChecks({ timedOut: true });
  assert.deepEqual(timedOut.map((c) => c.status), ["fail", "skip", "skip"]);
  assert.deepEqual(mobilePerfChecks({ error: "boom" }).map((c) => c.status), ["skip", "skip", "skip"]);
});

test("CPU slowdown is calibrated to the host: 4× on a fast laptop, less on slower servers, never below 1×", () => {
  assert.equal(cpuSlowdownFor(4000), 4);
  assert.equal(cpuSlowdownFor(9000), 4, "capped at Lighthouse's 4×");
  assert.equal(cpuSlowdownFor(1500), 1.5);
  assert.equal(cpuSlowdownFor(600), 1);
});
