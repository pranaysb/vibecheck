import { getUser } from "@/lib/auth/session";
import { runAudit, type AuditEvent, type AuditInput } from "@/lib/audit/run";
import { AuditInputError, normalizeUrl } from "@/lib/audit/url-audit";
import { rateLimit, extractTargetDomain, getClientIp } from "@/lib/security/rate-limit";
import { isSameOrigin } from "@/lib/security/origin";
import { deleteByPrefix, uploadPrefix } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 25) * 1024 * 1024;

function fail(status: number, error: string, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return fail(403, "Cross-origin requests are not accepted.");
  const user = await getUser();

  let input: AuditInput;
  const type = req.headers.get("content-type") ?? "";
  if (type.startsWith("multipart/form-data")) {
    if (!user) return fail(401, "Sign in to upload files.");
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > MAX_UPLOAD_BYTES + 64 * 1024) return fail(413, `Uploads are limited to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail(400, "Attach a .zip file.");
    if (file.size > MAX_UPLOAD_BYTES) return fail(413, `Uploads are limited to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
    if (!/\.zip$/i.test(file.name)) return fail(400, "Only .zip archives are supported.");
    input = { source: "ZIP", filename: file.name.slice(0, 120), data: new Uint8Array(await file.arrayBuffer()) };
  } else {
    const body = await req.json().catch(() => null);
    if (body?.source === "URL" && typeof body.url === "string" && body.url.trim()) {
      // Reject typos before they count against the rate limit.
      try {
        normalizeUrl(body.url.slice(0, 2048));
      } catch (err) {
        return fail(400, err instanceof AuditInputError ? err.message : "That doesn't look like a web address.");
      }
      input = { source: "URL", url: body.url.slice(0, 2048) };
    }
    else if (body?.source === "ZIP" && typeof body.blobKey === "string") {
      // A .zip the browser already uploaded to private Blob storage via /api/uploads.
      if (!user) return fail(401, "Sign in to upload files.");
      if (!body.blobKey.startsWith(uploadPrefix(user.id)) || body.blobKey.includes("..") || !/\.zip$/i.test(body.blobKey)) return fail(400, "Invalid upload.");
      const filename = typeof body.filename === "string" && /\.zip$/i.test(body.filename) ? body.filename.slice(0, 120) : "upload.zip";
      input = { source: "ZIP", filename, blobKey: body.blobKey };
    }
    else if (body?.source === "GITHUB" && typeof body.repo === "string" && body.repo.trim()) {
      if (!user) return fail(401, "Sign in to import a repository.");
      input = { source: "GITHUB", repo: body.repo.slice(0, 300) };
    } else return fail(400, "Provide a URL, a GitHub repository, or a .zip file.");
  }

  const who = user ? `user:${user.id}` : `ip:${getClientIp(req)}`;
  const mine = await rateLimit(`audit:${who}`, user ? 10 : 4, 60);
  if (!mine.allowed) return fail(429, `You've hit the audit limit (${mine.limit} per minute). Try again in ${mine.retryAfterSeconds}s.`, { "Retry-After": String(mine.retryAfterSeconds) });
  // Per-target cooldown so VibeCheck can't be used to hammer someone else's site.
  const domain = input.source === "URL" ? extractTargetDomain(input.url) : null;
  if (domain) {
    const target = await rateLimit(`audit-target:${domain}`, 3, 60);
    if (!target.allowed) return fail(429, `${domain} was audited several times in the last minute. Try again in ${target.retryAfterSeconds}s.`, { "Retry-After": String(target.retryAfterSeconds) });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: AuditEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          /* client went away; the audit still completes and is saved */
        }
      };
      try {
        await runAudit(input, user?.id ?? null, send);
        // The raw upload is no longer needed once its files are extracted (or the audit failed).
        if (input.source === "ZIP" && "blobKey" in input) await deleteByPrefix([input.blobKey]).catch(() => {});
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
