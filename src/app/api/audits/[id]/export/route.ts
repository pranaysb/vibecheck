import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { canViewAudit } from "@/lib/access";
import { toJson, toMarkdown } from "@/lib/audit/report";
import type { AuditMeta, CheckResult } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?format=md|json: the report as Markdown (for issues and PRs) or JSON. Same visibility as the page. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const format = new URL(req.url).searchParams.get("format") === "json" ? "json" : "md";
  const audit = await prisma.audit.findUnique({
    where: { id },
    select: { id: true, label: true, target: true, finalUrl: true, source: true, status: true, createdAt: true, durationMs: true, checks: true, meta: true, ownerId: true, requests: { select: { status: true, expertId: true } } },
  });
  if (!audit || !canViewAudit(audit, await getUser()) || audit.status !== "COMPLETED") return new Response("Not found", { status: 404 });

  const reportUrl = new URL(`/audits/${audit.id}`, req.url).toString();
  const data = { ...audit, checks: (audit.checks ?? []) as unknown as CheckResult[], meta: (audit.meta ?? {}) as AuditMeta };
  const name = `vibecheck-${audit.label.replace(/[^a-z0-9.-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "audit"}-${audit.id.slice(-6)}`;
  const isPrivate = audit.source === "ZIP";
  const headers = { "cache-control": isPrivate ? "private, no-store" : "no-store", "x-content-type-options": "nosniff" };
  if (format === "json") {
    return new Response(JSON.stringify(toJson(data, reportUrl), null, 2), { headers: { ...headers, "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="${name}.json"` } });
  }
  return new Response(toMarkdown(data, reportUrl), { headers: { ...headers, "content-type": "text/markdown; charset=utf-8", "content-disposition": `attachment; filename="${name}.md"` } });
}
