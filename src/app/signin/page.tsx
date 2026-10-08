import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Sign in" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (await getUser()) redirect(safe);
  return <AuthForm mode="signin" next={safe} />;
}
