import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AnalysisEngine } from "@/lib/analysis/engine";
import { AIInvolvement, FindingStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "trending";
    const query = searchParams.get("q") || "";
    const tech = searchParams.get("tech") || "";

    const where: any = { isPublished: true };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { tagline: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    if (tech) {
      where.techStack = { has: tech };
    }

    if (filter === "expert_reviewed") {
      where.expertReviews = { some: { status: "COMPLETED" } };
    } else if (filter === "security_reviewed") {
      where.findings = { some: { category: "SECURITY", status: "FIXED" } };
    } else if (filter === "ai_built") {
      where.aiInvolvement = { in: ["HEAVY", "ALMOST_ENTIRELY"] };
    }

    let orderBy: any = { createdAt: "desc" };
    if (filter === "trending") {
      orderBy = [{ vibeScore: "desc" }, { viewsCount: "desc" }];
    } else if (filter === "highest_rated") {
      orderBy = { vibeScore: "desc" };
    } else if (filter === "new") {
      orderBy = { createdAt: "desc" };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        versions: {
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          select: { id: true, productScore: true, wouldShip: true },
        },
        expertReviews: {
          where: { status: "COMPLETED" },
          select: { id: true, report: true },
        },
        findings: {
          select: { id: true, severity: true, status: true, category: true },
        },
      },
    });

    // Handle "most_improved" sorting in-memory if requested
    let result = projects;
    if (filter === "most_improved") {
      result = [...projects].sort((a, b) => {
        const deltaA = a.versions.reduce((sum, v) => sum + v.scoreDelta, 0);
        const deltaB = b.versions.reduce((sum, v) => sum + v.scoreDelta, 0);
        return deltaB - deltaA;
      });
    }

    return NextResponse.json({ projects: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      slug,
      tagline,
      description,
      liveUrl,
      githubUrl,
      aiInvolvement,
      aiTools,
      techStack,
      framework,
      database,
      hosting,
      whatBuilt,
      whyBuilt,
      problemSolved,
      difficultParts,
      unsureParts,
      feedbackWanted,
      userId,
    } = body;

    if (!title || !slug || !liveUrl || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.project.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    // Run initial automated analysis
    const analysis = await AnalysisEngine.runAnalysis({
      liveUrl,
      githubUrl,
      techStack: techStack || [],
      whatBuilt,
      title,
    });

    // Create project
    const project = await prisma.project.create({
      data: {
        title,
        slug: finalSlug,
        tagline: tagline || "Built with AI assistance.",
        description: description || "An exciting new AI-assisted project on VibeCheck.",
        liveUrl,
        githubUrl: githubUrl || null,
        aiInvolvement: (aiInvolvement as AIInvolvement) || AIInvolvement.MODERATE,
        aiTools: aiTools || ["Cursor"],
        techStack: techStack || ["Next.js", "TypeScript"],
        framework: framework || "Next.js",
        database: database || "PostgreSQL",
        hosting: hosting || "Vercel",
        whatBuilt,
        whyBuilt,
        problemSolved,
        difficultParts,
        unsureParts,
        feedbackWanted,
        vibeScore: analysis.overallScore,
        scoreProduct: analysis.categoryScores.product,
        scoreUx: analysis.categoryScores.ux,
        scoreEngineering: analysis.categoryScores.engineering,
        scoreSecurity: analysis.categoryScores.security,
        scorePerformance: analysis.categoryScores.performance,
        scoreAccessibility: analysis.categoryScores.accessibility,
        scoreDocumentation: analysis.categoryScores.documentation,
        userId,
      },
    });

    // Create version 1
    await prisma.projectVersion.create({
      data: {
        projectId: project.id,
        versionNumber: "v1",
        vibeScore: analysis.overallScore,
        scoreDelta: 0,
        changelog: "Initial public submission on VibeCheck.",
      },
    });

    // Save findings
    for (const f of analysis.findings) {
      await prisma.finding.create({
        data: {
          projectId: project.id,
          versionDiscovered: "v1",
          category: f.category,
          severity: f.severity,
          title: f.title,
          description: f.description,
          evidence: f.evidence,
          recommendation: f.recommendation,
          confidence: f.confidence,
          status: FindingStatus.OPEN,
        },
      });
    }

    // Log product event
    await prisma.productEvent.create({
      data: {
        eventName: "project_created",
        userId,
        projectId: project.id,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    console.error("Project creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
