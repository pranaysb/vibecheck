import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { canViewAudit } from "@/lib/access";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await ctx.params;
  const audit = await prisma.audit.findUnique({ where: { id }, select: { source: true, ownerId: true, requests: { select: { status: true, expertId: true } } } });
  if (!audit || !canViewAudit(audit, await getUser())) return new Response("Not found", { status: 404 });
  const shot = await prisma.screenshot.findUnique({ where: { auditId_kind: { auditId: id, kind } } });
  if (!shot) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(shot.data), {
    headers: { "content-type": "image/jpeg", "cache-control": audit.source === "ZIP" ? "private, max-age=86400" : "public, max-age=86400, immutable" },
  });
}
