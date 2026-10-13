"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuditStreamError, streamAudit } from "@/components/audit-stream";

/** Re-audits the same URL or repository and opens the new report, which shows what changed. */
export function RerunButton({ source, target }: { source: "URL" | "GITHUB"; target: string }) {
  const router = useRouter();
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setStep("Starting");
    const body = source === "URL" ? { source, url: target } : { source, repo: target };
    try {
      const id = await streamAudit({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }, setStep);
      router.push(`/audits/${id}`);
    } catch (err) {
      setError(err instanceof AuditStreamError ? err.message : "The audit failed.");
      setStep(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button type="button" onClick={run} disabled={step !== null} className="btn btn-secondary btn-sm">
        {step !== null && <span className="size-3.5 rounded-full border-2 border-line border-t-fg animate-spin" aria-hidden="true" />}
        {step ?? "Run again"}
      </button>
      <span aria-live="polite" className="sr-only">{step}</span>
      {error && <p role="alert" className="text-xs text-fail">{error}</p>}
    </div>
  );
}
