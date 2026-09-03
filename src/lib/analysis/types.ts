import { FindingCategory, Severity, Confidence, FindingStatus } from "@prisma/client";

export interface AnalysisFindingInput {
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  evidence?: string;
  recommendation: string;
  confidence: Confidence;
}

export interface CategoryScoreResult {
  category: FindingCategory;
  score: number;
  findings: AnalysisFindingInput[];
  checksPassed: number;
  checksTotal: number;
}

export interface FullAnalysisResult {
  overallScore: number;
  categoryScores: {
    product: number;
    ux: number;
    engineering: number;
    security: number;
    performance: number;
    accessibility: number;
    documentation: number;
  };
  findings: AnalysisFindingInput[];
  metadata: {
    scannedUrl?: string;
    repoUrl?: string;
    durationMs: number;
    isMockFallback?: boolean;
    timestamp: string;
  };
}
