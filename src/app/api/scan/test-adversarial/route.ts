import { NextResponse } from "next/server";
import { validateTargetDestination } from "@/lib/security/ssrf";

export async function GET() {
  const attackVectors = [
    // 1. IPv4 Loopback & Canonical representations
    { name: "IPv4 Standard Loopback (127.0.0.1)", url: "http://127.0.0.1", expectedBlocked: true },
    { name: "IPv4 Shorthand 127.1", url: "http://127.1", expectedBlocked: true },
    { name: "IPv4 Shorthand 127.0.1", url: "http://127.0.1", expectedBlocked: true },
    { name: "Decimal Encoded 127.0.0.1 (2130706433)", url: "http://2130706433", expectedBlocked: true },
    { name: "Hexadecimal Encoded 127.0.0.1 (0x7f000001)", url: "http://0x7f000001", expectedBlocked: true },
    { name: "Octal Component IPv4 (0177.0.0.1)", url: "http://0177.0.0.1", expectedBlocked: true },
    { name: "Mixed Hex/Dot IPv4 (0x7f.0.0.1)", url: "http://0x7f.0.0.1", expectedBlocked: true },
    { name: "Zero Source Address (0.0.0.0)", url: "http://0.0.0.0", expectedBlocked: true },

    // 2. Localhost Domain & Internal Cloud Metadata Hostnames
    { name: "Localhost Hostname", url: "http://localhost", expectedBlocked: true },
    { name: "Localhost Subdomain (app.localhost)", url: "http://app.localhost", expectedBlocked: true },
    { name: "GCP Metadata Hostname", url: "http://metadata.google.internal", expectedBlocked: true },
    { name: "AWS Instance Data Hostname", url: "http://instance-data", expectedBlocked: true },

    // 3. IPv6 Loopback, Translations & Special Prefixes
    { name: "IPv6 Loopback ([::1])", url: "http://[::1]", expectedBlocked: true },
    { name: "IPv6 Full Form Loopback ([0:0:0:0:0:0:0:1])", url: "http://[0:0:0:0:0:0:0:1]", expectedBlocked: true },
    { name: "IPv4-Mapped IPv6 Loopback ([::ffff:127.0.0.1])", url: "http://[::ffff:127.0.0.1]", expectedBlocked: true },
    { name: "Hex IPv4-Mapped IPv6 ([::ffff:7f00:1])", url: "http://[::ffff:7f00:1]", expectedBlocked: true },
    { name: "IPv6 Link-Local ([fe80::1])", url: "http://[fe80::1]", expectedBlocked: true },
    { name: "IPv6 Unique Local Address ([fc00::1])", url: "http://[fc00::1]", expectedBlocked: true },
    { name: "IPv6 Unique Local Address ([fd00::1])", url: "http://[fd00::1]", expectedBlocked: true },
    { name: "IPv6 Multicast ([ff02::1])", url: "http://[ff02::1]", expectedBlocked: true },
    { name: "IPv6 Zone Identifier Attempt (http://[fe80::1%25eth0])", url: "http://[fe80::1%25eth0]", expectedBlocked: true },

    // 4. Cloud Metadata & Private Networks (RFC-1918, CGNAT, Documentation)
    { name: "Cloud Metadata IP AWS/GCP (169.254.169.254)", url: "http://169.254.169.254", expectedBlocked: true },
    { name: "RFC-1918 Class A (10.0.0.1)", url: "http://10.0.0.1", expectedBlocked: true },
    { name: "RFC-1918 Class B (172.16.0.1)", url: "http://172.16.0.1", expectedBlocked: true },
    { name: "RFC-1918 Class C (192.168.1.1)", url: "http://192.168.1.1", expectedBlocked: true },
    { name: "Carrier-Grade NAT (100.64.0.1)", url: "http://100.64.0.1", expectedBlocked: true },
    { name: "TEST-NET-1 Documentation IP (192.0.2.1)", url: "http://192.0.2.1", expectedBlocked: true },
    { name: "TEST-NET-2 Documentation IP (198.51.100.1)", url: "http://198.51.100.1", expectedBlocked: true },
    { name: "Multicast Network (224.0.0.1)", url: "http://224.0.0.1", expectedBlocked: true },
    { name: "Reserved Class E Network (240.0.0.1)", url: "http://240.0.0.1", expectedBlocked: true },

    // 5. Protocol Whitelisting & Valid Public Destinations
    { name: "Non-HTTP Scheme (ftp://127.0.0.1)", url: "ftp://127.0.0.1", expectedBlocked: true },
    { name: "Non-HTTP Scheme (gopher://127.0.0.1)", url: "gopher://127.0.0.1", expectedBlocked: true },
    { name: "Non-HTTP Scheme (file:///etc/passwd)", url: "file:///etc/passwd", expectedBlocked: true },
    { name: "Valid Public Target (https://example.com)", url: "https://example.com", expectedBlocked: false },
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
