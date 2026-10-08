import { test } from "node:test";
import assert from "node:assert/strict";
import { previewPath, verifyPreviewToken } from "../src/lib/preview";

test("preview tokens verify for their audit only, and expire", () => {
  const now = Date.UTC(2026, 9, 8, 12, 0, 0);
  const token = previewPath("audit_a", now).split("/")[3];
  assert.ok(verifyPreviewToken("audit_a", token, now));
  assert.ok(!verifyPreviewToken("audit_b", token, now), "token is bound to the audit id");
  assert.ok(!verifyPreviewToken("audit_a", token, now + 14 * 3600 * 1000), "token expires");
  const [exp, mac] = token.split(".");
  assert.ok(!verifyPreviewToken("audit_a", `${Number(exp) + 86400}.${mac}`, now), "expiry can't be extended");
  assert.ok(!verifyPreviewToken("audit_a", "garbage", now));
});
