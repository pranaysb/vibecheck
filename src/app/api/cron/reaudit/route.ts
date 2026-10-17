import { dueWatches } from "@/lib/watch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const authorized = (req: Request) => {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
};

/**
 * Called daily by Vercel Cron. Each due watch runs in its own function invocation (POST ./run), so they run in
 * parallel and each gets the full 300 s an audit may need, instead of sharing this one.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const due = await dueWatches();
  const runUrl = new URL("/api/cron/reaudit/run", req.url);
  const results = await Promise.allSettled(
    due.map(async ({ id }) => {
      const res = await fetch(runUrl, {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}`, "content-type": "application/json" },
        body: JSON.stringify({ watchId: id }),
        signal: AbortSignal.timeout(295_000),
      });
      return { id, status: res.status, ...(await res.json().catch(() => ({}))) };
    })
  );
  const summary = {
    due: due.length,
    ran: results.filter((r) => r.status === "fulfilled" && r.value.ran).length,
    alerts: results.filter((r) => r.status === "fulfilled" && r.value.alert).length,
    failed: results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && (r.value.error || r.value.status >= 400))).length,
  };
  console.info("reaudit", JSON.stringify(summary));
  return Response.json(summary);
}
