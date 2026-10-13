/** Client side of POST /api/audits: reads the NDJSON progress stream until the audit finishes. */
export type AuditStreamEvent = { type: "audit"; id: string } | { type: "step"; label: string } | { type: "done"; id: string; score: number | null } | { type: "error"; message: string; id?: string };

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
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += value;
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const ev = JSON.parse(line) as AuditStreamEvent;
      if (ev.type === "step") onStep(ev.label);
      else if (ev.type === "done") return ev.id;
      else if (ev.type === "error") throw new AuditStreamError(ev.message, ev.id);
    }
  }
  throw new AuditStreamError("The connection closed before the audit finished. If it completed, it will appear in your dashboard.");
}
