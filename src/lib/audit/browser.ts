import type { Browser, BrowserContext, Page, Route } from "playwright-core";
import { validateTargetDestination } from "@/lib/security/ssrf";
import { isNecessaryCookie, siteOf, trackerFor } from "./privacy";
import type { CheckResult } from "./types";

/** Uploaded sites are served to Chromium from memory under this never-resolvable origin. */
export const UPLOAD_ORIGIN = "https://upload.vibecheck.invalid";

export interface ArchiveSite {
  /** Path (relative to the site root, no leading slash) → file */
  files: Map<string, { data: Uint8Array; contentType: string }>;
  entry: string;
}

export interface BrowserRun {
  ran: boolean;
  reason?: string;
  checks: CheckResult[];
  renderedHtml?: string;
  screenshots: { kind: "desktop" | "mobile"; width: number; height: number; data: Buffer }[];
  requests?: number;
  transferBytes?: number;
  /** Desktop, unthrottled LCP in ms, shown next to the throttled mobile figure for comparison. */
  desktopLcp?: number;
}

const DESKTOP = { width: 1280, height: 800 };
/** Upper bounds that keep a full URL audit well inside the 300 s function limit, whatever a site does. */
const BROWSER_BUDGET_MS = 100_000;
const MOBILE_PERF_BUDGET_MS = 85_000;
const MOBILE = { width: 390, height: 844 };

async function launch(): Promise<Browser> {
  const { chromium } = await import("playwright-core");
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const mod = await import("@sparticuz/chromium-min");
    const sparticuz = mod.default;
    const pack =
      process.env.CHROMIUM_PACK_URL ??
      `https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.${process.arch === "arm64" ? "arm64" : "x64"}.tar`;
    return chromium.launch({ executablePath: await sparticuz.executablePath(pack), args: sparticuz.args, headless: true });
  }
  let executablePath: string | undefined = process.env.CHROMIUM_PATH;
  if (!executablePath) {
    try {
      executablePath = chromium.executablePath();
    } catch {
      executablePath = undefined;
    }
  }
  return chromium.launch({ executablePath, headless: true, args: ["--disable-dev-shm-usage"] });
}

/** Routes every request: uploaded files from memory, public hosts after SSRF validation, everything else blocked. */
function makeRouter(site?: ArchiveSite) {
  const verdicts = new Map<string, Promise<boolean>>();
  return async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.protocol === "data:" || url.protocol === "blob:") return route.continue();
    if (site && url.origin === UPLOAD_ORIGIN) {
      let path = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (path === "" || path.endsWith("/")) path += "index.html";
      const file = site.files.get(path) ?? site.files.get(path + ".html") ?? site.files.get(path + "/index.html");
      if (!file) return route.fulfill({ status: 404, contentType: "text/plain", body: "Not found in upload" });
      return route.fulfill({ status: 200, contentType: file.contentType, body: Buffer.from(file.data) });
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return route.abort("blockedbyclient");
    let verdict = verdicts.get(url.host);
    if (!verdict) {
      verdict = validateTargetDestination(url.toString()).then((r) => r.allowed);
      verdicts.set(url.host, verdict);
    }
    return (await verdict) ? route.continue() : route.abort("blockedbyclient");
  };
}

async function newContext(browser: Browser, viewport: { width: number; height: number }, mobile: boolean, site?: ArchiveSite, device?: { userAgent: string; deviceScaleFactor: number }) {
  const ctx = await browser.newContext({
    viewport,
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: device?.deviceScaleFactor ?? 1,
    serviceWorkers: "block",
    userAgent:
      device?.userAgent ??
      (mobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 VibeCheckAudit/2.0"
        : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 VibeCheckAudit/2.0"),
  });
  // Some bundlers wrap functions in a __name() helper; define it so serialized page.evaluate code runs.
  await ctx.addInitScript("globalThis.__name = globalThis.__name || ((f) => f);");
  await ctx.route("**/*", makeRouter(site));
  return ctx;
}

/**
 * Screenshots are evidence, not results: with animations frozen and a short timeout, and if a page still can't
 * be captured (heavy WebGL on a GPU-less server can stall it), the checks stand without the picture.
 */
async function capture(page: Page): Promise<Buffer | null> {
  return page.screenshot({ type: "jpeg", quality: 72, animations: "disabled", caret: "hide", timeout: 12_000 }).catch(() => null);
}

/** Thrown when the site answers the headless browser with an error page (usually bot protection). */
class BlockedRenderError extends Error {}

async function settle(page: Page, url: string, fetchedStatus?: number) {
  // Wait for the document, not for "load": pages with endless trackers or ads may never fire it.
  const go = (timeout: number) => page.goto(url, { waitUntil: "domcontentloaded", timeout });
  // One retry for dropped or stalled connections, not for real errors. A fresh attempt opens a new connection,
  // which often lands on a healthy edge server when a host has several addresses.
  const res = await go(20_000).catch(async (err: Error) => {
    if (!/ERR_CONNECTION_(RESET|CLOSED|ABORTED)|ERR_NETWORK_CHANGED|ERR_TIMED_OUT|page\.goto: Timeout/.test(err.message)) throw err;
    await page.waitForTimeout(800);
    return go(15_000);
  });
  // A 4xx/5xx document is not the page the user asked about; judging it would produce confident results
  // about the wrong document.
  if (res && res.status() >= 400) {
    throw new BlockedRenderError(
      fetchedStatus !== undefined && fetchedStatus >= 400
        ? `The page itself returned HTTP ${res.status()}, so there was no page to render.`
        : `The site answered the headless browser with HTTP ${res.status()} while a direct request got the page, which usually means bot protection (e.g. a Cloudflare challenge). Rendered checks were not run; HTML checks use the page fetched directly.`
    );
  }
  await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 3_000 }).catch(() => {});
}

