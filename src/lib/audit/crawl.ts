import { parse } from "node-html-parser";
import { safeFetch } from "@/lib/net/safe-fetch";
import type { CheckResult } from "./types";

/**
 * Visits the site's other pages (same origin only, at most MAX_PAGES), starting from the links on the audited
 * page and the sitemap, honouring robots.txt. Each page is fetched once over the same SSRF-guarded client.
 */

export const MAX_PAGES = 20;
const CONCURRENCY = 2;
/** Answers that mean "slow down" (419 is Hacker News' and Laravel's). The crawl stops when it sees one. */
const THROTTLED = new Set([419, 429, 503]);
const DEADLINE_MS = 30_000;
const ASSET = /\.(png|jpe?g|gif|webp|avif|svg|ico|pdf|zip|gz|tar|mp4|webm|mov|mp3|wav|woff2?|ttf|otf|css|js|mjs|json|xml|txt|csv|xlsx?|docx?|pptx?|dmg|exe|apk)$/i;

export interface CrawledPage {
  url: string;
  status: number | null;
  error?: string;
  linkedFrom: string;
  title?: string;
  description?: string;
  h1Count?: number;
  imgNoAlt?: number;
  /** The server sent an app shell with almost no content; the page is rendered by JavaScript. */
  shell?: boolean;
  /** Absolute rel=canonical URL, when the page declares one. */
  canonical?: string;
}

export interface CrawlResult {
  pages: CrawledPage[];
  /** Internal URLs found but not visited because of the page limit or deadline. */
  unvisited: number;
  disallowed: number;
  /** The site asked us to slow down, so the crawl stopped early. */
  throttled?: boolean;
}

/** Same-origin page links in a document, normalised (no fragment), excluding assets and non-http links. */
export function discoverLinks(html: string, pageUrl: string): string[] {
  const origin = new URL(pageUrl).origin;
  const out = new Set<string>();
  for (const a of parse(html).querySelectorAll("a[href]")) {
    const href = a.getAttribute("href")!.trim();
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript|data):/i.test(href)) continue;
    let u: URL;
    try {
      u = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (u.origin !== origin || ASSET.test(u.pathname)) continue;
    u.hash = "";
    out.add(u.toString());
  }
  return [...out];
}

/** <loc> entries of a urlset sitemap (sitemap indexes are not followed). */
export function sitemapUrls(xml: string, origin: string): string[] {
  if (!/<urlset\b/.test(xml)) return [];
  const out = new Set<string>();
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    try {
      const u = new URL(m[1].replace(/&amp;/g, "&"));
      if (u.origin !== origin || ASSET.test(u.pathname)) continue;
      u.hash = "";
      out.add(u.toString()); // normalised, so "https://site.com" and "https://site.com/" are one page
    } catch {}
  }
  return [...out];
}

/** robots.txt rules for `User-agent: *` (or VibeCheck), longest match wins, Allow beats Disallow on ties. */
export function robotsAllows(robots: string | null): (path: string) => boolean {
  if (!robots) return () => true;
  const rules: { allow: boolean; path: string }[] = [];
  let applies = false;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      const match = value === "*" || /vibecheck/i.test(value);
      applies = lastWasAgent ? applies || match : match;
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!applies || (key !== "allow" && key !== "disallow") || !value) continue;
    rules.push({ allow: key === "allow", path: value });
  }
  const toRegex = (p: string) => new RegExp("^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
  return (path) => {
    let best: { allow: boolean; len: number } | null = null;
    for (const r of rules) {
      if (!toRegex(r.path).test(path)) continue;
      if (!best || r.path.length > best.len || (r.path.length === best.len && r.allow)) best = { allow: r.allow, len: r.path.length };
    }
    return best ? best.allow : true;
  };
}

/** The page's rel=canonical as an absolute, normalised URL. */
export function canonicalOf(html: string, pageUrl: string): string | undefined {
  const href = parse(html).querySelector('link[rel="canonical" i]')?.getAttribute("href")?.trim();
  if (!href) return undefined;
  try {
    const u = new URL(href, pageUrl);
    u.hash = "";
    return u.toString();
  } catch {
    return undefined;
  }
}

function pageFacts(html: string) {
  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false, pre: true } });
  const bodyText = (root.querySelector("body")?.textContent ?? "").replace(/\s+/g, " ").trim();
  return {
    shell: bodyText.length < 150 && root.querySelectorAll("script").length > 0,
    title: root.querySelector("title")?.textContent.trim() ?? "",
    description: root.querySelector('meta[name="description" i]')?.getAttribute("content")?.trim() ?? "",
    h1Count: root.querySelectorAll("h1").length,
    imgNoAlt: root.querySelectorAll("img").filter((i) => !i.hasAttribute("alt") && i.getAttribute("role") !== "presentation").length,
  };
}

