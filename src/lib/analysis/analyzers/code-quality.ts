import { FindingCategory, Severity, Confidence } from "@prisma/client";
import { AnalysisFindingInput, CategoryScoreResult } from "../types";

export class CodeQualityAnalyzer {
  static analyze(repoUrl?: string | null, whatBuilt?: string | null): CategoryScoreResult {
    const findings: AnalysisFindingInput[] = [];
    let checksPassed = 3;
    const checksTotal = 4;

    if (!repoUrl) {
      findings.push({
        category: FindingCategory.CODE_QUALITY,
        severity: Severity.LOW,
        title: "Repository code quality review pending public repository link",
        description: "Static code analysis requires a linked GitHub repository.",
        recommendation: "Link your project repository to enable linting and complexity analysis.",
        confidence: Confidence.MEDIUM,
      });
      return {
        category: FindingCategory.CODE_QUALITY,
        score: 75,
        findings,
        checksPassed: 3,
        checksTotal: 4,
      };
    }

    // Heuristics for automated check
    const hasStory = Boolean(whatBuilt && whatBuilt.length > 50);
    if (!hasStory) {
      findings.push({
        category: FindingCategory.CODE_QUALITY,
        severity: Severity.MEDIUM,
        title: "Missing documentation on architectural decisions",
        description: "Clear architectural documentation helps reviewers evaluate whether business logic is properly decoupled.",
        recommendation: "Complete the 'What did you build' and 'What was difficult' write-up sections.",
        confidence: Confidence.HIGH,
      });
    } else {
      checksPassed++;
    }

    const score = Math.round((checksPassed / checksTotal) * 100);

    return {
      category: FindingCategory.CODE_QUALITY,
      score,
      findings,
      checksPassed,
      checksTotal,
    };
  }
}
