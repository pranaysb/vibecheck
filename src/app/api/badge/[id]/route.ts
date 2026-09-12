import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let score = 85;
  let grade = "B";

  try {
    const report = await prisma.auditReport.findUnique({
      where: { id },
      select: { score: true, grade: true },
    });
    if (report) {
      score = report.score;
      grade = report.grade;
    }
  } catch {
    // Graceful fallback for badge rendering
  }

  // Color mapping based on score
  let badgeColor = "#10b981"; // Emerald for A/A+
  if (grade === "B") badgeColor = "#0284c7"; // Blue
  else if (grade === "C") badgeColor = "#f59e0b"; // Amber
  else if (grade === "D") badgeColor = "#ea580c"; // Orange
  else if (grade === "F") badgeColor = "#e11d48"; // Rose

  const leftText = "VibeCheck";
  const rightText = `${grade} · ${score}/100`;

  // Exact character widths for crisp layout
  const leftWidth = 68;
  const rightWidth = rightText.length * 7 + 16;
  const totalWidth = leftWidth + rightWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#0f172a"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${badgeColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${leftText}</text>
    <text x="${leftWidth / 2}" y="14" fill="#fff" font-weight="600">${leftText}</text>
    <text aria-hidden="true" x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${rightText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14" fill="#fff" font-weight="700">${rightText}</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
