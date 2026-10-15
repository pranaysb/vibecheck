"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getUser, requireUser } from "@/lib/auth/session";
import { FOCUS_AREAS } from "@/lib/access";
import { notify, notifyAdmins, notifyExperts } from "@/lib/notify";
import type { FormState } from "@/lib/form";

// ---------- Expert applications ----------

const Application = z.object({
  headline: z.string().trim().min(4, "Add a one-line headline.").max(120),
  bio: z.string().trim().min(80, "Tell reviewers about your experience in at least 80 characters.").max(3000),
  expertise: z.array(z.enum(FOCUS_AREAS)).min(1, "Pick at least one area."),
  links: z
    .array(z.url({ protocol: /^https?$/, error: "Links must be full URLs starting with https://." }))
    .min(1, "Add at least one link where your work can be verified.")
    .max(5),
});

export async function applyAsExpert(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/experts/apply");
  const parsed = Application.safeParse({
    headline: form.get("headline"),
    bio: form.get("bio"),
    expertise: form.getAll("expertise"),
    links: String(form.get("links") ?? "")
      .split(/\s+/)
      .filter(Boolean),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const existing = await prisma.expertProfile.findUnique({ where: { userId: user.id } });
  if (existing?.status === "APPROVED") {
    await prisma.expertProfile.update({ where: { userId: user.id }, data: parsed.data });
    revalidatePath("/experts");
    return { ok: "Profile updated." };
  }
  await prisma.expertProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: { ...parsed.data, status: "PENDING", decidedAt: null },
  });
  await notifyAdmins(`${existing ? "Updated" : "New"} expert application from ${user.name}`, "/admin", parsed.data.headline);
  revalidatePath("/admin");
  return { ok: "Application submitted. An admin will review your links and approve or decline it." };
}

export async function decideExpert(form: FormData) {
  const user = await requireUser("/admin");
  if (!user.isAdmin) throw new Error("Admins only.");
  const id = String(form.get("id"));
  const decision = form.get("decision") === "approve" ? "APPROVED" : "REJECTED";
  const reason = String(form.get("reason") ?? "").trim().slice(0, 500);
  const profile = await prisma.expertProfile.update({ where: { id }, data: { status: decision, decidedAt: new Date() } });
  const open = decision === "APPROVED" ? await prisma.reviewRequest.count({ where: { status: "OPEN", requesterId: { not: profile.userId } } }) : 0;
  await notify(
    profile.userId,
    decision === "APPROVED" ? "You're approved as an expert" : "Your expert application wasn't approved",
    decision === "APPROVED" ? "/expert" : "/experts/apply",
    decision === "APPROVED"
      ? open
        ? `${open} open request${open === 1 ? " is" : "s are"} waiting in your review queue.`
        : "Your review queue is empty right now; you'll be notified when a request matching your areas arrives."
      : reason
        ? `Reason: ${reason} You can update your application and resubmit.`
        : "You can update your application and resubmit."
  );
  revalidatePath("/admin");
  revalidatePath("/experts");
}

// ---------- Review requests (site owner) ----------

const RequestInput = z.object({
  auditId: z.string().min(1),
  focus: z.array(z.enum(FOCUS_AREAS)).min(1, "Pick at least one focus area."),
  notes: z.string().trim().min(20, "Give the reviewer some context (at least 20 characters).").max(4000),
});

export async function requestReview(_: FormState, form: FormData): Promise<FormState> {
  const auditId = String(form.get("auditId"));
  const user = await requireUser(`/audits/${auditId}`);
  const parsed = RequestInput.safeParse({ auditId, focus: form.getAll("focus"), notes: form.get("notes") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const audit = await prisma.audit.findUnique({ where: { id: auditId } });
  if (!audit || audit.status !== "COMPLETED") return { error: "That audit isn't available." };
  if (audit.ownerId && audit.ownerId !== user.id) return { error: "Only the person who ran this audit can request a review of it. Run your own audit first." };
  const active = await prisma.reviewRequest.count({ where: { auditId, status: { in: ["OPEN", "CLAIMED"] } } });
  if (active) return { error: "A review for this audit is already in progress." };
  await prisma.$transaction([
    ...(audit.ownerId ? [] : [prisma.audit.update({ where: { id: auditId }, data: { ownerId: user.id } })]),
    prisma.reviewRequest.create({ data: { auditId, requesterId: user.id, focus: parsed.data.focus, notes: parsed.data.notes } }),
  ]);
  await notifyExperts(parsed.data.focus, user.id, `New review request: ${audit.label}`, "/expert", `Focus: ${parsed.data.focus.join(", ")}`);
  revalidatePath(`/audits/${auditId}`);
  revalidatePath("/expert");
  return { ok: "Request posted. Approved experts can now see it in their queue." };
}

export async function cancelRequest(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("id"));
  await prisma.reviewRequest.updateMany({ where: { id, requesterId: user.id, status: "OPEN" }, data: { status: "CANCELLED" } });
  revalidatePath("/dashboard");
}

const Rating = z.object({ id: z.string(), rating: z.coerce.number().int().min(1).max(5), note: z.string().trim().max(1000).optional() });

export async function rateReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = Rating.safeParse({ id: form.get("id"), rating: form.get("rating"), note: form.get("note") || undefined });
  if (!parsed.success) return { error: "Pick a rating from 1 to 5." };
  const review = await prisma.expertReview.findUnique({ where: { id: parsed.data.id }, include: { request: true } });
  if (!review || review.request.requesterId !== user.id) return { error: "Only the requester can rate this review." };
  if (review.rating) return { error: "You've already rated this review." };
  await prisma.expertReview.update({ where: { id: review.id }, data: { rating: parsed.data.rating, ratingNote: parsed.data.note } });
  await notify(review.expertId, `Your review was rated ${parsed.data.rating}/5`, `/reviews/${review.id}`, parsed.data.note);
  revalidatePath(`/reviews/${review.id}`);
  revalidatePath("/experts");
  return { ok: "Thanks — your rating is now part of this expert's public record." };
}