export async function crawlSite(opts: { startUrl: string; startHtml: string; robots: string | null; sitemap: string | null }): Promise<CrawlResult> {
  const start = new URL(opts.startUrl);
  start.hash = "";
  const allowed = robotsAllows(opts.robots);
  const seen = new Set<string>([start.toString()]);
  const queue: { url: string; from: string }[] = [];
  let disallowed = 0;
  const enqueue = (url: string, from: string) => {
    if (seen.has(url)) return;
    seen.add(url);
    const u = new URL(url);
    if (!allowed(u.pathname + u.search)) {
      disallowed++;
      return;
    }
    queue.push({ url, from });
  };
  // Links on the audited page first (what visitors can reach), then the sitemap.
  for (const l of discoverLinks(opts.startHtml, start.toString())) enqueue(l, start.pathname);
  for (const l of opts.sitemap ? sitemapUrls(opts.sitemap, start.origin) : []) enqueue(l, "sitemap.xml");

  const pages: CrawledPage[] = [];
  const deadline = Date.now() + DEADLINE_MS;
  let next = 0;
  let throttled = false;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (!throttled && next < queue.length && pages.length < MAX_PAGES && Date.now() < deadline) {
        const { url, from } = queue[next++];
        const page: CrawledPage = { url, status: null, linkedFrom: from };
        pages.push(page);
        try {
          const res = await safeFetch(url, { maxBytes: 1.5 * 1024 * 1024, timeoutMs: 10_000 });
          page.status = res.status;
          if (THROTTLED.has(res.status)) {
            throttled = true;
            continue;
          }
          const isHtml = /text\/html|application\/xhtml/i.test(res.headers["content-type"] ?? "");
          if (res.status < 400 && isHtml) {
            const html = res.body.toString("utf8");
            Object.assign(page, pageFacts(html), { canonical: canonicalOf(html, res.url) });
            // Follow links one level further, but only on our own origin (safeFetch may have redirected).
            if (new URL(res.url).origin === start.origin) for (const l of discoverLinks(html, res.url)) enqueue(l, new URL(url).pathname);
          }
        } catch (err) {
          page.error = (err as Error).message.slice(0, 160);
        }
      }
    })
  );
  // A rate-limit answer says nothing about the page itself, so those pages count as not visited.
  const visited = pages.filter((p) => p.status === null || !THROTTLED.has(p.status));
  return { pages: visited, unvisited: queue.length - visited.length, disallowed, throttled };
}

const path = (u: string) => {
  const x = new URL(u);
  return x.pathname + x.search;
};

