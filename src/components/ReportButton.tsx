"use client";

import { useState } from "react";
import { useFormAction } from "@/components/use-form-action";
import { reportContent } from "@/app/actions/moderation";

const REASONS = [
  ["ABUSIVE", "Abusive or harassing"],
  ["SPAM", "Spam"],
  ["MISLEADING", "Misleading or fake"],
  ["OTHER", "Something else"],
] as const;

export function ReportButton({ targetType, targetId, label = "Report" }: { targetType: "REVIEW" | "EXPERT"; targetId: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const { state, onSubmit, pending } = useFormAction(reportContent);
  if (state?.ok) return <p role="status" className="text-xs text-muted">{state.ok}</p>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-muted underline underline-offset-4 hover:text-fg">
        {label}
      </button>
    );
  const id = `report-${targetId}`;
  return (
    <form onSubmit={onSubmit} className="w-full space-y-3 rounded-xl border border-line bg-surface p-4 text-sm">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <div>
        <label htmlFor={`${id}-reason`} className="label">Reason</label>
        <select id={`${id}-reason`} name="reason" className="field h-10" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {REASONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-details`} className="label">What&rsquo;s wrong?</label>
        <textarea id={`${id}-details`} name="details" rows={3} className="field" required minLength={10} maxLength={2000} />
      </div>
      {state?.error && <p role="alert" className="text-fail">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Sending…" : "Send report"}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <p className="text-xs text-muted">Only admins see reports.</p>
    </form>
  );
}
