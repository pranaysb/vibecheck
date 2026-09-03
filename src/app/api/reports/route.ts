import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ReportReason, ReportStatus, ReportTargetType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reporterId, targetType, targetId, reason, details } = body;

    if (!reporterId || !targetType || !targetId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType: targetType as ReportTargetType,
        targetId,
        reason: (reason as ReportReason) || ReportReason.OTHER,
        details: details || null,
        status: ReportStatus.PENDING,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { reportId, status } = body;

    if (!reportId || !status) {
      return NextResponse.json({ error: "reportId and status required" }, { status: 400 });
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as ReportStatus,
        resolvedAt: status !== "PENDING" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
