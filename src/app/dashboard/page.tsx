import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { cancelRequest } from "@/app/actions/reviews";
import { ScoreRing, SOURCE_LABEL, timeAgo } from "@/components/audit-ui";
import { VERDICT } from "@/components/review-ui";
import { DeleteAccount } from "./DeleteAccount";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const REQUEST_STATUS = { OPEN: "Waiting for an expert", CLAIMED: "In review", COMPLETED: "Delivered", CANCELLED: "Cancelled" } as const;

export default async function Dashboard() {
  const user = await requireUser("/dashboard");
  const [audits, requests] = await Promise.all([
    prisma.audit.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, label: true, source: true, status: true, score: true, createdAt: true } }),
    prisma.reviewRequest.findMany({
      where: { requesterId: user.id },
      orderBy: { createdAt: "desc" },
      include: { audit: { select: { label: true } }, expert: { select: { name: true } }, review: { select: { id: true, verdict: true, rating: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Hi, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-muted">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.expertStatus === "APPROVED" && <Link href="/expert" className="btn btn-secondary btn-sm">Review queue</Link>}
          {user.isAdmin && <Link href="/admin" className="btn btn-secondary btn-sm">Admin</Link>}
          {user.expertStatus === null && <Link href="/experts/apply" className="btn btn-secondary btn-sm">Apply as expert</Link>}
          {user.expertStatus === "PENDING" && <span className="chip h-8">Expert application pending</span>}
          <Link href="/" className="btn btn-primary btn-sm">New audit</Link>
        </div>
      </div>

      <section className="mt-12" aria-labelledby="reqs">
        <h2 id="reqs" className="text-base font-semibold mb-3">Expert reviews</h2>
        {requests.length === 0 ? (
          <p className="card p-6 text-sm text-muted">You haven&rsquo;t requested a review yet. Open any audit report and choose &ldquo;Request an expert review&rdquo;.</p>
        ) : (
          <ul className="card divide-y divide-line">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/audits/${r.auditId}`} className="font-medium hover:underline underline-offset-4 break-all">{r.audit.label}</Link>
                  <p className="text-sm text-muted">
                    {REQUEST_STATUS[r.status]}
                    {r.expert && r.status !== "OPEN" ? ` · ${r.expert.name}` : ""} · {r.focus.join(", ")}
                  </p>
                </div>
                {r.review ? (
                  <Link href={`/reviews/${r.review.id}`} className="btn btn-secondary btn-sm">
                    <span className={VERDICT[r.review.verdict].tone}>{VERDICT[r.review.verdict].label}</span>
                    {!r.review.rating && <span className="text-muted">· rate it</span>}
                  </Link>
                ) : r.status === "OPEN" ? (
                  <form action={cancelRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-ghost btn-sm" type="submit">Cancel</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="audits">
        <h2 id="audits" className="text-base font-semibold mb-3">Your audits</h2>
        {audits.length === 0 ? (
          <div className="card p-6 text-sm text-muted">
            No audits yet. <Link href="/" className="text-fg underline underline-offset-4">Run your first one</Link>.
          </div>
        ) : (
          <ul className="card divide-y divide-line">
            {audits.map((a) => (
              <li key={a.id}>
                <Link href={`/audits/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface">
                  <ScoreRing score={a.status === "COMPLETED" ? a.score : null} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{a.label}</p>
                    <p className="text-sm text-muted">
                      {SOURCE_LABEL[a.source]} · {timeAgo(a.createdAt)}
                      {a.status === "FAILED" && <span className="text-fail"> · failed</span>}
                    </p>
                  </div>
                  <span className="text-faint" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16 border-t border-line pt-8" aria-labelledby="danger">
        <h2 id="danger" className="text-base font-semibold">Delete my account</h2>
        <p className="mt-1 text-sm text-muted max-w-xl">
          Removes your account, uploads, review requests, expert profile and reviews, and your sign-in. Audits of public URLs stay, without your name.{" "}
          <Link href="/privacy" className="underline underline-offset-4">Details</Link>
        </p>
        <DeleteAccount />
      </section>
    </div>
  );
}
