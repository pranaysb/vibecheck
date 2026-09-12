import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Audit ID is required" }, { status: 400 });
    }

    const report = await prisma.auditReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Audit report not found" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to retrieve audit report" }, { status: 500 });
  }
}
