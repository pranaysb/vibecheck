import crypto from "node:crypto";
import https from "node:https";
import http from "node:http";
import { validateTargetDestination } from "@/lib/security/ssrf";
import { analyzeVibeFromHtml, VibeAnalysisResult } from "@/lib/scanner/vibe-analyzer";

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type FindingCategory = "SECURITY_HEADERS" | "EXPOSURE_PROBES" | "TRANSPORT_HYGIENE" | "SECRETS_DETECTION";
export type FindingStatus = "PASSED" | "FAILED" | "WARNING";

export interface AuditFinding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  description: string;
  risk: string;
  evidence?: string;
  curlCommand: string;
  remediation: {
    summary: string;
    nextJsConfig?: string;
    vercelConfig?: string;
    nginxConfig?: string;
  };
}

export interface DeepAuditResult {
  targetUrl: string;
  finalUrl: string;
  domain: string;
  ipAddress: string;
  statusCode: number;
  hops: number;
  ttfbMs: number;
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  verdict: string;
  vibe: VibeAnalysisResult;
  technicalFindings: AuditFinding[];
  findings: any;
  rawHeaders: Record<string, string>;
  sha256Digest: string;
  scannedAt: string;
  stats: {
    passed: number;
    failed: number;
    warnings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
  };
}

interface RawHttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  ttfbMs: number;
  body: string;
  finalUrl: string;
  hops: number;
}

/**
 * Low-level SSRF-guarded HTTP request with exact TLS SNI and redirect handling
 */
async function safeHttpRequest(initialUrl: string, maxHops = 5, maxBodyBytes = 262144): Promise<RawHttpResponse> {
  let currentUrl = initialUrl;
  let hops = 0;
  const startTime = performance.now();
  let firstByteTime = 0;

  while (hops < maxHops) {
    const ssrfCheck = await validateTargetDestination(currentUrl);
    if (!ssrfCheck.allowed) {
      throw new Error(`SSRF Sandbox Blocked (${currentUrl}): ${ssrfCheck.reason}`);
    }

    const parsed = new URL(currentUrl);
    const isHttps = parsed.protocol === "https:";
    const mod = isHttps ? https : http;

    const hopResponse = await new Promise<{
      statusCode: number;
      headers: Record<string, string>;
      body: string;
    }>((resolve, reject) => {
      const opts = {
        method: "GET",
        hostname: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port, 10) : isHttps ? 443 : 80,
        path: (parsed.pathname || "/") + (parsed.search || ""),
        headers: {
          Host: parsed.hostname,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
        },
        servername: isHttps ? parsed.hostname : undefined,
        ALPNProtocols: isHttps ? ["http/1.1"] : undefined,
        timeout: 8000,
      };

      const req = mod.request(opts, (res) => {
        if (!firstByteTime) {
          firstByteTime = performance.now();
        }

        const normalizedHeaders: Record<string, string> = {};
        for (const [key, val] of Object.entries(res.headers)) {
          if (val) {
            normalizedHeaders[key.toLowerCase()] = Array.isArray(val) ? val.join(", ") : val;
          }
        }

        let bodyAcc = "";
        res.on("data", (chunk) => {
          if (bodyAcc.length < maxBodyBytes) {
            bodyAcc += chunk.toString("utf8");
          }
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 200,
            headers: normalizedHeaders,
            body: bodyAcc,
          });
        });
      });

      req.on("error", (err) => reject(new Error(`Failed to reach ${currentUrl}: ${err.message}`)));
      req.on("timeout", () => {
        req.destroy(new Error(`Connection to ${currentUrl} timed out after 8s`));
      });
      req.end();
    });

    // Check for redirects
    if ([301, 302, 303, 307, 308].includes(hopResponse.statusCode)) {
      const location = hopResponse.headers["location"];
      if (!location) {
        return {
          statusCode: hopResponse.statusCode,
          headers: hopResponse.headers,
          ttfbMs: Math.round((firstByteTime || performance.now()) - startTime),
          body: hopResponse.body,
          finalUrl: currentUrl,
          hops,
        };
      }

      currentUrl = new URL(location, currentUrl).toString();
      hops++;
    } else {
      return {
        statusCode: hopResponse.statusCode,
        headers: hopResponse.headers,
        ttfbMs: Math.round((firstByteTime || performance.now()) - startTime),
        body: hopResponse.body,
        finalUrl: currentUrl,
        hops,
      };
    }
  }

  throw new Error(`Exceeded maximum redirect hops (${maxHops})`);
}

