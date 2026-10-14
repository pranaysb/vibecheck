import { test } from "node:test";
import assert from "node:assert/strict";
import { e2eAuthEnabled, e2eCookieValue, verifyE2eCookie } from "../src/lib/auth/e2e";

test("test-only sign-in: off without a secret, off on Vercel, cookies can't be forged", () => {
  const saved = { secret: process.env.E2E_AUTH_SECRET, vercel: process.env.VERCEL };
  try {
    delete process.env.E2E_AUTH_SECRET;
    delete process.env.VERCEL;
    assert.equal(e2eAuthEnabled(), false, "no secret, no test sign-in");

    process.env.E2E_AUTH_SECRET = "unit-test-secret";
    assert.equal(e2eAuthEnabled(), true);
    const cookie = e2eCookieValue("user_123");
    assert.equal(verifyE2eCookie(cookie), "user_123");
    assert.equal(verifyE2eCookie(cookie.replace("user_123", "user_999")), null, "user id can't be swapped");
    assert.equal(verifyE2eCookie("user_123.forged"), null);
    assert.equal(verifyE2eCookie(undefined), null);

    process.env.VERCEL = "1";
    assert.equal(e2eAuthEnabled(), false, "never on Vercel, even with the secret set");
    assert.equal(verifyE2eCookie(cookie), null);
  } finally {
    if (saved.secret === undefined) delete process.env.E2E_AUTH_SECRET;
    else process.env.E2E_AUTH_SECRET = saved.secret;
    if (saved.vercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = saved.vercel;
  }
});
