import { safeFetch, BlockedDestinationError, type FetchResult } from "@/lib/net/safe-fetch";
import { headerChecks } from "./header-checks";
import { htmlChecks } from "./html-checks";
import { findSecrets } from "./secrets";
import { runBrowserAudit, type BrowserRun } from "./browser";
import { canonicalOf, crawlChecks, crawlSite, MAX_PAGES } from "./crawl";
import type { AuditMeta, CheckResult, ProgressFn } from "./types";
import { parse } from "node-html-parser";

export interface AuditOutput {
  checks: CheckResult[];
  meta: AuditMeta;
  finalUrl?: string;
  screenshots: BrowserRun["screenshots"];
}

/** Errors meant to be shown to the person who typed the URL, in plain words. */
export class AuditInputError extends Error {}

export function normalizeUrl(input: string): string {
  let s = input.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new AuditInputError("That doesn't look like a web address. Try something like example.com or https://example.com/pricing.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new AuditInputError("Only web pages (http:// or https://) can be audited.");
  if (u.hostname === "localhost" || u.hostname.endsWith(".localhost")) {
    throw new AuditInputError("localhost is your own computer, which VibeCheck's servers can't reach. Deploy the site publicly, or upload its build folder as a .zip.");
  }
  if (!u.hostname.includes(".") && !u.hostname.includes(":")) throw new AuditInputError(`"${u.hostname}" isn't a public web address. Include the full domain, like ${u.hostname}.com.`);
  u.hash = "";
  return u.toString();
}

async function probe(url: string, maxBytes = 8192): Promise<FetchResult | null> {
  try {
    return await safeFetch(url, { followRedirects: false, maxBytes, timeoutMs: 6000 });
  } catch {
    return null;
  }
}

function looksLikeHtml(buf: Buffer) {
  return /<(!doctype|html|head|body)\b/i.test(buf.subarray(0, 2048).toString("utf8"));
}

export async function auditUrl(rawUrl: string, step: ProgressFn): Promise<AuditOutput> {
  const target = normalizeUrl(rawUrl);
  const checks: CheckResult[] = [];
  const meta: AuditMeta = {};

  // 1. Primary fetch
  step("Fetching the page");
  let page: FetchResult;
  try {
    page = await withRetry(() => safeFetch(target, { maxBytes: 3 * 1024 * 1024 }));
  } catch (err) {
    if (err instanceof BlockedDestinationError) throw friendlyBlocked(err.message, new URL(target).hostname);
    const e = err as Error & { code?: string };
    if (e.code && /CERT|SSL|TLS|SELF_SIGNED|UNABLE_TO_VERIFY/i.test(e.code)) {
      checks.push({
        id: "sec-tls",
        category: "security",
        severity: "critical",
        method: "http",
        title: "Valid TLS certificate",
        status: "fail",
        detail: "The TLS handshake was rejected. Browsers will show a full-page security warning.",
        evidence: [e.message],
      });
      return { checks, meta, screenshots: [] };
    }
    if (e.code === "ECONNREFUSED") throw new AuditInputError(`${new URL(target).hostname} refused the connection. Is the site running and reachable from the internet?`);
    if (/timed out/i.test(e.message)) throw new AuditInputError(`${new URL(target).hostname} didn't respond within 10 seconds.`);
    throw err;
  }
  const finalUrl = page.url;

  // Audit web pages, not files or APIs; a JSON endpoint scored on "page title" and "alt text" is noise.
  const type = page.headers["content-type"] ?? "";
  if (page.status < 400 && type && !/text\/html|application\/xhtml\+xml/i.test(type)) {
    throw new AuditInputError(`That address returns ${type.split(";")[0]}, not a web page. Enter the URL of a page people visit in a browser.`);
  }
  const isHttps = finalUrl.startsWith("https:");
  const origin = new URL(finalUrl).origin;
  meta.statusCode = page.status;
  meta.ttfbMs = page.ttfbMs;
  meta.resolvedIp = page.resolvedIp;
  meta.redirects = page.redirects;
  meta.responseHeaders = page.headers;

  // 2. Transport
  checks.push({
    id: "rel-status",
    category: "reliability",
    // Critical: an error page isn't the site the user meant to audit, so its other results mustn't look healthy.
    severity: "critical",
    method: "http",
    title: "Page responds successfully",
    status: page.status >= 200 && page.status < 300 ? "pass" : "fail",
    detail: `HTTP ${page.status} after ${page.redirects.length} redirect(s).`,
    evidence: [...page.redirects.map((r) => `${r.status} ${r.url}`), `${page.status} ${finalUrl}`],
  });
  checks.push({
    id: "sec-https",
    category: "security",
    // Critical: without HTTPS every password and form field crosses the network in plain text,
    // and browsers label the page "Not secure". Such a site shouldn't score above the critical cap.
    severity: "critical",
    method: "http",
    title: "Served over HTTPS",
    status: isHttps ? "pass" : "fail",
    detail: isHttps ? "The final URL uses HTTPS." : "The page is served over plain HTTP; anything typed into it can be read on the network.",
    evidence: [finalUrl],
  });
  if (page.tls) {
    const days = page.tls.validTo ? Math.floor((Date.parse(page.tls.validTo) - Date.now()) / 86_400_000) : null;
    checks.push({
      id: "sec-tls",
      category: "security",
      severity: "critical",
      method: "http",
      title: "Valid TLS certificate",
      status: !page.tls.authorized ? "fail" : days !== null && days < 14 ? "warn" : "pass",
      detail: !page.tls.authorized
        ? `Certificate rejected: ${page.tls.authorizationError}.`
        : days !== null
          ? `Trusted certificate${page.tls.issuer ? ` from ${page.tls.issuer}` : ""}, expires in ${days} days.`
          : "Trusted certificate.",
      evidence: [page.tls.protocol, page.tls.validTo && `valid until ${page.tls.validTo}`].filter(Boolean) as string[],
      fix: days !== null && days < 14 ? "Renew now and check that auto-renewal is working." : undefined,
    });
    // http:// → https:// upgrade
    const plain = new URL(finalUrl);
    plain.protocol = "http:";
    plain.pathname = "/";
    plain.search = "";
    const http = await probe(plain.toString(), 1024);
    if (http) {
      const loc = http.headers["location"] ?? "";
      const upgrades = http.status >= 300 && http.status < 400 && loc.startsWith("https://");
      checks.push({
        id: "sec-http-redirect",
        category: "security",
        severity: "medium",
        method: "http",
        title: "HTTP redirects to HTTPS",
        status: upgrades ? "pass" : "fail",
        detail: upgrades ? `http:// answers ${http.status} → ${loc}` : `http:// answers ${http.status} without redirecting to HTTPS.`,
        evidence: [`GET ${plain} → ${http.status}${loc ? ` Location: ${loc}` : ""}`],
      });
    }
  }
  const hops = page.redirects.length;
  checks.push({
    id: "perf-redirects",
    category: "performance",
    severity: "low",
    method: "http",
    title: "Short redirect chain",
    status: hops <= 1 ? "pass" : hops === 2 ? "warn" : "fail",
    detail: hops === 0 ? "No redirects." : `${hops} redirect(s) before the page; each costs a full round trip.`,
  });
  checks.push({
    id: "perf-ttfb",
    category: "performance",
    severity: "medium",
    method: "http",
    title: "Server response time",
    status: page.ttfbMs < 800 ? "pass" : page.ttfbMs < 1800 ? "warn" : "fail",
    detail: `${page.ttfbMs} ms to first byte for the final URL, measured from the audit server, including connection and TLS setup.`,
  });
  const enc = page.headers["content-encoding"];
  if (page.body.length > 1024) {
    checks.push({
      id: "perf-compression",
      category: "performance",
      severity: "medium",
      method: "http",
      title: "HTML is compressed",
      status: enc && /br|gzip|zstd|deflate/.test(enc) ? "pass" : "fail",
      detail: enc
        ? `content-encoding: ${enc}, ${(page.transferBytes / 1024).toFixed(1)} KB on the wire for ${(page.body.length / 1024).toFixed(1)} KB of HTML.`
        : `${(page.body.length / 1024).toFixed(1)} KB of HTML sent uncompressed.`,
      fix: "Enable gzip or brotli on your host or CDN.",
    });
  }

  checks.push(...headerChecks(page.headers, page.setCookies, isHttps));

  // 3. Exposure probes
  step("Probing for exposed files");
  const [env, gitHead, gitConfig, robots, sitemap] = await Promise.all([
    probe(`${origin}/.env`, 4096),
    probe(`${origin}/.git/HEAD`, 1024),
    probe(`${origin}/.git/config`, 4096),
    probe(`${origin}/robots.txt`, 32_768),
    probe(`${origin}/sitemap.xml`, 512 * 1024), // read in full: the crawler visits the pages it lists
  ]);
  const envText = env && env.status === 200 && !looksLikeHtml(env.body) ? env.body.toString("utf8") : "";
  const envExposed = /^[A-Z][A-Z0-9_]{2,}\s*=/m.test(envText);
  checks.push({
    id: "sec-exposed-env",
    category: "security",
    severity: "critical",
    method: "http",
    title: "/.env is not public",
    status: envExposed ? "fail" : "pass",
    detail: envExposed ? "/.env returns environment variables. Treat every secret in it as compromised and rotate them." : `/.env answered ${env?.status ?? "no response"} with no KEY=value content.`,
    evidence: envExposed ? envText.split("\n").filter((l) => /^[A-Z]/.test(l)).slice(0, 6).map((l) => l.split("=")[0] + "=<redacted>") : undefined,
    fix: "Deny dotfiles at the web server and keep .env out of the deploy directory.",
  });
  const gitExposed =
    (gitHead?.status === 200 && /^(ref: refs\/|[0-9a-f]{40})/.test(gitHead.body.toString("utf8").trim())) ||
    (gitConfig?.status === 200 && /\[core\]/.test(gitConfig.body.toString("utf8")));
  checks.push({
    id: "sec-exposed-git",
    category: "security",
    severity: "critical",
    method: "http",
    title: "/.git is not public",
    status: gitExposed ? "fail" : "pass",
    detail: gitExposed ? "The .git directory is downloadable, so your full source and history can be reconstructed." : "/.git/HEAD and /.git/config are not served.",
    fix: "Deploy build output only, or deny /.git at the web server.",
  });
  checks.push({
    id: "seo-robots",
    category: "seo",
    severity: "low",
    method: "http",
    title: "robots.txt",
    status: robots?.status === 200 && !looksLikeHtml(robots.body) ? "pass" : "warn",
    detail: robots?.status === 200 && !looksLikeHtml(robots.body) ? "/robots.txt is served." : `/robots.txt answered ${robots?.status ?? "no response"}.`,
  });
  const robotsSitemap = robots?.status === 200 ? /^sitemap:/im.test(robots.body.toString("utf8")) : false;
  const sitemapOk = sitemap?.status === 200 && /<(urlset|sitemapindex)\b/.test(sitemap.body.toString("utf8"));
  checks.push({
    id: "seo-sitemap",
    category: "seo",
    severity: "low",
    method: "http",
    title: "XML sitemap",
    status: sitemapOk || robotsSitemap ? "pass" : "warn",
    detail: sitemapOk ? "/sitemap.xml is a valid sitemap." : robotsSitemap ? "robots.txt points to a sitemap." : "No sitemap at /sitemap.xml or in robots.txt.",
  });

  // 4. Client-side secrets in HTML and same-origin scripts
  step("Scanning HTML and JavaScript for leaked secrets");
  const html = page.body.toString("utf8");
  const root = parse(html);
  const scriptUrls = root
    .querySelectorAll("script[src]")
    .map((s) => {
      try {
        return new URL(s.getAttribute("src")!, finalUrl);
      } catch {
        return null;
      }
    })
    .filter((u): u is URL => !!u && u.origin === origin)
    .slice(0, 12);
  const sources: { label: string; text: string }[] = [{ label: new URL(finalUrl).pathname || "/", text: html }];
  const scripts = await Promise.all(scriptUrls.map((u) => probe(u.toString(), 2 * 1024 * 1024)));
  scripts.forEach((r, i) => r?.status === 200 && sources.push({ label: scriptUrls[i].pathname, text: r.body.toString("utf8") }));
  const leaks = sources.flatMap((s) => findSecrets(s.text).map((h) => `${s.label}: ${h.kind} ${h.sample}`));
  checks.push({
    id: "sec-client-secrets",
    category: "security",
    severity: "critical",
    method: "http",
    title: "No secrets in client code",
    status: leaks.length ? "fail" : "pass",
    detail: leaks.length
      ? "Credential patterns were found in code every visitor downloads. Rotate them now and move the calls server-side."
      : `Scanned the HTML and ${sources.length - 1} same-origin script(s) for ${"AWS, Stripe, OpenAI, Anthropic, GitHub, Slack, SendGrid, Supabase service_role, private keys and database URLs"}.`,
    evidence: leaks.length ? leaks.slice(0, 8) : undefined,
  });
  const firstScript = scripts.find((r) => r?.status === 200);
  if (firstScript) {
    const mapUrl = firstScript.headers["sourcemap"] || firstScript.headers["x-sourcemap"] || firstScript.url + ".map";
    const map = await probe(new URL(mapUrl, firstScript.url).toString(), 512);
    const exposed = map?.status === 200 && /"mappings"|"sources"|"version"/.test(map.body.toString("utf8"));
    checks.push({
      id: "sec-source-maps",
      category: "security",
      severity: "low",
      method: "http",
      title: "Production source maps",
      status: exposed ? "warn" : "pass",
      detail: exposed ? "Source maps are public, which reveals original source code and comments. Fine for open source; otherwise disable." : "No public source map for the first bundle.",
      evidence: exposed ? [map!.url] : undefined,
    });
  }

  // 5. Browser
  step("Rendering in headless Chromium (desktop + 390px mobile)");
  const browser = await runBrowserAudit({ url: finalUrl, fetchedStatus: page.status });
  meta.browser = { ran: browser.ran, reason: browser.reason, requests: browser.requests, transferBytes: browser.transferBytes };
  checks.push(...browser.checks);

  // 6. HTML structure — judged on the rendered DOM when available, since that's what users get
  step("Checking HTML structure, accessibility and metadata");
  const docHtml = browser.renderedHtml ?? html;
  meta.title = parse(docHtml).querySelector("title")?.textContent.trim() || undefined;
  checks.push(...htmlChecks([{ label: finalUrl, html: docHtml }], { isHttps }));

  // 7. The rest of the site
  step(`Crawling up to ${MAX_PAGES} more pages on ${new URL(finalUrl).host}`);
  const startFacts = parse(docHtml);
  const crawl = await crawlSite({
    startUrl: finalUrl,
    startHtml: docHtml,
    robots: robots?.status === 200 && !looksLikeHtml(robots.body) ? robots.body.toString("utf8") : null,
    sitemap: sitemapOk ? sitemap!.body.toString("utf8") : null,
  });
  checks.push(
    ...crawlChecks(crawl, {
      url: finalUrl,
      title: meta.title ?? "",
      description: startFacts.querySelector('meta[name="description" i]')?.getAttribute("content")?.trim() ?? "",
      canonical: canonicalOf(docHtml, finalUrl),
    })
  );
  meta.crawl = {
    throttled: crawl.throttled,
    unvisited: crawl.unvisited,
    disallowed: crawl.disallowed,
    pages: crawl.pages.map((p) => ({ url: p.url, status: p.status, title: p.shell ? undefined : p.title, error: p.status === null ? p.error : undefined })),
  };

  return { checks, meta, finalUrl, screenshots: browser.screenshots };
}

/** Turns SSRF/DNS rejections into something a non-engineer can act on. */
function friendlyBlocked(message: string, requestedHost: string): AuditInputError {
  // safeFetch reports the hop that was blocked, which may be a redirect target rather than the requested host.
  let host = requestedHost;
  try {
    host = new URL(message.match(/^Blocked destination (\S+): /)?.[1] ?? "").hostname || requestedHost;
  } catch {}
  const via = host !== requestedHost ? `${requestedHost} redirected to ${host}, which` : `${host}`;
  if (/DNS resolution failed|zero records/i.test(message)) return new AuditInputError(`We couldn't find ${host}. Check the spelling, or that the domain is live.`);
  if (/localhost|Loopback|Private|Link-Local|Metadata|Carrier-Grade|Unique Local|forbidden/i.test(message))
    return new AuditInputError(`${via} is a private or local address that VibeCheck can't reach. Deploy the site publicly, or upload its build as a .zip.`.replace(`, which is a`, ` — a`));
  return new AuditInputError(`VibeCheck can't audit ${host}: ${message.replace(/^Blocked destination [^:]+:\s*/, "")}`);
}

/** Connection-level failures worth one more try; real answers (DNS, refused, blocked, HTTP errors) are not. */
export function isTransient(err: unknown): boolean {
  const e = err as Error & { code?: string };
  if (err instanceof BlockedDestinationError) return false;
  return ["ECONNRESET", "ETIMEDOUT", "EPIPE", "ECONNABORTED", "EAI_AGAIN"].includes(e.code ?? "") || /timed out|socket hang up|ECONNRESET/i.test(e.message ?? "");
}

/** Retries once after a short pause when the failure looks like a dropped connection. */
export async function withRetry<T>(fn: () => Promise<T>, pauseMs = 800): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isTransient(err)) throw err;
    await new Promise((r) => setTimeout(r, pauseMs));
    return fn();
  }
}
