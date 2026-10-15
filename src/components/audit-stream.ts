/** Client side of POST /api/audits: reads the NDJSON progress stream until the audit finishes. */
export type AuditStreamEvent = { type: "audit"; id: string } | { type: "step"; label: string } | { type: "done"; id: string; score: number | null } | { type: "error"; message: string; id?: string } | { type: "ping" };

export class AuditStreamError extends Error {
  constructor(message: string, public auditId?: string) {
    super(message);
  }
}

/** Resolves with the finished audit id; rejects with AuditStreamError (carrying the audit id when one was created). */
export async function streamAudit(init: RequestInit, onStep: (label: string) => void): Promise<string> {
  const res = await fetch("/api/audits", init);
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new AuditStreamError(data.error ?? `Request failed (${res.status}).`);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  let auditId: string | undefined;
  for (;;) {
    const { done, value } = await reader.read().catch(() => ({ done: true as const, value: undefined }));
    if (done) break;
    buf += value;
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const ev = JSON.parse(line) as AuditStreamEvent;
      if (ev.type === "audit") auditId = ev.id;
      else if (ev.type === "step") onStep(ev.label);
      else if (ev.type === "done") return ev.id;
      else if (ev.type === "error") throw new AuditStreamError(ev.message, ev.id);
    }
  }
  // The stream was cut off, but the audit keeps running on the server: follow it until it finishes.
  if (auditId) return followAudit(auditId, onStep);
  throw new AuditStreamError("The connection closed before the audit started. Try again.");
}

async function followAudit(id: string, onStep: (label: string) => void): Promise<string> {
  onStep("Connection interrupted; still running on the server");
  const until = Date.now() + 5 * 60_000;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, 3_000));
    const res = await fetch(`/api/audits/${id}/status`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) continue;
    const s = (await res.json()) as { status: string; error: string | null };
    if (s.status === "COMPLETED") return id;
    if (s.status === "FAILED") throw new AuditStreamError(s.error ?? "The audit failed.", id);
  }
  throw new AuditStreamError("The audit is taking unusually long. It will appear in your dashboard when it finishes.", id);
}