const VITALS_INIT = `
  window.__vc = { lcp: 0, cls: 0 };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vc.lcp = e.startTime; })
      .observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vc.cls += e.value; })
      .observe({ type: "layout-shift", buffered: true });
  } catch {}
`;

/** Runs in the page. Resolves every CSS color (oklch, color-mix…) through a canvas to sRGB. */
function contrastAudit() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const rgba = (c: string): [number, number, number, number] => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top: number[], bottom: number[]) => [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3])).concat(1);
  const lum = (c: number[]) => {
    const [r, g, b] = c.slice(0, 3).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const describe = (el: Element) => {
    const cls = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (cls.length ? "." + cls.join(".") : "");
  };

  const failures: { selector: string; ratio: number; required: number; text: string; fg: string; bg: string }[] = [];
  let checked = 0;
  let indeterminate = 0;
  const all = Array.from(document.body?.querySelectorAll("*") ?? []);
  for (const el of all) {
    if (checked >= 800) break;
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent || "").trim().length > 1);
    if (!hasText) continue;
    const st = getComputedStyle(el);
    if (st.visibility !== "visible" || st.display === "none" || Number(st.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    if (el.closest("[aria-hidden='true'], script, style, noscript, svg")) continue;

    // Composite backgrounds from the element upward until opaque. Background images make the result unknowable.
    const layers: number[][] = [];
    let unknown = false;
    for (let cur: Element | null = el; cur; cur = cur.parentElement) {
      const cs = getComputedStyle(cur);
      if (cs.backgroundImage && cs.backgroundImage !== "none") {
        unknown = true;
        break;
      }
      const bg = rgba(cs.backgroundColor);
      if (bg[3] > 0) layers.push(bg);
      if (bg[3] >= 1) break;
    }
    if (unknown) {
      indeterminate++;
      continue;
    }
    let bg: number[] = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    const fg = over(rgba(st.color), bg);

    const l1 = lum(fg);
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(st.fontSize);
    const bold = Number(st.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const required = large ? 3 : 4.5;
    checked++;
    if (ratio + 0.005 < required) {
      failures.push({
        selector: describe(el),
        ratio: Math.round(ratio * 100) / 100,
        required,
        text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40),
        fg: `rgb(${fg.slice(0, 3).map(Math.round).join(",")})`,
        bg: `rgb(${bg.slice(0, 3).map(Math.round).join(",")})`,
      });
    }
  }
  return { checked, indeterminate, failures };
}

