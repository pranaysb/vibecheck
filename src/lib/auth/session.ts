import { cache } from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Clerk owns sign-in, email verification and sessions. This module maps the signed-in Clerk user
 * onto VibeCheck's own User row (audits, reviews and expert profiles hang off it).
 */
export type SessionUser = Pick<User, "id" | "email" | "name"> & {
  isAdmin: boolean;
  expertStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
};

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

const SELECT = { id: true, email: true, name: true, expertProfile: { select: { status: true } } } as const;

/**
 * First request after a Clerk sign-in: link to an existing row with the same email (accounts created
 * before Clerk), or create one. Only a Clerk-verified primary email is ever stored, which is what
 * makes ADMIN_EMAILS safe: nobody can register an admin's address without receiving its code.
 */
async function linkClerkUser(clerkId: string) {
  const cu = await currentUser();
  const primary = cu?.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId);
  if (!cu || !primary || primary.verification?.status !== "verified") return null;
  const email = primary.emailAddress.toLowerCase();
  const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || cu.username || email.split("@")[0];

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, clerkId: true } });
  if (existing) {
    if (existing.clerkId && existing.clerkId !== clerkId) return null; // address belongs to another Clerk user
    return prisma.user.update({ where: { id: existing.id }, data: { clerkId }, select: SELECT });
  }
  try {
    return await prisma.user.create({ data: { clerkId, email, name }, select: SELECT });
  } catch {
    // Two first requests raced; the other one created the row.
    return prisma.user.findUnique({ where: { clerkId }, select: SELECT });
  }
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const user = (await prisma.user.findUnique({ where: { clerkId: userId }, select: SELECT })) ?? (await linkClerkUser(userId));
  if (!user) return null;
  const { expertProfile, ...u } = user;
  return { ...u, isAdmin: isAdminEmail(u.email), expertStatus: expertProfile?.status ?? null };
});

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getUser();
  if (user) return user;
  if ((await auth()).userId) {
    // Signed in to Clerk but not linkable (no verified primary email); redirecting to sign-in would loop.
    throw new Error("Your account needs a verified primary email address. Add one under Manage account.");
  }
  redirect(`/sign-in?redirect_url=${encodeURIComponent(next)}`);
}
