import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { canViewAudit } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lets the audit form follow an audit whose progress stream was cut off (mobile networks, proxies). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const audit = await prisma.audit.findUnique({ where: { id }, select: { status: true, score: true, error: true, source: true, ownerId: true, requests: { select: { status: true, expertId: true } } } });
  if (!audit || !canViewAudit(audit, await getUser())) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ status: audit.status, score: audit.score, error: audit.error }, { headers: { "cache-control": "no-store" } });
}
