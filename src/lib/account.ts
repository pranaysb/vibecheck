import { prisma } from "@/lib/db";
import { deleteAuditObjects } from "@/lib/storage";

/**
 * Deletes a user's VibeCheck data (see /privacy). Returns their Clerk id so the caller can remove the sign-in.
 * - Uploaded (.zip) and GitHub audits are deleted with their files and screenshots.
 * - Public URL audits are kept, detached from the account (Audit.owner is SetNull).
 * - Their review requests, expert profile, expert reviews, reports and notifications are deleted.
 *   Requests this person was reviewing (claimed, or delivered by them) go back to the queue.
 */
export async function deleteUserData(userId: string): Promise<string | null> {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { clerkId: true } });
  if (!row) return null;
  const fileAudits = await prisma.audit.findMany({ where: { ownerId: userId, source: { in: ["ZIP", "GITHUB"] } }, select: { id: true } });
  const ids = fileAudits.map((a) => a.id);
  await prisma.$transaction([
    prisma.reviewRequest.updateMany({ where: { expertId: userId, status: "CLAIMED" }, data: { status: "OPEN", expertId: null, claimedAt: null } }),
    prisma.reviewRequest.updateMany({ where: { review: { expertId: userId } }, data: { status: "OPEN", expertId: null, claimedAt: null } }),
    prisma.audit.deleteMany({ where: { id: { in: ids } } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  await deleteAuditObjects(ids).catch((err) => console.error("Blob cleanup after account deletion failed:", err));
  return row.clerkId;
}
