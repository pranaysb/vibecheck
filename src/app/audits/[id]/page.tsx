import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { previewPath } from "@/lib/preview";
import { getUser } from "@/lib/auth/session";
import { canViewAudit } from "@/lib/access";
import { computeScore, CRITICAL_CAP, type AuditMeta, type CheckResult } from "@/lib/audit/types";
import { CategorySummary, CheckGroups, FixFirst, ScoreRing, SOURCE_LABEL, timeAgo } from "@/components/audit-ui";
import { RequestReviewForm } from "./RequestReviewForm";
import { RerunButton } from "./RerunButton";
import { diffAudits } from "@/lib/audit/compare";
import { VERDICT } from "@/components/review-ui";

export const dynamic = "force-dynamic";

async function load(id: string) {
  return prisma.audit.findUnique({
    where: { id },
    include: {
      screenshots: { select: { kind: true, width: true, height: true } },
      requests: {
        orderBy: { createdAt: "desc" },
        include: { expert: { select: { name: true } }, review: { select: { id: true, verdict: true, createdAt: true, hiddenAt: true } } },
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

  // What changed since this owner's previous completed audit of the same target.
  const previous =
    audit.ownerId && audit.status === "COMPLETED"
      ? await prisma.audit.findFirst({
          where: { ownerId: audit.ownerId, target: audit.target, status: "COMPLETED", createdAt: { lt: audit.createdAt } },
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true, checks: true },
        })
      : null;
  const prevChecks = (previous?.checks ?? []) as unknown as CheckResult[];
  const prevScore = previous ? computeScore(prevChecks).score : null;
  const diff = previous ? diffAudits(prevChecks, checks) : null;
  const improved = diff ? [...diff.fixed.map((c) => ({ c, note: "now passing" })), ...diff.changed.filter((x) => x.from === "fail").map((x) => ({ c: x.check, note: "fail → warning" }))] : [];
  const worse = diff ? [...diff.regressed.map((c) => ({ c, note: c.status === "fail" ? "now failing" : "now a warning" })), ...diff.changed.filter((x) => x.from === "warn").map((x) => ({ c: x.check, note: "warning → fail" }))] : [];
  const canRerun = (audit.source === "URL" || (audit.source === "GITHUB" && Boolean(user))) && audit.status !== "RUNNING";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <span className="chip">{SOURCE_LABEL[audit.source]}</span>
        <span>{timeAgo(audit.createdAt)}</span>
        {audit.durationMs ? <span>· took {(audit.durationMs / 1000).toFixed(1)}s</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl sm:text-4xl font-semibold break-words min-w-0">{audit.label}</h1>
        {canRerun && <RerunButton source={audit.source as "URL" | "GITHUB"} target={audit.target} />}
      </div>
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

          <FixFirst checks={checks} />

          {previous && diff && (
            <section className="mt-6 card p-5" aria-labelledby="changes">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="changes" className="font-semibold">
                  Since your audit {timeAgo(previous.createdAt)}
                  {prevScore !== null && score.score !== null && (
                    <span className={`ml-2 tabular-nums ${score.score > prevScore ? "text-pass" : score.score < prevScore ? "text-fail" : "text-muted"}`}>
                      {prevScore} → {score.score} ({score.score - prevScore >= 0 ? "+" : ""}{score.score - prevScore})
                    </span>
                  )}
                </h2>
                <Link href={`/audits/${previous.id}`} className="text-sm text-muted underline underline-offset-4 hover:text-fg">Previous report</Link>
              </div>
              {improved.length + worse.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No check changed status.</p>
              ) : (
                <div className="mt-3 grid gap-4 sm:grid-cols-2 text-sm">
                  {improved.length > 0 && (
                    <div>
                      <p className="eyebrow mb-1.5 text-pass">Better ({improved.length})</p>
                      <ul className="space-y-1">{improved.map(({ c, note }) => <li key={c.id}>{c.title} <span className="text-muted">· {note}</span></li>)}</ul>
                    </div>
                  )}
                  {worse.length > 0 && (
                    <div>
                      <p className="eyebrow mb-1.5 text-fail">Worse ({worse.length})</p>
                      <ul className="space-y-1">{worse.map(({ c, note }) => <li key={c.id}>{c.title} <span className="text-muted">· {note}</span></li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {meta.build && !meta.build.ran && meta.build.reason && (
            <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
              <span className="font-medium text-fg">Build step did not run.</span> {meta.build.reason}
            </p>
          )}
          {meta.build?.ok && (
            <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
              <span className="font-medium text-fg">Built in an isolated Vercel Sandbox.</span>{" "}
              {meta.build.packageManager} install and build ran in {Math.round((meta.build.ms ?? 0) / 1000)}s with no secrets.{" "}
              {meta.build.mode === "server"
                ? "The app was started and audited while running with outbound network disabled; the sandbox was then deleted, so there is no live preview, only screenshots and source files."
                : `The site checks below audit the built output in ${meta.build.outputDir}/.`}
            </p>
          )}
          {meta.browser && !meta.browser.ran && meta.browser.reason && (
            <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
              <span className="font-medium text-fg">Browser checks did not run.</span> {meta.browser.reason}
            </p>
          )}

          {audit.filesPurgedAt && (
            <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
              Screenshots and uploaded files were deleted on {audit.filesPurgedAt.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })} under the 90-day retention policy. The results below are kept.
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

          {meta.crawl && meta.crawl.pages.length > 0 && (
            <details className="mt-10 card px-5 py-4">
              <summary className="cursor-pointer text-sm font-medium">
                Pages crawled ({meta.crawl.pages.length + 1}){meta.crawl.unvisited > 0 && <span className="text-muted font-normal"> · {meta.crawl.unvisited} more not visited</span>}
                {meta.crawl.disallowed > 0 && <span className="text-muted font-normal"> · {meta.crawl.disallowed} skipped by robots.txt</span>}
              </summary>
              <ul className="mt-3 divide-y divide-line text-sm">
                {[{ url: audit.finalUrl ?? audit.target, status: meta.statusCode ?? null, title: meta.title, error: undefined as string | undefined }, ...meta.crawl.pages].map((p) => {
                  const u = new URL(p.url);
                  const bad = p.status === null || p.status >= 400;
                  return (
                    <li key={p.url} className="flex items-baseline gap-3 py-2 min-w-0">
                      <span className={`font-mono text-xs w-10 shrink-0 ${bad ? "text-fail" : "text-muted"}`}>{p.status ?? "—"}</span>
                      <span className="font-mono text-xs truncate min-w-0" title={p.url}>{u.pathname + u.search}</span>
                      <span className="text-muted truncate min-w-0 hidden sm:inline">{p.title ?? p.error ?? ""}</span>
                    </li>
                  );
                })}
              </ul>
            </details>
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
                      {r.review!.hiddenAt ? (
                        <span className="text-sm text-muted">Removed by a moderator</span>
                      ) : (
                        <span className={`text-sm font-medium ${VERDICT[r.review!.verdict].tone}`}>{VERDICT[r.review!.verdict].label} →</span>
                      )}
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
                <Link href={`/sign-in?redirect_url=${encodeURIComponent(`/audits/${audit.id}`)}`} className="btn btn-primary">Sign in to request a review</Link>
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
