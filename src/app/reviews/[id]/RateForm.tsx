"use client";

import { useFormAction } from "@/components/use-form-action";
import { rateReview } from "@/app/actions/reviews";

export function RateForm({ id }: { id: string }) {
  const { state, onSubmit, pending } = useFormAction(rateReview);
  if (state?.ok) return <p role="status" className="text-sm">{state.ok}</p>;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <fieldset>
        <legend className="font-semibold">How useful was this review?</legend>
        <p className="text-sm text-muted mt-0.5">Your rating appears on the expert&rsquo;s public profile.</p>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} className="peer sr-only" required />
              <span className="grid place-items-center size-10 rounded-lg border border-line-strong text-sm font-medium peer-checked:bg-invert peer-checked:text-invert-fg peer-checked:border-invert peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ring)]">
                {n}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="note" className="label">Note (optional)</label>
        <textarea id="note" name="note" rows={3} className="field" maxLength={1000} />
      </div>
      {state?.error && <p role="alert" className="text-sm text-fail">{state.error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Submit rating"}</button>
    </form>
  );
}
