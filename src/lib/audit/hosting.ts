import type { CheckResult } from "./types";

type Headers = Record<string, string>;

export type HostId = "github-pages" | "vercel" | "netlify" | "cloudflare" | "cloudfront" | "render" | "fly" | "nginx" | "apache";

export interface Host {
  id: HostId;
  name: string;
  /** The response header that identified it, shown as evidence. */
  evidence: string;
}

/**
 * Identifies the hosting platform from response headers. Platform-specific headers win over a CDN in front
 * (a Vercel or Render app behind Cloudflare is configured on Vercel or Render), and the CDN over the web server.
 */
const host = (id: HostId, name: string, evidence: string): Host => ({ id, name, evidence });

export function detectHost(h: Headers): Host | null {
  const server = (h["server"] ?? "").toLowerCase();
  const via = (h["via"] ?? "").toLowerCase();
  if (server === "github.com" || h["x-github-request-id"]) return host("github-pages", "GitHub Pages", h["x-github-request-id"] ? "x-github-request-id header" : "server: GitHub.com");
  if (h["x-vercel-id"] || server === "vercel") return host("vercel", "Vercel", h["x-vercel-id"] ? "x-vercel-id header" : "server: Vercel");
  if (h["x-nf-request-id"] || server.includes("netlify")) return host("netlify", "Netlify", h["x-nf-request-id"] ? "x-nf-request-id header" : `server: ${h["server"]}`);
  if (h["x-render-origin-server"] || h["rndr-id"]) return host("render", "Render", h["rndr-id"] ? "rndr-id header" : "x-render-origin-server header");
  if (h["fly-request-id"] || server.startsWith("fly/")) return host("fly", "Fly.io", h["fly-request-id"] ? "fly-request-id header" : `server: ${h["server"]}`);
  if (h["x-amz-cf-id"] || via.includes("cloudfront")) return host("cloudfront", "Amazon CloudFront", h["x-amz-cf-id"] ? "x-amz-cf-id header" : `via: ${h["via"]}`);
  if (server === "cloudflare" || h["cf-ray"]) return host("cloudflare", "Cloudflare", h["cf-ray"] ? "cf-ray header" : "server: cloudflare");
  if (server.startsWith("nginx")) return host("nginx", "nginx", `server: ${h["server"]}`);
  if (server.startsWith("apache")) return host("apache", "Apache", `server: ${h["server"]}`);
  return null;
}

/** The header each check recommends. CSP starts in report-only mode so a strict policy can't break the site. */
const RECOMMENDED: Partial<Record<string, [key: string, value: string]>> = {
  "sec-csp": ["Content-Security-Policy-Report-Only", "default-src 'self'; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"],
  "sec-hsts": ["Strict-Transport-Security", "max-age=63072000; includeSubDomains"],
  "sec-framing": ["X-Frame-Options", "DENY"],
  "sec-nosniff": ["X-Content-Type-Options", "nosniff"],
  "sec-referrer": ["Referrer-Policy", "strict-origin-when-cross-origin"],
};

const CSP_NOTE = "Start in report-only mode: watch the browser console for violations, adjust the policy, then rename the header to Content-Security-Policy.";

/** How to set one response header on a given host, as copy-paste config. Null when the host can't set it. */
export function setHeaderOn(host: HostId, key: string, value: string): string | null {
  switch (host) {
    case "vercel":
      return `In vercel.json at the project root:\n{\n  "headers": [{ "source": "/(.*)", "headers": [{ "key": "${key}", "value": "${value}" }] }]\n}\n(Next.js: or return it from headers() in next.config.)`;
    case "netlify":
      return `In a file named _headers in your publish folder:\n/*\n  ${key}: ${value}`;
    case "cloudflare":
      return `Cloudflare Pages: in a file named _headers in your output folder:\n/*\n  ${key}: ${value}\nAny other site behind Cloudflare: Rules → Transform Rules → Modify Response Header → Set static "${key}" to "${value}".`;
    case "cloudfront":
      return `In CloudFront: Policies → Response headers → create a policy with custom header ${key}: ${value} (or start from the managed SecurityHeadersPolicy), then attach it to the distribution's behavior.`;
    case "render":
      return `Render static site: Settings → Headers → add path /* with ${key}: ${value} (or a headers entry in render.yaml). For a web service, send it from your app.`;
    case "fly":
      return `Fly.io passes your app's headers through: send ${key}: ${value} from your app or web server (e.g. a middleware that sets it on every response).`;
    case "nginx":
      return `In the server block: add_header ${key} "${value}" always;`;
    case "apache":
      return `In the VirtualHost or .htaccess (mod_headers): Header always set ${key} "${value}"`;
    case "github-pages":
      return null;
  }
}

