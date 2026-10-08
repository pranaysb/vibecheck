import Link from "next/link";
import { prisma } from "@/lib/db";
import { Stars } from "@/components/review-ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Experts", description: "Admin-approved reviewers. Every count and rating comes from completed reviews." };

function host(u: string) {
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export default async function Experts() {
  const experts = await prisma.expertProfile.findMany({
    where: { status: "APPROVED" },
    include: { user: { select: { id: true, name: true, expertReviews: { select: { rating: true } } } } },
    orderBy: { decidedAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-semibold">Experts</h1>
          <p className="mt-3 text-muted leading-relaxed">
            Each person here applied with links to their work and was approved by an admin. Review counts and ratings come only from completed reviews rated by the people who requested them.
          </p>
        </div>
        <Link href="/experts/apply" className="btn btn-primary">Apply as an expert</Link>
      </div>

      {experts.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="font-medium">No experts have been approved yet.</p>
          <p className="mt-1 text-sm text-muted">If you review websites or code professionally, apply and you could be first.</p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {experts.map((e) => {
            const rated = e.user.expertReviews.filter((r) => r.rating !== null);
            const avg = rated.length ? rated.reduce((n, r) => n + r.rating!, 0) / rated.length : null;
            return (
              <li key={e.id} className="card p-6 flex flex-col">
                <div className="flex items-start gap-3">
                  <span className="size-10 rounded-full bg-invert text-invert-fg grid place-items-center font-semibold shrink-0" aria-hidden="true">
                    {e.user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-semibold">{e.user.name}</h2>
                    <p className="text-sm text-muted">{e.headline}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed line-clamp-4">{e.bio}</p>
                <div className="mt-4 mb-5 flex flex-wrap gap-1.5">
                  {e.expertise.map((x) => (
                    <span key={x} className="chip">{x}</span>
                  ))}
                </div>
                <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-3 text-sm border-t border-line">
                  <span className="text-muted tabular-nums">
                    {e.user.expertReviews.length} review{e.user.expertReviews.length === 1 ? "" : "s"}
                    {avg !== null ? (
                      <span className="ml-2 inline-flex items-center gap-1.5">
                        <Stars value={avg} /> {avg.toFixed(1)} ({rated.length})
                      </span>
                    ) : (
                      " · no ratings yet"
                    )}
                  </span>
                  <span className="flex gap-3">
                    {e.links.slice(0, 3).map((l) => (
                      <a key={l} href={l} className="underline underline-offset-4 text-muted hover:text-fg" rel="noopener noreferrer nofollow" target="_blank">
                        {host(l)}
                      </a>
                    ))}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
