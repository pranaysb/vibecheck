"use client";

import { useFormAction } from "@/components/use-form-action";
import { useState } from "react";
import { requestReview } from "@/app/actions/reviews";
import { FOCUS_AREAS } from "@/lib/access";

export function RequestReviewForm({ auditId }: { auditId: string }) {
  const [open, setOpen] = useState(false);
  const { state, onSubmit, pending } = useFormAction(requestReview);

  if (state?.ok) return <p className="text-sm rounded-xl bg-surface border border-line px-4 py-3">{state.ok}</p>;
  if (!open)
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        Request an expert review
      </button>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="auditId" value={auditId} />
      <fieldset>
        <legend className="label">What should the expert focus on?</legend>
        <div className="flex flex-wrap gap-2 mt-1">
          {FOCUS_AREAS.map((f) => (
            <label key={f} className="cursor-pointer">
              <input type="checkbox" name="focus" value={f} className="peer sr-only" />
              <span className="chip h-8 px-3 text-[13px] peer-checked:bg-invert peer-checked:text-invert-fg peer-checked:border-invert peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ring)]">
                {f}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="notes" className="label">Context for the reviewer</label>
        <textarea id="notes" name="notes" rows={5} className="field" placeholder="What is the product, who is it for, and what are you unsure about? Mention test credentials if the reviewer needs to log in." required minLength={20} />
      </div>
      {state?.error && <p role="alert" className="text-sm text-fail">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Posting…" : "Post request"}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <p className="text-xs text-muted">No payment is taken. Approved experts can see this audit, your notes, and any uploaded files.</p>
    </form>
  );
}
