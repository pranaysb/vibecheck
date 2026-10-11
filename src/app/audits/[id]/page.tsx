import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { previewPath } from "@/lib/preview";
import { getUser } from "@/lib/auth/session";
import { canViewAudit } from "@/lib/access";
import { computeScore, CRITICAL_CAP, type AuditMeta, type CheckResult } from "@/lib/audit/types";
import { CategorySummary, CheckGroups, ScoreRing, SOURCE_LABEL, timeAgo } from "@/components/audit-ui";
import { RequestReviewForm } from "./RequestReviewForm";
import { VERDICT } from "@/components/review-ui";

export const dynamic = "force-dynamic";

async function load(id: string) {
  return prisma.audit.findUnique({
    where: { id },
    include: {
      screenshots: { select: { kind: true, width: true, height: true } },
      requests: {
        orderBy: { createdAt: "desc" },
        include: { expert: { select: { name: true } }, review: { select: { id: true, verdict: true, createdAt: true } } },
      },
      _count: { select: { files: true } },
    },
  });
}

/** A RUNNING audit older than 3 minutes lost its worker (deploy, crash, timeout). */
function isAbandoned(createdAt: Date) {
  return Date.now() - createdAt.getTime() > 3 * 60 * 1000;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const audit = await prisma.audit.findUnique({ where: { id: (await params).id }, select: { label: true, source: true } });
  return { title: audit && audit.source !== "ZIP" ? `Audit of ${audit.label}` : "Audit", robots: { index: false } };
}

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [audit, user] = await Promise.all([load(id), getUser()]);
  if (!audit || !canViewAudit(audit, user)) notFound();

  const meta = (audit.meta ?? {}) as AuditMeta;
  const checks = (audit.checks ?? []) as unknown as CheckResult[];
  const score = computeScore(checks);
  const isOwner = user?.id === audit.ownerId;
  const active = audit.requests.find((r) => r.status === "OPEN" || r.status === "CLAIMED");
  const completed = audit.requests.filter((r) => r.review);
  const stale = audit.status === "RUNNING" && isAbandoned(audit.createdAt);
  const skipped = checks.filter((c) => c.status === "skip");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <span className="chip">{SOURCE_LABEL[audit.source]}</span>
        <span>{timeAgo(audit.createdAt)}</span>
        {audit.durationMs ? <span>· took {(audit.durationMs / 1000).toFixed(1)}s</span> : null}
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl font-semibold break-words">{audit.label}</h1>
      {meta.title && meta.title !== audit.label && <p className="mt-1 text-muted">{meta.title}</p>}
      <p className="mt-2 text-sm text-muted break-all">
        {audit.source === "ZIP" ? (
          audit.target
        ) : (
          <a href={meta.github?.commitUrl ?? audit.finalUrl ?? audit.target} className="underline underline-offset-4 hover:text-fg" rel="noopener noreferrer nofollow" target="_blank">
            {meta.github ? `${meta.github.repo} @ ${meta.github.ref}` : audit.finalUrl ?? audit.target}
          </a>
        )}
      </p>

      {audit.status === "FAILED" || stale ? (
        <div className="card mt-8 p-6">
          <h2 className="font-semibold">The audit could not finish</h2>
          <p className="mt-2 text-sm text-muted prose-text">{stale ? "This audit stopped responding and was abandoned. Run it again." : audit.error}</p>
          <Link href="/" className="btn btn-primary btn-sm mt-4">Run another audit</Link>
        </div>
      ) : audit.status === "RUNNING" ? (
        <div className="card mt-8 p-6 flex items-center gap-3">
          <span className="size-4 rounded-full border-2 border-line border-t-fg animate-spin" aria-hidden="true" />
          <p className="text-sm">This audit is still running. Refresh in a few seconds.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mt-8 grid gap-6 md:grid-cols-[auto_1fr] items-start">
            <div className="card p-6 flex flex-col items-center text-center md:w-56">
              <ScoreRing score={score.score} />
              <dl className="mt-5 grid grid-cols-3 gap-3 text-center w-full">
                {(["fail", "warn", "pass"] as const).map((s) => (
                  <div key={s}>
                    <dt className="text-[11px] uppercase tracking-wide text-muted">{s === "fail" ? "Failed" : s === "warn" ? "Warn" : "Passed"}</dt>
                    <dd className={`text-lg font-semibold tabular-nums ${s === "fail" ? "text-fail" : s === "warn" ? "text-warn" : "text-pass"}`}>{score.counts[s]}</dd>
                  </div>
                ))}
              </dl>
              {score.capped && <p className="mt-4 text-xs text-fail leading-relaxed">Capped at {CRITICAL_CAP} because a critical check failed.</p>}
            </div>
            <div className="min-w-0 space-y-4">
              <CategorySummary checks={checks} />
              <p className="text-[13px] text-muted leading-relaxed">
                Score = weighted share of applicable checks passed (critical 10, high 6, medium 3, low 1; warnings earn half).{" "}
                {skipped.length > 0 && `${skipped.length} check(s) did not run and are excluded. `}
                <Link href="/methodology" className="underline underline-offset-4 hover:text-fg">How every check works</Link>
              </p>
            </div>
          </div>

          {meta.browser && !meta.browser.ran && meta.browser.reason && (
            <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
              <span className="font-medium text-fg">Browser checks did not run.</span> {meta.browser.reason}
            </p>
          )}

          {/* Screenshots */}
          {audit.screenshots.length > 0 && (
            <section className="mt-10" aria-labelledby="shots">
              <h2 id="shots" className="text-base font-semibold mb-3">As rendered by Chromium</h2>
              <div className="grid gap-4 grid-cols-[1fr_auto] items-start">
                {(["desktop", "mobile"] as const).map((kind) => {
                  const s = audit.screenshots.find((x) => x.kind === kind);
                  if (!s) return null;
                  return (
                    <figure key={kind} className={kind === "mobile" ? "w-[96px] sm:w-[180px]" : "min-w-0"}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/audits/${audit.id}/screenshot/${kind}`} width={s.width} height={s.height} alt={`${kind} screenshot of ${audit.label}`} className="w-full h-auto rounded-xl border border-line bg-surface" loading="lazy" />
                      <figcaption className="mt-1.5 text-xs text-muted">{kind === "desktop" ? `${s.width}×${s.height}` : `${s.width}px phone`}</figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          )}

          {/* Expert review */}
          <section className="mt-12 card p-6" aria-labelledby="expert">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="expert" className="text-lg font-semibold">Expert review</h2>
                <p className="mt-1 text-sm text-muted max-w-xl">
                  Automated checks can&rsquo;t judge whether your product makes sense, whether the flow is confusing, or whether the code will hold up. A person can.
                </p>
              </div>
              {audit.source !== "URL" && audit._count.files > 0 && (isOwner || user?.isAdmin || user?.expertStatus === "APPROVED") && (
                <div className="flex gap-2">
                  {meta.files?.root !== null && meta.files?.root !== undefined && (
                    <a href={previewPath(audit.id)} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">Open preview</a>
                  )}
                  <Link href={`/audits/${audit.id}/files`} className="btn btn-secondary btn-sm">Browse files</Link>
                </div>
              )}
            </div>

            {completed.length > 0 && (
              <ul className="mt-5 space-y-2">
                {completed.map((r) => (
                  <li key={r.id}>
                    <Link href={`/reviews/${r.review!.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 hover:bg-surface">
                      <span className="text-sm">
                        <span className="font-medium">{r.expert?.name ?? "Expert"}</span>
                        <span className="text-muted"> · {timeAgo(r.review!.createdAt)}</span>
                      </span>
                      <span className={`text-sm font-medium ${VERDICT[r.review!.verdict].tone}`}>{VERDICT[r.review!.verdict].label} →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5">
              {active ? (
                <p className="text-sm rounded-xl bg-surface border border-line px-4 py-3">
                  {active.status === "OPEN" ? "Review requested. Waiting for an approved expert to claim it." : `${active.expert?.name ?? "An expert"} is reviewing this now.`}
                </p>
              ) : !user ? (
                <Link href={`/signin?next=/audits/${audit.id}`} className="btn btn-primary">Sign in to request a review</Link>
              ) : !user.verified ? (
                <Link href={`/verify?next=/audits/${audit.id}`} className="btn btn-primary">Verify your email to request a review</Link>
              ) : audit.ownerId && !isOwner ? (
                <p className="text-sm text-muted">Only the person who ran this audit can request a review. <Link href="/" className="underline underline-offset-4">Run your own</Link>.</p>
              ) : (
                <RequestReviewForm auditId={audit.id} />
              )}
            </div>
          </section>

          {/* Checks */}
          <section className="mt-12" aria-label="All checks">
            <CheckGroups checks={checks} />
          </section>

          {meta.responseHeaders && (
            <details className="mt-10 card">
              <summary className="px-5 py-4 text-sm font-medium">Raw response headers{meta.resolvedIp ? ` · ${meta.resolvedIp}` : ""}</summary>
              <pre className="px-5 pb-5 font-mono text-[12.5px] leading-relaxed overflow-x-auto text-muted">
                {Object.entries(meta.responseHeaders)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("\n")}
              </pre>
            </details>
          )}
          {meta.steps && (
            <p className="mt-6 text-xs text-faint">
              Steps: {meta.steps.map((s) => `${s.label} (${(s.ms / 1000).toFixed(1)}s)`).join(" · ")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
