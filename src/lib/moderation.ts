import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/security/rate-limit";

export type ReportTargetType = "REVIEW" | "EXPERT";
export type ReportReasonType = "ABUSIVE" | "SPAM" | "MISLEADING" | "OTHER";
type Result = { ok: string } | { error: string };

/** Files a report. Targets must exist; nobody can report their own review or profile. */
export async function fileReport(reporterId: string, input: { targetType: ReportTargetType; targetId: string; reason: ReportReasonType; details: string }): Promise<Result> {
  const { targetType, targetId, reason, details } = input;
  if (targetType === "REVIEW") {
    const r = await prisma.expertReview.findUnique({ where: { id: targetId }, select: { expertId: true } });
    if (!r) return { error: "That review no longer exists." };
    if (r.expertId === reporterId) return { error: "You can't report your own review." };
  } else {
    const p = await prisma.expertProfile.findUnique({ where: { id: targetId }, select: { userId: true } });
    if (!p) return { error: "That expert no longer exists." };
    if (p.userId === reporterId) return { error: "You can't report your own profile." };
  }
  const limited = await rateLimit(`report:${reporterId}`, 10, 3600);
  if (!limited.allowed) return { error: "You've sent a lot of reports. Try again later." };
  const existing = await prisma.report.findUnique({ where: { reporterId_targetType_targetId: { reporterId, targetType, targetId } } });
  if (existing) return { ok: "You've already reported this. An admin will look at it." };
  await prisma.report.create({ data: { reporterId, targetType, targetId, reason, details } });
  return { ok: "Thanks. An admin will review your report." };
}

/** Applies an admin decision to every open report on the same target, and notifies everyone involved. */
export async function settleReport(reportId: string, action: "dismiss" | "hide" | "revoke"): Promise<void> {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.status !== "OPEN") return;

  let acted = false;
  if (action === "hide" && report.targetType === "REVIEW") {
    const review = await prisma.expertReview.update({
      where: { id: report.targetId },
      data: { hiddenAt: new Date(), hiddenNote: `Removed after a report (${report.reason.toLowerCase()}).` },
    });
    await notify(review.expertId, "One of your reviews was removed by a moderator", `/reviews/${review.id}`, "It no longer counts toward your rating.");
    acted = true;
  } else if (action === "revoke" && report.targetType === "EXPERT") {
    const profile = await prisma.expertProfile.update({ where: { id: report.targetId }, data: { status: "REJECTED", decidedAt: new Date() } });
    // Anything they had claimed goes back to the queue.
    await prisma.reviewRequest.updateMany({ where: { expertId: profile.userId, status: "CLAIMED" }, data: { status: "OPEN", expertId: null, claimedAt: null } });
    await notify(profile.userId, "Your expert approval was revoked", "/experts/apply", "Your review queue access was removed after a report.");
    acted = true;
  }
  const status = acted ? "ACTIONED" : "DISMISSED";
  const where = { targetType: report.targetType, targetId: report.targetId, status: "OPEN" as const };
  const settled = await prisma.report.findMany({ where, select: { reporterId: true } });
  await prisma.report.updateMany({ where, data: { status, resolvedAt: new Date() } });
  for (const r of settled) {
    await notify(r.reporterId, acted ? "Action taken on your report" : "Your report was reviewed", undefined, acted ? "Thanks for flagging it." : "An admin looked at it and didn't find a rules violation.");
  }
}

export async function restoreHiddenReview(reviewId: string) {
  await prisma.expertReview.update({ where: { id: reviewId }, data: { hiddenAt: null, hiddenNote: null } });
}
