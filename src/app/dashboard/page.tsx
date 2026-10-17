import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { cancelRequest } from "@/app/actions/reviews";
import { ScoreRing, SOURCE_LABEL, timeAgo } from "@/components/audit-ui";
import { VERDICT } from "@/components/review-ui";
import { DeleteAccount } from "./DeleteAccount";
import { resumeWatch, unwatchSite } from "@/app/actions/watch";
import { SCORE_DROP_ALERT, WATCH_LIMIT } from "@/lib/watch-config";

/** Score history, oldest to newest, as a tiny line on a fixed 0–100 scale. */
function Sparkline({ values }: { values: number[] }) {
  const w = 72;
  const h = 24;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - (v / 100) * h).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="hidden sm:block text-muted shrink-0" role="img" aria-label={`Score history: ${values.join(", ")}`}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const REQUEST_STATUS = { OPEN: "Waiting for an expert", CLAIMED: "In review", COMPLETED: "Delivered", CANCELLED: "Cancelled" } as const;

export default async function Dashboard() {
  const user = await requireUser("/dashboard");
  const [audits, requests, watches] = await Promise.all([
    prisma.audit.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 300, select: { id: true, label: true, target: true, source: true, status: true, score: true, createdAt: true } }),
    prisma.reviewRequest.findMany({
      where: { requesterId: user.id },
      orderBy: { createdAt: "desc" },
      include: { audit: { select: { label: true } }, expert: { select: { name: true } }, review: { select: { id: true, verdict: true, rating: true } } },
    }),
    prisma.watch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);

  const watchedTargets = new Set(watches.map((w) => w.target));
  // One row per site: newest run, newest score, change since the previous completed run, recent trend.
  const byTarget = new Map<string, typeof audits>();
  for (const a of audits) byTarget.set(a.target, [...(byTarget.get(a.target) ?? []), a]);
  const sites = [...byTarget].map(([target, runs]) => {
    const done = runs.filter((r) => r.status === "COMPLETED" && r.score !== null);
    return {
      target,
      latest: runs[0],
      latestDone: done[0],
      count: runs.length,
      delta: done.length > 1 ? done[0].score! - done[1].score! : null,
      history: done.slice(0, 10).map((r) => r.score!).reverse(),
    };
  });

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

      {watches.length > 0 && (
        <section className="mt-12" aria-labelledby="watches">
          <h2 id="watches" className="text-base font-semibold mb-1">Weekly re-audits</h2>
          <p className="text-sm text-muted mb-3">You&rsquo;re notified when a check gets worse or the score drops {SCORE_DROP_ALERT}+ points. Up to {WATCH_LIMIT} sites.</p>
          <ul className="card divide-y divide-line">
            {watches.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  {w.lastAuditId ? (
                    <Link href={`/audits/${w.lastAuditId}`} className="font-medium hover:underline underline-offset-4 break-all">{w.label}</Link>
                  ) : (
                    <p className="font-medium break-all">{w.label}</p>
                  )}
                  <p className="text-sm text-muted">
                    {w.pausedAt ? (
                      <span className="text-fail">Paused after {w.consecutiveFailures} failed runs</span>
                    ) : (
                      <>Next run around {w.nextRunAt.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" })}</>
                    )}
                    {w.lastRunAt && <> · last ran {timeAgo(w.lastRunAt)}</>}
                  </p>
                </div>
                {w.pausedAt && (
                  <form action={resumeWatch}>
                    <input type="hidden" name="id" value={w.id} />
                    <button type="submit" className="btn btn-secondary btn-sm">Resume</button>
                  </form>
                )}
                <form action={unwatchSite}>
                  <input type="hidden" name="id" value={w.id} />
                  <button type="submit" className="btn btn-ghost btn-sm">Stop</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12" aria-labelledby="sites">
        <h2 id="sites" className="text-base font-semibold mb-3">Your sites</h2>
        {sites.length === 0 ? (
          <div className="card p-6 text-sm text-muted">
            No audits yet. <Link href="/" className="text-fg underline underline-offset-4">Run your first one</Link>.
          </div>
        ) : (
          <ul className="card divide-y divide-line">
            {sites.map((site) => (
              <li key={site.target}>
                <Link href={`/audits/${(site.latestDone ?? site.latest).id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface">
                  <ScoreRing score={site.latestDone?.score ?? null} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{site.latest.label}</p>
                    <p className="text-sm text-muted">
                      {SOURCE_LABEL[site.latest.source]} · {site.count} {site.count === 1 ? "audit" : "audits"} · last {timeAgo(site.latest.createdAt)}
                      {site.latest.status === "RUNNING" && <span className="text-fg"> · running now</span>}
                      {site.latest.status === "FAILED" && <span className="text-fail"> · last run failed</span>}
                      {watchedTargets.has(site.target) && <span> · watched weekly</span>}
                    </p>
                  </div>
                  {site.delta !== null && site.delta !== 0 && (
                    <span className={`text-sm tabular-nums ${site.delta > 0 ? "text-pass" : "text-fail"}`} title="Change since the previous completed audit">
                      {site.delta > 0 ? "+" : "−"}
                      {Math.abs(site.delta)}
                    </span>
                  )}
                  {site.history.length > 1 && <Sparkline values={site.history} />}
                  <span className="text-faint" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {audits.length > 0 && (
        <details className="mt-8 group">
          <summary className="cursor-pointer text-sm text-muted hover:text-fg">All audits ({audits.length})</summary>
          <ul className="mt-3 card divide-y divide-line">
            {audits.map((a) => (
              <li key={a.id}>
                <Link href={`/audits/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface">
                  <ScoreRing score={a.status === "COMPLETED" ? a.score : null} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{a.label}</p>
                    <p className="text-sm text-muted">
                      {SOURCE_LABEL[a.source]} · {timeAgo(a.createdAt)}
                      {a.status === "FAILED" && <span className="text-fail"> · failed</span>}
                      {a.status === "RUNNING" && <span className="text-fg"> · running</span>}
                    </p>
                  </div>
                  <span className="text-faint" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}

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
