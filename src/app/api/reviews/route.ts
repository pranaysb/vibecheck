import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotificationType, WouldShip } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      userId,
      productScore = 8,
      designScore = 8,
      engineeringScore = 8,
      docScore = 8,
      wouldShip = "ALMOST",
      whatLiked,
      whatToImprove,
      biggestIssue,
      bugReport,
      suggestion,
    } = body;

    if (!projectId || !userId || !whatLiked || !whatToImprove || !biggestIssue) {
      return NextResponse.json({ error: "Missing required review fields" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { creator: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        projectId,
        userId,
        productScore: Number(productScore),
        designScore: Number(designScore),
        engineeringScore: Number(engineeringScore),
        docScore: Number(docScore),
        wouldShip: (wouldShip as WouldShip) || WouldShip.ALMOST,
        whatLiked,
        whatToImprove,
        biggestIssue,
        bugReport: bugReport || null,
        suggestion: suggestion || null,
      },
      include: {
        author: true,
      },
    });

    // Award +15 reputation points to reviewer
    await prisma.user.update({
      where: { id: userId },
      data: { reputationPoints: { increment: 15 } },
    });

    // Notify project creator
    if (project.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: project.userId,
          type: NotificationType.REVIEW_RECEIVED,
          title: `New review on ${project.title}`,
          message: `${review.author.name} reviewed your project (Product ${productScore}/10).`,
          link: `/projects/${project.slug}/reviews`,
        },
      });
    }

    // Log analytics
    await prisma.productEvent.create({
      data: {
        eventName: "review_submitted",
        userId,
        projectId,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
