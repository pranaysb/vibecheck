import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { notifyAdmins, notifyExperts } from "../src/lib/notify";

describe("notification fan-out (database)", async () => {
  const dbUp = await prisma.$queryRaw`select 1`.then(() => true).catch(() => false);
  if (!dbUp) {
    test.skip("database not reachable");
    return;
  }
  const tag = `ntf-${Date.now()}`;
  after(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: tag } } });
    await prisma.$disconnect();
  });

  test("new requests reach approved experts in a matching area, never the requester or others", async () => {
    const mk = (n: string, expertise: string[] | null, status: "APPROVED" | "PENDING" = "APPROVED") =>
      prisma.user.create({
        data: { email: `${tag}-${n}@vibecheck.test`, name: n, ...(expertise ? { expertProfile: { create: { headline: "h", bio: "b".repeat(80), expertise, links: ["https://example.com"], status } } } : {}) },
      });
    const security = await mk("security", ["Security", "SEO"]);
    const seoOnly = await mk("seo", ["SEO"]);
    const pending = await mk("pending", ["Security"], "PENDING");
    const requester = await mk("requester", ["Security"]); // an approved expert who is also the requester
    await notifyExperts(["Security", "Mobile"], requester.id, `${tag} request`, "/expert");
    // Other test files run in parallel on the same database, so only this test's accounts are compared.
    const mine = [security.id, seoOnly.id, pending.id, requester.id];
    const got = await prisma.notification.findMany({ where: { title: `${tag} request`, userId: { in: mine } }, select: { userId: true } });
    assert.deepEqual(got.map((n) => n.userId), [security.id]);
    assert.ok(![seoOnly.id, pending.id, requester.id].some((id) => got.some((n) => n.userId === id)));
  });

  test("admin notifications go to accounts listed in ADMIN_EMAILS, case-insensitively", async () => {
    const admin = await prisma.user.create({ data: { email: `${tag}-Admin@vibecheck.test`, name: "Admin" } });
    const other = await prisma.user.create({ data: { email: `${tag}-user@vibecheck.test`, name: "User" } });
    const saved = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = `nobody@x.test, ${tag}-admin@vibecheck.test`;
    try {
      await notifyAdmins(`${tag} admin`, "/admin");
    } finally {
      process.env.ADMIN_EMAILS = saved;
    }
    const got = await prisma.notification.findMany({ where: { title: `${tag} admin`, userId: { in: [admin.id, other.id] } }, select: { userId: true } });
    assert.deepEqual(got.map((n) => n.userId), [admin.id]);
    assert.ok(!got.some((n) => n.userId === other.id));
  });
});
