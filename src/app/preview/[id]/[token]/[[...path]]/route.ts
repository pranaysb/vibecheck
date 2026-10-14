import { prisma } from "@/lib/db";
import { verifyPreviewToken } from "@/lib/preview";
import { readStored } from "@/lib/storage";
import type { AuditMeta } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves an uploaded site for human review. The CSP `sandbox` directive (without allow-same-origin)
 * gives the document an opaque origin, so uploaded scripts cannot read VibeCheck cookies or call
 * its APIs as the viewer. Access comes from the signed token (see lib/preview.ts).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; token: string; path?: string[] }> }) {
  const { id, token, path = [] } = await ctx.params;
  if (!verifyPreviewToken(id, token)) return new Response("This preview link has expired. Reopen it from the audit page.", { status: 403 });
  const audit = await prisma.audit.findUnique({ where: { id }, select: { source: true, meta: true } });
  if (!audit || audit.source === "URL") return new Response("Not found", { status: 404 });

  const root = (audit.meta as AuditMeta | null)?.files?.root;
  if (root === null || root === undefined) return new Response("This upload has no renderable site.", { status: 404 });
  const prefix = root ? root + "/" : "";
  let rel = path.map(decodeURIComponent).join("/");
  if (rel === "" || rel.endsWith("/")) rel += "index.html";

  const candidates = [rel, rel + ".html", rel + "/index.html"].map((p) => prefix + p);
  const file = await prisma.auditFile.findFirst({ where: { auditId: id, path: { in: candidates } } });
  const bytes = file ? await readStored(file) : null;
  if (!file || !bytes) return new Response("Not found in upload", { status: 404 });

  let body: BodyInit = new Uint8Array(bytes);
  const base = `/preview/${id}/${token}/`;
  // Root-relative URLs ("/style.css") would otherwise hit VibeCheck itself; point them into the upload.
  if (file.contentType.startsWith("text/html")) {
    // Next.js drops trailing slashes, so pin relative URLs to the served file's directory.
    const dir = file.path.slice(prefix.length).split("/").slice(0, -1).map(encodeURIComponent).join("/");
    const baseTag = `<base href="${base}${dir ? dir + "/" : ""}">`;
    const html = Buffer.from(bytes).toString("utf8").replace(/(\s(?:src|href|action|poster)\s*=\s*["'])\/(?!\/)/gi, `$1${base}`);
    body = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + baseTag) : baseTag + html;
  } else if (file.contentType.startsWith("text/css")) {
    body = Buffer.from(bytes).toString("utf8").replace(/url\(\s*(["']?)\/(?!\/)/gi, `url($1${base}`);
  }

  return new Response(body, {
    headers: {
      "content-type": file.contentType,
      "content-security-policy": "sandbox allow-scripts allow-forms allow-popups allow-modals",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cache-control": "private, max-age=300",
      // The sandboxed page has an opaque ("null") origin, and module scripts, fonts and crossorigin assets are
      // always fetched with CORS, so without this they'd be blocked. Access is granted by the signed token in
      // the URL, not by cookies, so allowing any origin (without credentials) exposes nothing new.
      "access-control-allow-origin": "*",
    },
  });
}
