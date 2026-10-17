#!/usr/bin/env node
// End-to-end test of the whole VibeCheck workflow through the real UI, with four users in separate
// browser contexts: builder, expert, admin, bystander. Requires the server to run with E2E_AUTH_SECRET
// (test-only sign-in, impossible on Vercel) and ADMIN_EMAILS containing E2E_ADMIN_EMAIL.
//
// Usage: E2E_AUTH_SECRET=... node scripts/e2e.mjs [baseUrl] [--target=example.com] [--repo=owner/name] [--sandbox] [--headed]
import { chromium } from "playwright-core";
import { zipSync, strToU8 } from "fflate";

const base = (process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "http://localhost:3000").replace(/\/$/, "");
const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const target = arg("target", "example.com");
const repo = arg("repo", "mdn/beginner-html-site-styled");
const secret = process.env.E2E_AUTH_SECRET;
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@vibecheck.test";
if (!secret) throw new Error("Set E2E_AUTH_SECRET (same value as the server).");

const tag = Date.now().toString(36);
const emails = { builder: `builder-${tag}@e2e.test`, expert: `expert-${tag}@e2e.test`, bystander: `bystander-${tag}@e2e.test` };
let step = 0;
const ok = (msg) => console.log(`✓ ${String(++step).padStart(2)} ${msg}`);
const AUDIT_TIMEOUT = 150_000;

const browser = await chromium.launch({ headless: !process.argv.includes("--headed") });
async function as(email, name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const res = await ctx.request.post(`${base}/api/e2e/login`, { data: { email, name, secret } });
  if (!res.ok()) throw new Error(`login ${email}: ${res.status()} ${await res.text()}`);
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);
  return page;
}
async function expectText(page, text, msg) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible" });
  if (msg) ok(msg);
}
async function runAudit(page, tab, fill) {
  await page.goto(`${base}/`);
  await page.getByRole("tab", { name: tab }).click();
  await fill();
  await page.getByRole("button", { name: "Run audit" }).click();
  await page.waitForURL(/\/audits\/[a-z0-9]+$/, { timeout: AUDIT_TIMEOUT });
  return page.url();
}

