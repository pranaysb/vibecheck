import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { E2E_COOKIE, e2eAuthEnabled, e2eCookieValue } from "@/lib/auth/e2e";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Test-only: signs the browser in as a local user (created if needed). 404 unless e2e auth is enabled,
 * which is impossible on Vercel. Requires the secret, so a stray local server can't be signed into.
 */
export async function POST(req: Request) {
  if (!e2eAuthEnabled()) return new Response("Not found", { status: 404 });
  const body = await req.json().catch(() => null);
  if (body?.secret !== process.env.E2E_AUTH_SECRET) return new Response("Forbidden", { status: 403 });
  if (typeof body?.email !== "string" || !/^[^@\s]+@[^@\s]+$/.test(body.email)) return Response.json({ error: "email required" }, { status: 400 });
  const email = body.email.toLowerCase();
  const user = await prisma.user.upsert({ where: { email }, create: { email, name: String(body.name ?? email.split("@")[0]).slice(0, 80) }, update: {} });
  (await cookies()).set(E2E_COOKIE, e2eCookieValue(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
  return Response.json({ id: user.id });
}

export async function DELETE() {
  if (!e2eAuthEnabled()) return new Response("Not found", { status: 404 });
  (await cookies()).delete(E2E_COOKIE);
  return new Response(null, { status: 204 });
}
