#!/usr/bin/env node
// End-to-end smoke test against a running VibeCheck: page status codes plus one real URL audit.
// Usage: node scripts/smoke.mjs [baseUrl] [--require-browser]
const base = (process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "http://localhost:3000").replace(/\/$/, "");
const requireBrowser = process.argv.includes("--require-browser");
let failed = false;
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
};

const pages = { "/": 200, "/experts": 200, "/methodology": 200, "/privacy": 200, "/terms": 200, "/sign-in": 200, "/dashboard": 307, "/admin": 307, "/audits/does-not-exist": 404 };
for (const [path, want] of Object.entries(pages)) {
  const res = await fetch(base + path, { redirect: "manual" });
  check(res.status === want, `${path} → ${res.status} (want ${want})`);
}

const res = await fetch(`${base}/api/audits`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: base },
  body: JSON.stringify({ source: "URL", url: "example.com" }),
});
check(res.ok, `POST /api/audits → ${res.status}`);
const events = (await res.text()).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
const done = events.find((e) => e.type === "done");
const error = events.find((e) => e.type === "error");
check(Boolean(done), `audit finished${done ? ` (score ${done.score})` : error ? `: ${error.message}` : ""}`);
if (done) {
  const page = await fetch(`${base}/audits/${done.id}`).then((r) => r.text());
  check(page.includes("example.com"), "audit report renders");
  const browserRan = !page.includes("Browser checks did not run");
  check(browserRan || !requireBrowser, `browser checks ${browserRan ? "ran" : "did not run"}`);
}
process.exit(failed ? 1 : 0);
