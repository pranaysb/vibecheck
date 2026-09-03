import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reviewId } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: true, author: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Anti-abuse: cannot vote on own review
    if (review.userId === userId) {
      return NextResponse.json({ error: "You cannot vote on your own review" }, { status: 400 });
    }

    // Check existing vote
    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: { reviewId, userId },
      },
    });

    let isHelpful = true;
    if (existingVote) {
      // Toggle / remove vote
      await prisma.reviewVote.delete({
        where: { id: existingVote.id },
      });
      await prisma.review.update({
        where: { id: reviewId },
        data: { helpfulVotesCount: { decrement: 1 } },
      });
      await prisma.user.update({
        where: { id: review.userId },
        data: { reputationPoints: { decrement: 10 } },
      });
      isHelpful = false;
    } else {
      // Add vote
      await prisma.reviewVote.create({
        data: { reviewId, userId, isHelpful: true },
      });
      await prisma.review.update({
        where: { id: reviewId },
        data: { helpfulVotesCount: { increment: 1 } },
      });
      // Award +10 reputation points to review author
      await prisma.user.update({
        where: { id: review.userId },
        data: { reputationPoints: { increment: 10 } },
      });

      // Notify reviewer
      await prisma.notification.create({
        data: {
          userId: review.userId,
          type: NotificationType.HELPFUL_VOTE,
          title: "Feedback marked helpful",
          message: `Someone found your review on ${review.project.title} helpful (+10 points).`,
          link: `/projects/${review.project.slug}/reviews`,
        },
      });

      // Log event
      await prisma.productEvent.create({
        data: {
          eventName: "feedback_marked_helpful",
          userId,
          projectId: review.projectId,
        },
      });
    }

    const updatedReview = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { helpfulVotesCount: true },
    });

    return NextResponse.json({ success: true, isHelpful, helpfulVotesCount: updatedReview?.helpfulVotesCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