function mobileAudit() {
  // Mobile Chrome zooms out to fit wide layouts, so innerWidth grows with the bug; the device width doesn't.
  const vw = window.screen.width;
  const sw = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
  const describe = (el: Element) => {
    const cls = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (cls.length ? "." + cls.join(".") : "");
  };
  const overflowing: string[] = [];
  if (sw > vw + 1) {
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed") {
        const parentOverflows = el.parentElement && el.parentElement.getBoundingClientRect().right > vw + 1;
        if (!parentOverflows || overflowing.length === 0) overflowing.push(`${describe(el)} (right edge ${Math.round(r.right)}px)`);
        if (overflowing.length >= 6) break;
      }
    }
  }
  const small: string[] = [];
  const targets = document.querySelectorAll("a[href], button, input:not([type='hidden']), select, textarea, [role='button'], [role='link'], summary");
  for (const el of Array.from(targets)) {
    const st = getComputedStyle(el);
    if (st.visibility !== "visible" || st.display === "none") continue;
    if (el.tagName === "A" && st.display === "inline") continue; // WCAG 2.5.8 inline exception
    const r = el.getBoundingClientRect();
    // ≤1px boxes are the visually-hidden pattern (e.g. skip links that appear on focus), not tap targets.
    if (r.width <= 1 || r.height <= 1) continue;
    if (r.width < 24 || r.height < 24) small.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}px`);
  }
  return { vw, sw, overflowing, small };
}

type BrowserTarget = { url: string; fetchedStatus?: number } | { site: ArchiveSite };
interface Progress {
  phase: string;
  browser: Browser | null;
  set: (phase: string) => void;
}

function progressFor(label: string): Progress {
  const t0 = Date.now();
  const p: Progress = {
    phase: "starting Chromium",
    browser: null,
    set(phase) {
      // One line per phase in the server logs, so a slow site shows exactly where the time went.
      console.log(`[browser] ${label} +${Date.now() - t0}ms: finished ${p.phase}, now ${phase}`);
      p.phase = phase;
    },
  };
  return p;
}

/**
 * Stops waiting at the budget even if Chromium itself is stuck (closing a browser whose page is wedged can hang
 * too), so the rest of the audit always completes. The browser is closed in the background.
 */
async function withBrowserBudget<T>(budgetMs: number, progress: Progress, work: Promise<T>, onTimeout: (phase: string) => T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[browser] over the ${budgetMs}ms budget while ${progress.phase}; abandoning`);
      progress.browser?.close().catch(() => {});
      resolve(onTimeout(progress.phase));
    }, budgetMs);
  });
  try {
    return await Promise.race([work, limit]);
  } finally {
    clearTimeout(timer);
  }
}

export async function runBrowserAudit(target: BrowserTarget): Promise<BrowserRun> {
  const progress = progressFor("url" in target ? new URL(target.url).host : "upload");
  return withBrowserBudget(BROWSER_BUDGET_MS, progress, browserAudit(target, progress), (phase) => ({
    ran: false,
    reason: `The browser checks didn't finish within ${BROWSER_BUDGET_MS / 1000} seconds (stuck while ${phase}), so they were stopped. Pages that keep a browser busy this long are usually very script-heavy.`,
    checks: [],
    screenshots: [],
  }));
}

