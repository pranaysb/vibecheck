import { prisma } from "@/lib/db";
import { list, del } from "@vercel/blob";
import { pruneRateLimits } from "@/lib/security/rate-limit";
import { blobEnabled, deleteAuditObjects } from "@/lib/storage";
import { notify } from "@/lib/notify";

export const FILE_RETENTION_DAYS = 90;
/** A claimed request with no review after this long goes back to the queue. */
export const CLAIM_TIMEOUT_DAYS = 7;
const BATCH = 200;

/**
 * Daily maintenance (see /privacy for the promised retention):
 * - deletes uploaded files and screenshots of audits older than 90 days, unless a review is in progress;
 * - fails audits stuck in RUNNING (worker died) and removes their partial files;
 * - releases review requests claimed for more than 7 days without a review, notifying both sides;
 * - deletes raw .zip uploads that were never turned into an audit;
 * - prunes rate-limit counters older than 24 hours.
 */
export async function runRetention(now = new Date()) {
  const cutoff = new Date(now.getTime() - FILE_RETENTION_DAYS * 86400_000);
  const expired = await prisma.audit.findMany({
    where: {
      createdAt: { lt: cutoff },
      filesPurgedAt: null,
      OR: [{ files: { some: {} } }, { screenshots: { some: {} } }],
      requests: { none: { status: { in: ["OPEN", "CLAIMED"] } } },
    },
    select: { id: true },
    take: BATCH,
  });
  const expiredIds = expired.map((a) => a.id);
  if (expiredIds.length) {
    await deleteAuditObjects(expiredIds);
    await prisma.$transaction([
      prisma.auditFile.deleteMany({ where: { auditId: { in: expiredIds } } }),
      prisma.screenshot.deleteMany({ where: { auditId: { in: expiredIds } } }),
      prisma.audit.updateMany({ where: { id: { in: expiredIds } }, data: { filesPurgedAt: now } }),
    ]);
  }

  const stuck = await prisma.audit.findMany({ where: { status: "RUNNING", createdAt: { lt: new Date(now.getTime() - 3600_000) } }, select: { id: true }, take: BATCH });
  if (stuck.length) {
    await deleteAuditObjects(stuck.map((a) => a.id));
    await prisma.audit.updateMany({ where: { id: { in: stuck.map((a) => a.id) } }, data: { status: "FAILED", error: "The audit stopped responding and was abandoned." } });
  }

  const staleClaims = await prisma.reviewRequest.findMany({
    where: { status: "CLAIMED", claimedAt: { lt: new Date(now.getTime() - CLAIM_TIMEOUT_DAYS * 86400_000) } },
    select: { id: true, expertId: true, requesterId: true, auditId: true, audit: { select: { label: true } } },
    take: BATCH,
  });
  for (const r of staleClaims) {
    // Conditional, so a review submitted at the same moment wins.
    const released = await prisma.reviewRequest.updateMany({ where: { id: r.id, status: "CLAIMED", expertId: r.expertId }, data: { status: "OPEN", expertId: null, claimedAt: null } });
    if (!released.count) continue;
    await notify(r.expertId, `Your claim on ${r.audit.label} expired`, "/expert", `Requests go back to the queue after ${CLAIM_TIMEOUT_DAYS} days without a review.`);
    await notify(r.requesterId, `Your review request for ${r.audit.label} is back in the queue`, `/audits/${r.auditId}`, `The expert who claimed it didn't deliver within ${CLAIM_TIMEOUT_DAYS} days.`);
  }

  let orphanUploads = 0;
  if (blobEnabled()) {
    const prefix = `${process.env.VERCEL_ENV ?? "local"}/uploads/`;
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      const old = page.blobs.filter((b) => b.uploadedAt.getTime() < now.getTime() - 86400_000);
      if (old.length) {
        await del(old.map((b) => b.url));
        orphanUploads += old.length;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }

  const rateLimits = await pruneRateLimits(24 * 3600, now);
  return { expiredAudits: expiredIds.length, stuckAudits: stuck.length, releasedClaims: staleClaims.length, orphanUploads, rateLimits };
}
