import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { blobEnabled, buildPack, packKeyFor } from "../src/lib/storage";
import { auditObjectKeys } from "../src/lib/storage-keys";
import { prisma } from "../src/lib/db";

test("Blob is only used on Vercel, or locally when explicitly enabled", () => {
  const saved = { ...process.env };
  try {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    delete process.env.VERCEL;
    delete process.env.BLOB_LOCAL;
    assert.equal(blobEnabled(), false, "a pulled token alone must not send local runs to the production store");
    process.env.BLOB_LOCAL = "1";
    assert.equal(blobEnabled(), true);
    delete process.env.BLOB_LOCAL;
    process.env.VERCEL = "1";
    assert.equal(blobEnabled(), true);
    delete process.env.BLOB_READ_WRITE_TOKEN;
    assert.equal(blobEnabled(), false, "no store connected");
  } finally {
    process.env = saved;
  }
});

test("one pack holds every file and screenshot, byte for byte", () => {
  const png = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
  const html = new TextEncoder().encode("<h1>hi</h1>".repeat(50));
  const shot = new Uint8Array([255, 216, 255, 9, 9]);
  const pack = unzipSync(buildPack([{ path: "index.html", data: html }, { path: "img/logo.png", data: png }], [{ kind: "desktop", data: shot }]));
  assert.deepEqual(Object.keys(pack).sort(), ["files/img/logo.png", "files/index.html", "shots/desktop.jpg"]);
  assert.deepEqual(pack["files/index.html"], html);
  assert.deepEqual(pack["files/img/logo.png"], png);
  assert.deepEqual(pack["shots/desktop.jpg"], shot);
  assert.match(packKeyFor("abc"), /\/audits\/abc\/pack\.zip$/);
});

describe("deletion keys (database)", async () => {
  const dbUp = await prisma.$queryRaw`select 1`.then(() => true).catch(() => false);
  if (!dbUp) {
    test.skip("database not reachable");
    return;
  }
  const tag = `stk-${Date.now()}`;
  after(async () => {
    await prisma.audit.deleteMany({ where: { label: { startsWith: tag } } });
    await prisma.$disconnect();
  });
  test("keys come from the database: the pack plus any older per-file objects, nothing listed", async () => {
    const packed = await prisma.audit.create({ data: { source: "ZIP", target: "a.zip", label: `${tag}-a`, packKey: "local/audits/a/pack.zip" } });
    const legacy = await prisma.audit.create({ data: { source: "ZIP", target: "b.zip", label: `${tag}-b`, files: { create: [{ path: "index.html", contentType: "text/html", size: 1, blobKey: "local/audits/b/files/index.html" }] }, screenshots: { create: [{ kind: "desktop", width: 1, height: 1, blobKey: "local/audits/b/shots/desktop.jpg" }] } } });
    const keys = await auditObjectKeys([packed.id, legacy.id]);
    const byPack = keys.find((k) => k.packKey)!;
    assert.equal(byPack.packKey, "local/audits/a/pack.zip");
    assert.deepEqual(keys.find((k) => !k.packKey)!.blobKeys.sort(), ["local/audits/b/files/index.html", "local/audits/b/shots/desktop.jpg"]);
  });
});