async function browserAudit(target: BrowserTarget, progress: Progress): Promise<BrowserRun> {
  let browser: Browser | null = null;
  const site = "site" in target ? target.site : undefined;
  const url = "url" in target ? target.url : `${UPLOAD_ORIGIN}/${target.site.entry}`;
  const isUpload = Boolean(site);
  try {
    browser = await launch();
    progress.browser = browser;
  } catch (err) {
    return { ran: false, reason: `Headless Chromium is unavailable on this server (${(err as Error).message.split("\n")[0]}).`, checks: [], screenshots: [] };
  }

  const checks: CheckResult[] = [];
  const screenshots: BrowserRun["screenshots"] = [];
  let desktop: BrowserContext | null = null;
  let mobile: BrowserContext | null = null;
  progress.set("loading the desktop page");
  try {
    // ---------- Desktop pass ----------
    desktop = await newContext(browser, DESKTOP, false, site);
    await desktop.addInitScript(VITALS_INIT);
    const page = await desktop.newPage();
    const origin = new URL(url).origin;
    const consoleErrors: string[] = [];
    const failed: { url: string; reason: string; sameOrigin: boolean }[] = [];
    let transferBytes = 0;
    let requests = 0;

    const requestHosts = new Map<string, number>();
    page.on("request", (req) => {
      try {
        const h = new URL(req.url()).hostname;
        requestHosts.set(h, (requestHosts.get(h) ?? 0) + 1);
      } catch {}
    });
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 200)));
    page.on("pageerror", (e) => consoleErrors.push(`Uncaught ${e.name}: ${e.message}`.slice(0, 200)));
    page.on("requestfinished", async (req) => {
      requests++;
      try {
        const s = await req.sizes();
        transferBytes += s.responseBodySize + s.responseHeadersSize;
      } catch {}
      const res = await req.response().catch(() => null);
      if (res && res.status() >= 400) failed.push({ url: req.url(), reason: `HTTP ${res.status()}`, sameOrigin: req.url().startsWith(origin) });
    });
    page.on("requestfailed", (req) => {
      requests++;
      const reason = req.failure()?.errorText ?? "failed";
      if (reason.includes("BLOCKED_BY_CLIENT")) return; // our own SSRF filter
      // ERR_ABORTED means the browser cancelled the request itself (prefetches dropped at navigation or
      // teardown, superseded fetches); nothing failed to load. Counting it flagged almost every Next.js site.
      if (reason.includes("ERR_ABORTED")) return;
      failed.push({ url: req.url(), reason, sameOrigin: req.url().startsWith(origin) });
    });

    await settle(page, url, "url" in target ? target.fetchedStatus : undefined);
    await page.waitForTimeout(800);
    const renderedHtml = await page.content();
    const vitals = (await page.evaluate("window.__vc")) as { lcp: number; cls: number } | undefined;
    progress.set("measuring text contrast");
    const contrast = await page.evaluate(contrastAudit);
    const cookies = await desktop.cookies().catch(() => []);
    progress.set("running axe-core");
    const axe = await runAxe(page);
    progress.set("taking the desktop screenshot");
    const shot = await capture(page);
    if (shot) screenshots.push({ kind: "desktop", ...DESKTOP, data: shot });

    // ---------- Mobile pass ----------
    mobile = await newContext(browser, MOBILE, true, site);
    const mpage = await mobile.newPage();
    progress.set("loading the phone page");
    await settle(mpage, url, "url" in target ? target.fetchedStatus : undefined);
    await mpage.waitForTimeout(500);
    progress.set("checking the phone layout");
    const m = await mpage.evaluate(mobileAudit);
    progress.set("taking the phone screenshot");
    const mshot = await capture(mpage);
    if (mshot) screenshots.push({ kind: "mobile", ...MOBILE, data: mshot });

    // ---------- Checks ----------
    checks.push({
      id: "a11y-contrast",
      category: "accessibility",
      severity: "medium",
      method: "browser",
      title: "Text color contrast (WCAG 1.4.3)",
      status: contrast.failures.length === 0 ? "pass" : contrast.failures.length <= 3 ? "warn" : "fail",
      detail:
        `${contrast.checked} rendered text elements measured against their composited background; ${contrast.failures.length} below the AA minimum (4.5:1, or 3:1 for large text).` +
        (contrast.indeterminate ? ` ${contrast.indeterminate} sat on background images and were not measured.` : ""),
      evidence: contrast.failures.slice(0, 8).map((f) => `${f.selector} "${f.text}" ${f.ratio}:1 (needs ${f.required}:1) ${f.fg} on ${f.bg}`),
      fix: "Darken the text or lighten the background until the ratio clears the threshold.",
    });
    checks.push({
      id: "resp-overflow",
      category: "accessibility",
      severity: "medium",
      method: "browser",
      title: "No sideways scrolling on a 390px phone",
      status: m.sw > m.vw + 1 ? "fail" : "pass",
      detail: m.sw > m.vw + 1 ? `The page is ${m.sw}px wide in a ${m.vw}px viewport, so content scrolls sideways (WCAG 1.4.10).` : `Content fits within the ${m.vw}px viewport.`,
      evidence: m.overflowing.length ? m.overflowing : undefined,
      fix: "Look for fixed widths, long unbroken strings, and wide tables or images; use max-width: 100% and min-width: 0 in flex/grid children.",
    });
    checks.push({
      id: "resp-tap-targets",
      category: "accessibility",
      severity: "low",
      method: "browser",
      title: "Touch targets at least 24×24px (WCAG 2.5.8)",
      status: m.small.length === 0 ? "pass" : m.small.length <= 5 ? "warn" : "fail",
      detail: m.small.length ? `${m.small.length} interactive element(s) on the 390px layout are smaller than 24×24 CSS pixels.` : "Every interactive element on the mobile layout is at least 24×24px.",
      evidence: m.small.length ? m.small.slice(0, 8) : undefined,
      fix: "Add padding to small icon buttons and links; 44×44px is the comfortable target.",
    });

    const thirdPartyOnly = failed.length > 0 && failed.every((f) => !f.sameOrigin);
    checks.push({
      id: "rel-console-errors",
      category: "reliability",
      severity: "medium",
      method: "browser",
      title: "No JavaScript errors on load",
      status: consoleErrors.length === 0 ? "pass" : consoleErrors.length <= 2 ? "warn" : "fail",
      detail: consoleErrors.length ? `${consoleErrors.length} error(s) were logged to the console while the page loaded.` : "The console stayed clean during load.",
      evidence: consoleErrors.length ? [...new Set(consoleErrors)].slice(0, 6) : undefined,
    });
    checks.push({
      id: "rel-failed-requests",
      category: "reliability",
      severity: "medium",
      method: "browser",
      title: "All requested resources load",
      status: failed.length === 0 ? "pass" : thirdPartyOnly ? "warn" : "fail",
      detail: failed.length
        ? `${failed.length} of ${requests} request(s) failed${thirdPartyOnly ? ", all to third-party hosts" : ""}.`
        : `All ${requests} request(s) succeeded.`,
      evidence: failed.length ? failed.slice(0, 8).map((f) => `${f.reason} ${f.url.replace(UPLOAD_ORIGIN, "")}`) : undefined,
    });

    const mb = transferBytes / 1024 / 1024;
    checks.push({
      id: "perf-weight",
      category: "performance",
      severity: "medium",
      method: "browser",
      title: "Page weight",
      status: mb < 2 ? "pass" : mb < 4 ? "warn" : "fail",
      detail: `${mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.max(1, Math.round(transferBytes / 1024))} KB`} transferred across ${requests} requests to render the first screen and settle.`,
      fix: "Serve images as AVIF/WebP at display size, lazy-load below-the-fold media, and split large JS bundles.",
    });
    if (vitals) {
      const cls = Math.round(vitals.cls * 1000) / 1000;
      checks.push({
        id: "perf-cls",
        category: "performance",
        severity: "medium",
        method: "browser",
        title: "Cumulative Layout Shift during load",
        status: cls < 0.1 ? "pass" : cls < 0.25 ? "warn" : "fail",
        detail: `CLS ${cls} measured over load plus ~1s settle (good is below 0.1).`,
        fix: "Reserve space for images, embeds and late-loading fonts with explicit width/height or aspect-ratio.",
      });
    }
    checks.push(axeCheck(axe));
    checks.push(privacyCheck(new URL(url).hostname, requestHosts, cookies, isUpload));
    return { ran: true, checks, renderedHtml, screenshots, requests, transferBytes, desktopLcp: vitals?.lcp ? Math.round(vitals.lcp) : undefined };
  } catch (err) {
    if (err instanceof BlockedRenderError) return { ran: false, reason: err.message, checks: [], screenshots: [] };
    const msg = (err as Error).message.split("\n")[0];
    if (/page\.goto: Timeout/.test(msg)) {
      return {
        ran: false,
        reason: "The page answered our HTTP request but never finished loading in a headless browser, twice (20 and 15 seconds). Some sites stall automated browsers on purpose (bot protection), so the in-browser checks were not run.",
        checks: [],
        screenshots,
      };
    }
    return { ran: false, reason: `Browser pass failed: ${msg}`, checks: [], screenshots };
  } finally {
    progress.set("closing the browser");
    await desktop?.close().catch(() => {});
    await mobile?.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
/** Rules that dedicated checks above already score, so a single problem isn't counted twice. */
const AXE_COVERED = ["color-contrast", "image-alt", "label", "button-name", "link-name", "html-has-lang", "meta-viewport", "target-size", "duplicate-id", "duplicate-id-aria", "duplicate-id-active"];

interface AxeSummary {
  violations: { id: string; impact: string | null; help: string; nodes: number; targets: string[] }[];
  passes: number;
  incomplete: number;
  version: string;
}

/** Runs axe-core's WCAG 2.2 A/AA rules in the rendered page. Playwright's evaluate is not subject to the page's CSP. */
async function runAxe(page: Page): Promise<AxeSummary | string> {
  try {
    const { default: axe } = await import("axe-core");
    await page.evaluate(axe.source);
    const run = page.evaluate(
      async ({ tags, covered }) => {
        const w = window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<{ violations: { id: string; impact: string | null; help: string; nodes: { target: unknown[] }[] }[]; passes: unknown[]; incomplete: unknown[]; testEngine: { version: string } }> } };
        const r = await w.axe.run(document, { runOnly: { type: "tag", values: tags }, rules: Object.fromEntries(covered.map((id) => [id, { enabled: false }])), resultTypes: ["violations"] });
        return {
          violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 2).map((n) => String(n.target.join(" "))) })),
          passes: r.passes.length,
          incomplete: r.incomplete.length,
          version: r.testEngine.version,
        };
      },
      { tags: AXE_TAGS, covered: AXE_COVERED }
    );
    return await Promise.race([run, new Promise<string>((resolve) => setTimeout(() => resolve("axe-core did not finish within 20 seconds."), 20_000))]);
  } catch (err) {
    return `axe-core could not run in this page (${(err as Error).message.split("\n")[0]}).`;
  }
}

const IMPACT_RANK: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

export function axeCheck(axe: AxeSummary | string): CheckResult {
  const base = { id: "a11y-axe", category: "accessibility", severity: "high", method: "browser", title: "WCAG 2.2 A/AA automated scan (axe-core)" } as const;
  if (typeof axe === "string") return { ...base, status: "skip", detail: axe };
  const v = [...axe.violations].sort((a, b) => (IMPACT_RANK[a.impact ?? "minor"] ?? 4) - (IMPACT_RANK[b.impact ?? "minor"] ?? 4));
  const severe = v.filter((x) => x.impact === "critical" || x.impact === "serious");
  const elements = v.reduce((n, x) => n + x.nodes, 0);
  return {
    ...base,
    status: severe.length ? "fail" : v.length ? "warn" : "pass",
    detail: v.length
      ? `axe-core ${axe.version} found ${v.length} WCAG rule(s) violated across ${elements} element(s) (${severe.length} serious or critical), with ${axe.passes} rules passing. Rules scored by other checks here (contrast, alt text, labels, names, tap targets) are excluded.`
      : `axe-core ${axe.version} ran the WCAG 2.0–2.2 A/AA rules on the rendered desktop page: ${axe.passes} passed, none violated.${axe.incomplete ? ` ${axe.incomplete} need a human to judge.` : ""}`,
    evidence: v.length ? v.slice(0, 10).map((x) => `${x.impact ?? "minor"} · ${x.id}: ${x.help} (${x.nodes}×, e.g. ${x.targets[0] ?? "?"})`) : undefined,
    fix: v.length ? `Each rule id is explained at dequeuniversity.com/rules/axe/${axe.version.split(".").slice(0, 2).join(".")}/<rule-id>. Automated rules catch roughly a third of WCAG issues; keyboard and screen-reader testing by a person covers the rest.` : undefined,
  };
}

export function privacyCheck(pageHost: string, requestHosts: Map<string, number>, cookies: { name: string; domain: string; expires: number }[], isUpload: boolean): CheckResult {
  const first = siteOf(pageHost);
  const trackers = new Map<string, { hosts: Set<string>; requests: number }>();
  for (const [host, n] of requestHosts) {
    if (siteOf(host) === first) continue;
    const name = trackerFor(host);
    if (!name) continue;
    const t = trackers.get(name) ?? { hosts: new Set(), requests: 0 };
    t.hosts.add(host);
    t.requests += n;
    trackers.set(name, t);
  }
  const thirdPartyCookies = cookies.filter((c) => (isUpload || siteOf(c.domain) !== first) && !isNecessaryCookie(c.name));
  const days = (c: { expires: number }) => (c.expires > 0 ? Math.round((c.expires * 1000 - Date.now()) / 86_400_000) : 0);
  const found = trackers.size > 0 || thirdPartyCookies.length > 0;
  return {
    id: "priv-trackers",
    category: "privacy",
    severity: "medium",
    method: "browser",
    title: "No tracking before consent",
    status: found ? "warn" : "pass",
    detail: found
      ? `Before any click or consent, the page contacted ${trackers.size} tracking service(s) and ${thirdPartyCookies.length} third-party cookie(s) were set. In the EU and UK (GDPR and ePrivacy), non-essential tracking needs consent first.`
      : `No known advertising, cross-site analytics or session-replay services were contacted and no third-party cookies were set on load (${requestHosts.size} hosts contacted).`,
    evidence: found
      ? [
          ...[...trackers].map(([name, t]) => `${name}: ${t.requests} request(s) to ${[...t.hosts].slice(0, 3).join(", ")}`),
          ...thirdPartyCookies.slice(0, 6).map((c) => `cookie ${c.name} on ${c.domain.replace(/^\./, "")}${days(c) > 0 ? `, kept ${days(c)} days` : ", session"}`),
        ]
      : undefined,
    fix: found ? "Load these tags only after the visitor accepts (most consent tools and Google Consent Mode can gate them), or switch to a cookieless analytics service." : undefined,
  };
}

/**
 * Lighthouse's mobile profile, applied in the browser the way Lighthouse's "devtools" throttling does it:
 * Slow 4G (150 ms RTT and 1.6 Mbps down, with DevTools' packet-level adjustments) and the CPU slowed 4×.
 */
export const MOBILE_THROTTLING = { latencyMs: 562.5, downloadKbps: 1474.56, uploadKbps: 675, cpuSlowdown: 4 };
/** Lighthouse's emulated phone (a Moto G Power), so sites serve the same mobile variant Lighthouse sees. */
const LIGHTHOUSE_PHONE = {
  viewport: { width: 412, height: 823 },
  userAgent: "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 VibeCheckAudit/2.0",
  deviceScaleFactor: 1.75,
};
const THROTTLED_TIMEOUT_MS = 45_000;

const MOBILE_PERF_INIT = `
  window.__vcm = { lcp: 0, fcp: 0, long: [], res: [] };
  try {
    performance.setResourceTimingBufferSize(2000);
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vcm.res.push([e.startTime, e.responseEnd || e.startTime]); }).observe({ type: "resource", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vcm.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__vcm.fcp = e.startTime; }).observe({ type: "paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vcm.long.push([e.startTime, e.duration]); }).observe({ type: "longtask", buffered: true });
  } catch {}
`;

export type ThrottledRun = { lcp: number; fcp: number; tbt: number; loadMs: number } | { timedOut: true } | { error: string };

/**
 * Lighthouse-style mobile performance for a live URL, in its own browser so it can run alongside the crawl
 * (which only waits on the network) instead of after it.
 */
export async function runMobilePerf(url: string, desktopLcp?: number): Promise<CheckResult[]> {
  const progress = progressFor(`${new URL(url).host} (throttled phone)`);
  const work = (async () => {
    let browser: Browser;
    try {
      browser = await launch();
      progress.browser = browser;
    } catch (err) {
      return mobilePerfChecks({ error: `Headless Chromium is unavailable (${(err as Error).message.split("\n")[0]})` });
    }
    try {
      progress.set("loading under throttling");
      return mobilePerfChecks(await throttledMobileRun(browser, url), desktopLcp);
    } finally {
      await browser.close().catch(() => {});
    }
  })();
  return withBrowserBudget(MOBILE_PERF_BUDGET_MS, progress, work, (phase) => mobilePerfChecks({ error: `it didn't finish within ${MOBILE_PERF_BUDGET_MS / 1000} seconds (stuck while ${phase})` }));
}