export function crawlChecks(crawl: CrawlResult, start: { url: string; title: string; description: string; canonical?: string }): CheckResult[] {
  const { pages } = crawl;
  const scope =
    `${pages.length} internal page(s) visited${crawl.unvisited ? `, ${crawl.unvisited} more found but not visited (${crawl.throttled ? "the site started rate-limiting the crawl, so it stopped" : `limit ${MAX_PAGES}`})` : ""}` +
    `${crawl.disallowed ? `, ${crawl.disallowed} skipped by robots.txt` : ""}.`;
  if (!pages.length) {
    const skip = (id: string, category: CheckResult["category"], title: string): CheckResult => ({ id, category, severity: "medium", method: "http", title, status: "skip", detail: "The page links to no other pages on this site, and no sitemap lists any, so there was nothing else to crawl." });
    return [skip("rel-broken-links", "reliability", "No broken internal links"), skip("seo-pages", "seo", "Every page has a unique title and description"), skip("a11y-pages", "accessibility", "Other pages: headings and image alt text")];
  }

  // Only "not found", "gone" and server errors are broken links. 401/403 are access control, other 4xx are
  // usually bot or rate limiting, and timeouts or resets are the network, not the link.
  const broken = pages.filter((p) => (p.status !== null && (p.status === 404 || p.status === 410 || p.status >= 500)) || (p.status === null && p.error && !/timed out|ECONNRESET|socket hang up/i.test(p.error)));
  const unreachable = pages.filter((p) => p.status === null && !broken.includes(p));
  // JavaScript-rendered pages share one shell document, so their server HTML says nothing about titles or headings.
  const shells = pages.filter((p) => p.shell);
  const html = pages.filter((p) => p.title !== undefined && !p.shell);
  const shellNote = shells.length ? ` ${shells.length} page(s) are rendered by JavaScript and were not judged here.` : "";
  // Pages that declare the same canonical URL are one page to search engines (e.g. "/" and "/home"); count it once.
  const identity = new Set<string>();
  const all = [{ url: start.url, title: start.title, description: start.description, canonical: start.canonical }, ...html.map((p) => ({ url: p.url, title: p.title!, description: p.description!, canonical: p.canonical }))].filter((p) => {
    const id = p.canonical ?? new URL(p.url).toString();
    if (identity.has(id)) return false;
    identity.add(id);
    if (p.canonical) identity.add(new URL(p.url).toString());
    return true;
  });
  const byTitle = new Map<string, string[]>();
  for (const p of all) if (p.title) byTitle.set(p.title, [...(byTitle.get(p.title) ?? []), path(p.url)]);
  const dupTitles = [...byTitle].filter(([, urls]) => urls.length > 1);
  const noTitle = all.filter((p) => !p.title);
  const noDesc = all.filter((p) => !p.description);
  const noH1 = html.filter((p) => p.h1Count === 0);
  const imgs = html.filter((p) => (p.imgNoAlt ?? 0) > 0);

  const onlyShells = html.length === 0;
  const shellSkip = `All ${shells.length} other page(s) are rendered by JavaScript, so their server HTML can't be judged for this. The audited page's own rendered checks cover it.`;
  return [
    {
      id: "rel-broken-links",
      category: "reliability",
      severity: "medium",
      method: "http",
      title: "No broken internal links",
      status: broken.length ? "fail" : "pass",
      detail: broken.length
        ? `${broken.length} internal link(s) lead to an error page. ${scope}`
        : `Every visited internal page answered without an error. ${scope}${unreachable.length ? ` ${unreachable.length} timed out and were not counted.` : ""}`,
      evidence: broken.length ? broken.slice(0, 10).map((p) => `${p.status ?? p.error} ${path(p.url)} (linked from ${p.linkedFrom})`) : undefined,
      fix: broken.length ? "Fix or remove the links, or redirect the old URLs to their new pages." : undefined,
    },
    {
      id: "seo-pages",
      category: "seo",
      severity: "medium",
      method: "html",
      title: "Every page has a unique title and description",
      status: onlyShells ? "skip" : noTitle.length || dupTitles.length ? "fail" : noDesc.length ? "warn" : "pass",
      detail: onlyShells
        ? shellSkip
        : noTitle.length || dupTitles.length || noDesc.length
          ? `Across ${all.length} pages: ${noTitle.length} without a title, ${dupTitles.length} title(s) shared by several pages, ${noDesc.length} without a meta description. Search results show these, so each page needs its own.${shellNote}`
          : `All ${all.length} pages have their own title and a meta description.${shellNote}`,
      evidence: [
        ...noTitle.slice(0, 4).map((p) => `no <title>: ${path(p.url)}`),
        ...dupTitles.slice(0, 4).map(([t, urls]) => `"${t.slice(0, 60)}" on ${urls.length} pages: ${urls.slice(0, 3).join(", ")}`),
        ...noDesc.slice(0, 4).map((p) => `no description: ${path(p.url)}`),
      ].slice(0, 10),
    },
    {
      id: "a11y-pages",
      category: "accessibility",
      severity: "medium",
      method: "html",
      title: "Other pages: headings and image alt text",
      status: onlyShells ? "skip" : imgs.length ? "fail" : noH1.length ? "warn" : "pass",
      detail: onlyShells
        ? shellSkip
        : imgs.length || noH1.length
          ? `Of ${html.length} other pages, ${imgs.length} have images with no alt attribute and ${noH1.length} have no <h1> in the HTML the server sends (one added later by JavaScript isn't seen here, and isn't seen by every search engine or assistive tool either).${shellNote}`
          : `All ${html.length} other pages have an <h1> and alt attributes on every image (judged on the HTML the server sends).${shellNote}`,
      evidence: [...imgs.slice(0, 6).map((p) => `${p.imgNoAlt} image(s) without alt: ${path(p.url)}`), ...noH1.slice(0, 4).map((p) => `no <h1> in server HTML: ${path(p.url)}`)].slice(0, 10),
    },
  ].map((c) => (c.evidence && !c.evidence.length ? { ...c, evidence: undefined } : c)) as CheckResult[];
}
