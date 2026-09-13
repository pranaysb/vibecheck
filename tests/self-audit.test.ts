import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  generateSelfAuditReport,
  executeLiveSelfAuditProbes,
  verifyReportIntegrity,
} from "../src/lib/audit/self-audit-engine";

describe("Self-Audit Engine & Live Telemetry Verification", () => {
  test("1. Generates honest audited baseline report when no live probes are supplied", () => {
    const report = generateSelfAuditReport();
    assert.equal(report.isLiveMeasured, false);
    assert.ok(report.auditId.startsWith("VC-SELF-"));

    // Check that pillars without live probes are honestly marked as AUDITED_BASELINE
    const ssrfPillar = report.pillarMeasurements.find((p) => p.name === "SSRF Sandboxing");
    assert.ok(ssrfPillar);
    assert.equal(ssrfPillar.verificationType, "AUDITED_BASELINE");
    assert.ok(ssrfPillar.methodology.includes("Verified at Commit"));

    const perfPillar = report.pillarMeasurements.find((p) => p.name === "Performance (Edge Latency)");
    assert.ok(perfPillar);
    assert.equal(perfPillar.verificationType, "AUDITED_BASELINE");
    assert.ok(perfPillar.rawMetricValue?.includes("Audited Baseline"));

    const valid = verifyReportIntegrity(report);
    assert.equal(valid.valid, true);
  });

  test("2. Executes genuine live in-process probes for SSRF and latency", async () => {
    const liveResults = await executeLiveSelfAuditProbes();

    assert.equal(liveResults.ssrfResult.total, 34, "Must test all 34 attack vectors");
    assert.equal(liveResults.ssrfResult.passed, 34, "All 34 vectors must be blocked or allowed appropriately");
    assert.equal(liveResults.ssrfResult.score, 100);

    assert.ok(liveResults.perfResult.iterations >= 25, "Must perform multiple iterations for p95");
    assert.ok(liveResults.perfResult.p95Ms > 0, "Measured p95 must be a real positive latency");
    assert.ok(liveResults.perfResult.p95Ms < 500, "In-process operations should complete in under 500ms");

    const liveReport = generateSelfAuditReport(liveResults);
    assert.equal(liveReport.isLiveMeasured, true);

    const liveSsrf = liveReport.pillarMeasurements.find((p) => p.name === "SSRF Sandboxing");
    assert.ok(liveSsrf);
    assert.equal(liveSsrf.verificationType, "LIVE_IN_PROCESS");
    assert.equal(liveSsrf.findingDefects, "34/34 Vectors Blocked");

    const livePerf = liveReport.pillarMeasurements.find((p) => p.name === "Performance (Edge Latency)");
    assert.ok(livePerf);
    assert.equal(livePerf.verificationType, "LIVE_IN_PROCESS");
    assert.ok(livePerf.rawMetricValue?.includes("Live Measured"));

    const valid = verifyReportIntegrity(liveReport);
    assert.equal(valid.valid, true);
  });

  test("3. Detects tampering when report fields or findings are modified post-generation", () => {
    const report = generateSelfAuditReport();
    const tampered = { ...report, findings: [...report.findings] };
    tampered.findings[0] = { ...tampered.findings[0]!, status: "ASSIGNED" };

    const check = verifyReportIntegrity(tampered);
    assert.equal(check.valid, false, "Must catch tampered report digest");
    assert.ok(check.reason?.includes("Report digest mismatch"));
  });
});
