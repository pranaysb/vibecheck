import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { AuditForm } from "@/components/AuditForm";
import { CATALOG } from "@/lib/audit/catalog";
import { CATEGORY_LABEL, type Category } from "@/lib/audit/types";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? 25);

export default async function Home() {
  const [user, experts, reviews] = await Promise.all([
    getUser(),
    prisma.expertProfile.count({ where: { status: "APPROVED" } }),
    prisma.expertReview.count(),
  ]);
  const byCategory = (Object.keys(CATEGORY_LABEL) as Category[]).map((c) => ({ c, items: CATALOG.filter((k) => k.category === c) }));

  return (
    <>
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pt-16 sm:pt-24 pb-14">
        <p className="chip mb-6">
          <span className="size-1.5 rounded-full bg-pass" aria-hidden="true" />
          {CATALOG.length} checks · every result shows its evidence
        </p>
        <h1 className="text-4xl sm:text-[56px] font-semibold leading-[1.04]">
          Know what&rsquo;s wrong with your site before your users do.
        </h1>
        <p className="mt-5 text-lg text-muted max-w-2xl leading-relaxed">
          Point VibeCheck at a live URL, a GitHub repo, or a .zip. You get a deterministic audit in under a minute, then a
          written review from a human expert when you want a second pair of eyes.
        </p>
        <div className="mt-10">
          <AuditForm signedIn={Boolean(user)} verified={Boolean(user?.verified)} maxUploadMb={MAX_UPLOAD_MB} />
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 grid gap-10 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Automated audit",
              d: "Real HTTP requests, a headless Chromium render at desktop and 390px, file scans, and OSV.dev dependency lookups. No AI guesses, no made-up scores. Same input, same result.",
            },
            {
              n: "02",
              t: "Request an expert",
              d: "Pick focus areas and tell the reviewer what you're worried about. Your request goes to a queue that only admin-approved experts can see.",
            },
            {
              n: "03",
              t: "Get a written review",
              d: "An expert claims it, studies the audit, the live site, and the code, and sends back a verdict with prioritized findings. You rate the review afterwards, and ratings are public.",
            },
          ].map((s) => (
            <div key={s.n}>
              <p className="font-mono text-xs text-faint">{s.n}</p>
              <h2 className="mt-2 text-lg font-semibold">{s.t}</h2>
              <p className="mt-2 text-[15px] text-muted leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold">What gets checked</h2>
            <p className="mt-2 text-muted">Pass, warning, or fail, each with the raw evidence behind it.</p>
          </div>
          <Link href="/methodology" className="btn btn-secondary btn-sm self-start sm:self-auto">Full methodology →</Link>
        </div>
        <div className="grid gap-px bg-line border border-line rounded-2xl overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {byCategory.map(({ c, items }) => (
            <div key={c} className="bg-raised p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">{CATEGORY_LABEL[c]}</h3>
                <span className="text-xs text-muted tabular-nums">{items.length} checks</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {items.slice(0, 5).map((i) => (
                  <li key={i.id} className="flex gap-2">
                    <span className="text-faint" aria-hidden="true">–</span>
                    {i.title}
                  </li>
                ))}
                {items.length > 5 && <li className="text-faint">+ {items.length - 5} more</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 grid gap-8 md:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold">Reviewed by people, not personas.</h2>
            <p className="mt-3 text-muted leading-relaxed max-w-xl">
              Experts apply with links to work you can check. An admin reviews each application before the expert can see any request.
              Every review is tied to the expert&rsquo;s account, and the rating you give is shown on their profile.
            </p>
            <p className="mt-4 text-sm text-muted tabular-nums">
              {experts === 0 ? "No experts have been approved yet. The network is open for applications." : `${experts} approved expert${experts === 1 ? "" : "s"}`}
              {reviews > 0 && ` · ${reviews} review${reviews === 1 ? "" : "s"} delivered`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Link href="/experts" className="btn btn-secondary">Browse experts</Link>
            <Link href="/experts/apply" className="btn btn-primary">Apply as an expert</Link>
          </div>
        </div>
      </section>
    </>
  );
}
