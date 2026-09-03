import { safeFetchUrl, SafeFetchResult } from "./ssrf";
import { SecurityAnalyzer } from "./analyzers/security";
import { PerformanceAnalyzer } from "./analyzers/performance";
import { AccessibilityAnalyzer } from "./analyzers/accessibility";
import { DependencyAnalyzer } from "./analyzers/dependencies";
import { CodeQualityAnalyzer } from "./analyzers/code-quality";
import { SEOAnalyzer } from "./analyzers/seo";
import { FullAnalysisResult, AnalysisFindingInput } from "./types";
import { FindingCategory, Severity, Confidence } from "@prisma/client";

export class AnalysisEngine {
  static async runAnalysis(params: {
    liveUrl: string;
    githubUrl?: string | null;
    techStack?: string[];
    whatBuilt?: string | null;
    title?: string;
  }): Promise<FullAnalysisResult> {
    const startTime = Date.now();
    let fetchResult: SafeFetchResult = await safeFetchUrl(params.liveUrl);

    let isMockFallback = false;

    // If the URL failed to fetch (e.g. mock demo domain, unreachable dev port),
    // synthesize a safe, realistic response so the analysis workflow is fully demonstrable
    if (!fetchResult.ok || !fetchResult.bodySnippet) {
      isMockFallback = true;
      fetchResult = {
        ok: true,
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-encoding": "gzip",
          "cache-control": "public, max-age=0, must-revalidate",
          "x-powered-by": "Next.js",
        },
        bodySnippet: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${params.title || "Vibe-Coded Project"} - Official Showcase</title>
  <meta name="description" content="AI-assisted project built with modern web technologies." />
  <meta property="og:title" content="${params.title || "Project"}" />
</head>
<body>
  <header><h1>${params.title || "Project"}</h1></header>
  <main>
    <p>Welcome to ${params.title || "our application"}.</p>
    <button>Submit</button>
  </main>
</body>
</html>`,
        durationMs: 420,
        finalUrl: params.liveUrl,
        tlsInfo: { isHttps: params.liveUrl.startsWith("https://") },
      };
    }

    // Run analyzers
    const security = SecurityAnalyzer.analyze(fetchResult, params.githubUrl);
    const performance = PerformanceAnalyzer.analyze(fetchResult);
    const accessibility = AccessibilityAnalyzer.analyze(fetchResult);
    const dependencies = DependencyAnalyzer.analyze(params.githubUrl, params.techStack || []);
    const codeQuality = CodeQualityAnalyzer.analyze(params.githubUrl, params.whatBuilt);
    const seo = SEOAnalyzer.analyze(fetchResult);

    // Combine all findings
    const allFindings: AnalysisFindingInput[] = [
      ...security.findings,
      ...performance.findings,
      ...accessibility.findings,
      ...dependencies.findings,
      ...codeQuality.findings,
      ...seo.findings,
    ];

    // Compute subscores
    const securityScore = security.score;
    const performanceScore = performance.score;
    const accessibilityScore = accessibility.score;
    const engineeringScore = Math.round((codeQuality.score * 0.6) + (dependencies.score * 0.4));
    const uxScore = Math.round((accessibility.score * 0.5) + (performance.score * 0.5));
    const productScore = Math.min(95, Math.max(70, Math.round((seo.score * 0.4) + (uxScore * 0.6))));
    const documentationScore = params.whatBuilt && params.whatBuilt.length > 100 ? 82 : 70;

    // Weighted aggregate Vibe Score
    const overallScore = Math.round(
      productScore * 0.15 +
      uxScore * 0.15 +
      engineeringScore * 0.20 +
      securityScore * 0.20 +
      performanceScore * 0.15 +
      accessibilityScore * 0.10 +
      documentationScore * 0.05
    );

    return {
      overallScore,
      categoryScores: {
        product: productScore,
        ux: uxScore,
        engineering: engineeringScore,
        security: securityScore,
        performance: performanceScore,
        accessibility: accessibilityScore,
        documentation: documentationScore,
      },
      findings: allFindings,
      metadata: {
        scannedUrl: params.liveUrl,
        repoUrl: params.githubUrl || undefined,
        durationMs: Date.now() - startTime,
        isMockFallback,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
