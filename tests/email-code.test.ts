import { test, describe, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { generateCode, hashCode, normalizeCode, issueCode, consumeCode, MAX_ATTEMPTS } from "../src/lib/auth/email-code";
import { prisma } from "../src/lib/db";

describe("email code primitives", () => {
  test("codes are 6 digits, zero-padded", () => {
    for (let i = 0; i < 500; i++) assert.match(generateCode(), /^\d{6}$/);
  });
  test("hash is bound to email and purpose", () => {
    const h = hashCode("a@x.test", "VERIFY", "123456");
    assert.equal(h, hashCode("A@X.test", "VERIFY", "123456"), "email is case-insensitive");
    assert.notEqual(h, hashCode("b@x.test", "VERIFY", "123456"));
    assert.notEqual(h, hashCode("a@x.test", "SIGNIN", "123456"));
    assert.ok(!h.includes("123456"), "plaintext code is never stored");
  });
  test("pasted codes with spaces or dashes normalize", () => {
    assert.equal(normalizeCode(" 123 456 "), "123456");
    assert.equal(normalizeCode("123-456"), "123456");
  });
});

// Integration: runs against the local database (skipped if it's unreachable).
describe("issue and consume (database)", async () => {
  const dbUp = await prisma.$queryRaw`select 1`.then(() => true).catch(() => false);
  if (!dbUp) {
    test.skip("database not reachable");
    return;
  }
  const email = `code-test-${Date.now()}@vibecheck.test`;
  const sent: string[] = [];
  const info = mock.method(console, "info", (msg: string) => {
    const m = /code to (?:verify your email|sign in) is (\d{6})/.exec(msg);
    if (m) sent.push(m[1]);
  });
  const lastCode = () => sent[sent.length - 1];

  before(async () => prisma.emailCode.deleteMany({ where: { email } }));
  after(async () => {
    info.mock.restore();
    await prisma.emailCode.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  test("issues a code and enforces the resend cooldown", async () => {
    const t0 = new Date();
    assert.deepEqual(await issueCode(email, "VERIFY", t0), { ok: true });
    assert.match(lastCode(), /^\d{6}$/);
    const again = await issueCode(email, "VERIFY", new Date(t0.getTime() + 5_000));
    assert.equal(again.ok, false);
  });

  test("wrong codes burn attempts, then lock out even the right code", async () => {
    const code = lastCode();
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < MAX_ATTEMPTS; i++) assert.equal((await consumeCode(email, "VERIFY", wrong)).ok, false);
    const r = await consumeCode(email, "VERIFY", code);
    assert.equal(r.ok, false);
    assert.match((r as { error: string }).error, /Too many/);
  });

  test("a new code invalidates the old one; the right code works exactly once", async () => {
    const old = lastCode();
    // Pretend the cooldown passed by issuing "later".
    assert.deepEqual(await issueCode(email, "VERIFY", new Date(Date.now() + 61_000)), { ok: true });
    const fresh = lastCode();
    if (old !== fresh) assert.equal((await consumeCode(email, "VERIFY", old)).ok, false, "old code is dead");
    assert.deepEqual(await consumeCode(email, "VERIFY", fresh), { ok: true });
    assert.equal((await consumeCode(email, "VERIFY", fresh)).ok, false, "single use");
  });

  test("codes don't cross purposes and expire", async () => {
    assert.deepEqual(await issueCode(email, "SIGNIN", new Date(Date.now() + 200_000)), { ok: true });
    const code = lastCode();
    assert.equal((await consumeCode(email, "VERIFY", code)).ok, false, "SIGNIN code can't verify");
    const r = await consumeCode(email, "SIGNIN", code, new Date(Date.now() + 200_000 + 11 * 60_000));
    assert.equal(r.ok, false, "expired after 10 minutes");
  });
});
