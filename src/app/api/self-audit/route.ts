import { NextResponse } from "next/server";
import { executeLiveSelfAuditProbes, generateSelfAuditReport } from "@/lib/audit/self-audit-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const liveResults = await executeLiveSelfAuditProbes();
    const liveReport = generateSelfAuditReport(liveResults);

    return NextResponse.json(liveReport, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Failed to run live self audit:", err);
    return NextResponse.json(
      { error: "Failed to execute live self-audit", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
