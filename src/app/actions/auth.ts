"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import crypto from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getUser } from "@/lib/auth/session";
import { consumeCode, issueCode } from "@/lib/auth/email-code";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type FormState = { error?: string; ok?: string; email?: string } | undefined;

/** Auth state changes what the header shows, so refresh the root layout before navigating. */
function go(path: string): never {
  revalidatePath("/", "layout");
  redirect(path);
}

function safeNext(next: FormDataEntryValue | null): string {
  const s = typeof next === "string" ? next : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
}

async function throttle(key: string): Promise<string | null> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const r = checkRateLimit({ ip: `auth:${key}:${ip}` }, { maxPerIp: 10, windowMs: 10 * 60 * 1000 });
  return r.allowed ? null : `Too many attempts. Try again in ${r.retryAfterSeconds}s.`;
}

const SignUp = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.email("Enter a valid email.").trim().toLowerCase().max(200),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
});

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const limited = await throttle("signup");
  if (limited) return { error: limited };
  const parsed = SignUp.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) return { error: "An account with that email already exists. Sign in, or choose \"Email me a code\"." };
  const user = await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  await issueCode(email, "VERIFY");
  go(`/verify?next=${encodeURIComponent(safeNext(form.get("next")))}`);
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const limited = await throttle("signin");
  if (limited) return { error: limited };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "That email and password don't match." };
  await createSession(user.id);
  go(safeNext(form.get("next")));
}

// ---------- Email verification (signed-in user) ----------

export async function sendVerificationCode(): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Sign in first." };
  if (user.verified) return { ok: "Your email is already verified." };
  const r = await issueCode(user.email, "VERIFY");
  return r.ok ? { ok: `We sent a 6-digit code to ${user.email}.` } : { error: r.error };
}

export async function verifyEmail(_: FormState, form: FormData): Promise<FormState> {
  const limited = await throttle("verify");
  if (limited) return { error: limited };
  const user = await getUser();
  if (!user) return { error: "Sign in first." };
  if (!user.verified) {
    const r = await consumeCode(user.email, "VERIFY", String(form.get("code") ?? ""));
    if (!r.ok) return { error: r.error };
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  }
  go(safeNext(form.get("next")));
}

// ---------- Passwordless sign-in ----------

const GENERIC_SENT = "If an account exists for that email, we sent it a 6-digit code.";

export async function requestSignInCode(_: FormState, form: FormData): Promise<FormState> {
  const limited = await throttle("code");
  if (limited) return { error: limited };
  const parsed = z.email("Enter a valid email.").trim().toLowerCase().safeParse(form.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const email = parsed.data;
  // Same answer whether or not the account exists, so this can't be used to discover who has signed up.
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    const r = await issueCode(email, "SIGNIN");
    if (!r.ok && /just sent|Too many/.test(r.error)) return { error: r.error, email };
    if (!r.ok) return { error: r.error };
  }
  return { ok: GENERIC_SENT, email };
}

export async function signInWithCode(_: FormState, form: FormData): Promise<FormState> {
  const limited = await throttle("signin");
  if (limited) return { error: limited };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const r = user ? await consumeCode(email, "SIGNIN", String(form.get("code") ?? "")) : { ok: false as const, error: "That code has expired. Request a new one." };
  if (!r.ok) return { error: r.error, email };
  if (!user!.emailVerifiedAt) {
    // First proof of ownership. Whoever registered this address before may not have owned it:
    // end their sessions and retire the password they chose.
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: user!.id } }),
      prisma.user.update({
        where: { id: user!.id },
        data: { emailVerifiedAt: new Date(), passwordHash: await hashPassword(crypto.randomBytes(32).toString("hex")) },
      }),
    ]);
  }
  await createSession(user!.id);
  go(safeNext(form.get("next")));
}

export async function signOut() {
  await destroySession();
  go("/");
}
