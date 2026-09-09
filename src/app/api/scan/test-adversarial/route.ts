import { NextResponse } from "next/server";
import { validateTargetDestination } from "@/lib/security/ssrf";

export async function GET() {
  const attackVectors = [
    { name: "IPv4 Literal Loopback", url: "http://127.0.0.1", expectedBlocked: true },
    { name: "Localhost Hostname", url: "http://localhost", expectedBlocked: true },
    { name: "Localhost Subdomain", url: "http://app.localhost", expectedBlocked: true },
    { name: "Zero Source Address", url: "http://0.0.0.0", expectedBlocked: true },
    { name: "IPv6 Loopback", url: "http://[::1]", expectedBlocked: true },
    { name: "IPv4-Mapped IPv6 Loopback", url: "http://[::ffff:127.0.0.1]", expectedBlocked: true },
    { name: "Cloud Metadata IP (AWS/GCP)", url: "http://169.254.169.254", expectedBlocked: true },
    { name: "GCP Metadata Hostname", url: "http://metadata.google.internal", expectedBlocked: true },
    { name: "RFC-1918 Class A (10.0.0.1)", url: "http://10.0.0.1", expectedBlocked: true },
    { name: "RFC-1918 Class B (172.16.0.1)", url: "http://172.16.0.1", expectedBlocked: true },
    { name: "RFC-1918 Class C (192.168.1.1)", url: "http://192.168.1.1", expectedBlocked: true },
    { name: "Decimal Encoded 127.0.0.1", url: "http://2130706433", expectedBlocked: true },
    { name: "Hexadecimal Encoded 127.0.0.1", url: "http://0x7f000001", expectedBlocked: true },
    { name: "Carrier-Grade NAT (100.64.0.1)", url: "http://100.64.0.1", expectedBlocked: true },
    { name: "Non-HTTP Scheme (ftp://)", url: "ftp://127.0.0.1", expectedBlocked: true },
    { name: "Valid Public Target (example.com)", url: "https://example.com", expectedBlocked: false },
  ];

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
