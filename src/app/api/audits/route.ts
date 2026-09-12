import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: any = { isPublic: true };
    if (domain) {
      where.domain = { contains: domain.toLowerCase(), mode: "insensitive" };
    }

    const audits = await prisma.auditReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        targetUrl: true,
        finalUrl: true,
        domain: true,
        statusCode: true,
        score: true,
        grade: true,
        verdict: true,
        ttfbMs: true,
        hops: true,
        sha256Digest: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ audits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to list audits" }, { status: 500 });
  }
}
