"use client";

import { useFormAction } from "@/components/use-form-action";
import { applyAsExpert } from "@/app/actions/reviews";
import { FOCUS_AREAS } from "@/lib/access";

type Initial = { headline: string; bio: string; expertise: string[]; links: string };

export function ApplyForm({ initial, approved }: { initial?: Initial; approved: boolean }) {
  const { state, onSubmit, pending } = useFormAction(applyAsExpert);
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="headline" className="label">Headline</label>
        <input id="headline" name="headline" className="field" defaultValue={initial?.headline} placeholder="Frontend engineer, 8 years, accessibility specialist" required maxLength={120} />
      </div>
      <div>
        <label htmlFor="bio" className="label">Experience</label>
        <textarea id="bio" name="bio" rows={6} className="field" defaultValue={initial?.bio} placeholder="What you've built, shipped, or audited, and what you look for when you review." required minLength={80} maxLength={3000} />
      </div>
      <fieldset>
        <legend className="label">Areas you review</legend>
        <div className="flex flex-wrap gap-2 mt-1">
          {FOCUS_AREAS.map((f) => (
            <label key={f} className="cursor-pointer">
              <input type="checkbox" name="expertise" value={f} defaultChecked={initial?.expertise.includes(f)} className="peer sr-only" />
              <span className="chip h-8 px-3 text-[13px] peer-checked:bg-invert peer-checked:text-invert-fg peer-checked:border-invert peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ring)]">{f}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="links" className="label">Links to verifiable work</label>
        <textarea id="links" name="links" rows={3} className="field font-mono text-[13px]" defaultValue={initial?.links} placeholder={"https://github.com/you\nhttps://your-portfolio.dev"} required aria-describedby="links-hint" />
        <p id="links-hint" className="mt-1.5 text-xs text-muted">One per line, up to five. Full URLs starting with https://.</p>
      </div>
      {state?.error && <p role="alert" className="text-sm text-fail">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-pass">{state.ok}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : approved ? "Save profile" : initial ? "Resubmit application" : "Submit application"}
      </button>
    </form>
  );
}
