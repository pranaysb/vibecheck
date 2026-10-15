import { prisma } from "@/lib/db";
import { blobEnabled } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** For uptime monitors: 200 when the database answers, 503 when it doesn't. Reveals no configuration values. */
export async function GET() {
  const started = Date.now();
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {}
  return Response.json(
    { ok: db, db, dbMs: Date.now() - started, storage: blobEnabled() ? "blob" : "database", commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null },
    { status: db ? 200 : 503, headers: { "cache-control": "no-store" } }
  );
}
