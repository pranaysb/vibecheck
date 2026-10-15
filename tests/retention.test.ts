import { after, test, describe } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { runRetention } from "../src/lib/retention";
import { auditPrefix, uploadPrefix } from "../src/lib/storage";

describe("storage keys", () => {
  test("are namespaced by environment so local runs never touch production objects", () => {
    assert.match(auditPrefix("a1"), /^(local|development|preview|production)\/audits\/a1\/$/);
    assert.match(uploadPrefix("u1"), /\/uploads\/u1\/$/);
  });
});

describe("retention (database)", async () => {
  const dbUp = await prisma.$queryRaw`select 1`.then(() => true).catch(() => false);
  if (!dbUp) {
    test.skip("database not reachable");
    return;
  }
  const tag = `ret-${Date.now()}`;
  const day = 86400_000;
  const now = new Date();
  const shot = (auditId: string) => ({ auditId, kind: "desktop", width: 1, height: 1, data: new Uint8Array([1, 2, 3]) });

  // Cleanup runs even when an assertion fails, so a failed run never leaves rows behind.
  after(async () => {
    await prisma.audit.deleteMany({ where: { label: { startsWith: tag } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: tag } } });
    await prisma.$disconnect();
  });

  test("deletes expired files, spares in-progress reviews and recent audits, fails stuck runs", async () => {
    const user = await prisma.user.create({ data: { email: `${tag}@vibecheck.test`, name: "Retention test" } });
    const mk = (label: string, ageDays: number, status: "COMPLETED" | "RUNNING" = "COMPLETED") =>
      prisma.audit.create({ data: { source: "ZIP", target: `${label}.zip`, label: `${tag}-${label}`, status, createdAt: new Date(now.getTime() - ageDays * day) } });

    const expired = await mk("expired", 100);
    const reviewing = await mk("reviewing", 100);
    const recent = await mk("recent", 10);
    const stuck = await mk("stuck", 0.5, "RUNNING");
    await prisma.screenshot.createMany({ data: [shot(expired.id), shot(reviewing.id), shot(recent.id)] });
    await prisma.auditFile.create({ data: { auditId: expired.id, path: "index.html", contentType: "text/html", size: 3, data: new Uint8Array([60, 112, 62]) } });
    await prisma.reviewRequest.create({ data: { auditId: reviewing.id, requesterId: user.id, focus: ["Security"], notes: "in progress" } });
    const expert = await prisma.user.create({ data: { email: `${tag}-expert@vibecheck.test`, name: "Slow expert" } });
    const staleClaim = await prisma.reviewRequest.create({ data: { auditId: recent.id, requesterId: user.id, focus: ["SEO"], notes: "n", status: "CLAIMED", expertId: expert.id, claimedAt: new Date(now.getTime() - 8 * day) } });
    const freshClaim = await prisma.reviewRequest.create({ data: { auditId: recent.id, requesterId: user.id, focus: ["SEO"], notes: "n", status: "CLAIMED", expertId: expert.id, claimedAt: new Date(now.getTime() - 2 * day) } });

    const result = await runRetention(now);
    assert.ok(result.expiredAudits >= 1);
    assert.ok(result.stuckAudits >= 1);

    const after = async (id: string) => prisma.audit.findUnique({ where: { id }, include: { _count: { select: { files: true, screenshots: true } } } });
    const e = await after(expired.id);
    assert.equal(e?._count.files, 0);
    assert.equal(e?._count.screenshots, 0);
    assert.ok(e?.filesPurgedAt, "expired audit is marked purged");
    assert.equal(e?.status, "COMPLETED", "results are kept");

    assert.equal((await after(reviewing.id))?._count.screenshots, 1, "a review in progress keeps its files");
    assert.equal((await after(recent.id))?._count.screenshots, 1, "recent audits are untouched");
    const s = await after(stuck.id);
    assert.equal(s?.status, "FAILED");

    const sc = await prisma.reviewRequest.findUniqueOrThrow({ where: { id: staleClaim.id } });
    assert.equal(sc.status, "OPEN", "claims older than 7 days are released");
    assert.equal(sc.expertId, null);
    assert.equal((await prisma.reviewRequest.findUniqueOrThrow({ where: { id: freshClaim.id } })).status, "CLAIMED", "recent claims are kept");
    assert.equal(await prisma.notification.count({ where: { userId: { in: [user.id, expert.id] } } }), 2, "expert and requester are told");

  });
});
