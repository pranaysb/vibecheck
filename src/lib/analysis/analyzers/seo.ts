import { FindingCategory, Severity, Confidence } from "@prisma/client";
import { SafeFetchResult } from "../ssrf";
import { AnalysisFindingInput, CategoryScoreResult } from "../types";

export class SEOAnalyzer {
  static analyze(fetchResult: SafeFetchResult): CategoryScoreResult {
    const findings: AnalysisFindingInput[] = [];
    let checksPassed = 0;
    const checksTotal = 5;

    const html = fetchResult.bodySnippet;

    // 1. Title tag
    const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1].trim().length > 0) {
      checksPassed++;
      const titleLen = titleMatch[1].trim().length;
      if (titleLen < 15 || titleLen > 70) {
        findings.push({
          category: FindingCategory.SEO,
          severity: Severity.LOW,
          title: `Title tag length (${titleLen} chars) outside optimal range (15-65)`,
          description: "Search engines typically truncate page titles beyond 60-70 characters or rank short generic titles lower.",
          recommendation: "Refine `<title>` to describe unique value proposition within 40-60 characters.",
          confidence: Confidence.MEDIUM,
        });
      }
    } else {
      findings.push({
        category: FindingCategory.SEO,
        severity: Severity.HIGH,
        title: "Missing <title> element in document head",
        description: "The `<title>` tag is the most critical on-page SEO factor and controls browser tab titles.",
        recommendation: "Add a clear, descriptive `<title>` tag to `<head>`.",
        confidence: Confidence.HIGH,
      });
    }

    // 2. Meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    if (descMatch && descMatch[1].trim().length >= 30) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SEO,
        severity: Severity.MEDIUM,
        title: "Missing or truncated meta description",
        description: "Meta description provides the snippet preview under search results and social previews.",
        recommendation: "Provide a compelling `<meta name=\"description\" content=\"...\">` between 70 and 155 characters.",
        confidence: Confidence.HIGH,
      });
    }

    // 3. OpenGraph tags
    const hasOgTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
    const hasOgImage = /<meta[^>]+property=["']og:image["']/i.test(html);
    if (hasOgTitle && hasOgImage) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SEO,
        severity: Severity.LOW,
        title: "Incomplete OpenGraph social sharing meta tags",
        description: "Missing `og:title` or `og:image` meta tags hurts link previews when shared on X/Twitter, Slack, and Discord.",
        recommendation: "Add `og:title`, `og:description`, and `og:image` tags in `<head>`.",
        confidence: Confidence.HIGH,
      });
    }

    // 4. Canonical link tag
    if (/<link[^>]+rel=["']canonical["']/i.test(html)) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SEO,
        severity: Severity.LOW,
        title: "Missing canonical URL link tag",
        description: "A canonical link `<link rel=\"canonical\" href=\"...\">` prevents duplicate content indexing penalties.",
        recommendation: "Declare `<link rel=\"canonical\" href=\"https://yourdomain.com/...\" />`.",
        confidence: Confidence.MEDIUM,
      });
    }

    // 5. Charset declaration
    if (/<meta[^>]+charset=["']?[a-zA-Z0-9\-]+["']?/i.test(html)) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.SEO,
        severity: Severity.LOW,
        title: "Missing explicit charset declaration",
        description: "Browsers need explicit charset to avoid layout glitches or encoding misinterpretations.",
        recommendation: "Add `<meta charset=\"utf-8\" />` as the very first element in `<head>`.",
        confidence: Confidence.HIGH,
      });
    }

    const score = Math.min(100, Math.max(50, Math.round((checksPassed / checksTotal) * 100)));

    return {
      category: FindingCategory.SEO,
      score,
      findings,
      checksPassed,
      checksTotal,
    };
  }
}
