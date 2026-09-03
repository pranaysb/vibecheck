import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { versionNumber, changelog, fixedFindingIds = [] } = body;

    if (!versionNumber || !changelog) {
      return NextResponse.json({ error: "Version number and changelog are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: "desc" } },
        findings: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Mark specified findings as fixed
    if (fixedFindingIds.length > 0) {
      await prisma.finding.updateMany({
        where: { id: { in: fixedFindingIds } },
        data: {
          status: "FIXED",
          versionFixed: versionNumber,
          fixedAt: new Date(),
        },
      });
    }

    // Calculate score bump: each fixed critical gives +6, high +4, medium +3, low +1
    const fixedFindings = project.findings.filter((f) => fixedFindingIds.includes(f.id));
    let scoreBump = 0;
    for (const f of fixedFindings) {
      if (f.severity === "CRITICAL") scoreBump += 6;
      else if (f.severity === "HIGH") scoreBump += 4;
      else if (f.severity === "MEDIUM") scoreBump += 3;
      else scoreBump += 1;
    }
    if (scoreBump === 0) scoreBump = 3; // Baseline improvement for shipping a new version

    const newScore = Math.min(98, project.vibeScore + scoreBump);
    const scoreDelta = newScore - project.vibeScore;

    // Create the new version
    const newVersion = await prisma.projectVersion.create({
      data: {
        projectId: id,
        versionNumber,
        vibeScore: newScore,
        scoreDelta,
        changelog,
      },
    });

    // Update project overall score and subscores
    await prisma.project.update({
      where: { id },
      data: {
        vibeScore: newScore,
        scoreEngineering: Math.min(99, project.scoreEngineering + Math.ceil(scoreDelta * 0.8)),
        scoreSecurity: Math.min(99, project.scoreSecurity + Math.ceil(scoreDelta * 0.6)),
      },
    });

    // Notify creator
    await prisma.notification.create({
      data: {
        userId: project.userId,
        type: NotificationType.SCORE_IMPROVED,
        title: `Score improved! +${scoreDelta} points on ${versionNumber}`,
        message: `Your fixes on ${project.title} elevated your Vibe Score to ${newScore}/100.`,
        link: `/projects/${project.slug}/versions`,
      },
    });

    // Log analytics event
    await prisma.productEvent.create({
      data: {
        eventName: "project_resubmitted",
        userId: project.userId,
        projectId: project.id,
        metadata: JSON.stringify({ versionNumber, scoreDelta, newScore }),
      },
    });

    return NextResponse.json({ success: true, version: newVersion, newScore, scoreDelta });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
