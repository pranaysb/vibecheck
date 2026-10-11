import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { VerifyForm } from "./VerifyForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify your email", robots: { index: false } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const user = await requireUser(`/verify?next=${encodeURIComponent(safe)}`);
  if (user.verified) redirect(safe);
  // Show the code field whenever a live code exists, however the user got here.
  const live = await prisma.emailCode.count({ where: { email: user.email, purpose: "VERIFY", consumedAt: null, expiresAt: { gt: new Date() } } });
  return <VerifyForm email={user.email} next={safe} sent={live > 0} />;
}