// ---------- Expert workflow ----------

async function requireExpert() {
  const user = await getUser();
  if (!user || user.expertStatus !== "APPROVED") throw new Error("Approved experts only.");
  return user;
}

export async function claimRequest(form: FormData) {
  const user = await requireExpert();
  const id = String(form.get("id"));
  // Conditional update: only one expert can move OPEN → CLAIMED, and never on their own request.
  const res = await prisma.reviewRequest.updateMany({
    where: { id, status: "OPEN", requesterId: { not: user.id } },
    data: { status: "CLAIMED", expertId: user.id, claimedAt: new Date() },
  });
  if (!res.count) redirect("/expert?error=unavailable");
  const req = await prisma.reviewRequest.findUnique({ where: { id }, select: { requesterId: true, auditId: true, audit: { select: { label: true } } } });
  await notify(req?.requesterId, `${user.name} is reviewing ${req?.audit.label ?? "your site"}`, req ? `/audits/${req.auditId}` : undefined);
  redirect(`/expert/requests/${id}`);
}

export async function releaseRequest(form: FormData) {
  const user = await requireExpert();
  const id = String(form.get("id"));
  const res = await prisma.reviewRequest.updateMany({ where: { id, status: "CLAIMED", expertId: user.id }, data: { status: "OPEN", expertId: null, claimedAt: null } });
  if (res.count) {
    const req = await prisma.reviewRequest.findUnique({ where: { id }, select: { requesterId: true, auditId: true } });
    await notify(req?.requesterId, "Your review request is back in the queue", req ? `/audits/${req.auditId}` : undefined, "The expert who claimed it released it; another expert can pick it up.");
  }
  redirect("/expert");
}

const FindingInput = z.object({
  severity: z.enum(["critical", "high", "medium", "low"]),
  title: z.string().trim().min(3).max(160),
  detail: z.string().trim().min(10).max(4000),
  recommendation: z.string().trim().max(4000).optional().default(""),
});

const ReviewInput = z.object({
  requestId: z.string(),
  verdict: z.enum(["SHIP", "FIX_FIRST", "NOT_READY"], "Choose a verdict."),
  summary: z.string().trim().min(120, "Write a summary of at least 120 characters.").max(8000),
  findings: z.array(FindingInput).max(40),
});

export type ExpertFinding = z.infer<typeof FindingInput>;

export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireExpert();
  let findings: unknown = [];
  try {
    findings = JSON.parse(String(form.get("findings") ?? "[]"));
  } catch {
    return { error: "Findings could not be read." };
  }
  const parsed = ReviewInput.safeParse({ requestId: form.get("requestId"), verdict: form.get("verdict"), summary: form.get("summary"), findings });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.path[0] === "findings" ? `Finding ${Number(issue.path[1]) + 1}: ${String(issue.path[2] ?? "a field")} is too short or missing.` : issue.message };
  }
  const { requestId, verdict, summary } = parsed.data;
  const review = await prisma.$transaction(async (tx) => {
    const done = await tx.reviewRequest.updateMany({ where: { id: requestId, status: "CLAIMED", expertId: user.id }, data: { status: "COMPLETED" } });
    if (!done.count) return null;
    return tx.expertReview.create({
      data: { requestId, expertId: user.id, verdict, summary, findings: parsed.data.findings as unknown as Prisma.InputJsonValue },
    });
  });
  if (!review) return { error: "This request is no longer assigned to you." };
  const req = await prisma.reviewRequest.findUnique({ where: { id: requestId }, select: { requesterId: true, audit: { select: { label: true } } } });
  await notify(req?.requesterId, `Your expert review of ${req?.audit.label ?? "your site"} is ready`, `/reviews/${review.id}`, `${user.name}'s verdict: ${verdict === "SHIP" ? "ready to ship" : verdict === "FIX_FIRST" ? "fix first" : "not ready"}.`);
  revalidatePath("/expert");
  revalidatePath("/dashboard");
  redirect(`/reviews/${review.id}`);
}
