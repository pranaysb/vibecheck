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
  // Privacy
  { id: "priv-trackers", title: "No tracking before consent", category: "privacy", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Records every host Chromium contacts while the page loads, with no clicks, and every cookie set. Third-party requests to 40+ known advertising, cross-site analytics and session-replay domains, or any third-party cookie, warn. Cookieless analytics (Plausible, Fathom, Vercel, Cloudflare) and strictly necessary bot-protection or load-balancer cookies (Cloudflare __cf_bm, Akamai, AWS ALB, Imperva) are not counted." },
  // Design & UX
  { id: "ux-placeholder", title: "No template or placeholder content", category: "design", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Rendered page: template default titles (Create Next App, Vite + React, React App, Document…) and descriptions, starter text (\"Get started by editing\", lorem ipsum), the starter logo row (next.svg + vercel.svg, vite.svg, react.svg), and broken render output: a visible text node that is exactly undefined, NaN or null, $NaN, [object Object], or unrendered {{ }}. Code blocks are ignored." },
  { id: "ux-images", title: "Images load and keep proportions", category: "design", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Visible images in the first two screens that finished loading with no pixels fail; images drawn more than 10% off their natural aspect ratio with object-fit: fill warn. SVGs are skipped." },
  { id: "ux-overlap", title: "No overlapping text", category: "design", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "On the first 1.5 screens at 1280px: lines of text (each line's own rectangle, so floats and padding don't count) from two unrelated elements overlapping by over 30% of the smaller line, where the overlap is the topmost thing drawn and neither is clipped by an ancestor. Fixed-position, rotated and identical stacked text are ignored." },
  { id: "ux-clipped", title: "No cut-off text", category: "design", severity: "low", method: "browser", appliesTo: ["url", "site"], how: "Leaf text elements whose content is larger than their box under overflow: hidden or clip, with no text-overflow: ellipsis or line-clamp." },
  { id: "ux-line-length", title: "Comfortable line length", category: "design", severity: "low", method: "browser", appliesTo: ["url", "site"], how: "Paragraphs, list items and cells over 240 characters, estimated at over 110 characters per line at 1280px (width ÷ half the font size)." },
  { id: "ux-fonts", title: "Consistent typography", category: "design", severity: "low", method: "browser", appliesTo: ["url", "site"], how: "Typefaces weighted by how much visible text each sets; more than three with at least 2% each warns. Icon fonts are ignored." },
  { id: "ux-text-size", title: "Readable text on phones", category: "design", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Like Lighthouse's legible-font-size audit: the share of visible text characters on the 390px layout set below 12px. Over 10% warns; over 40% fails (Lighthouse's threshold). Text hidden from assistive tech is skipped." },
  // Performance
  { id: "perf-ttfb", title: "Server response time", category: "performance", severity: "medium", method: "http", appliesTo: ["url"], how: "Time to first byte from the audit server: < 800 ms pass, < 1.8 s warn." },
  { id: "perf-redirects", title: "Short redirect chain", category: "performance", severity: "low", method: "http", appliesTo: ["url"], how: "≤ 1 redirect passes, 2 warns." },
  { id: "perf-compression", title: "HTML compressed", category: "performance", severity: "medium", method: "http", appliesTo: ["url"], how: "content-encoding is br, gzip, zstd or deflate for HTML over 1 KB." },
  { id: "perf-weight", title: "Page weight", category: "performance", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Bytes transferred by Chromium during load: < 2 MB pass, < 4 MB warn." },
  { id: "perf-lcp", title: "Largest Contentful Paint (mobile)", category: "performance", severity: "high", method: "browser", appliesTo: ["url"], how: "A cold-cache load as Lighthouse's emulated phone (Moto G Power, 412px, Android Chrome) under its mobile profile (Slow 4G: 150 ms RTT, 1.6 Mbps down), applied with DevTools throttling. The CPU is slowed to a phone-class speed calibrated with Lighthouse's BenchmarkIndex (target 1000, i.e. Lighthouse's default 4× on a current laptop), so results don't depend on the audit server's hardware. ≤ 2.5 s pass, ≤ 4 s warn, otherwise fail; nothing painted within 45 s fails." },
  { id: "perf-fcp", title: "First Contentful Paint (mobile)", category: "performance", severity: "medium", method: "browser", appliesTo: ["url"], how: "Same throttled phone load: ≤ 1.8 s pass, ≤ 3 s warn (Lighthouse's mobile boundaries)." },
  { id: "perf-tbt", title: "Total Blocking Time (mobile)", category: "performance", severity: "medium", method: "browser", appliesTo: ["url"], how: "Same throttled phone load, Lighthouse's definition (when the audit server's CPU is slower than the phone target, long-task durations are first scaled to the target speed, as Lighthouse's simulated throttling does): each long task's time beyond 50 ms between first paint and Time to Interactive (the start of the first 5 s window with no long tasks and at most two requests in flight). ≤ 200 ms pass, ≤ 600 ms warn. Shown but not scored when the audit server has fewer than 4 CPU cores, where the browser's own threads inflate it." },
  { id: "perf-cls", title: "Cumulative Layout Shift", category: "performance", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Sum of layout-shift entries without recent input: < 0.1 pass, < 0.25 warn." },
  { id: "perf-heavy-assets", title: "No oversized assets", category: "performance", severity: "medium", method: "files", appliesTo: ["site"], how: "Images > 400 KB, scripts > 1 MB, video > 8 MB." },
  // Accessibility
  { id: "a11y-contrast", title: "Text contrast (WCAG 1.4.3)", category: "accessibility", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "For up to 800 rendered text elements, composites background layers and resolves any CSS color via canvas, then compares to 4.5:1 (3:1 large text)." },
  { id: "resp-overflow", title: "No sideways scroll at 390px", category: "accessibility", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "document scrollWidth vs. innerWidth in a 390×844 mobile context; lists offending elements." },
  { id: "resp-tap-targets", title: "Touch targets ≥ 24px (WCAG 2.5.8)", category: "accessibility", severity: "low", method: "browser", appliesTo: ["url", "site"], how: "Bounding boxes of links, buttons and inputs on the mobile layout; inline text links are exempt." },
  { id: "a11y-axe", title: "WCAG 2.2 A/AA scan (axe-core)", category: "accessibility", severity: "high", method: "browser", appliesTo: ["url", "site"], how: "Runs Deque's open-source axe-core engine (the one behind Lighthouse and most accessibility tools) on the rendered desktop page with the WCAG 2.0–2.2 A/AA rule tags. Serious or critical violations fail; moderate or minor ones warn. Rules already scored by other checks are excluded." },
  { id: "a11y-pages", title: "Other pages: headings and alt text", category: "accessibility", severity: "medium", method: "html", appliesTo: ["url"], how: "On each crawled page's server HTML: images with no alt attribute fail, a missing <h1> warns. JavaScript-rendered app shells are not judged." },
  { id: "a11y-focus-visible", title: "Keyboard focus is visible (WCAG 2.4.7)", category: "accessibility", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Judged on pixels: after a Tab press puts the page in keyboard mode, the area around each of the first 12 visible links and controls is captured unfocused and focused (transitions finished, text caret hidden). Identical pixels mean no visible focus indicator. Any warns; over 30% fails." },
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
  { id: "seo-pages", title: "Unique titles and descriptions", category: "seo", severity: "medium", method: "html", appliesTo: ["url"], how: "Across the audited page and every crawled page: a missing or duplicated <title> fails, a missing meta description warns. JavaScript-rendered app shells are not judged." },
  { id: "seo-robots", title: "robots.txt", category: "seo", severity: "low", method: "http", appliesTo: ["url"], how: "/robots.txt answers 200 with non-HTML content." },
  { id: "seo-sitemap", title: "XML sitemap", category: "seo", severity: "low", method: "http", appliesTo: ["url"], how: "/sitemap.xml is a urlset/sitemapindex, or robots.txt declares one." },
  // Reliability
  { id: "rel-status", title: "Page responds 2xx", category: "reliability", severity: "critical", method: "http", appliesTo: ["url"], how: "Final HTTP status after redirects." },
  { id: "rel-console-errors", title: "No JavaScript errors", category: "reliability", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "console.error calls and uncaught exceptions during load: 0 pass, ≤ 2 warn." },
  { id: "rel-failed-requests", title: "All resources load", category: "reliability", severity: "medium", method: "browser", appliesTo: ["url", "site"], how: "Network failures and 4xx/5xx responses; third-party-only failures warn. Requests the browser cancels itself (ERR_ABORTED, e.g. dropped prefetches) are not failures." },
  { id: "rel-broken-links", title: "No broken internal links", category: "reliability", severity: "medium", method: "http", appliesTo: ["url"], how: "Crawls up to 20 same-origin pages, starting from the links on the rendered page and sitemap.xml, honouring robots.txt. Any visited page answering 404, 410 or 5xx (or failing DNS/TLS) fails; access control (401/403), other 4xx, timeouts and resets are not counted. Two requests at a time; the crawl stops as soon as the site answers 419, 429 or 503." },
  { id: "rel-build", title: "Builds from a clean install", category: "reliability", severity: "medium", method: "sandbox", appliesTo: ["files"], how: "Projects with a build script and no build output are installed and built in a throwaway Vercel Sandbox microVM with no secrets: registries-only network while installing, no outbound network while running. A failed install fails; a failed build warns, since it may only need env vars." },
  { id: "rel-broken-refs", title: "No broken local references", category: "reliability", severity: "medium", method: "files", appliesTo: ["site"], how: "Every local src/href with a file extension resolves to a file in the upload." },
  // Code
  { id: "code-dependency-vulns", title: "Known vulnerable dependencies", category: "code", severity: "high", method: "osv", appliesTo: ["files"], how: "Exact versions from package-lock, pnpm-lock, yarn.lock, requirements.txt (== pins), poetry.lock or uv.lock, queried against OSV.dev. High/critical fails." },
  { id: "code-lockfile", title: "Lockfile committed", category: "code", severity: "low", method: "files", appliesTo: ["files"], how: "package.json without any lockfile." },
  { id: "code-gitignore-env", title: ".gitignore excludes .env", category: "code", severity: "medium", method: "files", appliesTo: ["files"], how: "Root .gitignore has a .env pattern (source projects only)." },
  { id: "code-readme", title: "README present", category: "code", severity: "low", method: "files", appliesTo: ["files"], how: "GitHub imports only." },
];

export const CATALOG_BY_ID = new Map(CATALOG.map((c) => [c.id, c]));
