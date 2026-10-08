"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type FormState = { error?: string; ok?: string } | undefined;

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
  if (await prisma.user.findUnique({ where: { email } })) return { error: "An account with that email already exists. Sign in instead." };
  const user = await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const limited = await throttle("signin");
  if (limited) return { error: limited };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "That email and password don't match." };
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
