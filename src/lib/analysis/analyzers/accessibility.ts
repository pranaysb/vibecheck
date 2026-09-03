import { FindingCategory, Severity, Confidence } from "@prisma/client";
import { SafeFetchResult } from "../ssrf";
import { AnalysisFindingInput, CategoryScoreResult } from "../types";

export class AccessibilityAnalyzer {
  static analyze(fetchResult: SafeFetchResult): CategoryScoreResult {
    const findings: AnalysisFindingInput[] = [];
    let checksPassed = 0;
    const checksTotal = 6;

    const html = fetchResult.bodySnippet;

    // 1. Check <html lang="...">
    if (/<html[^>]+lang=["'][a-zA-Z\-]+["']/i.test(html)) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.ACCESSIBILITY,
        severity: Severity.MEDIUM,
        title: "Missing or empty language attribute on <html> element",
        description: "Without a valid `lang` attribute, screen readers cannot determine the correct language pronunciation rules.",
        evidence: "Tag `<html>` lacks a valid `lang=\"...\"` attribute.",
        recommendation: "Add `lang=\"en\"` (or appropriate locale) to the root `<html>` tag.",
        confidence: Confidence.HIGH,
      });
    }

    // 2. Images missing alt attributes
    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    const missingAlt = imgTags.filter((tag) => !/alt=["'][^"']*["']/i.test(tag));
    if (missingAlt.length === 0) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.ACCESSIBILITY,
        severity: Severity.HIGH,
        title: `Images missing alt attributes (${missingAlt.length} found)`,
        description: "Images without an `alt` attribute prevent visually impaired users and screen readers from understanding visual context.",
        evidence: `Example: ${missingAlt[0].slice(0, 80)}...`,
        recommendation: "Provide informative `alt=\"...\"` text for content images, or `alt=\"\"` for purely decorative graphics.",
        confidence: Confidence.HIGH,
      });
    }

    // 3. Buttons without accessible names
    const buttonMatches = html.match(/<button\b[^>]*>([\s\S]*?)<\/button>/gi) || [];
    let emptyButtons = 0;
    for (const btn of buttonMatches) {
      const hasAria = /aria-label=["'][^"']+["']/i.test(btn) || /aria-labelledby=["'][^"']+["']/i.test(btn);
      const innerText = btn.replace(/<[^>]+>/g, "").trim();
      if (!hasAria && innerText.length === 0) {
        emptyButtons++;
      }
    }

    if (emptyButtons === 0) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.ACCESSIBILITY,
        severity: Severity.HIGH,
        title: `Buttons lacking accessible name or aria-label (${emptyButtons} found)`,
        description: "Icon-only buttons without text content or `aria-label` are announced as unlabelled buttons by assistive technologies.",
        evidence: `Discovered ${emptyButtons} button element(s) with neither text nor aria-label.`,
        recommendation: 'Add `aria-label="Action description"` to all icon buttons.',
        confidence: Confidence.HIGH,
      });
    }

    // 4. Viewport zoom disabled
    if (/name=["']viewport["'][^>]*content=["'][^"']*(user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?)[^"']*["']/i.test(html)) {
      findings.push({
        category: FindingCategory.ACCESSIBILITY,
        severity: Severity.MEDIUM,
        title: "Pinch-to-zoom is disabled by viewport meta tag",
        description: "Disabling browser zoom with `user-scalable=no` or `maximum-scale=1` harms low-vision users who rely on magnification.",
        evidence: "Discovered user-scalable=no or maximum-scale=1 in viewport content.",
        recommendation: "Remove `user-scalable=no` and allow users to zoom up to at least 200%.",
        confidence: Confidence.HIGH,
      });
    } else {
      checksPassed++;
    }

    // 5. Main heading (H1) structure
    if (/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.ACCESSIBILITY,
        severity: Severity.LOW,
        title: "Missing top-level <h1> heading in document",
        description: "Screen reader users navigate documents using heading shortcuts. Every page should have a single descriptive `<h1>`.",
        recommendation: "Ensure a primary `<h1>` represents the page's core subject.",
        confidence: Confidence.HIGH,
      });
    }

    // 6. Form inputs missing labels
    const inputs = html.match(/<input\b[^>]*>/gi) || [];
    const textInputs = inputs.filter((inp) => !/type=["'](hidden|submit|button|reset|image)["']/i.test(inp));
    const unlabelled = textInputs.filter((inp) => !/aria-label=["'][^"']+["']/i.test(inp) && !/id=["'][^"']+["']/i.test(inp));

    if (unlabelled.length === 0) {
      checksPassed++;
    } else {
      findings.push({
        category: FindingCategory.ACCESSIBILITY,
        severity: Severity.MEDIUM,
        title: `Form inputs without accessible labels or IDs (${unlabelled.length} found)`,
        description: "Form controls must have an associated `<label for=\"...\">` or an explicit `aria-label`.",
        recommendation: "Associate inputs with labels using matching `id` and `for` attributes.",
        confidence: Confidence.HIGH,
      });
    }

    const score = Math.min(100, Math.max(45, Math.round((checksPassed / checksTotal) * 100)));

    return {
      category: FindingCategory.ACCESSIBILITY,
      score,
      findings,
      checksPassed,
      checksTotal,
    };
  }
}
