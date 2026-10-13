import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { htmlChecks } from "../src/lib/audit/html-checks";
import { headerChecks } from "../src/lib/audit/header-checks";
import { computeScore, type CheckResult } from "../src/lib/audit/types";

const byId = (checks: CheckResult[], id: string) => {
  const c = checks.find((x) => x.id === id);
  assert.ok(c, `expected check ${id}`);
  return c;
};

const GOOD = `<!doctype html><html lang="en"><head>
<title>Acme — invoices that pay themselves</title>
<meta name="description" content="Acme sends invoices, chases late payers, and reconciles your bank feed automatically.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:title" content="Acme"><meta property="og:image" content="https://acme.test/og.png">
<link rel="canonical" href="https://acme.test/"><link rel="icon" href="/favicon.svg">
</head><body>
<h1>Invoices</h1><h2>How it works</h2><h3>Step one</h3>
<img src="/a.png" alt="Dashboard"><img src="/spacer.png" alt="">
<label for="email">Email</label><input id="email" type="email">
<label>Name <input name="name"></label>
<button aria-label="Close"><svg></svg></button><button>Save</button>
<a href="/x"><img src="/i.png" alt="Home"></a>
</body></html>`;

const BAD = `<html><head><meta name="viewport" content="width=device-width, user-scalable=no"></head><body>
<h2>Skip</h2><h4>Skipped level</h4>
<img src="/a.png">
<input type="text" placeholder="Search">
<button><svg></svg></button>
<a href="/x"></a>
<div id="dup"></div><div id="dup"></div>
<script src="http://cdn.insecure.test/x.js"></script>
</body></html>`;

describe("htmlChecks", () => {
  test("well-formed page passes every structural check", () => {
    const checks = htmlChecks([{ label: "/", html: GOOD }], { isHttps: true });
    const notPassing = checks.filter((c) => c.status !== "pass").map((c) => `${c.id}:${c.status}`);
    assert.deepEqual(notPassing, []);
  });

  test("broken page fails with evidence pointing at the elements", () => {
    const checks = htmlChecks([{ label: "/", html: BAD }], { isHttps: true });
    for (const id of ["seo-title", "seo-description", "a11y-lang", "a11y-viewport", "a11y-img-alt", "a11y-form-labels", "a11y-button-names", "a11y-link-names", "a11y-h1", "sec-mixed-content"]) {
      assert.equal(byId(checks, id).status, "fail", id);
    }
    assert.match(byId(checks, "a11y-viewport").detail, /pinch-zoom/);
    assert.match(byId(checks, "a11y-form-labels").evidence!.join(), /placeholder only/);
    assert.match(byId(checks, "sec-mixed-content").evidence!.join(), /http:\/\/cdn\.insecure\.test/);
    assert.equal(byId(checks, "a11y-heading-order").status, "warn");
    assert.equal(byId(checks, "a11y-duplicate-ids").status, "warn");
  });

  test("hidden elements and alt=\"\" are not flagged", () => {
    const html = `<html lang="en"><body><h1>x</h1><img src="d.png" alt=""><div hidden><img src="h.png"></div><button aria-hidden="true"></button></body></html>`;
    const checks = htmlChecks([{ label: "/", html }], { isHttps: false });
    assert.equal(byId(checks, "a11y-img-alt").status, "pass");
    assert.equal(byId(checks, "a11y-button-names").status, "pass");
    assert.equal(checks.find((c) => c.id === "sec-mixed-content"), undefined, "mixed content only applies to https");
  });

  test("multi-document evidence is prefixed with the file path", () => {
    const checks = htmlChecks([{ label: "index.html", html: GOOD }, { label: "about.html", html: BAD }], { isHttps: true });
    assert.match(byId(checks, "a11y-img-alt").evidence![0], /^about\.html: /);
    assert.equal(byId(checks, "seo-title").status, "pass", "head metadata is judged on the primary page");
  });

  test("noindex is surfaced", () => {
    const checks = htmlChecks([{ label: "/", html: `<html><head><meta name="robots" content="noindex,nofollow"></head></html>` }], { isHttps: true });
    assert.equal(byId(checks, "seo-noindex").status, "warn");
  });
});

