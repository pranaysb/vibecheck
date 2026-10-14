import type { Category, Method, Severity } from "./types";

export interface CatalogEntry {
  id: string;
  title: string;
  category: Category;
  severity: Severity;
  method: Method;
  appliesTo: ("url" | "files" | "site")[];
  how: string;
}

/** Every check the engine can emit. tests/catalog.test.ts fails if the engine emits an id that isn't listed here. */
export const CATALOG: CatalogEntry[] = [
  // Security
  { id: "sec-https", title: "Served over HTTPS", category: "security", severity: "critical", method: "http", appliesTo: ["url"], how: "The final URL after redirects uses https." },
  { id: "sec-tls", title: "Valid TLS certificate", category: "security", severity: "critical", method: "http", appliesTo: ["url"], how: "Node's TLS stack verifies the chain; warns if expiry is under 14 days." },
  { id: "sec-http-redirect", title: "HTTP redirects to HTTPS", category: "security", severity: "medium", method: "http", appliesTo: ["url"], how: "Requests http://host/ without following redirects and checks for a 3xx to https." },
  { id: "sec-hsts", title: "Strict-Transport-Security", category: "security", severity: "medium", method: "http", appliesTo: ["url"], how: "Header present with max-age ≥ 180 days." },
  { id: "sec-csp", title: "Content-Security-Policy", category: "security", severity: "medium", method: "http", appliesTo: ["url"], how: "Parses script-src (or default-src); warns on 'unsafe-inline' without a nonce or hash." },
  { id: "sec-framing", title: "Clickjacking protection", category: "security", severity: "medium", method: "http", appliesTo: ["url"], how: "X-Frame-Options DENY/SAMEORIGIN or a CSP frame-ancestors directive." },
  { id: "sec-nosniff", title: "X-Content-Type-Options", category: "security", severity: "low", method: "http", appliesTo: ["url"], how: "Header equals nosniff." },
  { id: "sec-referrer", title: "Referrer-Policy", category: "security", severity: "low", method: "http", appliesTo: ["url"], how: "Header set and not unsafe-url / no-referrer-when-downgrade." },
  { id: "sec-version-leak", title: "No version disclosure", category: "security", severity: "low", method: "http", appliesTo: ["url"], how: "X-Powered-By absent and Server header contains no version number." },
  { id: "sec-cookies", title: "Cookie attributes", category: "security", severity: "medium", method: "http", appliesTo: ["url"], how: "Every Set-Cookie on the first response has Secure and SameSite; session-like names also need HttpOnly." },
  { id: "sec-exposed-env", title: "/.env not public", category: "security", severity: "critical", method: "http", appliesTo: ["url"], how: "GET /.env must not return KEY=value lines." },
  { id: "sec-exposed-git", title: "/.git not public", category: "security", severity: "critical", method: "http", appliesTo: ["url"], how: "GET /.git/HEAD and /.git/config must not return git metadata." },
  { id: "sec-client-secrets", title: "No secrets in client code", category: "security", severity: "critical", method: "http", appliesTo: ["url"], how: "Pattern scan of the HTML and up to 12 same-origin scripts. Supabase JWTs are decoded and flagged only when role is service_role." },
  { id: "sec-source-maps", title: "Production source maps", category: "security", severity: "low", method: "http", appliesTo: ["url"], how: "Requests the first bundle's .map (or SourceMap header target)." },
  { id: "sec-mixed-content", title: "No http:// subresources", category: "security", severity: "medium", method: "html", appliesTo: ["url", "site"], how: "Scripts, styles, images, iframes, media and form actions referenced over plain http." },
  { id: "sec-committed-env", title: "No real .env files", category: "security", severity: "critical", method: "files", appliesTo: ["files"], how: ".env, .env.local, .env.production… with assigned values. Templates (.env.example) are allowed." },
  { id: "sec-file-secrets", title: "No hardcoded secrets", category: "security", severity: "critical", method: "files", appliesTo: ["files"], how: "Same pattern set as the client scan, over every text file under 2 MB." },
  // Performance
  { id: "perf-ttfb", title: "Server response time", category: "performance", severity: "medium", method: "http", appliesTo: ["url"], how: "Time to first byte from the audit server: < 800 ms pass, < 1.8 s warn." },
  { id: "perf-redirects", title: "Short redirect chain", category: "performance", severity: "low", method: "http", appliesTo: ["url"], how: "≤ 1 redirect passes, 2 warns." },
  { id: "perf-compression", title: "HTML compressed", category: "performance", severity: "medium", method: "http", appliesTo: ["url"], how: "content-encoding is br, gzip, zstd or deflate for HTML over 1 KB." },
  { id: "perf-weight", title: "Page weight", category: "performance", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Bytes transferred by Chromium during load: < 2 MB pass, < 4 MB warn." },
  { id: "perf-lcp", title: "Largest Contentful Paint", category: "performance", severity: "medium", method: "browser", appliesTo: ["url"], how: "PerformanceObserver in a 1280px desktop page, unthrottled: < 2.5 s pass, < 4 s warn." },
  { id: "perf-cls", title: "Cumulative Layout Shift", category: "performance", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Sum of layout-shift entries without recent input: < 0.1 pass, < 0.25 warn." },
  { id: "perf-heavy-assets", title: "No oversized assets", category: "performance", severity: "medium", method: "files", appliesTo: ["site"], how: "Images > 400 KB, scripts > 1 MB, video > 8 MB." },
  // Accessibility
  { id: "a11y-contrast", title: "Text contrast (WCAG 1.4.3)", category: "accessibility", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "For up to 800 rendered text elements, composites background layers and resolves any CSS color via canvas, then compares to 4.5:1 (3:1 large text)." },
  { id: "resp-overflow", title: "No sideways scroll at 390px", category: "accessibility", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "document scrollWidth vs. innerWidth in a 390×844 mobile context; lists offending elements." },
  { id: "resp-tap-targets", title: "Touch targets ≥ 24px (WCAG 2.5.8)", category: "accessibility", severity: "low", method: "browser", appliesTo: ["url", "site"], how: "Bounding boxes of links, buttons and inputs on the mobile layout; inline text links are exempt." },
  { id: "a11y-lang", title: "Document language", category: "accessibility", severity: "medium", method: "html", appliesTo: ["url", "site"], how: "<html lang> present." },
  { id: "a11y-viewport", title: "Viewport and zoom", category: "accessibility", severity: "medium", method: "html", appliesTo: ["url", "site"], how: "width=device-width set and neither user-scalable=no nor maximum-scale ≤ 1." },
  { id: "a11y-img-alt", title: "Images have alt", category: "accessibility", severity: "medium", method: "html", appliesTo: ["url", "site"], how: "Visible <img> without an alt attribute (alt=\"\" counts as decorative)." },
  { id: "a11y-form-labels", title: "Form fields labelled", category: "accessibility", severity: "medium", method: "html", appliesTo: ["url", "site"], how: "label[for], wrapping <label>, aria-label, aria-labelledby or title. Placeholder alone fails." },
  { id: "a11y-button-names", title: "Buttons have names", category: "accessibility", severity: "medium", method: "html", appliesTo: ["url", "site"], how: "Text, aria-label, aria-labelledby, img alt, svg <title> or title." },
  { id: "a11y-link-names", title: "Links have names", category: "accessibility", severity: "medium", method: "html", appliesTo: ["url", "site"], how: "Same accessible-name rules as buttons." },
  { id: "a11y-h1", title: "One main heading", category: "accessibility", severity: "low", method: "html", appliesTo: ["url", "site"], how: "Exactly one visible <h1>." },
  { id: "a11y-heading-order", title: "Heading order", category: "accessibility", severity: "low", method: "html", appliesTo: ["url", "site"], how: "No jumps of more than one level (h2 → h4)." },
  { id: "a11y-duplicate-ids", title: "Unique IDs", category: "accessibility", severity: "low", method: "html", appliesTo: ["url", "site"], how: "No id value used twice." },
  // SEO
  { id: "seo-title", title: "Page title", category: "seo", severity: "medium", method: "html", appliesTo: ["url", "site"], how: "<title> present; 10–70 characters." },
  { id: "seo-description", title: "Meta description", category: "seo", severity: "low", method: "html", appliesTo: ["url", "site"], how: "Present; 50–170 characters." },
  { id: "seo-social", title: "Social preview tags", category: "seo", severity: "low", method: "html", appliesTo: ["url", "site"], how: "og:title and og:image." },
  { id: "seo-canonical", title: "Canonical URL", category: "seo", severity: "low", method: "html", appliesTo: ["url", "site"], how: "<link rel=canonical>." },
  { id: "seo-favicon", title: "Favicon", category: "seo", severity: "low", method: "html", appliesTo: ["url", "site"], how: "<link rel=icon> or apple-touch-icon." },
  { id: "seo-noindex", title: "Excluded from search", category: "seo", severity: "high", method: "html", appliesTo: ["url", "site"], how: "Only reported when meta robots contains noindex." },
  { id: "seo-robots", title: "robots.txt", category: "seo", severity: "low", method: "http", appliesTo: ["url"], how: "/robots.txt answers 200 with non-HTML content." },
  { id: "seo-sitemap", title: "XML sitemap", category: "seo", severity: "low", method: "http", appliesTo: ["url"], how: "/sitemap.xml is a urlset/sitemapindex, or robots.txt declares one." },
  // Reliability
  { id: "rel-status", title: "Page responds 2xx", category: "reliability", severity: "critical", method: "http", appliesTo: ["url"], how: "Final HTTP status after redirects." },
  { id: "rel-console-errors", title: "No JavaScript errors", category: "reliability", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "console.error calls and uncaught exceptions during load: 0 pass, ≤ 2 warn." },
  { id: "rel-failed-requests", title: "All resources load", category: "reliability", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Network failures and 4xx/5xx responses; third-party-only failures warn. Requests the browser cancels itself (ERR_ABORTED, e.g. dropped prefetches) are not failures." },
  { id: "rel-broken-refs", title: "No broken local references", category: "reliability", severity: "medium", method: "files", appliesTo: ["site"], how: "Every local src/href with a file extension resolves to a file in the upload." },
  // Code
  { id: "code-dependency-vulns", title: "Known vulnerable dependencies", category: "code", severity: "high", method: "osv", appliesTo: ["files"], how: "Exact versions from package-lock, pnpm-lock, yarn.lock, requirements.txt (== pins), poetry.lock or uv.lock, queried against OSV.dev. High/critical fails." },
  { id: "code-lockfile", title: "Lockfile committed", category: "code", severity: "low", method: "files", appliesTo: ["files"], how: "package.json without any lockfile." },
  { id: "code-gitignore-env", title: ".gitignore excludes .env", category: "code", severity: "medium", method: "files", appliesTo: ["files"], how: "Root .gitignore has a .env pattern (source projects only)." },
  { id: "code-readme", title: "README present", category: "code", severity: "low", method: "files", appliesTo: ["files"], how: "GitHub imports only." },
];

export const CATALOG_BY_ID = new Map(CATALOG.map((c) => [c.id, c]));
