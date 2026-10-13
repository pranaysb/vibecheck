import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, pruneRateLimits, getClientIp, extractTargetDomain } from "../src/lib/security/rate-limit";
import { prisma } from "../src/lib/db";

describe("request helpers", () => {
  test("client IP prefers the platform-set header", () => {
    assert.equal(getClientIp(new Request("http://x", { headers: { "x-real-ip": "203.0.113.9", "x-forwarded-for": "6.6.6.6, 1.1.1.1" } })), "203.0.113.9");
    assert.equal(getClientIp(new Request("http://x", { headers: { "x-forwarded-for": "198.51.100.42, 10.0.0.1" } })), "198.51.100.42");
    assert.equal(getClientIp(new Request("http://x")), "127.0.0.1");
  });
  test("target domain is normalized", () => {
    assert.equal(extractTargetDomain("https://sub.acme.com/path?foo=bar"), "sub.acme.com");
    assert.equal(extractTargetDomain("http://Acme.COM:8080/"), "acme.com");
    assert.equal(extractTargetDomain("api.example.org"), "api.example.org");
    assert.equal(extractTargetDomain("invalid://@@@"), null);
  });
});

describe("rateLimit (database)", async () => {
  const dbUp = await prisma.$queryRaw`select 1`.then(() => true).catch(() => false);
  if (!dbUp) {
    test.skip("database not reachable");
    return;
  }
  const key = `test:${Date.now()}`;

  test("allows up to the limit, then blocks with a retry time", async () => {
    const t0 = new Date();
    for (let i = 1; i <= 3; i++) {
      const r = await rateLimit(key, 3, 60, t0);
      assert.equal(r.allowed, true);
      assert.equal(r.remaining, 3 - i);
    }
    const blocked = await rateLimit(key, 3, 60, new Date(t0.getTime() + 10_000));
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds >= 49 && blocked.retryAfterSeconds <= 50, `retry ${blocked.retryAfterSeconds}`);
  });

  test("the window resets after it expires", async () => {
    const later = new Date(Date.now() + 61_000);
    const r = await rateLimit(key, 3, 60, later);
    assert.equal(r.allowed, true);
    assert.equal(r.remaining, 2);
  });

  test("concurrent requests are counted exactly (no lost updates)", async () => {
    const k = `${key}:race`;
    const results = await Promise.all(Array.from({ length: 20 }, () => rateLimit(k, 5, 60)));
    assert.equal(results.filter((r) => r.allowed).length, 5);
    const row = await prisma.rateLimit.findUnique({ where: { key: k } });
    assert.equal(row?.count, 20);
  });

  test("pruning removes stale windows only", async () => {
    await prisma.rateLimit.create({ data: { key: `${key}:old`, windowStart: new Date(Date.now() - 3 * 86400_000), count: 1 } });
    await pruneRateLimits();
    assert.equal(await prisma.rateLimit.findUnique({ where: { key: `${key}:old` } }), null);
    assert.ok(await prisma.rateLimit.findUnique({ where: { key } }));
    await prisma.rateLimit.deleteMany({ where: { key: { startsWith: key } } });
    await prisma.$disconnect();
  });
});
