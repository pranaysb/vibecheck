import { CATEGORY_LABEL, METHOD_LABEL, SEVERITY_WEIGHT, type Category, type CheckResult, type Status } from "@/lib/audit/types";

export function scoreTone(score: number | null) {
  if (score === null) return "text-skip";
  if (score >= 90) return "text-pass";
  if (score >= 70) return "text-warn";
  return "text-fail";
}

export function ScoreRing({ score, size = 128 }: { score: number | null; size?: number }) {
  const stroke = size >= 100 ? 8 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score ?? 0;
  return (
    <div className={`relative inline-grid place-items-center ${scoreTone(score)}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="text-center">
          <span className="block font-semibold tabular-nums text-fg" style={{ fontSize: size * 0.3, lineHeight: 1 }}>
            {score ?? "—"}
          </span>
          {size >= 100 && <span className="block text-xs text-muted mt-1">of 100</span>}
        </span>
      </span>
      <span className="sr-only">{score === null ? "No score" : `Score ${score} out of 100`}</span>
    </div>
  );
}

const STATUS_TEXT: Record<Status, string> = { pass: "Passed", warn: "Warning", fail: "Failed", skip: "Not run" };

export function StatusIcon({ status, className = "" }: { status: Status; className?: string }) {
  const color = { pass: "text-pass", warn: "text-warn", fail: "text-fail", skip: "text-skip" }[status];
  return (
    <span className={`inline-grid place-items-center shrink-0 ${color} ${className}`} title={STATUS_TEXT[status]}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        {status === "pass" && (
          <>
            <circle cx="8" cy="8" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 8.2l2 2 4-4.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {status === "fail" && (
          <>
            <circle cx="8" cy="8" r="8" fill="currentColor" />
            <path d="M5.5 5.5l5 5m0-5l-5 5" stroke="var(--bg)" strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}
        {status === "warn" && (
          <>
            <path d="M8 1.5l6.8 12.2H1.2z" fill="currentColor" strokeLinejoin="round" />
            <path d="M8 6v3.6" stroke="var(--bg)" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="8" cy="11.6" r=".9" fill="var(--bg)" />
          </>
        )}
        {status === "skip" && <circle cx="8" cy="8" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2.5" />}
      </svg>
      <span className="sr-only">{STATUS_TEXT[status]}</span>
    </span>
  );
}

const ORDER: Record<Status, number> = { fail: 0, warn: 1, pass: 2, skip: 3 };
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function sortChecks(checks: CheckResult[]) {
  return [...checks].sort((a, b) => ORDER[a.status] - ORDER[b.status] || SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
}

export function CategorySummary({ checks }: { checks: CheckResult[] }) {
  const cats = (Object.keys(CATEGORY_LABEL) as Category[]).filter((c) => checks.some((k) => k.category === c));
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {cats.map((cat) => {
        const list = checks.filter((c) => c.category === cat && c.status !== "skip");
        const pass = list.filter((c) => c.status === "pass").length;
        const fail = list.filter((c) => c.status === "fail").length;
        const warn = list.filter((c) => c.status === "warn").length;
        return (
          <li key={cat}>
            <a href={`#${cat}`} className="block h-full card p-4 hover:border-line-strong transition-colors">
              <p className="text-[13px] text-muted">{CATEGORY_LABEL[cat]}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {pass}
                <span className="text-muted font-normal text-sm"> / {list.length} passed</span>
              </p>
              <div className="mt-3 flex h-1.5 rounded-full overflow-hidden bg-line" aria-hidden="true">
                <span className="bg-pass" style={{ width: `${(pass / Math.max(list.length, 1)) * 100}%` }} />
                <span className="bg-warn" style={{ width: `${(warn / Math.max(list.length, 1)) * 100}%` }} />
                <span className="bg-fail" style={{ width: `${(fail / Math.max(list.length, 1)) * 100}%` }} />
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** The failures that cost the most score, in the order a builder should tackle them. */
export function topPriorities(checks: CheckResult[], limit = 5): CheckResult[] {
  const impact = (c: CheckResult) => SEVERITY_WEIGHT[c.severity] * (c.status === "fail" ? 1 : 0.5);
  return checks.filter((c) => c.status === "fail" || c.status === "warn").sort((a, b) => impact(b) - impact(a)).slice(0, limit);
}

export function FixFirst({ checks }: { checks: CheckResult[] }) {
  const top = topPriorities(checks);
  if (!top.length) return null;
  return (
    <section className="mt-6 card p-5" aria-labelledby="fix-first">
      <h2 id="fix-first" className="font-semibold">Fix these first</h2>
      <p className="mt-1 text-sm text-muted">The problems that hurt your score most, biggest first. Each links to its evidence below.</p>
      <ol className="mt-4 space-y-3">
        {top.map((c, i) => (
          <li key={c.id} className="flex gap-3">
            <span className="font-mono text-xs text-faint mt-1 w-4 shrink-0">{i + 1}</span>
            <div className="min-w-0">
              <a href={`#check-${c.id}`} className="font-medium underline-offset-4 hover:underline">{c.title}</a>
              <span className={`ml-2 text-[11px] font-medium uppercase tracking-wide ${c.severity === "critical" || c.severity === "high" ? "text-fail" : "text-muted"}`}>{c.severity}</span>
              <p className="text-sm text-muted leading-relaxed">{c.detail}</p>
              {c.fix && <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap"><span className="text-muted">Fix: </span>{c.fix}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CheckRow({ check }: { check: CheckResult }) {
  const hasBody = Boolean(check.evidence?.length || check.fix);
  return (
    <li id={`check-${check.id}`} className="border-b border-line last:border-b-0 scroll-mt-20">
      <details className="group" open={check.status === "fail" && check.severity === "critical"}>
        <summary className="flex items-start gap-3 py-3.5 px-4 hover:bg-surface rounded-lg">
          <StatusIcon status={check.status} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-[15px]">{check.title}</span>
              {check.status !== "pass" && check.status !== "skip" && (
                <span className={`text-[11px] font-medium uppercase tracking-wide ${check.severity === "critical" || check.severity === "high" ? "text-fail" : "text-muted"}`}>{check.severity}</span>
              )}
            </div>
            <p className="text-sm text-muted mt-0.5 leading-relaxed">{check.detail}</p>
          </div>
          {hasBody && (
            <svg width="16" height="16" viewBox="0 0 16 16" className="mt-1 text-faint transition-transform group-open:rotate-180 shrink-0" aria-hidden="true">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </summary>
        {hasBody && (
          <div className="pl-11 pr-4 pb-4 space-y-3">
            {check.evidence?.length ? (
              <div>
                <p className="eyebrow mb-1.5">Evidence</p>
                <ul className="rounded-lg bg-surface border border-line p-3 font-mono text-[12.5px] leading-relaxed space-y-1 overflow-x-auto">
                  {check.evidence.map((e, i) => (
                    <li key={i} className="whitespace-pre-wrap break-all">{e}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {check.fix && (
              <div>
                <p className="eyebrow mb-1.5">How to fix</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{check.fix}</p>
              </div>
            )}
            <p className="text-xs text-faint">Measured by: {METHOD_LABEL[check.method]} · check id <code className="font-mono">{check.id}</code></p>
          </div>
        )}
      </details>
    </li>
  );
}

export function CheckGroups({ checks }: { checks: CheckResult[] }) {
  const cats = (Object.keys(CATEGORY_LABEL) as Category[]).filter((c) => checks.some((k) => k.category === c));
  return (
    <div className="space-y-10">
      {cats.map((cat) => (
        <section key={cat} id={cat} className="scroll-mt-20">
          <h3 className="text-base font-semibold mb-2">{CATEGORY_LABEL[cat]}</h3>
          <ul className="card p-1">
            {sortChecks(checks.filter((c) => c.category === cat)).map((c) => (
              <CheckRow key={c.id} check={c} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function timeAgo(d: Date) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

export const SOURCE_LABEL = { URL: "Live URL", ZIP: "Upload", GITHUB: "GitHub" } as const;
