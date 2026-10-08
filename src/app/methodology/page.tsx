import { CATALOG } from "@/lib/audit/catalog";
import { CATEGORY_LABEL, CRITICAL_CAP, METHOD_LABEL, SEVERITY_WEIGHT, type Category } from "@/lib/audit/types";

export const metadata = { title: "Methodology", description: "Every automated check VibeCheck runs, how it is measured, and how the score is computed." };

const APPLIES = { url: "URL", files: "Files", site: "Built site" } as const;

export default function Methodology() {
  const cats = Object.keys(CATEGORY_LABEL) as Category[];
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold">Methodology</h1>
      <p className="mt-4 text-muted max-w-2xl leading-relaxed">
        The automated audit is deterministic code: HTTP requests, an HTML parser, headless Chromium, file scans, and the OSV.dev vulnerability database. There is no language model in the loop and nothing is estimated.
        The same input produces the same result, apart from things that really change between runs, like response time.
      </p>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Scoring</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Each check has a weight by severity:{" "}
            {Object.entries(SEVERITY_WEIGHT)
              .map(([k, v]) => `${k} ${v}`)
              .join(", ")}
            . A pass earns the full weight, a warning half, a failure nothing. The score is earned ÷ possible × 100 over checks that ran.
            If any critical check fails, the score is capped at {CRITICAL_CAP}.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Safety</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Every outbound request is checked against private, loopback, link-local and metadata ranges, and the connection is pinned to the validated IP. Chromium&rsquo;s subrequests go through the same filter.
            Uploaded sites are rendered from memory and previewed under a sandboxed CSP, so their scripts can&rsquo;t reach your session. Real .env files are never stored.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">What a pass doesn&rsquo;t mean</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Automated checks cover what can be measured from outside. They can&rsquo;t find logic bugs, broken auth, or a confusing product. A high score means fewer known problems, not a secure or good product. That&rsquo;s what expert reviews are for.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Not run ≠ passed</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            If Chromium is unavailable, OSV.dev is unreachable, or a check doesn&rsquo;t apply, it is marked &ldquo;not run&rdquo; and left out of the score rather than counted as a pass.
          </p>
        </div>
      </section>

      <div className="mt-14 space-y-12">
        {cats.map((c) => {
          const items = CATALOG.filter((k) => k.category === c);
          return (
            <section key={c} id={c} className="scroll-mt-20">
              <h2 className="text-lg font-semibold">
                {CATEGORY_LABEL[c]} <span className="text-muted font-normal text-sm">· {items.length}</span>
              </h2>
              <div className="mt-3 card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-line">
                      <th scope="col" className="font-medium px-4 py-3">Check</th>
                      <th scope="col" className="font-medium px-4 py-3">How it&rsquo;s measured</th>
                      <th scope="col" className="font-medium px-4 py-3 whitespace-nowrap">Severity</th>
                      <th scope="col" className="font-medium px-4 py-3 whitespace-nowrap">Runs on</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((k) => (
                      <tr key={k.id} className="border-b border-line last:border-0 align-top">
                        <td className="px-4 py-3 min-w-[11rem]">
                          <p className="font-medium">{k.title}</p>
                          <p className="font-mono text-xs text-faint mt-0.5">{k.id}</p>
                        </td>
                        <td className="px-4 py-3 text-muted min-w-[16rem]">
                          {k.how} <span className="text-faint">({METHOD_LABEL[k.method]})</span>
                        </td>
                        <td className="px-4 py-3 capitalize">{k.severity}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{k.appliesTo.map((a) => APPLIES[a]).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
