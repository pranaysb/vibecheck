import { strFromU8 } from "fflate";
import { contentTypeFor, findSiteRoot, isProbablyBinary, isTextPath, type Archive } from "./archive";
import { runBrowserAudit, type BrowserRun } from "./browser";
import { extractFacts, htmlChecks } from "./html-checks";
import { dedupe, parsePackageLock, parsePnpmLock, parseRequirements, parseTomlLock, parseYarnLock, queryOsv, type Pkg } from "./osv";
import { envAssignments, findSecrets, isEnvFile } from "./secrets";
import type { AuditMeta, CheckResult, ProgressFn } from "./types";

export interface StoredFile {
  path: string;
  contentType: string;
  data: Uint8Array;
}

export interface FilesAuditOutput {
  checks: CheckResult[];
  meta: AuditMeta;
  stored: StoredFile[];
  screenshots: BrowserRun["screenshots"];
}

const STORE_BUDGET = 25 * 1024 * 1024;
const MAX_HTML_DOCS = 60;

function evidence(items: string[], max = 8) {
  return items.length ? items.slice(0, max).concat(items.length > max ? [`…and ${items.length - max} more`] : []) : undefined;
}

function resolveRef(fromPath: string, ref: string, root: string): string | null {
  const clean = ref.split(/[?#]/)[0];
  if (!clean) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(clean);
  } catch {
    decoded = clean;
  }
  const base = decoded.startsWith("/") ? (root ? root.split("/") : []) : fromPath.split("/").slice(0, -1);
  const parts = [...base];
  for (const seg of decoded.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

export async function auditFiles(archive: Archive, opts: { source: "ZIP" | "GITHUB" }, step: ProgressFn): Promise<FilesAuditOutput> {
  const checks: CheckResult[] = [];
  const meta: AuditMeta = {};
  const files = archive.files;
  const byPath = new Map(files.map((f) => [f.path, f]));
  const paths = files.map((f) => f.path);
  const text = (path: string) => {
    const f = byPath.get(path);
    return f ? strFromU8(f.data) : "";
  };

  // ---------- Secrets ----------
  step(`Scanning ${files.length} files for secrets`);
  const envFiles = paths.filter(isEnvFile);
  const envWithValues = envFiles.map((p) => ({ p, keys: envAssignments(text(p)) })).filter((e) => e.keys.length);
  checks.push({
    id: "sec-committed-env",
    category: "security",
    severity: "critical",
    method: "files",
    title: "No real .env files included",
    status: envWithValues.length ? "fail" : "pass",
    detail: envWithValues.length
      ? `${envWithValues.length} env file(s) with real values are in the ${opts.source === "GITHUB" ? "repository" : "upload"}. Assume those values are public and rotate them.`
      : envFiles.length
        ? "Env files are present but contain no assigned values."
        : "No .env files (templates like .env.example are allowed).",
    evidence: evidence(envWithValues.map((e) => `${e.p}: ${e.keys.slice(0, 6).join(", ")}${e.keys.length > 6 ? "…" : ""} = <redacted>`)),
    fix: "Delete the file, add .env* to .gitignore (keep !.env.example), and rotate every key. For git history use git filter-repo.",
  });

  const leaks: string[] = [];
  let scanned = 0;
  for (const f of files) {
    if (isEnvFile(f.path) || f.data.length > 2 * 1024 * 1024) continue;
    if (!isTextPath(f.path) && isProbablyBinary(f.data)) continue;
    if (/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(f.path)) continue;
    scanned++;
    for (const hit of findSecrets(strFromU8(f.data), 5)) leaks.push(`${f.path}:${hit.line} ${hit.kind} ${hit.sample}`);
  }
  checks.push({
    id: "sec-file-secrets",
    category: "security",
    severity: "critical",
    method: "files",
    title: "No hardcoded secrets",
    status: leaks.length ? "fail" : "pass",
    detail: leaks.length
      ? `${leaks.length} credential-shaped value(s) found in source. Anything shipped to the browser or pushed to a public repo is readable by anyone.`
      : `${scanned} text files scanned for API keys, tokens, private keys and database URLs.`,
    evidence: evidence(leaks),
    fix: "Move secrets to environment variables read on the server, then rotate the leaked values.",
  });

  // ---------- Project hygiene ----------
  const manifests = paths.filter((p) => /(^|\/)(package\.json|requirements\.txt|pyproject\.toml)$/.test(p) && p.split("/").length <= 3);
  const isSourceProject = manifests.length > 0;
  if (isSourceProject) {
    const gitignore = byPath.has(".gitignore") ? text(".gitignore") : null;
    const ignoresEnv = gitignore ? /^\s*\/?\.env(\*|\.\*|\b)/m.test(gitignore) : false;
    checks.push({
      id: "code-gitignore-env",
      category: "code",
      severity: "medium",
      method: "files",
      title: ".gitignore excludes env files",
      status: ignoresEnv ? "pass" : "fail",
      detail: gitignore === null ? "No .gitignore at the project root." : ignoresEnv ? ".gitignore covers .env files." : ".gitignore exists but doesn't exclude .env files, so one `git add .` can publish your keys.",
      fix: "Add these lines to .gitignore:\n.env*\n!.env.example",
    });
  }

  // ---------- Dependencies ----------
  const lockfiles = paths.filter((p) => /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|requirements\.txt|poetry\.lock|uv\.lock)$/.test(p) && p.split("/").length <= 3);
  const pkgJsons = paths.filter((p) => /(^|\/)package\.json$/.test(p) && p.split("/").length <= 3);
  if (pkgJsons.length && !lockfiles.some((p) => /lock/.test(p))) {
    checks.push({
      id: "code-lockfile",
      category: "code",
      severity: "low",
      method: "files",
      title: "Dependency lockfile committed",
      status: "warn",
      detail: "package.json has no lockfile next to it, so every install can resolve different versions. It also means dependency vulnerabilities can't be checked.",
      evidence: pkgJsons,
      fix: "Commit package-lock.json, pnpm-lock.yaml or yarn.lock.",
    });
  }
  if (lockfiles.length) {
    step(`Checking dependencies against OSV.dev`);
    const pkgs: Pkg[] = [];
    const parseErrors: string[] = [];
    for (const lf of lockfiles) {
      try {
        const t = text(lf);
        if (lf.endsWith("package-lock.json")) pkgs.push(...parsePackageLock(t));
        else if (lf.endsWith("pnpm-lock.yaml")) pkgs.push(...parsePnpmLock(t));
        else if (lf.endsWith("yarn.lock")) pkgs.push(...parseYarnLock(t));
        else if (lf.endsWith("requirements.txt")) pkgs.push(...parseRequirements(t));
        else pkgs.push(...parseTomlLock(t));
      } catch {
        parseErrors.push(lf);
      }
    }
    const unique = dedupe(pkgs);
    if (!unique.length) {
      checks.push({
        id: "code-dependency-vulns",
        category: "code",
        severity: "high",
        method: "osv",
        title: "Known vulnerabilities in dependencies",
        status: "skip",
        detail: `Found ${lockfiles.join(", ")} but no pinned versions could be read from it.`,
      });
    } else {
      try {
        const { vulns, queried, truncatedDetails } = await queryOsv(unique);
        const rank = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3, UNKNOWN: 4 };
        vulns.sort((a, b) => rank[a.severity] - rank[b.severity]);
        const serious = vulns.filter((v) => v.severity === "CRITICAL" || v.severity === "HIGH");
        const affected = new Set(vulns.map((v) => `${v.pkg.name}@${v.pkg.version}`));
        checks.push({
          id: "code-dependency-vulns",
          category: "code",
          severity: "high",
          method: "osv",
          title: "Known vulnerabilities in dependencies",
          status: serious.length ? "fail" : vulns.length ? "warn" : "pass",
          detail: vulns.length
            ? `${vulns.length} advisories affect ${affected.size} of ${queried} locked packages (${serious.length} high or critical).${truncatedDetails ? " Severity was looked up for the first 60 advisories." : ""}`
            : `${queried} locked package versions checked; none have published advisories in OSV.dev.`,
          evidence: evidence(vulns.map((v) => `${v.severity} ${v.pkg.name}@${v.pkg.version} — ${v.id}: ${v.summary}${v.fixed ? ` (fixed in ${v.fixed})` : ""}`), 10),
          fix: serious.length ? "Upgrade the listed packages to the fixed versions; `npm audit fix` handles most npm cases." : undefined,
        });
      } catch (err) {
        checks.push({
          id: "code-dependency-vulns",
          category: "code",
          severity: "high",
          method: "osv",
          title: "Known vulnerabilities in dependencies",
          status: "skip",
          detail: `OSV.dev could not be reached (${(err as Error).message}); this check did not run.`,
        });
      }
    }
  }
  if (opts.source === "GITHUB") {
    checks.push({
      id: "code-readme",
      category: "code",
      severity: "low",
      method: "files",
      title: "README present",
      status: paths.some((p) => /^readme(\.\w+)?$/i.test(p)) ? "pass" : "warn",
      detail: paths.some((p) => /^readme(\.\w+)?$/i.test(p)) ? "A README is at the repository root." : "No README at the repository root.",
    });
  }

  // ---------- Static site ----------
  const root = findSiteRoot(paths);
  const prefix = root ? root + "/" : "";
  const siteFiles = root === null ? [] : files.filter((f) => f.path.startsWith(prefix));
  meta.files = { total: files.length, stored: 0, bytes: files.reduce((n, f) => n + f.data.length, 0), root };
  let screenshots: BrowserRun["screenshots"] = [];

  if (root !== null) {
    const entryHtml = text(prefix + "index.html");
    const unbuilt = /<script[^>]+src=["'][^"']+\.(tsx?|jsx)["']/i.test(entryHtml);
    const htmlFiles = siteFiles.filter((f) => /\.html?$/i.test(f.path)).sort((a, b) => (a.path === prefix + "index.html" ? -1 : b.path === prefix + "index.html" ? 1 : a.path.localeCompare(b.path)));

    if (unbuilt) {
      meta.browser = { ran: false, reason: `${prefix}index.html loads TypeScript/JSX directly, so it is a dev template, not a build. Run your build and upload the output folder, or audit the deployed URL.` };
    } else {
      step(`Checking ${Math.min(htmlFiles.length, MAX_HTML_DOCS)} HTML file(s)`);
      const docs = htmlFiles.slice(0, MAX_HTML_DOCS).map((f) => ({ label: f.path, html: strFromU8(f.data) }));
      checks.push(...htmlChecks(docs, { isHttps: true }));

      // Broken local references
      const sitePaths = new Set(siteFiles.map((f) => f.path));
      const broken: string[] = [];
      for (const d of docs) {
        for (const ref of new Set(extractFacts(d).localRefs)) {
          if (!/\.[a-z0-9]{1,6}$/i.test(ref.split(/[?#]/)[0])) continue; // extensionless refs may be client routes
          const resolved = resolveRef(d.label, ref, root);
          if (resolved !== null && !sitePaths.has(resolved)) broken.push(`${d.label} → ${ref}`);
        }
      }
      checks.push({
        id: "rel-broken-refs",
        category: "reliability",
        severity: "medium",
        method: "files",
        title: "No broken local file references",
        status: broken.length ? "fail" : "pass",
        detail: broken.length ? `${broken.length} reference(s) point at files that are not in the upload.` : "Every local script, stylesheet, image and file link resolves.",
        evidence: evidence(broken),
      });

      // Heavy assets
      const heavy = siteFiles
        .filter((f) => (/\.(png|jpe?g|gif|webp|avif|bmp|tiff?)$/i.test(f.path) && f.data.length > 400 * 1024) || (/\.m?js$/i.test(f.path) && f.data.length > 1024 * 1024) || (/\.(mp4|webm|mov)$/i.test(f.path) && f.data.length > 8 * 1024 * 1024))
        .sort((a, b) => b.data.length - a.data.length)
        .map((f) => `${f.path} ${(f.data.length / 1024).toFixed(0)} KB`);
      checks.push({
        id: "perf-heavy-assets",
        category: "performance",
        severity: "medium",
        method: "files",
        title: "No oversized assets",
        status: heavy.length === 0 ? "pass" : heavy.length <= 2 ? "warn" : "fail",
        detail: heavy.length ? `${heavy.length} file(s) exceed the budget (images 400 KB, scripts 1 MB, video 8 MB).` : "Images, scripts and video are within size budgets.",
        evidence: evidence(heavy),
        fix: "Resize images to their display size and export as AVIF or WebP; code-split large bundles.",
      });

      step("Rendering the site in headless Chromium (desktop + 390px mobile)");
      const site = {
        entry: "index.html",
        files: new Map(siteFiles.map((f) => [f.path.slice(prefix.length), { data: f.data, contentType: contentTypeFor(f.path) }])),
      };
      const browser = await runBrowserAudit({ site });
      meta.browser = { ran: browser.ran, reason: browser.reason, requests: browser.requests, transferBytes: browser.transferBytes };
      checks.push(...browser.checks);
      screenshots = browser.screenshots;
      const titleMatch = entryHtml.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch) meta.title = titleMatch[1].trim();
    }
  } else {
    meta.browser = { ran: false, reason: "No index.html found, so there is no page to render. Upload your build output (dist/, build/, out/) or audit the deployed URL." };
  }

  // ---------- Choose what to keep for expert review ----------
  const stored: StoredFile[] = [];
  let budget = STORE_BUDGET;
  const ordered = [...siteFiles, ...files.filter((f) => !f.path.startsWith(prefix) || root === null)];
  const seen = new Set<string>();
  for (const f of ordered) {
    if (seen.has(f.path)) continue;
    seen.add(f.path);
    const inSite = root !== null && f.path.startsWith(prefix);
    if (isEnvFile(f.path)) continue; // never persist real env files
    if (!inSite && (!isTextPath(f.path) || f.data.length > 512 * 1024)) continue;
    if (f.data.length > budget) continue;
    budget -= f.data.length;
    stored.push({ path: f.path, contentType: contentTypeFor(f.path), data: f.data });
  }
  meta.files.stored = stored.length;
  meta.files.truncated = stored.length < files.length;

  return { checks, meta, stored, screenshots };
}
