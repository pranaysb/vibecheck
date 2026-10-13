import { del, get, list, put } from "@vercel/blob";

/**
 * File storage for audit uploads and screenshots.
 * - With a Vercel Blob store connected (BLOB_READ_WRITE_TOKEN or OIDC + BLOB_STORE_ID), bytes live in a
 *   *private* store and are only ever served through our own routes after an access check.
 * - Without one (local dev, CI), callers keep bytes inline in Postgres.
 * Keys are prefixed with the environment so local and preview runs never mix with production objects.
 */

/** Max .zip size for browser-to-Blob uploads (not subject to the platform's request-body limit). */
export const MAX_DIRECT_UPLOAD_MB = Number(process.env.MAX_DIRECT_UPLOAD_MB ?? 50);

export function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL));
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

/** Deletes every object under the given prefixes (paginated). Returns the number deleted. */
export async function deleteByPrefix(prefixes: string[]): Promise<number> {
  if (!blobEnabled() || !prefixes.length) return 0;
  let deleted = 0;
  for (const prefix of prefixes) {
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      if (page.blobs.length) {
        await del(page.blobs.map((b) => b.url));
        deleted += page.blobs.length;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }
  return deleted;
}

export function deleteAuditObjects(auditIds: string[]): Promise<number> {
  return deleteByPrefix(auditIds.map(auditPrefix));
}

/** Reads a stored row's bytes from wherever they live. */
export async function readStored(row: { blobKey: string | null; data: Uint8Array | null }): Promise<Uint8Array | null> {
  if (row.blobKey) return getObject(row.blobKey);
  return row.data ? new Uint8Array(row.data) : null;
}
