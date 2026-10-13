"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { fileReport, restoreHiddenReview, settleReport } from "@/lib/moderation";
import type { FormState } from "@/lib/form";

const ReportInput = z.object({
  targetType: z.enum(["REVIEW", "EXPERT"]),
  targetId: z.string().min(1),
  reason: z.enum(["ABUSIVE", "SPAM", "MISLEADING", "OTHER"], "Pick a reason."),
  details: z.string().trim().min(10, "Add a sentence about what's wrong.").max(2000),
});

export async function reportContent(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = ReportInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const result = await fileReport(user.id, parsed.data);
  if ("ok" in result) revalidatePath("/admin");
  return result;
}

export async function resolveReport(form: FormData) {
  const admin = await requireUser("/admin");
  if (!admin.isAdmin) throw new Error("Admins only.");
  const action = String(form.get("action"));
  await settleReport(String(form.get("id")), action === "hide" || action === "revoke" ? action : "dismiss");
  revalidatePath("/admin");
  revalidatePath("/experts");
}

export async function restoreReview(form: FormData) {
  const admin = await requireUser("/admin");
  if (!admin.isAdmin) throw new Error("Admins only.");
  const id = String(form.get("id"));
  await restoreHiddenReview(id);
  revalidatePath(`/reviews/${id}`);
  revalidatePath("/experts");
}
