import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { e2eAuthEnabled } from "@/lib/auth/e2e";
import type { CheckResult } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Test-only (never on Vercel): makes an e2e user's watches due now, so the suite can run the real daily cron.
 * With `regression: true` it also marks one currently failing check of the latest audit as passing, so the
 * re-audit sees a genuine pass → fail change and the alert path runs end to end.
 */
export async function POST(req: Request) {
  if (!e2eAuthEnabled()) return new Response("Not found", { status: 404 });
  const body = await req.json().catch(() => null);
  if (body?.secret !== process.env.E2E_AUTH_SECRET) return new Response("Forbidden", { status: 403 });
  if (typeof body?.email !== "string" || !body.email.endsWith("@e2e.test")) return Response.json({ error: "e2e email required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } });
  if (!user) return Response.json({ error: "no such user" }, { status: 404 });
  const watches = await prisma.watch.findMany({ where: { userId: user.id } });
  await prisma.watch.updateMany({ where: { userId: user.id }, data: { nextRunAt: new Date(Date.now() - 1000) } });
  let flipped: string | null = null;
  if (body.regression && watches[0]) {
    const latest = await prisma.audit.findFirst({ where: { ownerId: user.id, target: watches[0].target, status: "COMPLETED" }, orderBy: { createdAt: "desc" } });
    const checks = (latest?.checks ?? []) as unknown as CheckResult[];
    // A stable, non-timing check that fails today will fail again on the re-audit.
    const target = checks.find((c) => c.status === "fail" && !c.id.startsWith("perf-") && c.id !== "rel-console-errors" && c.id !== "rel-failed-requests");
    if (latest && target) {
      flipped = target.id;
      await prisma.audit.update({ where: { id: latest.id }, data: { checks: checks.map((c) => (c.id === target.id ? { ...c, status: "pass" } : c)) as unknown as Prisma.InputJsonValue } });
    }
  }
  return Response.json({ due: watches.length, flipped });
}
