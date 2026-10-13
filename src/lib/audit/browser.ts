import type { Browser, BrowserContext, Page, Route } from "playwright-core";
import { validateTargetDestination } from "@/lib/security/ssrf";
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
}

const DESKTOP = { width: 1280, height: 800 };
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

async function newContext(browser: Browser, viewport: { width: number; height: number }, mobile: boolean, site?: ArchiveSite) {
  const ctx = await browser.newContext({
    viewport,
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    userAgent: mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 VibeCheckAudit/2.0"
      : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 VibeCheckAudit/2.0",
  });
  // Some bundlers wrap functions in a __name() helper; define it so serialized page.evaluate code runs.
  await ctx.addInitScript("globalThis.__name = globalThis.__name || ((f) => f);");
  await ctx.route("**/*", makeRouter(site));
  return ctx;
}

async function settle(page: Page, url: string) {
  await page.goto(url, { waitUntil: "load", timeout: 20_000 });
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

export async function runBrowserAudit(target: { url: string } | { site: ArchiveSite }): Promise<BrowserRun> {
  let browser: Browser | null = null;
  const site = "site" in target ? target.site : undefined;
  const url = "url" in target ? target.url : `${UPLOAD_ORIGIN}/${target.site.entry}`;
  const isUpload = Boolean(site);
  try {
    browser = await launch();
  } catch (err) {
    return { ran: false, reason: `Headless Chromium is unavailable on this server (${(err as Error).message.split("\n")[0]}).`, checks: [], screenshots: [] };
  }

  const checks: CheckResult[] = [];
  const screenshots: BrowserRun["screenshots"] = [];
  let desktop: BrowserContext | null = null;
  let mobile: BrowserContext | null = null;
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

    await settle(page, url);
    await page.waitForTimeout(800);
    const renderedHtml = await page.content();
    const vitals = (await page.evaluate("window.__vc")) as { lcp: number; cls: number } | undefined;
    const contrast = await page.evaluate(contrastAudit);
    screenshots.push({ kind: "desktop", ...DESKTOP, data: await page.screenshot({ type: "jpeg", quality: 72 }) });

    // ---------- Mobile pass ----------
    mobile = await newContext(browser, MOBILE, true, site);
    const mpage = await mobile.newPage();
    await settle(mpage, url);
    await mpage.waitForTimeout(500);
    const m = await mpage.evaluate(mobileAudit);
    screenshots.push({ kind: "mobile", ...MOBILE, data: await mpage.screenshot({ type: "jpeg", quality: 72 }) });

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
    if (!isUpload && vitals) {
      const lcp = Math.round(vitals.lcp);
      checks.push({
        id: "perf-lcp",
        category: "performance",
        severity: "medium",
        method: "browser",
        title: "Largest Contentful Paint",
        status: lcp === 0 ? "skip" : lcp < 2500 ? "pass" : lcp < 4000 ? "warn" : "fail",
        detail:
          lcp === 0
            ? "The browser reported no LCP entry."
            : `${(lcp / 1000).toFixed(2)}s on a desktop viewport from a datacenter connection without throttling. Real phones on cellular will be slower.`,
      });
    }
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
    return { ran: true, checks, renderedHtml, screenshots, requests, transferBytes };
  } catch (err) {
    return { ran: false, reason: `Browser pass failed: ${(err as Error).message.split("\n")[0]}`, checks: [], screenshots };
  } finally {
    await desktop?.close().catch(() => {});
    await mobile?.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
