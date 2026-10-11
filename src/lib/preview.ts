import crypto from "node:crypto";
import { hmac } from "@/lib/secret";

/**
 * Sandboxed previews run on an opaque origin, so their subresource requests carry no session cookie.
 * Access is instead granted by an expiring HMAC token in the path, issued only after canViewAudit passes.
 */
const TTL_SECONDS = 12 * 60 * 60;

function sign(auditId: string, exp: number) {
  return hmac(`${auditId}.${exp}`).slice(0, 32);
}

export function previewPath(auditId: string, now = Date.now()): string {
  // Round expiry to the hour so the URL is stable across renders (and cacheable) within that window.
  const exp = Math.ceil(now / 1000 / 3600) * 3600 + TTL_SECONDS;
  return `/preview/${auditId}/${exp}.${sign(auditId, exp)}/`;
}

export function verifyPreviewToken(auditId: string, token: string, now = Date.now()): boolean {
  const [expStr, mac] = token.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < now || !mac) return false;
  const expected = sign(auditId, exp);
  return mac.length === expected.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}
