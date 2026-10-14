import crypto from "node:crypto";

/**
 * Test-only sign-in for the end-to-end suite (scripts/e2e.mjs), which drives the real UI with several
 * local users without creating accounts at Clerk.
 *
 * It can never be active on Vercel, and only works when E2E_AUTH_SECRET is set (local dev, CI).
 * The cookie is `<userId>.<HMAC(secret, userId)>`, so it can't be forged without the secret.
 */
export const E2E_COOKIE = "vc_e2e";

export function e2eAuthEnabled(): boolean {
  return Boolean(process.env.E2E_AUTH_SECRET) && !process.env.VERCEL;
}

function sign(userId: string): string {
  return crypto.createHmac("sha256", process.env.E2E_AUTH_SECRET!).update(`e2e:${userId}`).digest("base64url");
}

export function e2eCookieValue(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

/** Returns the user id from a valid cookie, or null. */
export function verifyE2eCookie(value: string | undefined): string | null {
  if (!value || !e2eAuthEnabled()) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = value.slice(0, dot);
  const mac = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  return mac.length === expected.length && crypto.timingSafeEqual(mac, expected) ? userId : null;
}
