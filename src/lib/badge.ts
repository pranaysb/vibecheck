import { prisma } from "@/lib/db";
import { AuditInputError, normalizeUrl } from "@/lib/audit/url-audit";

/** The latest completed public (live URL) audit of a site, or null. Badges never show anything else. */
export async function latestSiteAudit(site: string) {
  let target: string;
  try {
    target = normalizeUrl(site);
  } catch (err) {
    if (err instanceof AuditInputError) return null;
    throw err;
  }
  return prisma.audit.findFirst({
    where: { target, source: "URL", status: "COMPLETED", score: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { id: true, score: true, createdAt: true, label: true },
  });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
/** Width of 11px Verdana text, close enough for a badge (shields.io uses the same approach). */
const textWidth = (s: string) => Math.ceil([...s].reduce((w, c) => w + (/[ilI.:,;'|!]/.test(c) ? 3.6 : /[mwMW]/.test(c) ? 10.5 : /[A-Z0-9]/.test(c) ? 7.6 : 6.6), 0));

export function badgeColor(score: number | null): string {
  if (score === null) return "#6b6b6b";
  return score >= 90 ? "#1f883d" : score >= 70 ? "#9a6700" : "#cf222e";
}

/** A shields.io-style SVG: "VibeCheck | 84/100", colored by the same bands as the report's score ring. */
export function badgeSvg(score: number | null, title: string): string {
  const left = "VibeCheck";
  const right = score === null ? "not audited" : `${score}/100`;
  const lw = textWidth(left) + 12;
  const rw = textWidth(right) + 12;
  const w = lw + rw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(`${left}: ${right}`)}"><title>${esc(title)}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#24292f"/><rect x="${lw}" width="${rw}" height="20" fill="${badgeColor(score)}"/><rect width="${w}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11"><text x="${lw / 2}" y="14">${left}</text><text x="${lw + rw / 2}" y="14">${esc(right)}</text></g></svg>`;
}
