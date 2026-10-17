import { badgeSvg, latestSiteAudit } from "@/lib/badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?site=example.com: an SVG badge with the site's latest VibeCheck score, for READMEs. */
export async function GET(req: Request) {
  const site = new URL(req.url).searchParams.get("site")?.slice(0, 300) ?? "";
  const audit = site ? await latestSiteAudit(site) : null;
  const title = audit ? `VibeCheck score for ${audit.label}: ${audit.score}/100, audited ${audit.createdAt.toISOString().slice(0, 10)}` : `No completed VibeCheck audit for ${site || "this site"}`;
  return new Response(badgeSvg(audit?.score ?? null, title), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      // Fresh enough for a README; image proxies (GitHub's camo) cache on top of this.
      "cache-control": "public, max-age=600, s-maxage=600",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
