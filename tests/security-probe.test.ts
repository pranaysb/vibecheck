import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateTargetDestination } from "../src/lib/security/ssrf";

describe("SSRF Defensive Sandbox & Probing Gate", () => {
  test("1. Strictly blocks loopback and localhost destinations", async () => {
    const r1 = await validateTargetDestination("http://127.0.0.1:3000");
    assert.equal(r1.allowed, false);
    assert.ok(r1.reason?.includes("Loopback"));

    const r2 = await validateTargetDestination("http://localhost:8080");
    assert.equal(r2.allowed, false);

    const r3 = await validateTargetDestination("http://0.0.0.0");
    assert.equal(r3.allowed, false);
  });

  test("2. Strictly blocks AWS/GCP/Azure cloud metadata endpoint (169.254.169.254)", async () => {
    const metaCheck = await validateTargetDestination("http://169.254.169.254/latest/meta-data/");
    assert.equal(metaCheck.allowed, false);
    assert.ok(metaCheck.reason?.includes("Link-Local / Cloud Metadata"));
  });

  test("3. Strictly blocks private RFC-1918 subnets", async () => {
    const subnets = [
      "http://10.0.0.1",
      "http://10.254.0.1",
      "http://172.16.0.1",
      "http://172.31.255.255",
      "http://192.168.1.1",
      "http://192.168.0.254",
    ];

    for (const url of subnets) {
      const res = await validateTargetDestination(url);
      assert.equal(res.allowed, false, `Expected ${url} to be blocked`);
    }
  });

  test("4. Strictly blocks non-HTTP protocols (file://, gopher://, ftp://)", async () => {
    const protocols = [
      "file:///etc/passwd",
      "gopher://127.0.0.1:70",
      "ftp://example.com/file",
    ];

    for (const url of protocols) {
      const res = await validateTargetDestination(url);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Protocol"));
    }
  });

  test("5. Allows safe public internet destinations with DNS resolution", async () => {
    const publicSites = ["https://vercel.com", "https://github.com"];
    for (const site of publicSites) {
      const res = await validateTargetDestination(site);
      assert.equal(res.allowed, true, `Expected ${site} to be allowed`);
      assert.ok(res.resolvedIp, "Should resolve to public IP");
    }
  });
});
