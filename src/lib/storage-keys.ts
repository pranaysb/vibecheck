import { prisma } from "@/lib/db";

/** Every Blob key recorded for these audits (their pack and any older per-file objects), for deletion by key. */
export async function auditObjectKeys(auditIds: string[]) {
  if (!auditIds.length) return [];
  const [audits, files, shots] = await Promise.all([
    prisma.audit.findMany({ where: { id: { in: auditIds } }, select: { id: true, packKey: true } }),
    prisma.auditFile.findMany({ where: { auditId: { in: auditIds }, blobKey: { not: null } }, select: { auditId: true, blobKey: true } }),
    prisma.screenshot.findMany({ where: { auditId: { in: auditIds }, blobKey: { not: null } }, select: { auditId: true, blobKey: true } }),
  ]);
  return audits.map((a) => ({
    packKey: a.packKey,
    blobKeys: [...files, ...shots].filter((r) => r.auditId === a.id).map((r) => r.blobKey),
  }));
}
