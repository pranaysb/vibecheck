import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ExpertReviewStatus, NotificationType, ReviewPackage } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, expertId, creatorId, focusAreas, packageType = "STANDARD", notes } = body;

    if (!projectId || !expertId || !creatorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const priceMap: Record<string, number> = {
      ESSENTIAL: 999,
      STANDARD: 2499,
      DEEP_DIVE: 4999,
    };

    const packagePriceInr = priceMap[packageType] || 2499;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const expert = await prisma.user.findUnique({ where: { id: expertId } });

    if (!project || !expert) {
      return NextResponse.json({ error: "Project or Expert not found" }, { status: 404 });
    }

    const expertReview = await prisma.expertReview.create({
      data: {
        projectId,
        expertId,
        creatorId,
        focusAreas: focusAreas || ["Architecture", "Security"],
        packageType: (packageType as ReviewPackage) || ReviewPackage.STANDARD,
        packagePriceInr,
        notes: notes || null,
        status: ExpertReviewStatus.PENDING,
      },
    });

    // Notify expert
    await prisma.notification.create({
      data: {
        userId: expertId,
        type: NotificationType.EXPERT_UPDATE,
        title: "New Expert Review Request",
        message: `You received an engineering review request for ${project.title} (${packageType}).`,
        link: `/experts`,
      },
    });

    // Notify creator
    await prisma.notification.create({
      data: {
        userId: creatorId,
        type: NotificationType.EXPERT_UPDATE,
        title: "Review Request Submitted",
        message: `Your review request for ${project.title} was sent to ${expert.name}.`,
        link: `/dashboard`,
      },
    });

    // Log analytics
    await prisma.productEvent.create({
      data: {
        eventName: "expert_review_requested",
        userId: creatorId,
        projectId,
        metadata: JSON.stringify({ expertId, packageType, packagePriceInr }),
      },
    });

    return NextResponse.json({ success: true, expertReview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
