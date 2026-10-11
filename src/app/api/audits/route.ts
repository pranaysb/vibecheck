import { getUser } from "@/lib/auth/session";
import { runAudit, type AuditEvent, type AuditInput } from "@/lib/audit/run";
import { checkRateLimit, extractTargetDomain, getClientIp } from "@/lib/security/rate-limit";
import { isSameOrigin } from "@/lib/security/origin";

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
    if (!user.verified) return fail(403, "Verify your email before uploading.");
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
    if (body?.source === "URL" && typeof body.url === "string" && body.url.trim()) input = { source: "URL", url: body.url.slice(0, 2048) };
    else if (body?.source === "GITHUB" && typeof body.repo === "string" && body.repo.trim()) {
      if (!user) return fail(401, "Sign in to import a repository.");
      if (!user.verified) return fail(403, "Verify your email before importing a repository.");
      input = { source: "GITHUB", repo: body.repo.slice(0, 300) };
    } else return fail(400, "Provide a URL, a GitHub repository, or a .zip file.");
  }

  const limit = checkRateLimit(
    { ip: user ? `user:${user.id}` : getClientIp(req), domain: input.source === "URL" ? extractTargetDomain(input.url) : null },
    { maxPerIp: user ? 10 : 4, maxPerDomain: 3 }
  );
  if (!limit.allowed) return fail(429, limit.reason ?? "Too many audits; try again shortly.", { "Retry-After": String(limit.retryAfterSeconds) });

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
