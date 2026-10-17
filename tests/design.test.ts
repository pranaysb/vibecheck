import { test } from "node:test";
import assert from "node:assert/strict";
import { designChecks, type DesignFacts } from "../src/lib/audit/design";

const clean: DesignFacts = { title: "Acme", placeholders: [], brokenImages: [], distorted: [], overlaps: [], clipped: [], longLines: [], fonts: [{ family: "Inter", share: 1 }] };
const byId = (checks: ReturnType<typeof designChecks>) => Object.fromEntries(checks.map((c) => [c.id, c]));

test("a clean page passes every design check", () => {
  const c = byId(designChecks(clean, { small: [], smallChars: 0, totalChars: 900 }, { checked: 10, missing: [] }));
  for (const id of ["ux-placeholder", "ux-images", "ux-overlap", "ux-clipped", "ux-line-length", "ux-fonts", "ux-text-size", "a11y-focus-visible"]) assert.equal(c[id].status, "pass", id);
  assert.equal(c["a11y-focus-visible"].category, "accessibility");
});

test("statuses follow the documented thresholds", () => {
  const c = byId(
    designChecks(
      { ...clean, placeholders: ['page title is the template default "Create Next App"'], brokenImages: [], distorted: ["img stretched"], fonts: ["A", "B", "C", "D"].map((family) => ({ family, share: 0.25 })) },
      { small: ["p 9px"], smallChars: 450, totalChars: 1000 },
      { checked: 10, missing: ["a", "b", "c", "d"] }
    )
  );
  assert.equal(c["ux-placeholder"].status, "fail");
  assert.equal(c["ux-images"].status, "warn", "stretched only warns; a broken image fails");
  assert.equal(c["ux-fonts"].status, "warn");
  assert.equal(c["ux-text-size"].status, "fail", "45% of characters under 12px is over Lighthouse's 40%");
  assert.equal(c["a11y-focus-visible"].status, "fail", "4 of 10 is over 30%");
  const mild = byId(designChecks({ ...clean, brokenImages: ["img /x.png"] }, { small: ["p 11px"], smallChars: 150, totalChars: 1000 }, { checked: 10, missing: ["a"] }));
  assert.equal(mild["ux-images"].status, "fail");
  assert.equal(mild["ux-text-size"].status, "warn");
  assert.equal(mild["a11y-focus-visible"].status, "warn");
  assert.equal(byId(designChecks(clean, { small: ["label 11px"], smallChars: 30, totalChars: 1000 }, null))["ux-text-size"].status, "pass", "3% small labels pass");
});

test("anything that couldn't be measured is reported as not run, never as a pass", () => {
  const c = designChecks(null, null, null);
  assert.ok(c.length >= 8);
  assert.ok(c.every((x) => x.status === "skip"));
  assert.equal(byId(designChecks(clean, null, { checked: 0, missing: [] }))["a11y-focus-visible"].status, "skip");
});
