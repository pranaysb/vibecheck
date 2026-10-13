"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { upload } from "@vercel/blob/client";

type Tab = "url" | "github" | "zip";
type Step = { label: string; startedAt: number; endedAt?: number };

const TABS: { id: Tab; label: string }[] = [
  { id: "url", label: "Live URL" },
  { id: "github", label: "GitHub repo" },
  { id: "zip", label: "Upload .zip" },
];

/** `uploadPrefix` is set when the server has Blob storage: the .zip then goes browser → storage directly. */
export function AuditForm({ signedIn, maxUploadMb, uploadPrefix }: { signedIn: boolean; maxUploadMb: number; uploadPrefix: string | null }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [repo, setRepo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [running]);

  const needsAccount = tab !== "url" && !signedIn;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (running || needsAccount) return;
    setError(null);
    setFailedId(null);
    setSteps([]);

    if (tab === "zip") {
      if (!file) return setError("Choose a .zip file first.");
      if (file.size > maxUploadMb * 1024 * 1024) return setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is ${maxUploadMb} MB.`);
    }

    setRunning(true);
    setNow(Date.now());
    try {
      let init: RequestInit;
      if (tab === "zip" && file && uploadPrefix) {
        const started = Date.now();
        const mb = (file.size / 1024 / 1024).toFixed(1);
        setSteps([{ label: `Uploading ${mb} MB`, startedAt: started }]);
        const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+/, "") || "upload.zip";
        const blob = await upload(`${uploadPrefix}${safeName}`, file, {
          access: "private",
          handleUploadUrl: "/api/uploads",
          multipart: file.size > 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setSteps([{ label: `Uploading ${mb} MB · ${Math.round(percentage)}%`, startedAt: started }]),
        });
        setSteps([{ label: `Uploaded ${mb} MB`, startedAt: started, endedAt: Date.now() }]);
        init = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ source: "ZIP", blobKey: blob.pathname, filename: file.name }) };
      } else if (tab === "zip" && file) {
        const fd = new FormData();
        fd.append("file", file);
        init = { method: "POST", body: fd };
      } else {
        const body = tab === "url" ? { source: "URL", url } : { source: "GITHUB", repo };
        init = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
      }
      const res = await fetch("/api/audits", init);
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status}).`);
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
          const ev = JSON.parse(line);
          if (ev.type === "step") {
            const t = Date.now();
            setSteps((s) => [...s.map((x, i) => (i === s.length - 1 && !x.endedAt ? { ...x, endedAt: t } : x)), { label: ev.label, startedAt: t }]);
          } else if (ev.type === "done") {
            setSteps((s) => s.map((x) => (x.endedAt ? x : { ...x, endedAt: Date.now() })));
            router.push(`/audits/${ev.id}`);
            return;
          } else if (ev.type === "error") {
            if (ev.id) setFailedId(ev.id);
            throw new Error(ev.message);
          }
        }
      }
      throw new Error("The connection closed before the audit finished. If it completed, it will appear in your dashboard.");
    } catch (err) {
      setError((err as Error).message);
      setRunning(false);
    }
  }

  const label = tab === "url" ? "Website URL" : tab === "github" ? "Public GitHub repository" : "Site or project archive";

  return (
    <div className="card p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
      <div role="tablist" aria-label="What to audit" className="flex gap-1 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="audit-panel"
            disabled={running}
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={`btn btn-sm flex-1 sm:flex-none ${tab === t.id ? "bg-surface text-fg border border-line" : "btn-ghost border border-transparent"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form id="audit-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} onSubmit={start} className="p-2 pt-1">
        <label htmlFor="audit-input" className="sr-only">{label}</label>
        <div className="flex flex-col sm:flex-row gap-2">
          {tab === "url" && (
            <input id="audit-input" className="field h-12 text-base" type="text" inputMode="url" autoComplete="url" placeholder="yourproduct.com" value={url} onChange={(e) => setUrl(e.target.value)} required disabled={running} />
          )}
          {tab === "github" && (
            <input id="audit-input" className="field h-12 text-base font-mono text-[15px]" type="text" autoComplete="off" spellCheck={false} placeholder="owner/repo or github.com/owner/repo" value={repo} onChange={(e) => setRepo(e.target.value)} required disabled={running || needsAccount} />
          )}
          {tab === "zip" && (
            <>
              <input ref={fileInput} id="audit-input" type="file" accept=".zip,application/zip" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={running || needsAccount} />
              <button type="button" onClick={() => fileInput.current?.click()} disabled={running || needsAccount} className="field h-12 text-left text-base truncate">
                {file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : <span className="text-faint">Choose a .zip (build output or source)…</span>}
              </button>
            </>
          )}
          <button type="submit" className="btn btn-primary h-12 px-6 text-[15px]" disabled={running || needsAccount}>
            {running ? "Auditing…" : "Run audit"}
          </button>
        </div>

        {needsAccount ? (
          <p className="text-sm text-muted mt-3 px-1">
            Uploads and repo imports are stored for expert review, so they need an account.{" "}
            <Link href="/sign-up" className="text-fg underline underline-offset-4">Create one</Link> or <Link href="/sign-in" className="text-fg underline underline-offset-4">sign in</Link>.
          </p>
        ) : (
          <p className="text-[13px] text-muted mt-3 px-1">
            {tab === "url" && "Fetches the page, probes headers and exposed files, and renders it in Chromium at desktop and phone width."}
            {tab === "github" && "Downloads the default branch, scans for secrets, checks dependencies against OSV.dev, and renders any built index.html."}
            {tab === "zip" && `Up to ${maxUploadMb} MB. A build folder (dist/, out/, build/) gets rendered; source gets secret and dependency scans. node_modules is skipped.`}
          </p>
        )}

        {(steps.length > 0 || error) && (
          <div className="mt-4 border-t border-line pt-4 px-1" aria-live="polite">
            <ol className="space-y-2">
              {steps.map((s, i) => {
                const ms = (s.endedAt ?? now) - s.startedAt;
                return (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {s.endedAt ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" className="text-pass shrink-0" aria-hidden="true">
                        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="size-4 shrink-0 rounded-full border-2 border-line border-t-fg animate-spin" aria-hidden="true" />
                    )}
                    <span className={s.endedAt ? "text-muted" : "text-fg"}>{s.label}</span>
                    <span className="ml-auto font-mono text-xs text-faint tabular-nums">{(Math.max(ms, 0) / 1000).toFixed(1)}s</span>
                  </li>
                );
              })}
            </ol>
            {error && (
              <p role="alert" className="mt-3 text-sm text-fail">
                {error}
                {failedId && (
                  <>
                    {" "}
                    <Link className="underline underline-offset-4" href={`/audits/${failedId}`}>View record</Link>
                  </>
                )}
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
