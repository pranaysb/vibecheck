import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { timeAgo } from "@/components/audit-ui";
import { markAllRead } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications", robots: { index: false } };

export default async function Notifications() {
  const user = await requireUser("/notifications");
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold">Notifications</h1>
        {unread > 0 && (
          <form action={markAllRead}>
            <button type="submit" className="btn btn-secondary btn-sm">Mark all as read</button>
          </form>
        )}
      </div>
      {items.length === 0 ? (
        <p className="card mt-8 p-6 text-sm text-muted">Nothing yet. You&rsquo;ll see updates here when an expert claims or delivers your review, when your review is rated, and when an admin decides on your application.</p>
      ) : (
        <ul className="card mt-8 divide-y divide-line">
          {items.map((n) => {
            const inner = (
              <div className="flex gap-3 px-5 py-4">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-fg"}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className={n.readAt ? "text-muted" : "font-medium"}>
                    {n.title}
                    {!n.readAt && <span className="sr-only"> (unread)</span>}
                  </p>
                  {n.body && <p className="mt-0.5 text-sm text-muted prose-text">{n.body}</p>}
                </div>
                <span className="text-xs text-faint shrink-0">{timeAgo(n.createdAt)}</span>
              </div>
            );
            return <li key={n.id}>{n.link ? <Link href={`/notifications/${n.id}`} prefetch={false} className="block hover:bg-surface">{inner}</Link> : inner}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
