"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import type { FormState } from "@/lib/form";
import { WATCH_INTERVAL_DAYS, WATCH_LIMIT } from "@/lib/watch-config";

/** Starts weekly re-audits of a live URL the user audited. The first re-audit is a week after this audit. */
export async function watchSite(_: FormState, form: FormData): Promise<FormState> {
  const auditId = String(form.get("auditId"));
  const user = await requireUser(`/audits/${auditId}`);
  const audit = await prisma.audit.findUnique({ where: { id: auditId }, select: { source: true, status: true, target: true, label: true, ownerId: true, createdAt: true } });
  if (!audit || audit.status !== "COMPLETED") return { error: "That audit isn't available." };
  if (audit.source !== "URL") return { error: "Weekly re-audits are for live URLs." };
  if (audit.ownerId !== user.id) return { error: "Run your own audit of this site first; you can only watch sites from your audits." };
  const existing = await prisma.watch.findUnique({ where: { userId_target: { userId: user.id, target: audit.target } } });
  if (existing) return { ok: "Already watching this site." };
  if ((await prisma.watch.count({ where: { userId: user.id } })) >= WATCH_LIMIT) {
    return { error: `You can watch up to ${WATCH_LIMIT} sites. Stop watching one from your dashboard first.` };
  }
  const nextRunAt = new Date(Math.max(audit.createdAt.getTime(), Date.now()) + WATCH_INTERVAL_DAYS * 86_400_000);
  await prisma.watch.create({ data: { userId: user.id, target: audit.target, label: audit.label, nextRunAt, lastAuditId: auditId } });
  revalidatePath(`/audits/${auditId}`);
  revalidatePath("/dashboard");
  return { ok: `Watching. The next audit runs around ${nextRunAt.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" })}.` };
}

/** Stops weekly re-audits. Past audits stay. */
export async function unwatchSite(form: FormData) {
  const user = await requireUser("/dashboard");
  await prisma.watch.deleteMany({ where: { id: String(form.get("id")), userId: user.id } });
  revalidatePath("/dashboard");
  const auditId = form.get("auditId");
  if (typeof auditId === "string" && auditId) revalidatePath(`/audits/${auditId}`);
}

/** Resumes a watch that paused after repeated failures; the next run is tomorrow's daily run. */
export async function resumeWatch(form: FormData) {
  const user = await requireUser("/dashboard");
  await prisma.watch.updateMany({ where: { id: String(form.get("id")), userId: user.id }, data: { pausedAt: null, consecutiveFailures: 0, nextRunAt: new Date() } });
  revalidatePath("/dashboard");
}
