import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getUser } from "@/lib/auth/session";
import { MAX_DIRECT_UPLOAD_MB, blobEnabled, uploadPrefix } from "@/lib/storage";
import { isSameOrigin } from "@/lib/security/origin";
import { rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/**
 * Issues short-lived client tokens so the browser can upload a .zip straight to private Blob storage,
 * bypassing the platform's request-body limit. The token only permits a .zip under the caller's own prefix.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return Response.json({ error: "Cross-origin requests are not accepted." }, { status: 403 });
  if (!blobEnabled()) return Response.json({ error: "Direct uploads aren't configured on this server." }, { status: 501 });
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getUser();
        if (!user) throw new Error("Sign in to upload files.");
        if (!pathname.startsWith(uploadPrefix(user.id)) || !/\.zip$/i.test(pathname) || pathname.includes("..")) {
          throw new Error("Invalid upload path.");
        }
        const limited = await rateLimit(`upload:${user.id}`, 10, 3600);
        if (!limited.allowed) throw new Error(`Upload limit reached. Try again in ${Math.ceil(limited.retryAfterSeconds / 60)} min.`);
        return {
          allowedContentTypes: ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
          maximumSizeInBytes: MAX_DIRECT_UPLOAD_MB * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      // Completion is handled by POST /api/audits, which reads the blob; no webhook needed.
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