/** A cold-cache phone load under MOBILE_THROTTLING, in a fresh context so nothing is cached from earlier passes. */
async function throttledMobileRun(browser: Browser, url: string, site?: ArchiveSite): Promise<ThrottledRun> {
  const ctx = await newContext(browser, LIGHTHOUSE_PHONE.viewport, true, site, LIGHTHOUSE_PHONE);
  try {
    await ctx.addInitScript(MOBILE_PERF_INIT);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: MOBILE_THROTTLING.latencyMs,
      downloadThroughput: (MOBILE_THROTTLING.downloadKbps * 1024) / 8,
      uploadThroughput: (MOBILE_THROTTLING.uploadKbps * 1024) / 8,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: MOBILE_THROTTLING.cpuSlowdown });
    const started = Date.now();
    try {
      await page.goto(url, { waitUntil: "load", timeout: THROTTLED_TIMEOUT_MS });
    } catch (err) {
      if (/Timeout/.test((err as Error).message)) {
        // The document may still have painted; judge what rendered by the deadline.
        const partial = (await page.evaluate("window.__vcm").catch(() => null)) as { lcp: number } | null;
        if (!partial?.lcp) return { timedOut: true };
      } else throw err;
    }
    const loadMs = Date.now() - started;
    // Keep watching until the page reaches Time to Interactive (a 5 s window with no long tasks and at most two
    // requests in flight), for up to 20 s after load. Pages that never settle are judged on what was observed.
    const quietBy = Date.now() + 20_000;
    type Observed = { lcp: number; fcp: number; long: [number, number][]; res: [number, number][]; now: number };
    const observe = () => page.evaluate("Object.assign({}, window.__vcm, { now: performance.now() })") as Promise<Observed>;
    let m = await observe();
    while (Date.now() < quietBy && timeToInteractive(m.fcp, m.long, m.res, m.now) === null) {
      await page.waitForTimeout(1_000);
      m = await observe();
    }
    const tti = timeToInteractive(m.fcp, m.long, m.res, m.now) ?? m.now;
    return { lcp: Math.round(m.lcp), fcp: Math.round(m.fcp), tbt: totalBlockingTime(m.fcp, tti, m.long), loadMs };
  } catch (err) {
    return { error: (err as Error).message.split("\n")[0] };
  } finally {
    await ctx.close().catch(() => {});
  }
}

