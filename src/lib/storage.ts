import { del, get, list, put } from "@vercel/blob";
import { unzipSync, zipSync, type Zippable } from "fflate";

/**
 * File storage for audit uploads and screenshots.
 * - On Vercel with a Blob store connected, bytes live in a *private* store and are only ever served through our
 *   own routes after an access check. Each audit is ONE object (a zip "pack" of its files and screenshots), and
 *   objects are deleted by exact key, because the Hobby plan includes 2,000 uploads/lists a month and blocks Blob
 *   for 30 days past that. Deletes and reads are not counted against it.
 * - Everywhere else (local dev, CI) bytes stay inline in Postgres, so test runs never use the production store.
 *   Set BLOB_LOCAL=1 to use Blob from a local machine on purpose.
 */

/** Max .zip size for browser-to-Blob uploads (not subject to the platform's request-body limit). */
export const MAX_DIRECT_UPLOAD_MB = Number(process.env.MAX_DIRECT_UPLOAD_MB ?? 50);

export function blobEnabled(): boolean {
  const configured = Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL));
  return configured && Boolean(process.env.VERCEL || process.env.BLOB_LOCAL === "1");
}

function envPrefix(): string {
  return process.env.VERCEL_ENV ?? "local";
}

export function auditPrefix(auditId: string): string {
  return `${envPrefix()}/audits/${auditId}/`;
}

export function uploadPrefix(userId: string): string {
  return `${envPrefix()}/uploads/${userId}/`;
}

export function packKeyFor(auditId: string): string {
  return `${auditPrefix(auditId)}pack.zip`;
}

export async function putObject(key: string, data: Uint8Array, contentType: string): Promise<string> {
  const blob = await put(key, Buffer.from(data), {
    access: "private",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.pathname;
}

/** `fresh` reads from origin instead of the CDN; use it when reading right after a write. */
export async function getObject(key: string, { fresh = false } = {}): Promise<Uint8Array | null> {
  const res = await get(key, { access: "private", useCache: !fresh });
  if (!res || res.statusCode !== 200 || !res.stream) return null;
  return new Uint8Array(await new Response(res.stream).arrayBuffer());
}

/** Deletes objects by exact key, in batches. Free on every plan (unlike listing). */
export async function deleteKeys(keys: string[]): Promise<number> {
  const unique = [...new Set(keys.filter(Boolean))];
  if (!blobEnabled() || !unique.length) return 0;
  for (let i = 0; i < unique.length; i += 500) await del(unique.slice(i, i + 500));
  return unique.length;
}

/**
 * Deletes everything stored for these audits: their pack, plus any per-file objects from before packs existed.
 * Keys come from the database, so nothing has to be listed.
 */
export async function deleteAuditObjects(audits: { packKey: string | null; blobKeys: (string | null)[] }[]): Promise<number> {
  return deleteKeys(audits.flatMap((a) => [a.packKey, ...a.blobKeys]).filter((k): k is string => Boolean(k)));
}

/** Packs an audit's files and screenshots into one zip: images stored as-is, text compressed. */
export function buildPack(files: { path: string; data: Uint8Array }[], shots: { kind: string; data: Uint8Array }[]): Uint8Array {
  const entries: Zippable = {};
  for (const f of files) entries[`files/${f.path}`] = [f.data, { level: /\.(png|jpe?g|gif|webp|avif|woff2?|mp4|webm|zip|gz)$/i.test(f.path) ? 0 : 6 }];
  for (const s of shots) entries[`shots/${s.kind}.jpg`] = [s.data, { level: 0 }];
  return zipSync(entries);
}

// Recently read packs stay in memory, so a preview's dozens of asset requests don't each download the pack.
const PACK_CACHE_BYTES = 150 * 1024 * 1024;
const packCache = new Map<string, Promise<Record<string, Uint8Array> | null>>();
const packSizes = new Map<string, number>();

async function loadPack(key: string): Promise<Record<string, Uint8Array> | null> {
  const hit = packCache.get(key);
  if (hit) {
    packCache.delete(key); // re-insert: most recently used last
    packCache.set(key, hit);
    return hit;
  }
  const loading = (async () => {
    const bytes = await getObject(key);
    if (!bytes) return null;
    packSizes.set(key, bytes.length);
    let total = [...packSizes.values()].reduce((a, b) => a + b, 0);
    for (const k of packCache.keys()) {
      if (total <= PACK_CACHE_BYTES || k === key) break;
      total -= packSizes.get(k) ?? 0;
      packCache.delete(k);
      packSizes.delete(k);
    }
    return unzipSync(bytes);
  })();
  packCache.set(key, loading);
  loading.then((v) => !v && packCache.delete(key)).catch(() => packCache.delete(key));
  return loading;
}

/** Reads a stored row's bytes from wherever they live: inline, its own object (older audits), or the audit's pack. */
export async function readStored(row: { blobKey: string | null; data: Uint8Array | null }, pack?: { key: string | null; entry: string }): Promise<Uint8Array | null> {
  if (row.blobKey) return getObject(row.blobKey);
  if (row.data) return new Uint8Array(row.data);
  if (pack?.key) return (await loadPack(pack.key))?.[pack.entry] ?? null;
  return null;
}

/** Lists uploads left behind by abandoned upload flows (one list call per 1000 objects; run daily at most). */
export async function listUploads(prefix: string): Promise<{ pathname: string; uploadedAt: Date }[]> {
  if (!blobEnabled()) return [];
  const out: { pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}
