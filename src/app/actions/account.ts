"use server";

import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deleteAuditObjects } from "@/lib/storage";
import type { FormState } from "@/lib/form";

/**
 * Deletes the signed-in user's VibeCheck data and their Clerk account (see /privacy).
 * - Uploaded (.zip) and GitHub audits are deleted with their files and screenshots.
 * - Public URL audits are kept, detached from the account (Audit.owner is SetNull).
 * - Their review requests, expert profile and expert reviews are deleted. Requests this person was
 *   reviewing (claimed, or delivered by them) go back to the queue so the requester isn't stranded.
 */
export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/dashboard");
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== "delete") return { error: 'Type "delete" to confirm.' };

  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { clerkId: true } });
  const fileAudits = await prisma.audit.findMany({ where: { ownerId: user.id, source: { in: ["ZIP", "GITHUB"] } }, select: { id: true } });
  const ids = fileAudits.map((a) => a.id);

  await prisma.$transaction([
    prisma.reviewRequest.updateMany({ where: { expertId: user.id, status: "CLAIMED" }, data: { status: "OPEN", expertId: null, claimedAt: null } }),
    prisma.reviewRequest.updateMany({ where: { review: { expertId: user.id } }, data: { status: "OPEN", expertId: null, claimedAt: null } }),
    prisma.audit.deleteMany({ where: { id: { in: ids } } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  await deleteAuditObjects(ids).catch((err) => console.error("Blob cleanup after account deletion failed:", err));
  if (row?.clerkId) {
    try {
      await (await clerkClient()).users.deleteUser(row.clerkId);
    } catch (err) {
      console.error("Clerk user deletion failed:", err);
      return { error: "Your VibeCheck data was deleted, but removing your sign-in failed. Delete it under Manage account, or contact us." };
    }
  }
  redirect("/?deleted=1");
}
