import Link from "next/link";
import { getUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { UserButton } from "@clerk/nextjs";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight text-[15px]">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <rect width="20" height="20" rx="6" fill="currentColor" />
        <path d="M5.5 10.5l3 3 6-7" stroke="var(--bg)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      VibeCheck
    </span>
  );
}

export async function Header() {
  const user = await getUser();
  const unread = user ? await prisma.notification.count({ where: { userId: user.id, readAt: null } }) : 0;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl h-14 px-4 sm:px-6 flex items-center gap-2">
        <Link href="/" className="mr-3 rounded-md" aria-label="VibeCheck home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden sm:flex items-center">
          <Link href="/experts" className="btn btn-ghost btn-sm">Experts</Link>
          <Link href="/methodology" className="btn btn-ghost btn-sm">Methodology</Link>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <>
              {user.expertStatus === "APPROVED" && <Link href="/expert" className="btn btn-ghost btn-sm hidden sm:inline-flex">Review queue</Link>}
              {user.isAdmin && <Link href="/admin" className="btn btn-ghost btn-sm hidden sm:inline-flex">Admin</Link>}
              <Link href="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
              <Link href="/notifications" className="btn btn-ghost btn-sm relative px-2" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-fg text-bg text-[10px] font-semibold leading-4 text-center tabular-nums" aria-hidden="true">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <span className="ml-1.5 grid size-8 place-items-center">
                <UserButton />
              </span>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/sign-up" className="btn btn-primary btn-sm">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
