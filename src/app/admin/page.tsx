import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/auth/session";
import { decideExpert } from "@/app/actions/reviews";
import { timeAgo } from "@/components/audit-ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function Admin() {
  const user = await requireVerifiedUser("/admin");
  if (!user.isAdmin) notFound();

  const [pending, decided, counts] = await Promise.all([
    prisma.expertProfile.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, email: true, createdAt: true } } } }),
    prisma.expertProfile.findMany({ where: { status: { not: "PENDING" } }, orderBy: { decidedAt: "desc" }, take: 30, include: { user: { select: { name: true, email: true } } } }),
    Promise.all([prisma.user.count(), prisma.audit.count(), prisma.reviewRequest.count({ where: { status: "OPEN" } }), prisma.expertReview.count()]),
  ]);
  const stats = [
    ["Accounts", counts[0]],
    ["Audits run", counts[1]],
    ["Open requests", counts[2]],
    ["Reviews delivered", counts[3]],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold">Admin</h1>
      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-raised p-4">
            <dt className="text-[13px] text-muted">{k}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <h2 className="text-base font-semibold mb-1">Expert applications ({pending.length})</h2>
        <p className="text-sm text-muted mb-4">Open each link and confirm the work is real and belongs to the applicant before approving.</p>
        {pending.length === 0 ? (
          <p className="card p-5 text-sm text-muted">No pending applications.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.user.name} <span className="font-normal text-muted text-sm">· {p.user.email}</span></p>
                    <p className="text-sm text-muted">{p.headline} · applied {timeAgo(p.createdAt)}</p>
                    <p className="mt-3 prose-text text-sm">{p.bio}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.expertise.map((e) => (
                        <span key={e} className="chip">{e}</span>
                      ))}
                    </div>
                    <ul className="mt-3 space-y-1 text-sm">
                      {p.links.map((l) => (
                        <li key={l}>
                          <a href={l} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-4 break-all">{l}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <form action={decideExpert} className="flex gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <button name="decision" value="reject" className="btn btn-secondary btn-sm" type="submit">Decline</button>
                    <button name="decision" value="approve" className="btn btn-primary btn-sm" type="submit">Approve</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="mt-12">
          <h2 className="text-base font-semibold mb-3">Decided</h2>
          <ul className="card divide-y divide-line">
            {decided.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>{p.user.name} <span className="text-muted">· {p.user.email}</span></span>
                <span className="flex items-center gap-3">
                  <span className={p.status === "APPROVED" ? "text-pass" : "text-muted"}>{p.status === "APPROVED" ? "Approved" : "Declined"}</span>
                  <form action={decideExpert}>
                    <input type="hidden" name="id" value={p.id} />
                    <button name="decision" value={p.status === "APPROVED" ? "reject" : "approve"} className="btn btn-ghost btn-sm" type="submit">
                      {p.status === "APPROVED" ? "Revoke" : "Approve"}
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
