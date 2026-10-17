import { test } from "node:test";
import assert from "node:assert/strict";
import { applyHostAdvice, detectHost, setHeaderOn } from "../src/lib/audit/hosting";
import type { CheckResult } from "../src/lib/audit/types";

test("hosts are recognized from response headers, platform before CDN before web server", () => {
  assert.equal(detectHost({ server: "GitHub.com", "x-github-request-id": "1" })?.id, "github-pages");
  assert.equal(detectHost({ server: "Vercel", "x-vercel-id": "bom1::x" })?.id, "vercel");
  assert.equal(detectHost({ server: "cloudflare", "cf-ray": "x", "x-vercel-id": "y" })?.id, "vercel", "Vercel behind Cloudflare is configured on Vercel");
  assert.equal(detectHost({ server: "cloudflare", "cf-ray": "x", "rndr-id": "z" })?.id, "render");
  assert.equal(detectHost({ "x-nf-request-id": "1" })?.id, "netlify");
  assert.equal(detectHost({ "x-amz-cf-id": "1" })?.id, "cloudfront");
  assert.equal(detectHost({ server: "nginx/1.25.3" })?.id, "nginx");
  assert.equal(detectHost({ server: "Apache/2.4.58 (Ubuntu)" })?.id, "apache");
  assert.equal(detectHost({ server: "gws" }), null);
});

const check = (id: string, status: CheckResult["status"] = "fail"): CheckResult => ({ id, category: "security", severity: "medium", status, method: "http", title: id, detail: "d", fix: "generic" });

test("fixes become host-specific config; passing checks and unknown hosts keep the generic fix", () => {
  const [framing, nosniff, referrer, csp, passing] = applyHostAdvice([check("sec-framing"), check("sec-nosniff"), check("sec-referrer", "warn"), check("sec-csp"), check("sec-hsts", "pass")], detectHost({ "x-vercel-id": "1" }));
  assert.match(framing.fix!, /vercel\.json[\s\S]*"key": "X-Frame-Options", "value": "DENY"/);
  assert.match(nosniff.fix!, /X-Content-Type-Options/);
  assert.match(referrer.fix!, /Referrer-Policy/);
  assert.match(csp.fix!, /Content-Security-Policy-Report-Only[\s\S]*rename the header/);
  assert.equal(passing.fix, "generic");
  assert.ok(framing.evidence?.includes("Hosted on Vercel (x-vercel-id header)."));
  assert.equal(applyHostAdvice([check("sec-framing")], null)[0].fix, "generic");
  assert.match(setHeaderOn("netlify", "X-Frame-Options", "DENY")!, /^In a file named _headers[\s\S]*\/\*\n {2}X-Frame-Options: DENY$/);
  assert.match(setHeaderOn("nginx", "X-Frame-Options", "DENY")!, /add_header X-Frame-Options "DENY" always;/);
});

test("GitHub Pages: meta-tag fixes where they work, an honest 'not possible here' where they don't", () => {
  const gh = detectHost({ server: "GitHub.com" });
  const [referrer, csp, framing, nosniff, redirect] = applyHostAdvice([check("sec-referrer", "warn"), check("sec-csp"), check("sec-framing"), check("sec-nosniff"), check("sec-http-redirect")], gh);
  assert.match(referrer.fix!, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
  assert.match(csp.fix!, /<meta http-equiv="Content-Security-Policy"/);
  assert.doesNotMatch(csp.fix!, /frame-ancestors 'self'">/, "frame-ancestors is ignored in a meta CSP, so it isn't suggested there");
  for (const c of [framing, nosniff]) assert.match(c.fix!, /doesn't let sites set response headers[\s\S]*Cloudflare Pages, Netlify or Vercel/);
  assert.match(redirect.fix!, /Enforce HTTPS/);
});

test("one combined block per host with every failing header; nothing to combine for a single fix", async () => {
  const { combinedHeaderFix } = await import("../src/lib/audit/hosting");
  const failing = [check("sec-framing"), check("sec-nosniff"), check("sec-referrer", "warn"), check("sec-hsts", "pass")];
  const vercel = combinedHeaderFix(failing, "vercel")!;
  const parsed = JSON.parse(vercel.code);
  assert.deepEqual(parsed.headers[0].headers.map((h: { key: string }) => h.key), ["X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy"], "valid vercel.json, passing HSTS left out");
  assert.equal(combinedHeaderFix(failing, "netlify")!.code, "/*\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin");
  const gh = combinedHeaderFix(failing, "github-pages")!;
  assert.equal(gh.code, '<meta name="referrer" content="strict-origin-when-cross-origin">');
  assert.match(gh.note!, /X-Frame-Options and X-Content-Type-Options can't be added on GitHub Pages/);
  assert.equal(combinedHeaderFix([check("sec-framing")], "vercel"), null);
  assert.equal(combinedHeaderFix(failing, undefined), null);
});