/**
 * Time to Interactive as Lighthouse defines it: find the first 5 s window after First Contentful Paint with no
 * long tasks and never more than two network requests in flight; TTI is the end of the last long task before
 * that window, or FCP. Returns null when no such window has been observed yet.
 */
export function timeToInteractive(fcp: number, longTasks: [start: number, duration: number][], resources: [start: number, end: number][], observedUntil: number): number | null {
  const tasks = longTasks.map(([start, d]) => [start, start + d] as const).filter(([, end]) => end > fcp);
  // A quiet window can open at FCP, when a long task ends, or when the network drops back to two requests.
  const candidates = [fcp, ...tasks.map(([, end]) => end), ...resources.map(([, end]) => end).filter((t) => t > fcp)].sort((a, b) => a - b);
  const inFlightAt = (t: number) => resources.reduce((n, [start, end]) => n + (start <= t && t < end ? 1 : 0), 0);
  for (const c of candidates) {
    const windowEnd = c + 5_000;
    if (windowEnd > observedUntil) return null;
    if (tasks.some(([start, end]) => start < windowEnd && end > c)) continue;
    // In-flight count only rises at request starts, so checking the window start and every start inside it suffices.
    const points = [c, ...resources.map(([start]) => start).filter((t) => t > c && t < windowEnd)];
    // TTI is the end of the last long task before the quiet window (or FCP if there was none).
    if (points.every((t) => inFlightAt(t) <= 2)) return tasks.reduce((tti, [, end]) => (end <= c ? Math.max(tti, end) : tti), fcp);
  }
  return null;
}

