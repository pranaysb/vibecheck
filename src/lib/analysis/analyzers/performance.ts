import { FindingCategory, Severity, Confidence } from "@prisma/client";
import { SafeFetchResult } from "../ssrf";
import { AnalysisFindingInput, CategoryScoreResult } from "../types";

export class PerformanceAnalyzer {
  static analyze(fetchResult: SafeFetchResult): CategoryScoreResult {
    const findings: AnalysisFindingInput[] = [];
    let checksPassed = 0;
    const checksTotal = 5;

    const headers = fetchResult.headers;
    const durationMs = fetchResult.durationMs;

    // 1. Initial TTFB / Response Latency
    if (durationMs > 0 && durationMs < 800) {
      checksPassed++;
    } else if (durationMs >= 800 && durationMs < 1800) {
      checksPassed += 0.5;
      findings.push({
        category: FindingCategory.PERFORMANCE,
        severity: Severity.LOW,
        title: "Moderate server response latency",
        description: `Initial document response took ${durationMs}ms. Target under 600ms for optimal Largest Contentful Paint (LCP).`,
        evidence: `Initial HTTP duration: ${durationMs}ms`,
        recommendation: "Deploy edge caching, database query indexing, or server-side rendering streaming.",
        confidence: Confidence.HIGH,
      });
    } else if (durationMs >= 1800) {
      findings.push({
        category: FindingCategory.PERFORMANCE,
        severity: Severity.HIGH,
        title: "Slow initial server response (TTFB)",
        description: `Server took ${durationMs}ms to respond with initial HTML. This severely degrades user experience and Core Web Vitals.`,
        evidence: `Initial HTTP duration: ${durationMs}ms`,
        recommendation: "Investigate server bottlenecks, leverage Edge CDN caching, or convert dynamic queries to static generation.",
        confidence: Confidence.HIGH,
      });
    } else {
      checksPassed++;
    }

    // 2. HTTP Compression (gzip / brotli)
    const encoding = headers["content-encoding"] || "";
    if (encoding.includes("gzip") || encoding.includes("br") || encoding.includes("zstd")) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.PERFORMANCE,
        severity: Severity.MEDIUM,
        title: "HTTP payload compression not enabled",
        description: "Response was delivered uncompressed. Text-based assets (HTML, JS, CSS) should be served with Brotli or Gzip compression.",
        evidence: "Missing 'content-encoding: gzip' or 'br' header.",
        recommendation: "Enable Gzip or Brotli compression at your reverse proxy (Vercel, Cloudflare, Nginx).",
        confidence: Confidence.HIGH,
      });
    }

    // 3. Cache-Control Header
    if (headers["cache-control"]) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.PERFORMANCE,
        severity: Severity.LOW,
        title: "Missing Cache-Control header",
        description: "Static responses lack caching directives, causing repeat visitors to download redundant assets.",
        evidence: "Header 'cache-control' is absent.",
        recommendation: "Specify `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` for public pages.",
        confidence: Confidence.MEDIUM,
      });
    }

    // 4. Large inline base64 images check
    const base64Matches = fetchResult.bodySnippet.match(/data:image\/[a-zA-Z]+;base64,[^"']{1000,}/g);
    if (base64Matches && base64Matches.length > 2) {
      findings.push({
        category: FindingCategory.PERFORMANCE,
        severity: Severity.MEDIUM,
        title: "Oversized inline base64 images detected",
        description: `Found ${base64Matches.length} large base64 data URIs embedded directly inside HTML. This inflates initial document download size and blocks DOM rendering.`,
        evidence: `Discovered multiple inline base64 image strings exceeding 1KB each.`,
        recommendation: "Serve images as separate external static assets with WebP/AVIF formatting and proper cache headers.",
        confidence: Confidence.HIGH,
      });
    } else {
      checksPassed++;
    }

    // 5. Script count & render blocking
    const scriptTags = fetchResult.bodySnippet.match(/<script\b[^>]*>/gi) || [];
    if (scriptTags.length > 25) {
      findings.push({
        category: FindingCategory.PERFORMANCE,
        severity: Severity.LOW,
        title: "High quantity of synchronous client script tags",
        description: `Detected ${scriptTags.length} script tags in document head/body. Multiple unbundled scripts can block parsing.`,
        recommendation: "Consolidate scripts with a modern bundler and add `defer` or `async` attributes.",
        confidence: Confidence.MEDIUM,
      });
    } else {
      checksPassed++;
    }

    const score = Math.min(100, Math.max(40, Math.round((checksPassed / checksTotal) * 100)));

    return {
      category: FindingCategory.PERFORMANCE,
      score,
      findings,
      checksPassed,
      checksTotal,
    };
  }
}
