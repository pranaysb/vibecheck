import crypto from "node:crypto";
import type { CodePurpose } from "@prisma/client";
import { prisma } from "@/lib/db";
import { codeEmail, sendEmail } from "@/lib/email";
import { hmac } from "@/lib/secret";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_PER_HOUR = 5;

export function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Keyed hash bound to the email and purpose, so a leaked table row can't be replayed elsewhere. */
export function hashCode(email: string, purpose: CodePurpose, code: string): string {
  return hmac(`email-code:${purpose}:${email.toLowerCase()}:${code}`);
}

export function normalizeCode(input: string): string {
  return input.replace(/\D/g, "");
}

export type IssueResult = { ok: true } | { ok: false; error: string };

/** Creates a code, invalidates earlier ones for the same email+purpose, and emails it. Limits live in the DB so they hold across instances. */
export async function issueCode(email: string, purpose: CodePurpose, now = new Date()): Promise<IssueResult> {
  const recent = await prisma.emailCode.findMany({
    where: { email, purpose, createdAt: { gt: new Date(now.getTime() - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recent[0] && now.getTime() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now.getTime() - recent[0].createdAt.getTime())) / 1000);
    return { ok: false, error: `A code was just sent. You can request another in ${wait}s.` };
  }
  if (recent.length >= MAX_PER_HOUR) return { ok: false, error: "Too many codes requested for this email. Try again in an hour." };

  const code = generateCode();
  await prisma.emailCode.updateMany({ where: { email, purpose, consumedAt: null }, data: { consumedAt: now } });
  const row = await prisma.emailCode.create({
    data: { email, purpose, codeHash: hashCode(email, purpose, code), expiresAt: new Date(now.getTime() + CODE_TTL_MS) },
  });
  try {
    await sendEmail({ to: email, ...codeEmail(code, purpose) });
  } catch (err) {
    await prisma.emailCode.delete({ where: { id: row.id } }).catch(() => {});
    return { ok: false, error: (err as Error).message };
  }
  return { ok: true };
}

export type ConsumeResult = { ok: true } | { ok: false; error: string };

/** Checks a code against the newest live one. Every guess counts toward MAX_ATTEMPTS; success consumes it exactly once. */
export async function consumeCode(email: string, purpose: CodePurpose, input: string, now = new Date()): Promise<ConsumeResult> {
  const code = normalizeCode(input);
  if (code.length !== 6) return { ok: false, error: "Enter the 6-digit code from the email." };
  const row = await prisma.emailCode.findFirst({
    where: { email, purpose, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return { ok: false, error: "That code has expired. Request a new one." };
  // Claim an attempt atomically before comparing, so parallel guesses can't exceed MAX_ATTEMPTS.
  const claimed = await prisma.emailCode.updateMany({ where: { id: row.id, attempts: { lt: MAX_ATTEMPTS } }, data: { attempts: { increment: 1 } } });
  if (!claimed.count) return { ok: false, error: "Too many incorrect attempts. Request a new code." };

  const expected = Buffer.from(row.codeHash);
  const actual = Buffer.from(hashCode(email, purpose, code));
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return { ok: false, error: left > 0 ? `That code is incorrect. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many incorrect attempts. Request a new code." };
  }
  // Conditional update so two concurrent submissions can't both succeed.
  const won = await prisma.emailCode.updateMany({ where: { id: row.id, consumedAt: null }, data: { consumedAt: now } });
  return won.count ? { ok: true } : { ok: false, error: "That code was already used. Request a new one." };
}
