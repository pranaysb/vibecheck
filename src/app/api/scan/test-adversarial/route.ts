import { NextResponse } from "next/server";
import { validateTargetDestination } from "@/lib/security/ssrf";
import { SSRF_ATTACK_VECTORS } from "@/lib/security/attack-vectors";

export async function GET() {
  const attackVectors = SSRF_ATTACK_VECTORS;

  const results = [];
  let allPassed = true;

  for (const vector of attackVectors) {
    const val = await validateTargetDestination(vector.url);
    const wasBlocked = !val.allowed;
    const testPassed = wasBlocked === vector.expectedBlocked;

    if (!testPassed) allPassed = false;

    results.push({
      vector: vector.name,
      testUrl: vector.url,
      expectedBlocked: vector.expectedBlocked,
      actuallyBlocked: wasBlocked,
      reason: val.reason || "Allowed public target",
      testPassed,
    });
  }

  return NextResponse.json({
    status: allPassed ? "ALL_ATTACKS_DEFENDED" : "VULNERABILITIES_DETECTED",
    totalVectorsTested: attackVectors.length,
    passedVectors: results.filter((r) => r.testPassed).length,
    failedVectors: results.filter((r) => !r.testPassed).length,
    results,
  });
}
