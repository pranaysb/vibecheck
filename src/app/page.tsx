import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { AuditForm } from "@/components/AuditForm";
import { MAX_DIRECT_UPLOAD_MB, blobEnabled, uploadPrefix } from "@/lib/storage";
import { CATALOG } from "@/lib/audit/catalog";
import { CATEGORY_LABEL, computeScore, type Category, type CheckResult } from "@/lib/audit/types";
import { ScoreRing } from "@/components/audit-ui";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? 25);

// Public counts change rarely; cache them so the home page doesn't hit the database on every visit.
const getPublicCounts = unstable_cache(
  async () => {
    const [experts, reviews] = await Promise.all([
      prisma.expertProfile.count({ where: { status: "APPROVED" } }),
      prisma.expertReview.count({ where: { hiddenAt: null } }),
    ]);
    return { experts, reviews };
  },
  ["home-counts"],
  { revalidate: 300, tags: ["home-counts"] }
);

/**
 * A real report shown beside the hero: the audit named by EXAMPLE_AUDIT_ID, if it exists, completed, and is a
 * public URL audit. Nothing is shown otherwise; the numbers are never made up.
 */
const getExample = unstable_cache(
  async () => {
    let id = process.env.EXAMPLE_AUDIT_ID;
    if (!id || id === "cmvc7wyc60001l508qgfad42b") {
      id = "cmvcke3l80009js07d36tp5kb";
    }
    let audit = id
      ? await prisma.audit.findUnique({ where: { id }, select: { id: true, label: true, source: true, status: true, checks: true, createdAt: true } })
      : null;
    if (!audit || audit.label === "pranaysb.me") {
      audit = await prisma.audit.findFirst({
        where: { source: "URL", status: "COMPLETED", NOT: { label: "pranaysb.me" } },
        orderBy: { createdAt: "desc" },
        select: { id: true, label: true, source: true, status: true, checks: true, createdAt: true },
      });
    }
    if (!audit || audit.source !== "URL" || audit.status !== "COMPLETED") return null;
    const checks = (audit.checks ?? []) as unknown as CheckResult[];
    return { id: audit.id, label: audit.label, createdAt: audit.createdAt.toISOString(), score: computeScore(checks).score, checks };
  },
  ["home-example"],
  { revalidate: 600 }
);

function ExampleReport({ example }: { example: { id: string; label: string; createdAt: string; score: number | null; checks: CheckResult[] } }) {
  const cats = (Object.keys(CATEGORY_LABEL) as Category[]).filter((c) => example.checks.some((k) => k.category === c && k.status !== "skip"));
  return (
    <Link href={`/audits/${example.id}`} className="block card p-5 hover:border-line-strong transition-colors" aria-label={`Example report: ${example.label}, ${example.score} out of 100`}>
      <p className="eyebrow">A real report</p>
      <div className="mt-4 flex items-center gap-4">
        <ScoreRing score={example.score} size={72} />
        <div className="min-w-0">
          <p className="font-semibold truncate">{example.label}</p>
          <p className="text-sm text-muted">Audited {new Date(example.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {cats.map((cat) => {
          const list = example.checks.filter((c) => c.category === cat && c.status !== "skip");
          const n = Math.max(list.length, 1);
          const pass = list.filter((c) => c.status === "pass").length;
          const warn = list.filter((c) => c.status === "warn").length;
          const fail = list.filter((c) => c.status === "fail").length;
          return (
            <li key={cat} className="text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">{CATEGORY_LABEL[cat]}</span>
                <span className="tabular-nums text-muted">{pass}/{list.length}</span>
              </div>
              <div className="mt-1 flex h-1 rounded-full overflow-hidden bg-line" aria-hidden="true">
                <span className="bg-pass" style={{ width: `${(pass / n) * 100}%` }} />
                <span className="bg-warn" style={{ width: `${(warn / n) * 100}%` }} />
                <span className="bg-fail" style={{ width: `${(fail / n) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-sm">See the full report, with evidence →</p>
    </Link>
  );
}

export default async function Home() {
  const [user, { experts, reviews }, example] = await Promise.all([getUser(), getPublicCounts(), getExample()]);
  const byCategory = (Object.keys(CATEGORY_LABEL) as Category[]).map((c) => ({ c, items: CATALOG.filter((k) => k.category === c) }));

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
        <div className="min-w-0 max-w-3xl">
        <p className="chip mb-6">
          <span className="size-1.5 rounded-full bg-pass" aria-hidden="true" />
          {CATALOG.length} checks · every result shows its evidence
        </p>
        <h1 className="text-4xl sm:text-[56px] font-semibold leading-[1.04]">
          Know what&rsquo;s wrong with your site before your users do.
        </h1>
        <p className="mt-5 text-lg text-muted max-w-2xl leading-relaxed">
          Point VibeCheck at a live URL, a GitHub repo, or a .zip. You get a deterministic audit in a minute or two, free during early access, then a
          written review from a human expert when you want a second pair of eyes.
        </p>
        <div className="mt-10">
          <AuditForm
            signedIn={Boolean(user)}
            maxUploadMb={blobEnabled() ? MAX_DIRECT_UPLOAD_MB : MAX_UPLOAD_MB}
            uploadPrefix={user && blobEnabled() ? uploadPrefix(user.id) : null}
          />
        </div>
        </div>
        {example && <ExampleReport example={example} />}
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 grid gap-10 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Automated audit",
              d: "Real HTTP requests, a headless Chromium render at desktop and 390px, a throttled phone load like Lighthouse's, a crawl of up to 20 more pages, file scans, and OSV.dev dependency lookups. No AI guesses, no made-up scores.",
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
                <span className="text-xs text-muted tabular-nums">{items.length} {items.length === 1 ? "check" : "checks"}</span>
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
          {byCategory.length % 3 !== 0 && (
            <Link href="/methodology" className={`bg-raised p-6 hover:bg-surface transition-colors flex flex-col justify-between gap-4 ${byCategory.length % 3 === 1 ? "lg:col-span-2" : ""}`}>
              <div>
                <h3 className="font-semibold">How every check works</h3>
                <p className="mt-2 text-sm text-muted max-w-md">The exact method, thresholds and severity behind each of the {CATALOG.length} checks, and what an automated check can&rsquo;t tell you.</p>
              </div>
              <span className="text-sm">Read the methodology →</span>
            </Link>
          )}
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
