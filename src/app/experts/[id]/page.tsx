import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { canViewAudit } from "@/lib/access";
import { Stars, VERDICT } from "@/components/review-ui";
import { ReportButton } from "@/components/ReportButton";
import { timeAgo } from "@/components/audit-ui";
import { expertStats } from "@/lib/expert-stats";

export const dynamic = "force-dynamic";

async function load(id: string) {
  return prisma.expertProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          expertReviews: {
            where: { hiddenAt: null },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              verdict: true,
              summary: true,
              rating: true,
              createdAt: true,
              request: {
                select: { claimedAt: true, focus: true, audit: { select: { id: true, label: true, source: true, ownerId: true, requests: { select: { status: true, expertId: true } } } } },
              },
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const profile = await prisma.expertProfile.findUnique({ where: { id: (await params).id }, select: { status: true, headline: true, user: { select: { name: true } } } });
  if (!profile || profile.status !== "APPROVED") return { title: "Expert", robots: { index: false } };
  return { title: `${profile.user.name}, expert reviewer`, description: profile.headline };
}

export default async function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, viewer] = await Promise.all([load(id), getUser()]);
  const isSelf = viewer?.id === profile?.userId;
  // Public only once approved; the expert and admins can still see a pending or revoked profile.
  if (!profile || (profile.status !== "APPROVED" && !isSelf && !viewer?.isAdmin)) notFound();

  const reviews = profile.user.expertReviews;
  const stats = expertStats(reviews.map((r) => ({ rating: r.rating, verdict: r.verdict, claimedAt: r.request.claimedAt, deliveredAt: r.createdAt })));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <Link href="/experts" className="text-sm text-muted hover:text-fg">← All experts</Link>

      {profile.status !== "APPROVED" && (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          Only you{isSelf ? "" : " (as an admin)"} can see this page: the profile is {profile.status === "PENDING" ? "waiting for admin approval" : "not approved"}.
        </p>
      )}

      <header className="mt-6 flex flex-wrap items-start gap-4">
        <span className="size-14 rounded-full bg-invert text-invert-fg grid place-items-center text-xl font-semibold shrink-0" aria-hidden="true">
          {profile.user.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold break-words">{profile.user.name}</h1>
          <p className="mt-1 text-muted">{profile.headline}</p>
          {profile.decidedAt && profile.status === "APPROVED" && (
            <p className="mt-1 text-sm text-faint">Approved {profile.decidedAt.toLocaleDateString("en", { month: "long", year: "numeric" })}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isSelf && <Link href="/experts/apply" className="btn btn-secondary btn-sm">Edit profile</Link>}
          {viewer && !isSelf && <ReportButton targetType="EXPERT" targetId={profile.id} label="Report" />}
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {profile.expertise.map((x) => (
          <span key={x} className="chip">{x}</span>
        ))}
      </div>

      <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden">
        <div className="bg-raised p-4">
          <dt className="text-[13px] text-muted">Reviews delivered</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{stats.delivered}</dd>
        </div>
        <div className="bg-raised p-4">
          <dt className="text-[13px] text-muted">Average rating</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {stats.average !== null ? (
              <span className="inline-flex items-center gap-2">
                {stats.average.toFixed(1)} <Stars value={stats.average} />
              </span>
            ) : (
              <span className="text-base font-normal text-muted">No ratings yet</span>
            )}
          </dd>
          {stats.rated > 0 && <p className="text-xs text-muted mt-0.5">from {stats.rated} rating{stats.rated === 1 ? "" : "s"}</p>}
        </div>
        <div className="bg-raised p-4">
          <dt className="text-[13px] text-muted">Typical turnaround</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{stats.medianTurnaroundMs !== null ? formatDuration(stats.medianTurnaroundMs) : <span className="text-base font-normal text-muted">—</span>}</dd>
          {stats.medianTurnaroundMs !== null && <p className="text-xs text-muted mt-0.5">claim to delivery, median</p>}
        </div>
        <div className="bg-raised p-4">
          <dt className="text-[13px] text-muted">Verdicts</dt>
          <dd className="mt-1 space-y-0.5 text-sm tabular-nums">
            {(["SHIP", "FIX_FIRST", "NOT_READY"] as const).map((v) => (
              <p key={v}>
                <span className={VERDICT[v].tone}>{VERDICT[v].label}</span> <span className="text-muted">{stats.verdicts[v]}</span>
              </p>
            ))}
          </dd>
        </div>
      </dl>

      {stats.rated > 0 && (
        <section className="mt-6" aria-labelledby="ratings">
          <h2 id="ratings" className="sr-only">Rating breakdown</h2>
          <ul className="space-y-1.5 max-w-sm">
            {([5, 4, 3, 2, 1] as const).map((n) => {
              const count = stats.distribution[n];
              return (
                <li key={n} className="flex items-center gap-3 text-sm">
                  <span className="w-14 shrink-0 whitespace-nowrap text-muted tabular-nums">{n} star{n === 1 ? "" : "s"}</span>
                  <span className="h-1.5 flex-1 rounded-full bg-line overflow-hidden" aria-hidden="true">
                    <span className="block h-full bg-fg" style={{ width: `${(count / stats.rated) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right tabular-nums text-muted">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-labelledby="about">
        <h2 id="about" className="text-base font-semibold">About</h2>
        <p className="mt-2 prose-text whitespace-pre-line">{profile.bio}</p>
        {profile.links.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {profile.links.map((l) => (
              <li key={l}>
                <a href={l} className="underline underline-offset-4 text-muted hover:text-fg break-all" rel="noopener noreferrer nofollow" target="_blank">
                  {l.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="history">
        <h2 id="history" className="text-base font-semibold mb-3">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="card p-6 text-sm text-muted">No delivered reviews yet.</p>
        ) : (
          <ul className="card divide-y divide-line">
            {reviews.map((r) => {
              // Reviews of private uploads count toward the record, but their site and summary stay private.
              const visible = canViewAudit(r.request.audit, viewer);
              const v = VERDICT[r.verdict];
              return (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-medium min-w-0 break-words">
                      <span className={v.tone}>{v.label}</span>
                      <span className="text-muted font-normal"> · {visible ? r.request.audit.label : "a private upload"}</span>
                    </p>
                    <p className="text-sm text-muted flex items-center gap-2">
                      {r.rating ? <Stars value={r.rating} /> : <span>not rated yet</span>}
                      <span>· {timeAgo(r.createdAt)}</span>
                    </p>
                  </div>
                  {visible && <p className="mt-1.5 text-sm text-muted line-clamp-2">{r.summary}</p>}
                  <p className="mt-1.5 text-xs text-faint">{r.request.focus.join(" · ")}</p>
                  {visible && (
                    <Link href={`/reviews/${r.id}`} className="mt-2 inline-block text-sm underline underline-offset-4 hover:text-fg text-muted">
                      Read the review
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatDuration(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60_000))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} days`;
}