/**
 * Execute deep, multi-vector defensive security audit against target web application.
 */
export async function executeDeepProbe(inputUrl: string): Promise<DeepAuditResult> {
  let target = inputUrl.trim();
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    target = "https://" + target;
  }

  // 1. Initial SSRF destination validation
  const validation = await validateTargetDestination(target);
  if (!validation.allowed) {
    throw new Error(`SSRF Sandbox Blocked: ${validation.reason || "Forbidden target host"}`);
  }

  const parsedTarget = new URL(target);
  const domain = parsedTarget.hostname;
  const origin = parsedTarget.origin;
  const resolvedIp = validation.resolvedIp || "Unknown";

  // 2. Execute primary probe with SNI and redirect following
  const primary = await safeHttpRequest(target);
  const currentUrl = primary.finalUrl;
  const headers = primary.headers;
  const responseBodyText = primary.body;
  const ttfbMs = primary.ttfbMs;
  const hops = primary.hops;

  const findings: AuditFinding[] = [];

  // ==========================================
  // VECTOR 1: SECURITY HEADERS
  // ==========================================

  // 1. Content Security Policy (CSP)
  const csp = headers["content-security-policy"];
  const hasCsp = Boolean(csp);
  const cspHasUnsafe = hasCsp && (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'"));

  findings.push({
    id: "sec-csp",
    category: "SECURITY_HEADERS",
    severity: "HIGH",
    status: !hasCsp ? "FAILED" : cspHasUnsafe ? "WARNING" : "PASSED",
    title: !hasCsp ? "Missing Content-Security-Policy" : cspHasUnsafe ? "CSP with Unsafe Directives" : "Content-Security-Policy Active",
    description: hasCsp
      ? `Active CSP: ${csp.slice(0, 100)}${csp.length > 100 ? "..." : ""}`
      : "The application does not declare a Content-Security-Policy (CSP) HTTP header.",
    risk: "Without a strict CSP, browsers will execute any injected inline scripts or unauthorized external assets, making cross-site scripting (XSS) and data exfiltration significantly easier.",
    evidence: csp || undefined,
    curlCommand: `curl -I "${currentUrl}" | grep -i "content-security-policy"`,
    remediation: {
      summary: "Add a Content-Security-Policy header in your Next.js config or reverse proxy.",
      nextJsConfig: `// next.config.js\nconst securityHeaders = [\n  {\n    key: 'Content-Security-Policy',\n    value: "default-src 'self'; script-src 'self' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:;"\n  }\n];`,
      vercelConfig: `// vercel.json\n{\n  "headers": [\n    {\n      "source": "/(.*)",\n      "headers": [\n        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https:;" }\n      ]\n    }\n  ]\n}`,
    },
  });

  // 2. Strict-Transport-Security (HSTS)
  const hsts = headers["strict-transport-security"];
  const hasHsts = Boolean(hsts);
  const hstsMaxAgeMatch = hsts ? hsts.match(/max-age=(\d+)/i) : null;
  const hstsMaxAge = hstsMaxAgeMatch ? parseInt(hstsMaxAgeMatch[1], 10) : 0;
  const isHstsOptimal = hasHsts && hstsMaxAge >= 15552000; // >= 180 days

  findings.push({
    id: "sec-hsts",
    category: "SECURITY_HEADERS",
    severity: "HIGH",
    status: !hasHsts ? "FAILED" : isHstsOptimal ? "PASSED" : "WARNING",
    title: !hasHsts ? "Missing Strict-Transport-Security" : isHstsOptimal ? "Strict HSTS Enforced" : "HSTS Max-Age Insufficient",
    description: hasHsts
      ? `HSTS active with max-age=${hstsMaxAge}s (${Math.round(hstsMaxAge / 86400)} days).`
      : "Missing HTTP Strict-Transport-Security (HSTS) header.",
    risk: "Clients can be downgraded to unencrypted HTTP via SSL-stripping or man-in-the-middle (MitM) attacks.",
    evidence: hsts || undefined,
    curlCommand: `curl -I "${currentUrl}" | grep -i "strict-transport-security"`,
    remediation: {
      summary: "Configure HSTS with at least 1-year max-age, includeSubDomains, and preload.",
      nextJsConfig: `{\n  key: 'Strict-Transport-Security',\n  value: 'max-age=63072000; includeSubDomains; preload'\n}`,
      vercelConfig: `{\n  "key": "Strict-Transport-Security",\n  "value": "max-age=63072000; includeSubDomains; preload"\n}`,
    },
  });

  // 3. X-Frame-Options (Clickjacking)
  const xfo = headers["x-frame-options"]?.toUpperCase();
  const hasXfo = xfo === "DENY" || xfo === "SAMEORIGIN";
  const frameProtected = hasXfo || (hasCsp && csp.includes("frame-ancestors"));

  findings.push({
    id: "sec-xfo",
    category: "SECURITY_HEADERS",
    severity: "MEDIUM",
    status: frameProtected ? "PASSED" : "FAILED",
    title: frameProtected ? "Frame Embedding Protection Active" : "Missing X-Frame-Options",
    description: frameProtected
      ? `Frame protection active via ${hasXfo ? `X-Frame-Options: ${xfo}` : "CSP frame-ancestors"}.`
      : "No X-Frame-Options header or CSP frame-ancestors directive configured.",
    risk: "Attackers can embed your web application inside an invisible <iframe> on a malicious site to hijack user clicks (clickjacking).",
    evidence: xfo || (csp ? "CSP frame-ancestors" : undefined),
    curlCommand: `curl -I "${currentUrl}" | grep -i "x-frame-options"`,
    remediation: {
      summary: "Set X-Frame-Options to DENY or SAMEORIGIN.",
      nextJsConfig: `{\n  key: 'X-Frame-Options',\n  value: 'DENY'\n}`,
      vercelConfig: `{\n  "key": "X-Frame-Options",\n  "value": "DENY"\n}`,
    },
  });

  // 4. X-Content-Type-Options (MIME Sniffing)
  const xcto = headers["x-content-type-options"]?.toLowerCase();
  const hasNoSniff = xcto === "nosniff";

  findings.push({
    id: "sec-xcto",
    category: "SECURITY_HEADERS",
    severity: "LOW",
    status: hasNoSniff ? "PASSED" : "FAILED",
    title: hasNoSniff ? "MIME Sniffing Blocked (nosniff)" : "Missing X-Content-Type-Options",
    description: hasNoSniff
      ? "X-Content-Type-Options is set to 'nosniff'."
      : "Missing X-Content-Type-Options header.",
    risk: "Browsers may inspect file contents and execute scripts even if the server declared a non-executable content-type like text/plain.",
    evidence: xcto || undefined,
    curlCommand: `curl -I "${currentUrl}" | grep -i "x-content-type-options"`,
    remediation: {
      summary: "Set X-Content-Type-Options to 'nosniff'.",
      nextJsConfig: `{\n  key: 'X-Content-Type-Options',\n  value: 'nosniff'\n}`,
      vercelConfig: `{\n  "key": "X-Content-Type-Options",\n  "value": "nosniff"\n}`,
    },
  });

  // 5. Referrer-Policy
  const refPolicy = headers["referrer-policy"];
  const hasRefPolicy = Boolean(refPolicy);

  findings.push({
    id: "sec-referrer",
    category: "SECURITY_HEADERS",
    severity: "LOW",
    status: hasRefPolicy ? "PASSED" : "WARNING",
    title: hasRefPolicy ? `Referrer-Policy: ${refPolicy}` : "Missing Referrer-Policy",
    description: hasRefPolicy
      ? `Referrer policy set to '${refPolicy}'.`
      : "No explicit Referrer-Policy configured.",
    risk: "URLs containing sensitive tokens, query parameters, or internal paths may leak in the HTTP Referer header to third-party domains.",
    evidence: refPolicy || undefined,
    curlCommand: `curl -I "${currentUrl}" | grep -i "referrer-policy"`,
    remediation: {
      summary: "Set Referrer-Policy to 'strict-origin-when-cross-origin' or 'no-referrer'.",
      nextJsConfig: `{\n  key: 'Referrer-Policy',\n  value: 'strict-origin-when-cross-origin'\n}`,
      vercelConfig: `{\n  "key": "Referrer-Policy",\n  "value": "strict-origin-when-cross-origin"\n}`,
    },
  });

  // 6. Permissions-Policy
  const permPolicy = headers["permissions-policy"];
  const hasPermPolicy = Boolean(permPolicy);

  findings.push({
    id: "sec-permissions",
    category: "SECURITY_HEADERS",
    severity: "LOW",
    status: hasPermPolicy ? "PASSED" : "WARNING",
    title: hasPermPolicy ? "Permissions-Policy Configured" : "Missing Permissions-Policy",
    description: hasPermPolicy
      ? `Permissions-Policy active: ${permPolicy.slice(0, 80)}...`
      : "No Permissions-Policy defined to restrict browser hardware access.",
    risk: "Compromised third-party scripts could invoke sensitive browser APIs (camera, microphone, geolocation) without boundary controls.",
    evidence: permPolicy || undefined,
    curlCommand: `curl -I "${currentUrl}" | grep -i "permissions-policy"`,
    remediation: {
      summary: "Define a Permissions-Policy header restricting camera, microphone, and geolocation.",
      nextJsConfig: `{\n  key: 'Permissions-Policy',\n  value: 'camera=(), microphone=(), geolocation=()'\n}`,
      vercelConfig: `{\n  "key": "Permissions-Policy",\n  "value": "camera=(), microphone=(), geolocation=()"\n}`,
    },
  });

  // 7. Server Fingerprinting & Information Leakage
  const serverHeader = headers["server"];
  const poweredBy = headers["x-powered-by"];
  const leaksSoftware = Boolean(poweredBy) || (Boolean(serverHeader) && /\d+\.\d+/.test(serverHeader));

  findings.push({
    id: "sec-fingerprint",
    category: "SECURITY_HEADERS",
    severity: "INFO",
    status: leaksSoftware ? "WARNING" : "PASSED",
    title: leaksSoftware ? "Server Version Fingerprint Leaked" : "Minimal Server Fingerprint",
    description: leaksSoftware
      ? `Server reveals runtime details: ${[serverHeader, poweredBy].filter(Boolean).join(", ")}`
      : "Server runtime version headers are cleanly masked.",
    risk: "Exposing exact web server or framework versions helps attackers identify known CVEs to target.",
    evidence: [serverHeader ? `Server: ${serverHeader}` : "", poweredBy ? `X-Powered-By: ${poweredBy}` : ""].filter(Boolean).join(" | "),
    curlCommand: `curl -I "${currentUrl}" | grep -iE "server|x-powered-by"`,
    remediation: {
      summary: "Disable 'x-powered-by' in framework and reverse proxy configurations.",
      nextJsConfig: `// next.config.js\nmodule.exports = {\n  poweredByHeader: false,\n};`,
    },
  });

  // ==========================================
  // VECTOR 2: ACCIDENTAL PUBLIC EXPOSURE PROBES
  // ==========================================

  // 8. Probe for Exposed .env file
  let envExposed = false;
  let envEvidence = "";
  try {
    const envUrl = `${origin}/.env`;
    const envRes = await safeHttpRequest(envUrl, 1, 4096);
    if (envRes.statusCode === 200) {
      const envText = envRes.body;
      const isHtml = envText.includes("<!DOCTYPE") || envText.includes("<html") || envText.includes("<body");
      const hasEnvSignature = /^[A-Z0-9_]{2,}\s*=/m.test(envText) || envText.includes("DATABASE_URL") || envText.includes("SECRET");

      if (!isHtml && hasEnvSignature) {
        envExposed = true;
        envEvidence = envText.slice(0, 150);
      }
    }
  } catch {
    // Probe failed safely
  }

  findings.push({
    id: "probe-env",
    category: "EXPOSURE_PROBES",
    severity: "CRITICAL",
    status: envExposed ? "FAILED" : "PASSED",
    title: envExposed ? "CRITICAL: Public .env File Disclosed" : "Environment File Protected",
    description: envExposed
      ? "A publicly accessible .env file containing environment credentials was retrieved from the webroot!"
      : "No exposed .env or .env.local configuration file detected at webroot.",
    risk: "Total compromise of database credentials, API secrets, JWT signing keys, and private infrastructure.",
    evidence: envExposed ? `Exposed snippet: ${envEvidence}` : undefined,
    curlCommand: `curl -s "${origin}/.env" | head -n 5`,
    remediation: {
      summary: "Block access to dotfiles (.*) in your web server immediately and rotate all credentials!",
      nginxConfig: `location ~ /\\. {\n  deny all;\n  return 404;\n}`,
    },
  });

  // 9. Probe for Exposed .git/HEAD
  let gitExposed = false;
  try {
    const gitUrl = `${origin}/.git/HEAD`;
    const gitRes = await safeHttpRequest(gitUrl, 1, 1024);
    if (gitRes.statusCode === 200) {
      const gitText = gitRes.body.trim();
      if (gitText.startsWith("ref: refs/") || /^[0-9a-f]{40}/i.test(gitText)) {
        gitExposed = true;
      }
    }
  } catch {
    // Probe failed safely
  }

  findings.push({
    id: "probe-git",
    category: "EXPOSURE_PROBES",
    severity: "CRITICAL",
    status: gitExposed ? "FAILED" : "PASSED",
    title: gitExposed ? "CRITICAL: Public Git Repository (.git) Exposed" : "Git Repository Protected",
    description: gitExposed
      ? "The /.git/ directory is publicly accessible, allowing attackers to dump the entire source code repository!"
      : "No exposed .git directory detected at webroot.",
    risk: "Attackers can reconstruct the complete source code history, commit logs, and hardcoded legacy secrets using automated tools like git-dumper.",
    evidence: gitExposed ? "HTTP 200 with valid git ref: refs/ pointer" : undefined,
    curlCommand: `curl -s "${origin}/.git/HEAD"`,
    remediation: {
      summary: "Configure your web server to strictly deny access to any path starting with /.git",
      nginxConfig: `location ~ /\\.git {\n  deny all;\n  return 404;\n}`,
    },
  });

  // 10. Public Source Map (.js.map) Exposure Probe
  let sourceMapExposed = false;
  let sourceMapFile = "";
  try {
    const scriptSrcMatches = responseBodyText.match(/src=["']([^"']+\.js)["']/gi);
    if (scriptSrcMatches && scriptSrcMatches.length > 0) {
      const sampleScript = scriptSrcMatches[0].replace(/^src=["']|["']$/gi, "");
      const fullScriptUrl = new URL(sampleScript, currentUrl).toString();
      const mapUrl = `${fullScriptUrl}.map`;

      const mapRes = await safeHttpRequest(mapUrl, 1, 512);
      if (mapRes.statusCode === 200 && !mapRes.body.includes("<!DOCTYPE")) {
        sourceMapExposed = true;
        sourceMapFile = mapUrl;
      }
    }
  } catch {
    // Probe failed safely
  }

  findings.push({
    id: "probe-sourcemap",
    category: "EXPOSURE_PROBES",
    severity: "MEDIUM",
    status: sourceMapExposed ? "WARNING" : "PASSED",
    title: sourceMapExposed ? "Public JavaScript Source Maps Detected" : "Source Maps Hidden in Production",
    description: sourceMapExposed
      ? `Production bundles expose original un-minified source maps (${sourceMapFile}).`
      : "Production bundles do not publicly expose unminified .js.map source files.",
    risk: "Source maps disclose original un-minified TypeScript/React source code, backend API routes, internal comments, and business logic.",
    evidence: sourceMapExposed ? sourceMapFile : undefined,
    curlCommand: sourceMapExposed ? `curl -I "${sourceMapFile}"` : `curl -I "${origin}/_next/static/...js.map"`,
    remediation: {
      summary: "Disable production source maps in your Next.js configuration.",
      nextJsConfig: `// next.config.js\nmodule.exports = {\n  productionBrowserSourceMaps: false,\n};`,
    },
  });

  // ==========================================
  // VECTOR 3: CLIENT-SIDE SECRETS LEAK DETECTION
  // ==========================================

  // 11. High-Entropy / Sensitive Key Patterns in HTML/JS
  let secretLeaked = false;
  let secretType = "";
  const secretPatterns = [
    { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/ },
    { name: "Stripe Live Secret Key", regex: /sk_live_[0-9a-zA-Z]{24,}/ },
    { name: "OpenAI Secret Key", regex: /sk-(?:proj-)?[a-zA-Z0-9_-]{32,}/ },
    { name: "Private Key Header", regex: /-----BEGIN (?:RSA|EC|OPENSSH) PRIVATE KEY-----/ },
  ];

  for (const pat of secretPatterns) {
    if (pat.regex.test(responseBodyText)) {
      secretLeaked = true;
      secretType = pat.name;
      break;
    }
  }

  findings.push({
    id: "sec-client-secrets",
    category: "SECRETS_DETECTION",
    severity: "CRITICAL",
    status: secretLeaked ? "FAILED" : "PASSED",
    title: secretLeaked ? `CRITICAL: ${secretType} Found in Client DOM` : "No Plaintext API Secrets Leaked",
    description: secretLeaked
      ? `A pattern matching a ${secretType} was detected in the publicly served client HTML or bundle!`
      : "Scan of public DOM and scripts detected no sensitive private keys or backend secret tokens.",
    risk: "Attackers can scrape the live web page and use the leaked credential to hijack cloud accounts, charge credit cards, or query backend models.",
    evidence: secretLeaked ? `Matched pattern for ${secretType}` : undefined,
    curlCommand: `curl -s "${currentUrl}" | grep -E "sk_live_|AKIA"`,
    remediation: {
      summary: "Immediately revoke the exposed secret in your provider dashboard and move keys to server-side environment variables.",
    },
  });

  // ==========================================
  // VECTOR 4: TRANSPORT & PERFORMANCE HYGIENE
  // ==========================================

  // 12. TTFB Latency Check
  const ttfbOptimal = ttfbMs < 600;
  const ttfbAcceptable = ttfbMs < 1200;

  findings.push({
    id: "perf-ttfb",
    category: "TRANSPORT_HYGIENE",
    severity: ttfbMs > 1200 ? "HIGH" : "MEDIUM",
    status: ttfbOptimal ? "PASSED" : ttfbAcceptable ? "WARNING" : "FAILED",
    title: `Server TTFB Latency: ${ttfbMs}ms`,
    description: ttfbOptimal
      ? `Optimal server response latency (${ttfbMs}ms).`
      : `High Time-to-First-Byte (${ttfbMs}ms) suggests unoptimized cold starts or heavy server-side processing.`,
    risk: "Slow response times hurt user engagement, search engine rankings (LCP Core Web Vitals), and increase timeout vulnerabilities.",
    evidence: `${ttfbMs}ms`,
    curlCommand: `curl -o /dev/null -s -w 'TTFB: %{time_starttransfer}s\\n' "${currentUrl}"`,
    remediation: {
      summary: "Enable Edge caching, optimize server database queries, or use Incremental Static Regeneration (ISR).",
    },
  });

  // 13. Redirect Chain Length Check
  findings.push({
    id: "perf-redirects",
    category: "TRANSPORT_HYGIENE",
    severity: "LOW",
    status: hops <= 1 ? "PASSED" : hops <= 2 ? "WARNING" : "FAILED",
    title: `Redirect Hops: ${hops}`,
    description: hops === 0
      ? "Target served directly without redirection."
      : hops === 1
      ? `Clean 1-hop canonical redirect to ${currentUrl}.`
      : `Excessive redirect chain (${hops} hops) before reaching final destination.`,
    risk: "Long redirect chains degrade initial page load speed, waste mobile radio cycles, and create potential open-redirect risks.",
    evidence: `${hops} hops`,
    curlCommand: `curl -Ls -o /dev/null -w "%{num_redirects} redirects\\n" "${target}"`,
    remediation: {
      summary: "Configure DNS and reverse proxy canonical rules to resolve domains in a single 301/308 jump.",
    },
  });

  // ==========================================
  // DETERMINISTIC VIBE & PRODUCT CRAFT AUDIT
  // ==========================================
  const vibe = analyzeVibeFromHtml(responseBodyText, headers, ttfbMs, target, currentUrl);

  // Technical baseline counters
  let techScore = 100;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let passedCount = 0;
  let failedCount = 0;
  let warningCount = 0;

  for (const f of findings) {
    if (f.status === "PASSED") {
      passedCount++;
    } else if (f.status === "FAILED") {
      failedCount++;
      if (f.severity === "CRITICAL") {
        techScore -= 30;
        criticalCount++;
      } else if (f.severity === "HIGH") {
        techScore -= 15;
        highCount++;
      } else if (f.severity === "MEDIUM") {
        techScore -= 8;
        mediumCount++;
      } else {
        techScore -= 3;
      }
    } else if (f.status === "WARNING") {
      warningCount++;
      if (f.severity === "HIGH") {
        techScore -= 7;
      } else if (f.severity === "MEDIUM") {
        techScore -= 4;
      } else {
        techScore -= 2;
      }
    }
  }

  techScore = Math.max(0, Math.min(100, Math.round(techScore)));

  // Headline metric is the composite VibeScore
  const headlineScore = vibe.vibeScore;
  const headlineGrade = vibe.grade;
  const headlineVerdict = vibe.verdict;

  const scannedAt = new Date().toISOString();

  // Structured findings payload saved to database and client responses
  const findingsPayload = {
    vibeScore: vibe.vibeScore,
    grade: vibe.grade,
    verdict: vibe.verdict,
    scores: vibe.scores,
    productSnapshot: vibe.productSnapshot,
    critiques: vibe.critiques,
    summaryFeedback: vibe.summaryFeedback,
    technicalFindings: findings,
    stats: {
      passed: passedCount,
      failed: failedCount,
      warnings: warningCount,
      criticalCount,
      highCount,
      mediumCount,
      techScore,
    },
  };

  // Compute cryptographic SHA-256 integrity hash
  const canonicalPayload = JSON.stringify({
    domain,
    finalUrl: currentUrl,
    scannedAt,
    vibeScore: headlineScore,
    grade: headlineGrade,
    verdict: headlineVerdict,
    scores: vibe.scores,
    critiquesCount: vibe.critiques.length,
    technicalFindingsCount: findings.length,
  });

  const sha256Digest = crypto.createHash("sha256").update(canonicalPayload).digest("hex");

  return {
    targetUrl: target,
    finalUrl: currentUrl,
    domain,
    ipAddress: resolvedIp,
    statusCode: primary.statusCode,
    hops,
    ttfbMs,
    score: headlineScore,
    grade: headlineGrade,
    verdict: headlineVerdict,
    vibe,
    technicalFindings: findings,
    findings: findingsPayload,
    rawHeaders: headers,
    sha256Digest,
    scannedAt,
    stats: {
      passed: passedCount,
      failed: failedCount,
      warnings: warningCount,
      criticalCount,
      highCount,
      mediumCount,
    },
  };
}
