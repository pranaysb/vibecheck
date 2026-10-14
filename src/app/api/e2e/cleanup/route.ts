import { prisma } from "@/lib/db";
import { e2eAuthEnabled } from "@/lib/auth/e2e";
import { deleteUserData } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Test-only: deletes the e2e users of one run (`*-<tag>@e2e.test`) so a failed run leaves nothing behind. */
export async function POST(req: Request) {
  if (!e2eAuthEnabled()) return new Response("Not found", { status: 404 });
  const body = await req.json().catch(() => null);
  if (body?.secret !== process.env.E2E_AUTH_SECRET) return new Response("Forbidden", { status: 403 });
  if (typeof body?.tag !== "string" || !/^[a-z0-9]{4,20}$/.test(body.tag)) return Response.json({ error: "tag required" }, { status: 400 });
  const users = await prisma.user.findMany({ where: { email: { endsWith: `-${body.tag}@e2e.test` } }, select: { id: true } });
  for (const u of users) await deleteUserData(u.id);
  return Response.json({ deleted: users.length });
}
