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
