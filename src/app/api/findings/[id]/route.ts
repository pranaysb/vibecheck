import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FindingStatus } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, versionFixed } = body;

    const finding = await prisma.finding.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!finding) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    const updated = await prisma.finding.update({
      where: { id },
      data: {
        status: status as FindingStatus,
        versionFixed: versionFixed || finding.versionFixed,
        fixedAt: status === "FIXED" ? new Date() : null,
      },
    });

    if (status === "FIXED") {
      await prisma.productEvent.create({
        data: {
          eventName: "finding_fixed",
          projectId: finding.projectId,
          userId: finding.project.userId,
          metadata: JSON.stringify({ findingId: id, category: finding.category }),
        },
      });
    }

    return NextResponse.json({ success: true, finding: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
