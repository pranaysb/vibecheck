import { prisma } from "@/lib/db";

/** In-app notification. Never throws: a failed notification must not undo the action that caused it. */
export async function notify(userId: string | null | undefined, title: string, link?: string, body?: string) {
  if (!userId) return;
  try {
    await prisma.notification.create({ data: { userId, title, link, body } });
  } catch (err) {
    console.error("notify failed:", err);
  }
}

/** Same message to many people in one insert. Never throws. */
async function notifyMany(userIds: string[], title: string, link?: string, body?: string) {
  if (!userIds.length) return;
  try {
    await prisma.notification.createMany({ data: userIds.map((userId) => ({ userId, title, link, body })) });
  } catch (err) {
    console.error("notifyMany failed:", err);
  }
}

/** Every signed-up account whose email is in ADMIN_EMAILS. */
export async function notifyAdmins(title: string, link?: string, body?: string) {
  const emails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!emails.length) return;
  const admins = await prisma.user
    .findMany({ where: { OR: emails.map((email) => ({ email: { equals: email, mode: "insensitive" as const } })) }, select: { id: true } })
    .catch(() => []);
  await notifyMany(admins.map((a) => a.id), title, link, body);
}

/** Approved experts who review at least one of the requested areas (never the requester). */
export async function notifyExperts(focus: string[], exceptUserId: string, title: string, link?: string, body?: string) {
  const experts = await prisma.expertProfile
    .findMany({ where: { status: "APPROVED", expertise: { hasSome: focus }, userId: { not: exceptUserId } }, select: { userId: true }, take: 500 })
    .catch(() => []);
  await notifyMany(experts.map((e) => e.userId), title, link, body);
}
