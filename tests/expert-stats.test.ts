import { test } from "node:test";
import assert from "node:assert/strict";
import { expertStats } from "../src/lib/expert-stats";

const h = (n: number) => n * 3_600_000;
const at = (hours: number) => new Date(Date.UTC(2026, 9, 1) + h(hours));

test("expert record: ratings, distribution, verdicts and median turnaround", () => {
  const s = expertStats([
    { rating: 5, verdict: "SHIP", claimedAt: at(0), deliveredAt: at(10) },
    { rating: 3, verdict: "FIX_FIRST", claimedAt: at(0), deliveredAt: at(30) },
    { rating: null, verdict: "FIX_FIRST", claimedAt: at(0), deliveredAt: at(20) },
    { rating: 4, verdict: "NOT_READY", claimedAt: null, deliveredAt: at(5) },
  ]);
  assert.equal(s.delivered, 4);
  assert.equal(s.rated, 3);
  assert.equal(s.average, 4);
  assert.deepEqual(s.distribution, { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 });
  assert.deepEqual(s.verdicts, { SHIP: 1, FIX_FIRST: 2, NOT_READY: 1 });
  assert.equal(s.medianTurnaroundMs, h(20), "median of 10, 20, 30 hours; reviews without a claim time are left out");
});

test("a new expert has no average or turnaround rather than zeros", () => {
  const s = expertStats([]);
  assert.equal(s.average, null);
  assert.equal(s.medianTurnaroundMs, null);
  assert.equal(s.delivered, 0);
  assert.equal(expertStats([{ rating: null, verdict: "SHIP", claimedAt: at(0), deliveredAt: at(3) }, { rating: null, verdict: "SHIP", claimedAt: at(0), deliveredAt: at(5) }]).medianTurnaroundMs, h(4), "even count: mean of the middle two");
});
