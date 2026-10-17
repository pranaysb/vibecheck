import { latestSiteAudit } from "@/lib/badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?site=example.com: redirects to the site's latest report, so a README badge always links to current evidence. */
export async function GET(req: Request) {
  const site = new URL(req.url).searchParams.get("site")?.slice(0, 300) ?? "";
  const audit = site ? await latestSiteAudit(site) : null;
  return Response.redirect(new URL(audit ? `/audits/${audit.id}` : "/", req.url), 302);
}
