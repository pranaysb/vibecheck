import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { fileReport, settleReport } from "../src/lib/moderation";
import { deleteUserData } from "../src/lib/account";

describe("moderation and account deletion (database)", async () => {
  const dbUp = await prisma.$queryRaw`select 1`.then(() => true).catch(() => false);
  if (!dbUp) {
    test.skip("database not reachable");
    return;
  }
  const tag = `mod-${Date.now()}`;
  const mkUser = (n: string) => prisma.user.create({ data: { email: `${tag}-${n}@vibecheck.test`, name: n } });

  // A requester, an expert who delivered a review, a second expert holding a claim, and a bystander.
  const builder = await mkUser("builder");
  const expert = await mkUser("expert");
  const expert2 = await mkUser("expert2");
  const bystander = await mkUser("bystander");
  const profile = await prisma.expertProfile.create({ data: { userId: expert.id, headline: "h", bio: "b", expertise: ["Security"], links: [], status: "APPROVED" } });
  await prisma.expertProfile.create({ data: { userId: expert2.id, headline: "h2", bio: "b2", expertise: ["SEO"], links: [], status: "APPROVED" } });
  const zipAudit = await prisma.audit.create({ data: { source: "ZIP", target: "a.zip", label: `${tag}-zip`, status: "COMPLETED", ownerId: builder.id } });
  const urlAudit = await prisma.audit.create({ data: { source: "URL", target: "https://example.com/", label: `${tag}-url`, status: "COMPLETED", ownerId: builder.id } });
  const delivered = await prisma.reviewRequest.create({ data: { auditId: urlAudit.id, requesterId: builder.id, focus: ["Security"], notes: "n", status: "COMPLETED", expertId: expert.id } });
  const review = await prisma.expertReview.create({ data: { requestId: delivered.id, expertId: expert.id, verdict: "FIX_FIRST", summary: "s".repeat(130), findings: [] } });
  const claimed = await prisma.reviewRequest.create({ data: { auditId: zipAudit.id, requesterId: builder.id, focus: ["SEO"], notes: "n", status: "CLAIMED", expertId: expert.id, claimedAt: new Date() } });

  test("reports: no self-reports, no duplicates", async () => {
    assert.deepEqual(await fileReport(expert.id, { targetType: "REVIEW", targetId: review.id, reason: "SPAM", details: "my own review" }), { error: "You can't report your own review." });
    assert.ok("ok" in (await fileReport(builder.id, { targetType: "REVIEW", targetId: review.id, reason: "ABUSIVE", details: "rude and unhelpful" })));
    assert.ok("ok" in (await fileReport(bystander.id, { targetType: "REVIEW", targetId: review.id, reason: "SPAM", details: "copy-pasted text" })));
    const dup = await fileReport(builder.id, { targetType: "REVIEW", targetId: review.id, reason: "ABUSIVE", details: "again again" });
    assert.ok("ok" in dup && /already reported/.test(dup.ok));
    assert.equal(await prisma.report.count({ where: { targetId: review.id } }), 2);
  });

  test("hiding a review settles every report on it and notifies the expert and reporters", async () => {
    const first = await prisma.report.findFirstOrThrow({ where: { targetId: review.id } });
    await settleReport(first.id, "hide");
    const after = await prisma.expertReview.findUniqueOrThrow({ where: { id: review.id } });
    assert.ok(after.hiddenAt);
    assert.equal(await prisma.report.count({ where: { targetId: review.id, status: "OPEN" } }), 0);
    assert.equal(await prisma.report.count({ where: { targetId: review.id, status: "ACTIONED" } }), 2);
    assert.equal(await prisma.notification.count({ where: { userId: expert.id, title: { contains: "removed" } } }), 1);
    assert.equal(await prisma.notification.count({ where: { userId: { in: [builder.id, bystander.id] }, title: "Action taken on your report" } }), 2);
  });

  test("a hide action on an expert report is treated as a dismissal (actions must match the target)", async () => {
    await fileReport(builder.id, { targetType: "EXPERT", targetId: profile.id, reason: "MISLEADING", details: "fake credentials" });
    const r = await prisma.report.findFirstOrThrow({ where: { targetId: profile.id } });
    await settleReport(r.id, "hide");
    assert.equal((await prisma.report.findUniqueOrThrow({ where: { id: r.id } })).status, "DISMISSED");
    assert.equal((await prisma.expertProfile.findUniqueOrThrow({ where: { id: profile.id } })).status, "APPROVED");
  });

  test("revoking an expert releases their claimed requests", async () => {
    await fileReport(bystander.id, { targetType: "EXPERT", targetId: profile.id, reason: "ABUSIVE", details: "harassing builders" });
    const r = await prisma.report.findFirstOrThrow({ where: { targetId: profile.id, status: "OPEN" } });
    await settleReport(r.id, "revoke");
    assert.equal((await prisma.expertProfile.findUniqueOrThrow({ where: { id: profile.id } })).status, "REJECTED");
    const c = await prisma.reviewRequest.findUniqueOrThrow({ where: { id: claimed.id } });
    assert.equal(c.status, "OPEN");
    assert.equal(c.expertId, null);
  });

  test("deleting an expert's account reopens requests they delivered", async () => {
    await deleteUserData(expert.id);
    assert.equal(await prisma.user.findUnique({ where: { id: expert.id } }), null);
    assert.equal(await prisma.expertReview.findUnique({ where: { id: review.id } }), null);
    const d = await prisma.reviewRequest.findUniqueOrThrow({ where: { id: delivered.id } });
    assert.equal(d.status, "OPEN", "requester isn't left with a 'delivered' request and no review");
  });

  test("deleting a builder's account removes uploads but keeps public URL audits, detached", async () => {
    await deleteUserData(builder.id);
    assert.equal(await prisma.audit.findUnique({ where: { id: zipAudit.id } }), null);
    const url = await prisma.audit.findUniqueOrThrow({ where: { id: urlAudit.id } });
    assert.equal(url.ownerId, null);
    assert.equal(await prisma.reviewRequest.count({ where: { requesterId: builder.id } }), 0);
    assert.equal(await prisma.notification.count({ where: { userId: builder.id } }), 0);

    await prisma.audit.deleteMany({ where: { label: { startsWith: tag } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: tag } } });
    await prisma.rateLimit.deleteMany({ where: { key: { startsWith: "report:" } } });
    await prisma.$disconnect();
  });
});
