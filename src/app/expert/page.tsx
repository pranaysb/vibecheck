import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { claimRequest } from "@/app/actions/reviews";
import { ScoreRing, SOURCE_LABEL, timeAgo } from "@/components/audit-ui";
import { VERDICT } from "@/components/review-ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review queue" };

export default async function Queue({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("/expert");
  if (user.expertStatus !== "APPROVED") redirect("/experts/apply");
  const { error } = await searchParams;

  const include = { audit: { select: { id: true, label: true, source: true, score: true } }, requester: { select: { name: true } } } as const;
  const [open, mine, done] = await Promise.all([
    prisma.reviewRequest.findMany({ where: { status: "OPEN", requesterId: { not: user.id } }, orderBy: { createdAt: "asc" }, include }),
    prisma.reviewRequest.findMany({ where: { status: "CLAIMED", expertId: user.id }, orderBy: { claimedAt: "asc" }, include }),
    prisma.expertReview.findMany({ where: { expertId: user.id }, orderBy: { createdAt: "desc" }, take: 20, include: { request: { include: { audit: { select: { label: true } } } } } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold">Review queue</h1>
      <p className="mt-1 text-muted">Claim a request to lock it to you, then submit your written review.</p>
      {error === "unavailable" && <p role="alert" className="mt-4 text-sm text-fail">Someone else claimed that request first.</p>}

      <section className="mt-10" aria-labelledby="mine">
        <h2 id="mine" className="text-base font-semibold mb-3">In progress ({mine.length})</h2>
        {mine.length === 0 ? (
          <p className="card p-5 text-sm text-muted">Nothing claimed.</p>
        ) : (
          <ul className="card divide-y divide-line">
            {mine.map((r) => (
              <li key={r.id}>
                <Link href={`/expert/requests/${r.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-surface">
                  <ScoreRing score={r.audit.score} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{r.audit.label}</p>
                    <p className="text-sm text-muted">Claimed {r.claimedAt ? timeAgo(r.claimedAt) : ""} · {r.focus.join(", ")}</p>
                  </div>
                  <span className="btn btn-primary btn-sm">Continue</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="open">
        <h2 id="open" className="text-base font-semibold mb-3">Open requests ({open.length})</h2>
        {open.length === 0 ? (
          <p className="card p-5 text-sm text-muted">The queue is empty. New requests appear here as soon as they&rsquo;re posted.</p>
        ) : (
          <ul className="space-y-3">
            {open.map((r) => (
              <li key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <ScoreRing score={r.audit.score} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-all">{r.audit.label}</p>
                    <p className="text-sm text-muted">
                      {SOURCE_LABEL[r.audit.source]} · from {r.requester.name} · {timeAgo(r.createdAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.focus.map((f) => (
                        <span key={f} className="chip">{f}</span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed line-clamp-3 prose-text">{r.notes}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/audits/${r.audit.id}`} className="btn btn-secondary btn-sm">View audit</Link>
                    <form action={claimRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="btn btn-primary btn-sm">Claim</button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-10" aria-labelledby="done">
          <h2 id="done" className="text-base font-semibold mb-3">Delivered</h2>
          <ul className="card divide-y divide-line">
            {done.map((d) => (
              <li key={d.id}>
                <Link href={`/reviews/${d.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface">
                  <span className="truncate">{d.request.audit.label}</span>
                  <span className="text-sm text-muted shrink-0">
                    <span className={VERDICT[d.verdict].tone}>{VERDICT[d.verdict].label}</span> · {d.rating ? `rated ${d.rating}/5` : "not rated yet"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
