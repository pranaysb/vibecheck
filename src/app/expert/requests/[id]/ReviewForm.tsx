"use client";

import { useFormAction } from "@/components/use-form-action";
import { useState } from "react";
import { submitReview, type ExpertFinding } from "@/app/actions/reviews";
import { VERDICT } from "@/components/review-ui";

const SEVERITIES = ["critical", "high", "medium", "low"] as const;
const blank = (): ExpertFinding => ({ severity: "medium", title: "", detail: "", recommendation: "" });

export function ReviewForm({ requestId, automated }: { requestId: string; automated: ExpertFinding[] }) {
  const { state, onSubmit, pending } = useFormAction(submitReview);
  const [findings, setFindings] = useState<ExpertFinding[]>([]);
  const [verdict, setVerdict] = useState<keyof typeof VERDICT | "">("");

  const update = (i: number, patch: Partial<ExpertFinding>) => setFindings((f) => f.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setFindings((f) => {
      const n = [...f];
      const j = i + d;
      if (j < 0 || j >= n.length) return f;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-8">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="findings" value={JSON.stringify(findings)} />

      <fieldset>
        <legend className="label">Verdict</legend>
        <div className="grid gap-2 sm:grid-cols-3 mt-1">
          {(Object.keys(VERDICT) as (keyof typeof VERDICT)[]).map((v) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="verdict" value={v} checked={verdict === v} onChange={() => setVerdict(v)} className="peer sr-only" required />
              <span className="block h-full rounded-xl border border-line p-4 peer-checked:border-fg peer-checked:ring-1 peer-checked:ring-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ring)]">
                <span className={`block font-medium ${VERDICT[v].tone}`}>{VERDICT[v].label}</span>
                <span className="block text-xs text-muted mt-1">{VERDICT[v].blurb}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="summary" className="label">Summary</label>
        <textarea id="summary" name="summary" rows={8} className="field" required minLength={120} placeholder="Your overall read: what works, what worries you most, and the order you'd tackle things in." />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="label mb-0">Findings ({findings.length})</h2>
          <div className="flex gap-2">
            {automated.length > 0 && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFindings((f) => [...f, ...automated.filter((a) => !f.some((x) => x.title === a.title))])}>
                Import {automated.length} failing checks
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFindings((f) => [...f, blank()])}>
              Add finding
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted">Order matters: put what to fix first at the top. Edit imported checks into your own words, or delete ones that don&rsquo;t matter here.</p>
        <ol className="mt-4 space-y-3">
          {findings.map((f, i) => (
            <li key={i} className="card p-4 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-mono text-xs text-faint w-6">{i + 1}.</span>
                <label className="sr-only" htmlFor={`sev-${i}`}>Severity</label>
                <select id={`sev-${i}`} className="field h-9 w-auto text-sm" value={f.severity} onChange={(e) => update(i, { severity: e.target.value as ExpertFinding["severity"] })}>
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <label className="sr-only" htmlFor={`title-${i}`}>Title</label>
                <input id={`title-${i}`} className="field h-9 text-sm flex-1 min-w-[12rem]" placeholder="Title" value={f.title} onChange={(e) => update(i, { title: e.target.value })} />
                <div className="flex">
                  <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => move(i, -1)} aria-label={`Move finding ${i + 1} up`} disabled={i === 0}>↑</button>
                  <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => move(i, 1)} aria-label={`Move finding ${i + 1} down`} disabled={i === findings.length - 1}>↓</button>
                  <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => setFindings((x) => x.filter((_, j) => j !== i))} aria-label={`Remove finding ${i + 1}`}>✕</button>
                </div>
              </div>
              <label className="sr-only" htmlFor={`detail-${i}`}>What you found</label>
              <textarea id={`detail-${i}`} rows={3} className="field text-sm" placeholder="What you found and why it matters" value={f.detail} onChange={(e) => update(i, { detail: e.target.value })} />
              <label className="sr-only" htmlFor={`rec-${i}`}>Recommendation</label>
              <textarea id={`rec-${i}`} rows={2} className="field text-sm" placeholder="Recommendation (optional)" value={f.recommendation} onChange={(e) => update(i, { recommendation: e.target.value })} />
            </li>
          ))}
        </ol>
      </div>

      {state?.error && <p role="alert" className="text-sm text-fail">{state.error}</p>}
      <div className="flex items-center gap-3 border-t border-line pt-6">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Submitting…" : "Submit review"}</button>
        <p className="text-xs text-muted">Submitting is final and notifies the builder on their dashboard.</p>
      </div>
    </form>
  );
}