describe("headerChecks", () => {
  test("hardened headers pass", () => {
    const checks = headerChecks(
      {
        "content-security-policy": "default-src 'self'; script-src 'self' 'nonce-abc' 'strict-dynamic'; frame-ancestors 'none'",
        "strict-transport-security": "max-age=63072000; includeSubDomains",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        server: "nginx",
      },
      ["sid=abc; Path=/; Secure; HttpOnly; SameSite=Lax"],
      true
    );
    assert.deepEqual(checks.filter((c) => c.status !== "pass").map((c) => c.id), []);
  });

  test("missing and weak headers fail or warn with reasons", () => {
    const checks = headerChecks(
      { "content-security-policy": "script-src 'self' 'unsafe-inline'", "strict-transport-security": "max-age=300", "x-powered-by": "Express", server: "Apache/2.4.1" },
      ["session=1; Path=/"],
      true
    );
    assert.equal(byId(checks, "sec-csp").status, "warn");
    assert.equal(byId(checks, "sec-hsts").status, "warn");
    assert.equal(byId(checks, "sec-framing").status, "fail");
    assert.equal(byId(checks, "sec-nosniff").status, "fail");
    assert.equal(byId(checks, "sec-version-leak").status, "warn");
    assert.deepEqual(byId(checks, "sec-version-leak").evidence, ["X-Powered-By: Express", "Server: Apache/2.4.1"]);
    assert.match(byId(checks, "sec-cookies").evidence![0], /session: missing Secure, SameSite, HttpOnly/);
  });

  test("HSTS is not judged on plain http", () => {
    assert.equal(headerChecks({}, [], false).find((c) => c.id === "sec-hsts"), undefined);
  });
});

describe("computeScore", () => {
  const mk = (severity: CheckResult["severity"], status: CheckResult["status"]): CheckResult => ({ id: Math.random().toString(), category: "security", severity, status, title: "", detail: "", method: "http" });

  test("weights by severity, warnings earn half, skips are excluded", () => {
    const s = computeScore([mk("high", "pass"), mk("medium", "warn"), mk("low", "fail"), mk("critical", "skip")]);
    // earned 6 + 1.5 = 7.5 of possible 6 + 3 + 1 = 10
    assert.equal(s.score, 75);
    assert.equal(s.counts.skip, 1);
  });

  test("a failed critical check caps the score", () => {
    const checks = [mk("critical", "fail"), ...Array.from({ length: 30 }, () => mk("high", "pass"))];
    const s = computeScore(checks);
    assert.equal(s.score, 40);
    assert.equal(s.capped, true);
  });

  test("no applicable checks means no score, not 100", () => {
    assert.equal(computeScore([mk("high", "skip")]).score, null);
  });
});

describe("diffAudits", async () => {
  const { diffAudits } = await import("../src/lib/audit/compare");
  const c = (id: string, status: CheckResult["status"]): CheckResult => ({ id, status, category: "security", severity: "medium", title: id, detail: "", method: "http" });

  test("classifies fixes, regressions and severity changes; ignores checks that didn't run", () => {
    const before = [c("csp", "fail"), c("hsts", "pass"), c("alt", "warn"), c("lcp", "skip"), c("gone", "fail"), c("same", "fail")];
    const after = [c("csp", "pass"), c("hsts", "fail"), c("alt", "fail"), c("lcp", "fail"), c("new", "fail"), c("same", "fail")];
    const d = diffAudits(before, after);
    assert.deepEqual(d.fixed.map((x) => x.id), ["csp"]);
    assert.deepEqual(d.regressed.map((x) => x.id), ["hsts"]);
    assert.deepEqual(d.changed.map((x) => `${x.check.id}:${x.from}->${x.check.status}`), ["alt:warn->fail"]);
  });
});
