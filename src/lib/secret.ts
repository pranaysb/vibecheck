import crypto from "node:crypto";

const fallback = crypto.randomBytes(32).toString("hex");

/**
 * Key for HMACs (preview links, email codes). Without SESSION_SECRET each server process uses its
 * own random key, which is fine for local dev but breaks across serverless instances.
 */
export function signingSecret(): string {
  return process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || fallback;
}

export function hmac(value: string): string {
  return crypto.createHmac("sha256", signingSecret()).update(value).digest("base64url");
}
