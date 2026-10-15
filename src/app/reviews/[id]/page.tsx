import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { canViewAudit } from "@/lib/access";
import type { ExpertFinding } from "@/app/actions/reviews";
import { SEVERITY_TONE, Stars, VERDICT } from "@/components/review-ui";
import { RateForm } from "./RateForm";
import { ReportButton } from "@/components/ReportButton";
import { restoreReview } from "@/app/actions/moderation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Expert review", robots: { index: false } };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [review, user] = await Promise.all([
    prisma.expertReview.findUnique({
      where: { id },
      include: {
        expert: { select: { name: true, expertProfile: { select: { id: true, headline: true, status: true } } } },
        request: { include: { audit: { select: { id: true, label: true, source: true, ownerId: true, requests: { select: { status: true, expertId: true } } } } } },
      },
    }),
    getUser(),
  ]);
  if (!review || !canViewAudit(review.request.audit, user)) notFound();
  const findings = review.findings as unknown as ExpertFinding[];
  const isRequester = user?.id === review.request.requesterId;
  if (review.hiddenAt && !user?.isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <Link href={`/audits/${review.request.audit.id}`} className="text-sm text-muted hover:text-fg">← Audit of {review.request.audit.label}</Link>
        <p className="card mt-6 p-6 text-sm text-muted">This review was removed by a moderator and no longer counts toward the expert&rsquo;s rating.</p>
      </div>
    );
  }
  const v = VERDICT[review.verdict];

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <Link href={`/audits/${review.request.audit.id}`} className="text-sm text-muted hover:text-fg">← Audit of {review.request.audit.label}</Link>
      {review.hiddenAt && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          <span><span className="font-medium text-fail">Hidden from everyone but admins.</span> {review.hiddenNote}</span>
          <form action={restoreReview}>
            <input type="hidden" name="id" value={review.id} />
            <button type="submit" className="btn btn-secondary btn-sm">Restore</button>
          </form>
        </div>
      )}
      <p className="eyebrow mt-6">Expert review</p>
      <h1 className={`mt-2 text-3xl sm:text-4xl font-semibold ${v.tone}`}>{v.label}</h1>
      <p className="mt-1 text-muted">{v.blurb}</p>

      <div className="mt-6 flex items-center gap-3 border-y border-line py-4">
        <span className="size-9 rounded-full bg-invert text-invert-fg grid place-items-center font-semibold" aria-hidden="true">{review.expert.name.slice(0, 1).toUpperCase()}</span>
        <div className="text-sm">
          <p className="font-medium">
            {review.expert.expertProfile?.status === "APPROVED" ? (
              <Link href={`/experts/${review.expert.expertProfile.id}`} className="hover:underline underline-offset-4">{review.expert.name}</Link>
            ) : (
              review.expert.name
            )}
          </p>
          <p className="text-muted">
            {review.expert.expertProfile?.headline} · {review.createdAt.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Summary</h2>
        <p className="mt-2 prose-text">{review.summary}</p>
      </section>

      {findings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-base font-semibold">Findings, in priority order</h2>
          <ol className="mt-4 space-y-3">
            {findings.map((f, i) => (
              <li key={i} className="card p-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-faint">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-medium">
                      {f.title} <span className={`ml-1 text-[11px] uppercase tracking-wide font-medium ${SEVERITY_TONE[f.severity]}`}>{f.severity}</span>
                    </p>
                    <p className="mt-2 prose-text text-sm">{f.detail}</p>
                    {f.recommendation && (
                      <div className="mt-3 rounded-lg bg-surface border border-line p-3">
                        <p className="eyebrow mb-1">Recommendation</p>
                        <p className="prose-text text-sm">{f.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-12 card p-6">
        {review.rating ? (
          <div>
            <p className="text-sm text-muted">Rated by the requester</p>
            <p className="mt-1 flex items-center gap-2"><Stars value={review.rating} /> <span className="font-medium">{review.rating}/5</span></p>
            {review.ratingNote && <p className="mt-2 prose-text text-sm">{review.ratingNote}</p>}
          </div>
        ) : isRequester ? (
          <RateForm id={review.id} />
        ) : (
          <p className="text-sm text-muted">Not rated by the requester yet.</p>
        )}
      </section>
      {user && user.id !== review.expertId && !review.hiddenAt && (
        <div className="mt-6 flex justify-end">
          <ReportButton targetType="REVIEW" targetId={review.id} label="Report this review" />
        </div>
      )}
    </article>
  );
}