/** Total Blocking Time: for each long task between FCP and TTI, the part beyond 50 ms. */
export function totalBlockingTime(fcp: number, tti: number, longTasks: [start: number, duration: number][]): number {
  let blocking = 0;
  for (const [start, d] of longTasks) {
    const from = Math.max(start, fcp);
    const to = Math.min(start + d, tti);
    // Lighthouse (tbt-utils) clips each task to the FCP–TTI range and counts what exceeds 50 ms of the clipped part.
    blocking += Math.max(0, to - from - 50);
  }
  return Math.round(blocking);
}

const sec = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

export function mobilePerfChecks(run: ThrottledRun, desktopLcp?: number): CheckResult[] {
  const profile = "Lighthouse's mobile profile (a Moto G Power on Slow 4G: 1.6 Mbps, 150 ms RTT, CPU slowed 4×)";
  const base = { category: "performance", method: "browser" } as const;
  if ("error" in run || "timedOut" in run) {
    const timedOut = "timedOut" in run;
    const detail = timedOut
      ? `Nothing large had painted after ${THROTTLED_TIMEOUT_MS / 1000}s on ${profile}, though the page loaded on the unthrottled passes.`
      : `The throttled phone run failed (${run.error}), so these weren't measured.`;
    const status = timedOut ? "fail" : "skip";
    return [
      { ...base, id: "perf-lcp", severity: "high", title: "Largest Contentful Paint (mobile)", status, detail, fix: timedOut ? "Cut what loads before first render: render-blocking scripts and CSS, web fonts, and large hero images." : undefined },
      { ...base, id: "perf-fcp", severity: "medium", title: "First Contentful Paint (mobile)", status: "skip", detail: timedOut ? "Not measured: the page didn't finish rendering under throttling." : detail },
      { ...base, id: "perf-tbt", severity: "medium", title: "Total Blocking Time (mobile)", status: "skip", detail: timedOut ? "Not measured: the page didn't finish rendering under throttling." : detail },
    ];
  }
  // Thresholds are Lighthouse's mobile "good" (score ≥ 90) and "poor" (score < 50) boundaries.
  // Graded on the value as displayed (10 ms steps), so "1.80s" is never judged worse than "good is 1.8s or less".
  const grade = (v: number, good: number, poor: number) => {
    const shown = Math.round(v / 10) * 10;
    return (shown <= good ? "pass" : shown <= poor ? "warn" : "fail") as CheckResult["status"];
  };
  return [
    {
      ...base,
      id: "perf-lcp",
      severity: "high",
      title: "Largest Contentful Paint (mobile)",
      status: run.lcp === 0 ? "skip" : grade(run.lcp, 2500, 4000),
      detail: run.lcp === 0 ? "The browser reported no Largest Contentful Paint for this page." : `The main content appeared after ${sec(run.lcp)} on ${profile}. Good is 2.5s or less; over 4s is poor.`,
      evidence: [`Throttled load event: ${sec(run.loadMs)}`, ...(desktopLcp ? [`Desktop, unthrottled LCP for comparison: ${sec(desktopLcp)}`] : [])],
      fix: run.lcp > 2500 ? "Serve the hero image at phone size in AVIF/WebP with fetchpriority=\"high\", inline critical CSS, and defer non-essential scripts." : undefined,
    },
    {
      ...base,
      id: "perf-fcp",
      severity: "medium",
      title: "First Contentful Paint (mobile)",
      status: run.fcp === 0 ? "skip" : grade(run.fcp, 1800, 3000),
      detail: run.fcp === 0 ? "The browser reported no first paint." : `Something first appeared after ${sec(run.fcp)} on the same throttled phone. Good is 1.8s or less; over 3s is poor.`,
      fix: run.fcp > 1800 ? "Reduce render-blocking CSS and scripts in <head>, and use font-display: swap." : undefined,
    },
    {
      ...base,
      id: "perf-tbt",
      severity: "medium",
      title: "Total Blocking Time (mobile)",
      status: grade(run.tbt, 200, 600),
      detail: `Between first paint and the page becoming interactive (Time to Interactive), the main thread was blocked for ${run.tbt} ms (time beyond 50 ms in each long task), so taps and scrolls went unanswered. Good is 200 ms or less; over 600 ms is poor.`,
      fix: run.tbt > 200 ? "Split large JavaScript bundles, defer third-party scripts, and move heavy work off the main thread." : undefined,
    },
  ];
}
