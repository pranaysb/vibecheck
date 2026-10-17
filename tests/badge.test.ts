import { test } from "node:test";
import assert from "node:assert/strict";
import { badgeColor, badgeSvg } from "../src/lib/badge";
import { badgeSite } from "../src/lib/badge-site";
import { normalizeUrl } from "../src/lib/audit/url-audit";

test("a badge's site parameter normalizes back to the exact audited target", () => {
  for (const target of ["https://pranaysb.me/", "https://www.bbc.com/", "https://site.com/blog", "https://shop.example.co.uk/en/"]) {
    const t = normalizeUrl(target);
    assert.equal(normalizeUrl(badgeSite(t)), t, target);
  }
});

test("badge colors follow the score bands and the SVG escapes its text", () => {
  assert.equal(badgeColor(95), "#1f883d");
  assert.equal(badgeColor(80), "#9a6700");
  assert.equal(badgeColor(40), "#cf222e");
  assert.equal(badgeColor(null), "#6b6b6b");
  const svg = badgeSvg(84, `score for <script>alert(1)</script>`);
  assert.match(svg, /84\/100/);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(badgeSvg(null, "x"), /not audited/);
});
