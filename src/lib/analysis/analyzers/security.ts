import { FindingCategory, Severity, Confidence } from "@prisma/client";
import { SafeFetchResult } from "../ssrf";
import { AnalysisFindingInput, CategoryScoreResult } from "../types";

export class SecurityAnalyzer {
  static analyze(fetchResult: SafeFetchResult, repoUrl?: string | null): CategoryScoreResult {
    const findings: AnalysisFindingInput[] = [];
    let checksPassed = 0;
    const checksTotal = 7;

    const headers = fetchResult.headers;
    const isHttps = fetchResult.tlsInfo?.isHttps ?? fetchResult.finalUrl.startsWith("https://");

    // 1. Check HTTPS
    if (isHttps) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SECURITY,
        severity: Severity.HIGH,
        title: "Insecure HTTP connection detected",
        description: "The live URL does not enforce TLS encryption (HTTPS). Traffic, authentication tokens, and user submissions are sent in plaintext.",
        evidence: `Target URL protocol: ${fetchResult.finalUrl}`,
        recommendation: "Redirect all HTTP traffic to HTTPS and configure modern TLS 1.3 certificates.",
        confidence: Confidence.HIGH,
      });
    }

    // 2. Strict-Transport-Security (HSTS)
    if (headers["strict-transport-security"]) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SECURITY,
        severity: Severity.MEDIUM,
        title: "Missing Strict-Transport-Security (HSTS) header",
        description: "Without HSTS, initial user connections may be downgraded or intercepted by SSL stripping attacks.",
        evidence: "Header 'strict-transport-security' is absent in server response.",
        recommendation: "Add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` to production headers.",
        confidence: Confidence.HIGH,
      });
    }

    // 3. Content-Security-Policy (CSP)
    if (headers["content-security-policy"]) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SECURITY,
        severity: Severity.MEDIUM,
        title: "Missing Content-Security-Policy (CSP) header",
        description: "A robust CSP prevents Cross-Site Scripting (XSS) and data injection by specifying authorized domains for scripts, styles, and frames.",
        evidence: "Header 'content-security-policy' is absent in server response.",
        recommendation: "Define a restrictive CSP allowing only trusted script-src, object-src 'none', and base-uri 'self'.",
        confidence: Confidence.HIGH,
      });
    }

    // 4. X-Content-Type-Options
    if (headers["x-content-type-options"]?.toLowerCase().includes("nosniff")) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SECURITY,
        severity: Severity.LOW,
        title: "Missing X-Content-Type-Options: nosniff",
        description: "Prevents browsers from MIME-sniffing a response away from the declared content-type, blocking script execution masquerading as images.",
        evidence: "Header 'x-content-type-options' was not set to 'nosniff'.",
        recommendation: "Set `X-Content-Type-Options: nosniff` on all HTTP responses.",
        confidence: Confidence.HIGH,
      });
    }

    // 5. Frame Protection (X-Frame-Options / frame-ancestors)
    if (headers["x-frame-options"] || headers["content-security-policy"]?.includes("frame-ancestors")) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SECURITY,
        severity: Severity.MEDIUM,
        title: "Missing Clickjacking protection",
        description: "Without X-Frame-Options or CSP frame-ancestors, attackers can embed your web pages into malicious iframes to hijack clicks.",
        evidence: "Neither 'X-Frame-Options' nor 'frame-ancestors' detected in response headers.",
        recommendation: "Add `X-Frame-Options: DENY` or `X-Frame-Options: SAMEORIGIN`.",
        confidence: Confidence.HIGH,
      });
    }

    // 6. Referrer Policy
    if (headers["referrer-policy"]) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SECURITY,
        severity: Severity.LOW,
        title: "Missing Referrer-Policy header",
        description: "Controls how much referrer information is sent along with external links and asset requests.",
        evidence: "Header 'referrer-policy' is absent in server response.",
        recommendation: "Set `Referrer-Policy: strict-origin-when-cross-origin`.",
        confidence: Confidence.HIGH,
      });
    }

    // 7. Secret pattern scanning in body HTML / scripts
    const secretPatterns = [
      { name: "Stripe Live Secret Key", regex: /sk_live_[0-9a-zA-Z]{24}/ },
      { name: "GitHub Personal Access Token", regex: /ghp_[0-9a-zA-Z]{36}/ },
      { name: "OpenAI Secret Key", regex: /sk-[a-zA-Z0-9]{48}/ },
      { name: "AWS Access Key ID", regex: /AKIA[0-9A-Z]{16}/ },
    ];

    let foundSecret = false;
    for (const pattern of secretPatterns) {
      if (pattern.regex.test(fetchResult.bodySnippet)) {
        foundSecret = true;
        findings.push({
          category: FindingCategory.SECURITY,
          severity: Severity.CRITICAL,
          title: `Potential exposed credential: ${pattern.name}`,
          description: `A string matching the signature of a ${pattern.name} was discovered in the public client-side payload.`,
          evidence: "Matching pattern detected in client document HTML.",
          recommendation: "Immediately revoke this credential in your provider dashboard and move secret keys to server-only environment variables.",
          confidence: Confidence.HIGH,
        });
        break;
      }
    }
    if (!foundSecret) {
      checksPassed++;
    }

    // Calculate normalized score (0 - 100)
    let score = Math.round((checksPassed / checksTotal) * 100);
    // Severe penalty if critical secret or plain HTTP
    if (foundSecret) score = Math.min(score, 45);
    if (!isHttps) score = Math.min(score, 50);

    return {
      category: FindingCategory.SECURITY,
      score,
      findings,
      checksPassed,
      checksTotal,
    };
  }
}
