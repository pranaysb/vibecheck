import { NextResponse } from "next/server";
import { executeDeepProbe } from "@/lib/scanner/deep-probe";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawUrl = body.url || body.targetUrl;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "A valid target URL is required (e.g., https://example.com)" }, { status: 400 });
    }

    // Execute deep SSRF-sandboxed probe
    const auditResult = await executeDeepProbe(rawUrl);

    // Persist to database
    let savedReportId = "";
    try {
      const savedReport = await prisma.auditReport.create({
        data: {
          targetUrl: auditResult.targetUrl,
          finalUrl: auditResult.finalUrl,
          domain: auditResult.domain,
          ipAddress: auditResult.ipAddress,
          statusCode: auditResult.statusCode,
          score: auditResult.score,
          grade: auditResult.grade,
          verdict: auditResult.verdict,
          ttfbMs: auditResult.ttfbMs,
          hops: auditResult.hops,
          findings: auditResult.findings as any,
          rawHeaders: auditResult.rawHeaders as any,
          sha256Digest: auditResult.sha256Digest,
          isPublic: true,
        },
      });
      savedReportId = savedReport.id;
    } catch (dbErr) {
      console.warn("Could not persist audit report to database, falling back to deterministic digest:", dbErr);
      // Fallback ID based on sha256 prefix
      savedReportId = auditResult.sha256Digest.slice(0, 16);
    }

    return NextResponse.json({
      id: savedReportId,
      ...auditResult,
    });
  } catch (err: any) {
    console.error("API SCAN ERROR:", err, "CAUSE:", err.cause);
    const isSsrfBlock = err.message?.includes("SSRF Sandbox Blocked");
    return NextResponse.json(
      {
        error: err.message || "Failed to audit target web application",
        details: err.cause ? String(err.cause) : undefined,
        securityGateBlocked: isSsrfBlock,
      },
      { status: isSsrfBlock ? 403 : 500 }
    );
  }
}
