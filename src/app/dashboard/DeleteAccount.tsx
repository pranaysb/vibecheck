"use client";

import { useState } from "react";
import { useFormAction } from "@/components/use-form-action";
import { deleteAccount } from "@/app/actions/account";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const { state, onSubmit, pending } = useFormAction(deleteAccount);
  if (!open)
    return (
      <button type="button" className="btn btn-secondary btn-sm mt-4 text-fail" onClick={() => setOpen(true)}>
        Delete my account…
      </button>
    );
  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-end max-w-lg">
      <div className="flex-1">
        <label htmlFor="confirm" className="label">Type <strong>delete</strong> to confirm. This can&rsquo;t be undone.</label>
        <input id="confirm" name="confirm" className="field" autoComplete="off" required autoFocus />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary bg-fail text-invert-fg" disabled={pending}>{pending ? "Deleting…" : "Delete forever"}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {state?.error && <p role="alert" className="text-sm text-fail sm:basis-full">{state.error}</p>}
    </form>
  );
}