/** GitHub Pages can't send custom headers; say what's possible instead of giving advice that can't be applied. */
function githubPagesFix(checkId: string): string | undefined {
  const move =
    "GitHub Pages doesn't let sites set response headers, and this one can't be set from HTML. To add it, serve the same static files from Cloudflare Pages, Netlify or Vercel (all have free plans; add a _headers file or vercel.json), or put Cloudflare in front of a custom domain and add a Transform Rule.";
  switch (checkId) {
    case "sec-referrer":
      return 'GitHub Pages can\'t set headers, but this policy also works as a tag in <head>:\n<meta name="referrer" content="strict-origin-when-cross-origin">';
    case "sec-csp":
      return `GitHub Pages can't set headers, but most of a CSP works as a tag in <head> (frame-ancestors and reporting don't):\n<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: https:; object-src 'none'; base-uri 'self'">\nTest it locally first: unlike report-only mode, a meta CSP blocks immediately. For the full header, ${move.slice(move.indexOf("serve"))}`;
    case "sec-hsts":
    case "sec-http-redirect":
      return "In the repository: Settings → Pages → tick Enforce HTTPS. GitHub then redirects http:// to https:// and sends Strict-Transport-Security itself.";
    case "sec-framing":
    case "sec-nosniff":
      return move;
  }
  return undefined;
}

/**
 * Rewrites the header checks' fixes for the detected host, so the advice can be applied where the site actually
 * runs. Checks that pass, and checks for hosts we don't recognize, keep their generic fix.
 */
export function applyHostAdvice(checks: CheckResult[], host: Host | null): CheckResult[] {
  if (!host) return checks;
  return checks.map((c) => {
    if (c.status === "pass" || c.status === "skip") return c;
    const rec = RECOMMENDED[c.id];
    if (c.id === "sec-http-redirect" && host.id === "github-pages") return { ...c, fix: githubPagesFix(c.id), evidence: [...(c.evidence ?? []), `Hosted on ${host.name} (${host.evidence}).`] };
    if (!rec && c.id !== "sec-version-leak") return c;
    const hostLine = `Hosted on ${host.name} (${host.evidence}).`;
    if (c.id === "sec-version-leak") {
      const how = host.id === "nginx" ? "Set server_tokens off; in the http block." : host.id === "apache" ? "Set ServerTokens Prod and ServerSignature Off." : null;
      return how ? { ...c, fix: how, evidence: [...(c.evidence ?? []), hostLine] } : c;
    }
    const [key, value] = rec!;
    const fix = host.id === "github-pages" ? githubPagesFix(c.id) : setHeaderOn(host.id, key, value);
    if (!fix) return c;
    return { ...c, fix: c.id === "sec-csp" && host.id !== "github-pages" ? `${fix}\n${CSP_NOTE}` : fix, evidence: [...(c.evidence ?? []), hostLine] };
  });
}

/**
 * Every failing header fix for this host as one paste-ready block (one vercel.json, one _headers file, one
 * set of nginx lines), instead of a separate snippet per check. Null when there's nothing to combine.
 */
export function combinedHeaderFix(checks: CheckResult[], hostId: string | undefined): { title: string; code: string; note?: string } | null {
  const missing = checks.filter((c) => (c.status === "fail" || c.status === "warn") && RECOMMENDED[c.id]).map((c) => RECOMMENDED[c.id]!);
  if (missing.length < 2 || !hostId) return null;
  const hasCsp = missing.some(([k]) => k.startsWith("Content-Security-Policy"));
  const cspNote = hasCsp ? CSP_NOTE : undefined;
  switch (hostId as HostId) {
    case "vercel":
      return {
        title: "vercel.json (project root)",
        code: JSON.stringify({ headers: [{ source: "/(.*)", headers: missing.map(([key, value]) => ({ key, value })) }] }, null, 2),
        note: [cspNote, "Already have a vercel.json? Merge the headers entry into it. Next.js apps can return the same list from headers() in next.config."].filter(Boolean).join(" "),
      };
    case "netlify":
    case "cloudflare":
      return { title: `_headers (${hostId === "netlify" ? "publish" : "Cloudflare Pages output"} folder)`, code: `/*\n${missing.map(([k, v]) => `  ${k}: ${v}`).join("\n")}`, note: cspNote };
    case "nginx":
      return { title: "nginx server block", code: missing.map(([k, v]) => `add_header ${k} "${v}" always;`).join("\n"), note: cspNote };
    case "apache":
      return { title: "Apache VirtualHost or .htaccess (mod_headers)", code: missing.map(([k, v]) => `Header always set ${k} "${v}"`).join("\n"), note: cspNote };
    case "github-pages": {
      const tags = [
        ...(missing.some(([k]) => k === "Referrer-Policy") ? ['<meta name="referrer" content="strict-origin-when-cross-origin">'] : []),
        ...(hasCsp ? [`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: https:; object-src 'none'; base-uri 'self'">`] : []),
      ];
      const impossible = missing.filter(([k]) => k !== "Referrer-Policy" && !k.startsWith("Content-Security-Policy") && k !== "Strict-Transport-Security").map(([k]) => k);
      if (!tags.length) return null;
      return {
        title: "the <head> of every page (GitHub Pages can't send headers)",
        code: tags.join("\n"),
        note: `Test the CSP tag locally first; it blocks immediately.${impossible.length ? ` ${impossible.join(" and ")} can't be added on GitHub Pages at all; that needs Cloudflare Pages, Netlify or Vercel.` : ""}`,
      };
    }
  }
  return null;
}
