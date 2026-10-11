import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashToken, newToken } from "./password";

const COOKIE = "vc_session";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionUser = Pick<User, "id" | "email" | "name"> & {
  verified: boolean;
  /** Only true once the email is verified, so nobody can claim an admin address they don't own. */
  isAdmin: boolean;
  expertStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
};

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function createSession(userId: string) {
  const { token, hash } = newToken();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await prisma.session.create({ data: { tokenHash: hash, userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(COOKIE);
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, emailVerifiedAt: true, expertProfile: { select: { status: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const { expertProfile, emailVerifiedAt, ...u } = session.user;
  const verified = emailVerifiedAt !== null;
  return { ...u, verified, isAdmin: verified && isAdminEmail(u.email), expertStatus: expertProfile?.status ?? null };
});

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return user;
}

/** For pages and actions that need a verified email (uploads, reviews, expert work, admin). */
export async function requireVerifiedUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!user.verified) redirect(`/verify?next=${encodeURIComponent(next)}`);
  return user;
}
