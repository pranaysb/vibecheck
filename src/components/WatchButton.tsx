"use client";

import { useFormAction } from "@/components/use-form-action";
import { watchSite } from "@/app/actions/watch";

export function WatchButton({ auditId }: { auditId: string }) {
  const { state, onSubmit, pending } = useFormAction(watchSite);
  if (state?.ok) return <p role="status" className="text-sm text-pass">{state.ok}</p>;
  return (
    <form onSubmit={onSubmit} className="flex flex-col items-start gap-2 sm:items-end">
      <input type="hidden" name="auditId" value={auditId} />
      <button type="submit" className="btn btn-secondary btn-sm" disabled={pending}>
        {pending ? "Starting…" : "Watch weekly"}
      </button>
      {state?.error && <p role="alert" className="text-sm text-fail max-w-xs">{state.error}</p>}
    </form>
  );
}