let exitCode = 0;
try {
  const builder = await as(emails.builder, "E2E Builder");
  const expert = await as(emails.expert, `E2E Expert ${tag}`);
  const admin = await as(adminEmail, "E2E Admin");
  const bystander = await as(emails.bystander, "E2E Bystander");
  ok("four users signed in (test-only auth)");

  // ---------- Builder: three ways to audit ----------
  const urlAudit = await runAudit(builder, "Live URL", () => builder.locator("#audit-input").fill(target));
  await expectText(builder, "of 100", `URL audit of ${target} completed`);
  if (await builder.getByText("Browser checks did not run").count()) throw new Error("browser checks did not run on the URL audit");
  ok("browser checks ran (screenshots + rendered checks)");
  const md = await builder.request.get(`${urlAudit.replace("/audits/", "/api/audits/")}/export?format=md`);
  const mdText = md.ok() ? await md.text() : "";
  if (!mdText.startsWith("# VibeCheck audit:") || !mdText.includes("/100**")) throw new Error(`Markdown export: ${md.status()} ${mdText.slice(0, 80)}`);
  ok("report exports as Markdown for issues and PRs");
  const svg = await fetch(`${base}/api/badge?site=${encodeURIComponent(target)}`).then((r) => r.text());
  if (!/VibeCheck: \d{1,3}\/100/.test(svg)) throw new Error(`badge: ${svg.slice(0, 120)}`);
  const latest = await fetch(`${base}/latest?site=${encodeURIComponent(target)}`, { redirect: "manual" });
  if (latest.status !== 302 || !/\/audits\/[a-z0-9]+$/.test(latest.headers.get("location") ?? "")) throw new Error(`latest: ${latest.status} ${latest.headers.get("location")}`);
  const none = await fetch(`${base}/api/badge?site=never-audited-${tag}.example`).then((r) => r.text());
  if (!none.includes("not audited")) throw new Error("badge for an unaudited site should say so");
  ok("README badge shows the real latest score, links to the latest report, and says 'not audited' otherwise");
  await builder.goto(urlAudit);
  await builder.getByRole("button", { name: "Watch weekly" }).click();
  await expectText(builder, "Watching. VibeCheck re-audits this site about once a week", "builder started weekly re-audits of the URL");

  const zip = zipSync({
    "site/index.html": strToU8(`<!doctype html><html lang="en"><head><title>E2E upload ${tag}</title><link rel="stylesheet" href="style.css"></head><body><h1 id="hello">Hello from the upload</h1><img src="missing.png"></body></html>`),
    "site/style.css": strToU8("#hello{color:rgb(10, 120, 40)}"),
  });
  const zipAudit = await runAudit(builder, "Upload .zip", () => builder.locator("#audit-input").setInputFiles({ name: `e2e-${tag}.zip`, mimeType: "application/zip", buffer: Buffer.from(zip) }));
  await expectText(builder, "1 reference(s) point at files that are not in the upload", null);
  await builder.locator("summary", { hasText: "No broken local file references" }).click(); // expand the evidence
  await expectText(builder, "index.html → missing.png", ".zip upload audited; evidence names the broken reference");
  await builder.locator("summary", { hasText: "Images load and keep their proportions" }).click();
  await expectText(builder, "broken: img /missing.png", "rendered design check caught the broken image");
  const [preview] = await Promise.all([builder.waitForEvent("popup"), builder.getByRole("link", { name: "Open preview" }).click()]);
  await preview.waitForLoadState();
  const view = await preview.evaluate(() => ({ origin: window.origin, h1: document.querySelector("#hello")?.textContent, color: getComputedStyle(document.querySelector("#hello")).color }));
  if (view.origin !== "null" || view.h1 !== "Hello from the upload" || view.color !== "rgb(10, 120, 40)") throw new Error(`preview: ${JSON.stringify(view)}`);
  await preview.close();
  ok("sandboxed preview renders the upload with its CSS, on an opaque origin");

  // Opt-in (needs Vercel Sandbox credentials on the server): a source-only Vite + React project is built, then audited.
  if (process.argv.includes("--sandbox")) {
    const src = zipSync({
      "package.json": strToU8(JSON.stringify({ name: "e2e-vite", private: true, type: "module", scripts: { build: "vite build" }, dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" }, devDependencies: { vite: "^7.0.0", "@vitejs/plugin-react": "^5.0.0" } })),
      "vite.config.js": strToU8(`import { defineConfig } from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({ plugins: [react()] });`),
      "index.html": strToU8(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>E2E source ${tag}</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`),
      "src/main.jsx": strToU8(`import { createRoot } from "react-dom/client"; createRoot(document.getElementById("root")).render(<h1 id="hello">Rendered by React ${tag}</h1>);`),
    });
    await runAudit(builder, "Upload .zip", () => builder.locator("#audit-input").setInputFiles({ name: `e2e-src-${tag}.zip`, mimeType: "application/zip", buffer: Buffer.from(src) }));
    await expectText(builder, "Built in an isolated Vercel Sandbox", null);
    await expectText(builder, "The site checks below audit the built output in dist/", null);
    if (await builder.getByText("Browser checks did not run").count()) throw new Error("browser checks did not run on the built site");
    const [built] = await Promise.all([builder.waitForEvent("popup"), builder.getByRole("link", { name: "Open preview" }).click()]);
    await built.locator("#hello").waitFor();
    if ((await built.locator("#hello").textContent()) !== `Rendered by React ${tag}`) throw new Error("built preview did not render React");
    await built.close();
    ok("source-only Vite + React .zip was built in a Vercel Sandbox, audited, and its built preview renders");
    await builder.goto(zipAudit);
  }
  await builder.getByRole("link", { name: "Browse files" }).click();
  await builder.getByRole("link", { name: /^index\.html/ }).click(); // the single wrapper folder is stripped
  await expectText(builder, "Hello from the upload", "file browser shows the uploaded source");

  await runAudit(builder, "GitHub repo", () => builder.locator("#audit-input").fill(repo));
  await expectText(builder, "GitHub", null);
  await expectText(builder, "README present", `GitHub import of ${repo} audited`);

  await builder.goto(`${base}/dashboard`);
  await builder.getByRole("heading", { name: "Your sites" }).waitFor();
  await builder.locator("#sites ~ ul li, section[aria-labelledby=sites] li").filter({ hasText: repo }).first().waitFor();
  ok("dashboard lists each audited site with its latest score");

  // ---------- Builder requests a review of the URL audit ----------
  await builder.goto(urlAudit);
  await builder.getByRole("button", { name: "Request an expert review" }).click();
  await builder.locator("label", { hasText: "Security" }).first().click();
  await builder.getByLabel("Context for the reviewer").fill(`E2E ${tag}: please check security headers and accessibility.`);
  await builder.getByRole("button", { name: "Post request" }).click();
  await expectText(builder, "Waiting for an approved expert to claim it", "builder requested an expert review");

  // ---------- Expert applies, admin approves ----------
  await expert.goto(`${base}/expert`);
  await expert.waitForURL(/\/experts\/apply/);
  ok("unapproved user is kept out of the review queue");
  await expert.getByLabel("Headline").fill("E2E reviewer");
  await expert.getByLabel("Experience").fill("Automated end-to-end test account that reviews security headers, accessibility and mobile layout issues on real sites.");
  await expert.locator("label", { hasText: "Security" }).first().click();
  await expert.getByLabel("Links to verifiable work").fill("https://github.com/pranaysb/vibecheck");
  await expert.getByRole("button", { name: "Submit application" }).click();
  await expectText(expert, "Application submitted", "expert applied");

  await admin.goto(`${base}/admin`);
  const application = admin.locator("li", { hasText: emails.expert });
  await application.getByRole("button", { name: "Approve" }).click();
  await admin.locator("li", { hasText: emails.expert }).getByText("Approved").waitFor();
  ok("admin approved the expert");
  await admin.goto(`${base}/notifications`);
  await expectText(admin, `New expert application from E2E Expert ${tag}`, "admin was notified of the new application");
  await expert.goto(`${base}/notifications`);
  await expectText(expert, "waiting in your review queue", "approved expert was told how many requests are waiting");

  // ---------- Queue filters ----------
  await expert.goto(`${base}/expert?area=mine`);
  await expert.locator("li", { hasText: `E2E ${tag}` }).waitFor();
  await expert.goto(`${base}/expert?area=SEO`);
  if (await expert.locator("li", { hasText: `E2E ${tag}` }).count()) throw new Error("SEO filter still lists a Security-only request");
  await expectText(expert, "No open requests match this filter", null);
  await expert.goto(`${base}/expert?area=Security&sort=newest`);
  await expert.locator("li", { hasText: `E2E ${tag}` }).waitFor();
  ok("expert queue filters by area (mine / one area) and sorts");

  // ---------- Expert claims and reviews ----------
  await expert.goto(`${base}/expert`);
  const request = expert.locator("li", { hasText: `E2E ${tag}` });
  await request.getByRole("button", { name: "Claim" }).click();
  await expert.waitForURL(/\/expert\/requests\//);
  ok("expert claimed the request");
  await expectText(expert, "Claims without a review are released on", "workspace shows the 7-day claim deadline");
  await expert.getByRole("button", { name: /Import \d+ failing checks/ }).click();
  await expert.locator("label", { hasText: "Fix first" }).click();
  await expert.getByLabel("Summary").fill(`E2E ${tag} review. The page loads quickly and renders cleanly on desktop and mobile, but the security headers are incomplete. Add a strict CSP first, then the remaining headers.`);
  await expert.getByRole("button", { name: "Submit review" }).click();
  await expert.waitForURL(/\/reviews\//);
  const reviewUrl = expert.url();
  await expectText(expert, "Fix first", "expert delivered the review");

  // ---------- Builder is notified and rates ----------
  await builder.goto(`${base}/notifications`);
  await expectText(builder, "is reviewing", null);
  await expectText(builder, "is ready", "builder got 'claimed' and 'ready' notifications");
  await builder.goto(reviewUrl);
  await builder.locator("label", { hasText: /^5$/ }).click();
  await builder.getByLabel("Note (optional)").fill("Clear and actionable.");
  await builder.getByRole("button", { name: "Submit rating" }).click();
  await expectText(builder, "Rated by the requester", null);
  await expectText(builder, "5/5", "builder rated the review 5/5");

  await expert.goto(`${base}/notifications`);
  await expectText(expert, "rated 5/5", "expert was notified of the rating");
  await expert.goto(`${base}/experts`);
  const card = expert.locator("li", { hasText: `E2E Expert ${tag}` });
  await card.getByText("1 review").waitFor();
  await card.getByText("5.0").waitFor();
  ok("public expert profile shows 1 review, 5.0");
  await bystander.goto(`${base}/experts`);
  await bystander.locator("li", { hasText: `E2E Expert ${tag}` }).getByRole("link", { name: "Profile and reviews" }).click();
  await bystander.waitForURL(/\/experts\/[a-z0-9]+$/);
  const profileUrl = bystander.url();
  const stat = (label) => bystander.locator("dl > div", { hasText: label }).locator("dd");
  if ((await stat("Reviews delivered").textContent())?.trim() !== "1") throw new Error("profile: delivered count");
  if (!(await stat("Average rating").textContent())?.includes("5.0")) throw new Error("profile: average rating");
  // The reviewed audit is a public URL audit, so its site name and summary are shown.
  await bystander.locator("section[aria-labelledby=history] li", { hasText: "Fix first" }).filter({ hasText: target.replace(/^https?:\/\//, "").replace(/\/.*$/, "") }).waitFor();
  await bystander.getByRole("link", { name: "Read the review" }).click();
  await bystander.waitForURL(/\/reviews\//);
  ok("expert profile page shows the record and links to the public review");

  // ---------- Moderation ----------
  await bystander.goto(reviewUrl);
  await bystander.getByRole("button", { name: "Report this review" }).click();
  await bystander.getByLabel("Reason").selectOption("ABUSIVE");
  await bystander.getByLabel("What’s wrong?").fill("E2E moderation check: reporting this review.");
  await bystander.getByRole("button", { name: "Send report" }).click();
  await expectText(bystander, "An admin will review your report", "bystander reported the review");
  await admin.goto(`${base}/admin`);
  await admin.locator("li", { hasText: "E2E moderation check" }).getByRole("button", { name: "Hide review" }).click();
  await admin.getByText("E2E moderation check").waitFor({ state: "detached" });
  ok("admin hid the review");
  await builder.goto(reviewUrl);
  await expectText(builder, "removed by a moderator", "hidden review shows as removed to non-admins");
  await builder.goto(`${base}/experts`);
  await builder.locator("li", { hasText: `E2E Expert ${tag}` }).getByText("0 reviews").waitFor();
  ok("hidden review no longer counts toward the expert's record");
  await bystander.goto(profileUrl);
  await expectText(bystander, "No delivered reviews yet.", "hidden review is gone from the expert's profile page");

  // ---------- Re-run and compare ----------
  await builder.goto(urlAudit);
  await builder.getByRole("button", { name: "Run again" }).click();
  await builder.waitForURL((u) => /\/audits\/[a-z0-9]+$/.test(u.pathname) && u.toString() !== urlAudit, { timeout: AUDIT_TIMEOUT });
  await expectText(builder, "Since your audit", "re-run shows what changed since the previous audit");

  // ---------- Weekly re-audit through the real daily cron ----------
  if (process.env.CRON_SECRET) {
    const due = await fetch(`${base}/api/e2e/watch-due`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret, email: emails.builder, regression: true }) }).then((r) => r.json());
    if (due.due !== 1) throw new Error(`watch-due: ${JSON.stringify(due)}`);
    const cron = await fetch(`${base}/api/cron/reaudit`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` }, signal: AbortSignal.timeout(AUDIT_TIMEOUT) }).then((r) => r.json());
    if (cron.due < 1 || cron.ran < 1) throw new Error(`cron: ${JSON.stringify(cron)}`);
    const unauthorized = await fetch(`${base}/api/cron/reaudit`).then((r) => r.status);
    if (unauthorized !== 401) throw new Error(`cron without the secret answered ${unauthorized}`);
    ok(`daily cron re-audited the watched site (${cron.ran} run) and refuses calls without the secret`);
    await builder.goto(`${base}/notifications`);
    if (due.flipped) await expectText(builder, "got worse", `builder was alerted that "${due.flipped}" regressed`);
    else ok("no stable check to regress on this site, so no alert expected");
    await builder.goto(`${base}/dashboard`);
    await builder.locator("section[aria-labelledby=watches] li").filter({ hasText: "last ran" }).waitFor();
    ok("dashboard shows the weekly re-audit's last run and next date");
  } else {
    console.log("  (CRON_SECRET not set: skipping the weekly re-audit steps)");
  }

  // ---------- Account deletion ----------
  for (const [who, page] of [["bystander", bystander], ["expert", expert], ["builder", builder]]) {
    await page.goto(`${base}/dashboard`);
    await page.getByRole("button", { name: "Delete my account…" }).click();
    await page.getByLabel(/Type delete to confirm/).fill("delete");
    await page.getByRole("button", { name: "Delete forever" }).click();
    await page.waitForURL(/\/\?deleted=1$/);
    await page.goto(`${base}/dashboard`);
    await page.waitForURL(/\/sign-in/);
    ok(`${who} deleted their account`);
  }
  // Admins can see every audit, so a 404 for the admin means the upload is really gone.
  const res = await admin.goto(zipAudit);
  if (res?.status() !== 404) throw new Error(`deleted builder's upload audit answered ${res?.status()} for an admin`);
  ok("deleted builder's upload audit is gone (404 even for an admin)");
  console.log(`\nAll ${step} steps passed.`);
} catch (err) {
  exitCode = 1;
  console.error(`\n✗ step ${step + 1} failed: ${err.message.split("\n")[0]}`);
  // Leave evidence of what each user was looking at, for debugging the failure.
  const dir = process.env.E2E_ARTIFACTS ?? "e2e-artifacts";
  await import("node:fs").then((fs) => fs.mkdirSync(dir, { recursive: true }));
  for (const [i, p] of browser.contexts().flatMap((c) => c.pages()).entries()) {
    await p.screenshot({ path: `${dir}/page-${i}.png`, fullPage: true }).catch(() => {});
    const text = await p.evaluate(() => document.body.innerText).catch(() => "");
    await import("node:fs").then((fs) => fs.writeFileSync(`${dir}/page-${i}.txt`, `${p.url()}\n\n${text}`));
  }
  console.error(`  page screenshots and text saved to ${dir}/`);
} finally {
  // Whether or not the run passed, remove its users (and their uploads, requests, reviews).
  await fetch(`${base}/api/e2e/cleanup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret, tag }) }).catch(() => {});
  await browser.close();
  process.exit(exitCode);
}
