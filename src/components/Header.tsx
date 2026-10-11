import Link from "next/link";
import { getUser } from "@/lib/auth/session";
import { signOut } from "@/app/actions/auth";

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
              {!user.verified && (
                <Link href="/verify" className="chip h-8 px-3 text-[13px] text-fg border-line-strong hover:bg-surface mr-1">
                  <span className="size-1.5 rounded-full bg-warn" aria-hidden="true" />
                  Verify email
                </Link>
              )}
              {user.expertStatus === "APPROVED" && <Link href="/expert" className="btn btn-ghost btn-sm hidden sm:inline-flex">Review queue</Link>}
              {user.isAdmin && <Link href="/admin" className="btn btn-ghost btn-sm hidden sm:inline-flex">Admin</Link>}
              <Link href="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
              <form action={signOut}>
                <button className="btn btn-ghost btn-sm" type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signin" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
