import { runWatch } from "@/lib/watch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** One watched site's weekly re-audit. Only the daily dispatcher calls this, with the cron secret. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const body = (await req.json().catch(() => null)) as { watchId?: unknown } | null;
  if (typeof body?.watchId !== "string") return Response.json({ error: "watchId required" }, { status: 400 });
  return Response.json(await runWatch(body.watchId));
}
