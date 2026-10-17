import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { claimRequest } from "@/app/actions/reviews";
import { ScoreRing, SOURCE_LABEL, timeAgo } from "@/components/audit-ui";
import { VERDICT } from "@/components/review-ui";
import { FOCUS_AREAS } from "@/lib/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review queue" };

export default async function Queue({ searchParams }: { searchParams: Promise<{ error?: string; area?: string; sort?: string }> }) {
  const user = await requireUser("/expert");
  if (user.expertStatus !== "APPROVED") redirect("/experts/apply");
  const { error, area: areaParam, sort: sortParam } = await searchParams;
  const sort = sortParam === "newest" ? "newest" : "oldest";

  const include = { audit: { select: { id: true, label: true, source: true, score: true } }, requester: { select: { name: true } } } as const;
  const profile = await prisma.expertProfile.findUnique({ where: { userId: user.id }, select: { id: true, expertise: true } });
  const myAreas = profile?.expertise ?? [];
  // "mine" = requests overlapping the areas this expert reviews; otherwise one area, or everything.
  const area = areaParam === "mine" || (FOCUS_AREAS as readonly string[]).includes(areaParam ?? "") ? areaParam! : "all";
  const areaFilter = area === "all" ? {} : { focus: { hasSome: area === "mine" ? myAreas : [area] } };
  const [open, mine, done, allOpen] = await Promise.all([
    prisma.reviewRequest.findMany({ where: { status: "OPEN", requesterId: { not: user.id }, ...areaFilter }, orderBy: { createdAt: sort === "newest" ? "desc" : "asc" }, include }),
    prisma.reviewRequest.findMany({ where: { status: "CLAIMED", expertId: user.id }, orderBy: { claimedAt: "asc" }, include }),
    prisma.expertReview.findMany({ where: { expertId: user.id }, orderBy: { createdAt: "desc" }, take: 20, include: { request: { include: { audit: { select: { label: true } } } } } }),
    prisma.reviewRequest.findMany({ where: { status: "OPEN", requesterId: { not: user.id } }, select: { focus: true } }),
  ]);
  const counts = new Map<string, number>();
  for (const r of allOpen) for (const f of r.focus) counts.set(f, (counts.get(f) ?? 0) + 1);
  const mineCount = allOpen.filter((r) => r.focus.some((f) => myAreas.includes(f))).length;
  const href = (next: { area?: string; sort?: string }) => {
    const q = new URLSearchParams();
    const a = next.area ?? area;
    const so = next.sort ?? sort;
    if (a !== "all") q.set("area", a);
    if (so !== "oldest") q.set("sort", so);
    const qs = q.toString();
    return `/expert${qs ? `?${qs}` : ""}#open`;
  };
  const chip = (active: boolean) => `chip ${active ? "bg-invert text-invert-fg border-transparent" : "hover:text-fg"}`;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Review queue</h1>
          <p className="mt-1 text-muted">Claim a request to lock it to you, then submit your written review.</p>
        </div>
        {profile && <Link href={`/experts/${profile.id}`} className="btn btn-secondary btn-sm">Your public profile</Link>}
      </div>
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
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
          <h2 id="open" className="text-base font-semibold">
            Open requests ({open.length}
            {area !== "all" ? ` of ${allOpen.length}` : ""})
          </h2>
          <p className="text-sm text-muted">
            Order:{" "}
            <Link href={href({ sort: "oldest" })} className={sort === "oldest" ? "text-fg font-medium" : "underline underline-offset-4 hover:text-fg"} aria-current={sort === "oldest" ? "true" : undefined}>
              waiting longest
            </Link>{" "}
            ·{" "}
            <Link href={href({ sort: "newest" })} className={sort === "newest" ? "text-fg font-medium" : "underline underline-offset-4 hover:text-fg"} aria-current={sort === "newest" ? "true" : undefined}>
              newest
            </Link>
          </p>
        </div>
        {allOpen.length > 0 && (
          <nav aria-label="Filter by area" className="mb-4 flex flex-wrap gap-1.5">
            <Link href={href({ area: "all" })} className={chip(area === "all")} aria-current={area === "all" ? "true" : undefined}>All {allOpen.length}</Link>
            {myAreas.length > 0 && (
              <Link href={href({ area: "mine" })} className={chip(area === "mine")} aria-current={area === "mine" ? "true" : undefined}>My areas {mineCount}</Link>
            )}
            {FOCUS_AREAS.filter((f) => counts.has(f)).map((f) => (
              <Link key={f} href={href({ area: f })} className={chip(area === f)} aria-current={area === f ? "true" : undefined}>
                {f} {counts.get(f)}
              </Link>
            ))}
          </nav>
        )}
        {open.length === 0 ? (
          <p className="card p-5 text-sm text-muted">
            {allOpen.length === 0 ? (
              <>The queue is empty. New requests appear here as soon as they&rsquo;re posted.</>
            ) : (
              <>
                No open requests match this filter. <Link href={href({ area: "all" })} className="underline underline-offset-4 text-fg">Show all {allOpen.length}</Link>.
              </>
            )}
          </p>
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
