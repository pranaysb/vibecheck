import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { previewPath } from "@/lib/preview";
import { requireUser } from "@/lib/auth/session";
import { releaseRequest } from "@/app/actions/reviews";
import { computeScore, type AuditMeta, type CheckResult } from "@/lib/audit/types";
import { ScoreRing, SOURCE_LABEL, sortChecks } from "@/components/audit-ui";
import { ReviewForm } from "./ReviewForm";
import { CLAIM_TIMEOUT_DAYS } from "@/lib/retention";

export const dynamic = "force-dynamic";
export const metadata = { title: "Write review" };

export default async function Workspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/expert/requests/${id}`);
  if (user.expertStatus !== "APPROVED") redirect("/experts/apply");
  const req = await prisma.reviewRequest.findUnique({
    where: { id },
    include: { audit: true, requester: { select: { name: true } }, review: { select: { id: true } } },
  });
  if (!req || req.expertId !== user.id) notFound();
  if (req.review) redirect(`/reviews/${req.review.id}`);
  if (req.status !== "CLAIMED") redirect("/expert");

  const audit = req.audit;
  const checks = (audit.checks ?? []) as unknown as CheckResult[];
  const meta = (audit.meta ?? {}) as AuditMeta;
  const failing = sortChecks(checks.filter((c) => c.status === "fail" || c.status === "warn"));
  const hasSite = audit.source !== "URL" && meta.files?.root !== null && meta.files?.root !== undefined;
  const liveUrl = audit.source === "URL" ? audit.finalUrl ?? audit.target : meta.github?.htmlUrl;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <Link href="/expert" className="text-sm text-muted hover:text-fg">← Review queue</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[340px_1fr] items-start">
        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <ScoreRing score={computeScore(checks).score} size={56} />
              <div className="min-w-0">
                <p className="font-semibold break-all">{audit.label}</p>
                <p className="text-sm text-muted">{SOURCE_LABEL[audit.source]} · from {req.requester.name}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/audits/${audit.id}`} target="_blank" className="btn btn-secondary btn-sm">Audit report</Link>
              {liveUrl && <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">{audit.source === "URL" ? "Live site" : "Repository"}</a>}
              {hasSite && <a href={previewPath(audit.id)} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">Preview</a>}
              {audit.source !== "URL" && <Link href={`/audits/${audit.id}/files`} target="_blank" className="btn btn-secondary btn-sm">Files</Link>}
            </div>
          </div>
          <div className="card p-5">
            <p className="eyebrow">Focus</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {req.focus.map((f) => (
                <span key={f} className="chip">{f}</span>
              ))}
            </div>
            <p className="eyebrow mt-5">Their notes</p>
            <p className="mt-2 prose-text text-sm">{req.notes}</p>
          </div>
          <form action={releaseRequest}>
            <input type="hidden" name="id" value={req.id} />
            <button type="submit" className="btn btn-ghost btn-sm">Release back to the queue</button>
          </form>
          {req.claimedAt && (
            <p className="text-xs text-muted px-1">
              Claims without a review are released on{" "}
              {new Date(req.claimedAt.getTime() + CLAIM_TIMEOUT_DAYS * 86400_000).toLocaleDateString("en", { month: "short", day: "numeric" })} ({CLAIM_TIMEOUT_DAYS} days after claiming).
            </p>
          )}
        </aside>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Your review</h1>
          <p className="mt-1 text-sm text-muted">Write for the builder: what to fix first, why it matters, and how. They will see your name on it.</p>
          <ReviewForm
            requestId={req.id}
            automated={failing.map((c) => ({ severity: c.severity, title: c.title, detail: c.detail + (c.evidence?.length ? `\n\nEvidence:\n${c.evidence.join("\n")}` : ""), recommendation: c.fix ?? "" }))}
          />
        </div>
      </div>
    </div>
  );
}
