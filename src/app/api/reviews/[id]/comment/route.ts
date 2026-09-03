import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reviewId } = await params;
    const body = await req.json();
    const { userId, content } = body;

    if (!userId || !content) {
      return NextResponse.json({ error: "userId and content are required" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: true, author: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const comment = await prisma.reviewComment.create({
      data: {
        reviewId,
        userId,
        content,
      },
      include: {
        user: true,
      },
    });

    // Notify review author if commenter is someone else
    if (review.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: review.userId,
          type: NotificationType.REVIEW_RECEIVED,
          title: "New reply on your review",
          message: `${comment.user.name} replied: "${content.slice(0, 60)}..."`,
          link: `/projects/${review.project.slug}/reviews`,
        },
      });
    }

    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
