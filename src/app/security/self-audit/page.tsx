import { Metadata } from "next";
import { executeLiveSelfAuditProbes, generateSelfAuditReport } from "@/lib/audit/self-audit-engine";
import SelfAuditClientView from "./SelfAuditClientView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Security Self-Audit — VibeCheck",
  description: "Live in-process telemetry and verified security gate benchmarks for VibeCheck core platform.",
};

export default async function SelfAuditPage() {
  let initialReport;
  try {
    const liveResults = await executeLiveSelfAuditProbes();
    initialReport = generateSelfAuditReport(liveResults);
  } catch (err) {
    console.error("Failed to generate live self-audit report on server:", err);
    initialReport = generateSelfAuditReport();
  }

  return <SelfAuditClientView initialReport={initialReport} />;
}
