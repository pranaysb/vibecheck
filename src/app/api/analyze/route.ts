import { NextResponse } from "next/server";
import { AnalysisEngine } from "@/lib/analysis/engine";
import { prisma } from "@/lib/db";
import { FindingStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, liveUrl, githubUrl, title } = body;

    if (!liveUrl) {
      return NextResponse.json({ error: "liveUrl is required" }, { status: 400 });
    }

    // Run safe analysis
    const result = await AnalysisEngine.runAnalysis({
      liveUrl,
      githubUrl,
      title,
    });

    // If a projectId was supplied, persist the findings and updated scores
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
      });

      if (project) {
        const latestVersion = project.versions[0]?.versionNumber || "v1";

        // Update project scores
        await prisma.project.update({
          where: { id: projectId },
          data: {
            vibeScore: result.overallScore,
            scoreProduct: result.categoryScores.product,
            scoreUx: result.categoryScores.ux,
            scoreEngineering: result.categoryScores.engineering,
            scoreSecurity: result.categoryScores.security,
            scorePerformance: result.categoryScores.performance,
            scoreAccessibility: result.categoryScores.accessibility,
            scoreDocumentation: result.categoryScores.documentation,
          },
        });

        // Record analysis entry
        await prisma.analysis.create({
          data: {
            projectId,
            triggerType: "MANUAL_RERUN",
            status: "COMPLETED",
            rawResults: JSON.stringify(result),
          },
        });

        // Add any newly discovered findings that don't already exist
        for (const finding of result.findings) {
          const existing = await prisma.finding.findFirst({
            where: {
              projectId,
              title: finding.title,
            },
          });

          if (!existing) {
            await prisma.finding.create({
              data: {
                projectId,
                versionDiscovered: latestVersion,
                category: finding.category,
                severity: finding.severity,
                title: finding.title,
                description: finding.description,
                evidence: finding.evidence,
                recommendation: finding.recommendation,
                confidence: finding.confidence,
                status: FindingStatus.OPEN,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Analysis failed:", err);
    return NextResponse.json({ error: err.message || "Analysis failed" }, { status: 500 });
  }
}
