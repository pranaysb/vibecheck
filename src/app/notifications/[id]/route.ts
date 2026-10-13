import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";

/** Opening a notification marks it read, then goes to its link. Only the owner can mark it. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) redirect(`/sign-in?redirect_url=${encodeURIComponent("/notifications")}`);
  const n = await prisma.notification.findFirst({ where: { id, userId: user.id } });
  if (!n) redirect("/notifications");
  if (!n.readAt) await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  redirect(n.link && n.link.startsWith("/") ? n.link : "/notifications");
}
