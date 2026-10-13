import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { canViewAudit } from "@/lib/access";
import { readStored } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await ctx.params;
  const audit = await prisma.audit.findUnique({ where: { id }, select: { source: true, ownerId: true, requests: { select: { status: true, expertId: true } } } });
  if (!audit || !canViewAudit(audit, await getUser())) return new Response("Not found", { status: 404 });
  const shot = await prisma.screenshot.findUnique({ where: { auditId_kind: { auditId: id, kind } } });
  const bytes = shot ? await readStored(shot) : null;
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    // Uploaded-site screenshots are private: never let a shared cache keep them.
    headers: { "content-type": "image/jpeg", "cache-control": audit.source === "ZIP" ? "private, no-cache" : "public, max-age=86400, immutable" },
  });
}
