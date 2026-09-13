import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  getClientIp,
  extractTargetDomain,
  resetRateLimitStore,
} from "../src/lib/security/rate-limit";

describe("Abuse Protection & Rate Limiting Engine", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  test("1. Allows requests within requester IP quota and decrements remaining", () => {
    const config = { windowMs: 60000, maxPerIp: 5, maxPerDomain: 5 };

    const res1 = checkRateLimit({ ip: "192.168.1.50" }, config);
    assert.equal(res1.allowed, true);
    assert.equal(res1.remaining, 4);

    const res2 = checkRateLimit({ ip: "192.168.1.50" }, config);
    assert.equal(res2.allowed, true);
    assert.equal(res2.remaining, 3);
  });

  test("2. Rejects requests exceeding IP quota with HTTP 429 semantics", () => {
    const config = { windowMs: 60000, maxPerIp: 3, maxPerDomain: 10 };
    const ip = "203.0.113.10";

    assert.equal(checkRateLimit({ ip }, config).allowed, true);
    assert.equal(checkRateLimit({ ip }, config).allowed, true);
    assert.equal(checkRateLimit({ ip }, config).allowed, true);

    // 4th request must be rejected
    const blockedRes = checkRateLimit({ ip }, config);
    assert.equal(blockedRes.allowed, false);
    assert.equal(blockedRes.remaining, 0);
    assert.ok(blockedRes.retryAfterSeconds > 0, "Must provide positive retryAfterSeconds");
    assert.ok(blockedRes.reason?.includes("Rate limit exceeded"), "Must provide informative reason");
  });

  test("3. Enforces domain cooldown to prevent distributed target hammering", () => {
    const config = { windowMs: 60000, maxPerIp: 10, maxPerDomain: 2 };
    const domain = "victim-target.org";

    // Request 1 from IP A
    const res1 = checkRateLimit({ ip: "1.1.1.1", domain }, config);
    assert.equal(res1.allowed, true);

    // Request 2 from IP B
    const res2 = checkRateLimit({ ip: "2.2.2.2", domain }, config);
    assert.equal(res2.allowed, true);

    // Request 3 from IP C (exceeds domain quota of 2)
    const res3 = checkRateLimit({ ip: "3.3.3.3", domain }, config);
    assert.equal(res3.allowed, false);
    assert.ok(res3.reason?.includes("Target domain cooldown"));
    assert.ok(res3.retryAfterSeconds > 0);
  });

  test("4. Accurately extracts requester IP from standard headers", () => {
    // 1. x-forwarded-for with client IP first
    const req1 = new Request("http://localhost/api/scan", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
    });
    assert.equal(getClientIp(req1), "203.0.113.195");

    // 2. x-real-ip
    const req2 = new Request("http://localhost/api/scan", {
      headers: { "x-real-ip": "198.51.100.42" },
    });
    assert.equal(getClientIp(req2), "198.51.100.42");

    // 3. fallback when headers absent
    const req3 = new Request("http://localhost/api/scan");
    assert.equal(getClientIp(req3), "127.0.0.1");
  });

  test("5. Accurately extracts and normalizes target domain", () => {
    assert.equal(extractTargetDomain("https://sub.acme.com/path?foo=bar"), "sub.acme.com");
    assert.equal(extractTargetDomain("http://Acme.COM:8080/"), "acme.com");
    assert.equal(extractTargetDomain("api.example.org"), "api.example.org");
    assert.equal(extractTargetDomain("invalid://@@@"), null);
  });

  test("6. Allows requests again after store reset", () => {
    const config = { windowMs: 60000, maxPerIp: 1, maxPerDomain: 5 };
    const ip = "10.0.0.1";

    assert.equal(checkRateLimit({ ip }, config).allowed, true);
    assert.equal(checkRateLimit({ ip }, config).allowed, false);

    resetRateLimitStore();

    assert.equal(checkRateLimit({ ip }, config).allowed, true);
  });
});
