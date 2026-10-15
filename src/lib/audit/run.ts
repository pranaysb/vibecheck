import type { AuditSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { readZip } from "./archive";
import { auditFiles, type StoredFile } from "./files-audit";
import { downloadRepo, parseRepo } from "./github";
import { computeScore, type AuditMeta, type CheckResult } from "./types";
import { auditUrl, normalizeUrl } from "./url-audit";
import { auditPrefix, blobEnabled, deleteByPrefix, getObject, putObject } from "@/lib/storage";

/** Runs `fn` over items with at most `limit` in flight. */
async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

export type AuditInput =
  | { source: "URL"; url: string }
  | { source: "ZIP"; filename: string; data: Uint8Array }
  /** A .zip the browser uploaded straight to Blob storage (bypasses the 4.5 MB request limit). */
  | { source: "ZIP"; filename: string; blobKey: string }
  | { source: "GITHUB"; repo: string };

/**
 * Analysis must finish inside this budget so there is always time to save results (or the failure) before the
 * 300 s function limit. Without it, a site that hangs a step leaves the audit stuck as "running".
 */
const ANALYSIS_BUDGET_MS = 255_000;

function withinBudget<T>(work: Promise<T>, since = performance.now()): Promise<T> {
  const left = ANALYSIS_BUDGET_MS - (performance.now() - since);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`The audit ran out of time (over ${Math.round(ANALYSIS_BUDGET_MS / 60_000 * 10) / 10} minutes) and was stopped. Try again; if it keeps happening, this site or project is too slow or too large to audit in one pass.`)), Math.max(0, left));
  });
  return Promise.race([work, limit]).finally(() => clearTimeout(timer));
}

export type AuditEvent = { type: "audit"; id: string } | { type: "step"; label: string } | { type: "done"; id: string; score: number | null } | { type: "error"; message: string; id?: string };

function initial(input: AuditInput): { target: string; label: string } {
  if (input.source === "URL") {
    const url = normalizeUrl(input.url);
    return { target: url, label: new URL(url).host };
  }
  if (input.source === "ZIP") return { target: input.filename, label: input.filename.replace(/\.zip$/i, "") };
  const r = parseRepo(input.repo);
  return { target: `https://github.com/${r.owner}/${r.repo}${r.ref ? `/tree/${r.ref}` : ""}`, label: `${r.owner}/${r.repo}` };
}

/** Creates the audit row first (so failures are recorded too), runs every check, then persists results. */
export async function runAudit(input: AuditInput, ownerId: string | null, emit: (e: AuditEvent) => void): Promise<string> {
  const { target, label } = initial(input);
  const audit = await prisma.audit.create({ data: { source: input.source as AuditSource, target, label, ownerId } });
  emit({ type: "audit", id: audit.id });

  const started = performance.now();
  const steps: { label: string; ms: number }[] = [];
  let stepStart = started;
  const step = (l: string) => {
    const now = performance.now();
    if (steps.length) steps[steps.length - 1].ms = Math.round(now - stepStart);
    steps.push({ label: l, ms: 0 });
    stepStart = now;
    emit({ type: "step", label: l });
  };

  try {
    let checks: CheckResult[];
    let meta: AuditMeta;
    let finalUrl: string | undefined;
    let screenshots: { kind: string; width: number; height: number; data: Buffer }[] = [];
    let stored: StoredFile[] = [];

    if (input.source === "URL") {
      const out = await withinBudget(auditUrl(input.url, step), started);
      ({ checks, meta, finalUrl, screenshots } = out);
    } else {
      let zip: Uint8Array;
      let github: AuditMeta["github"];
      if (input.source === "GITHUB") {
        step("Downloading the repository from GitHub");
        const dl = await downloadRepo(parseRepo(input.repo));
        zip = dl.zip;
        github = { repo: dl.fullName, ref: dl.ref, htmlUrl: dl.htmlUrl, commitUrl: dl.sha ? `${dl.htmlUrl}/tree/${dl.sha}` : dl.htmlUrl };
      } else if ("blobKey" in input) {
        step("Reading the uploaded archive");
        const bytes = await getObject(input.blobKey, { fresh: true });
        if (!bytes) throw new Error("The uploaded file could not be read back from storage. Upload it again.");
        zip = bytes;
      } else {
        zip = input.data;
      }
      step("Unpacking files");
      const archive = readZip(zip);
      const out = await withinBudget(auditFiles(archive, { source: input.source }, step), started);
      ({ checks, meta, stored, screenshots } = out);
      if (github) meta.github = github;
    }

    // Files and screenshots go to private Blob storage when it's connected; otherwise inline in Postgres.
    const useBlob = blobEnabled();
    const fileRows = stored.map((f) => ({ auditId: audit.id, path: f.path, contentType: f.contentType, size: f.data.length, blobKey: null as string | null, data: new Uint8Array(f.data) as Uint8Array<ArrayBuffer> | null }));
    const shotRows = screenshots.map((s) => ({ auditId: audit.id, kind: s.kind, width: s.width, height: s.height, blobKey: null as string | null, data: new Uint8Array(s.data) as Uint8Array<ArrayBuffer> | null }));
    if (useBlob && (fileRows.length || shotRows.length)) {
      step("Saving files to storage");
      await pool(fileRows, 16, async (r) => {
        r.blobKey = await putObject(`${auditPrefix(audit.id)}files/${r.path}`, r.data!, r.contentType);
        r.data = null;
      });
      await pool(shotRows, 2, async (r) => {
        r.blobKey = await putObject(`${auditPrefix(audit.id)}shots/${r.kind}.jpg`, r.data!, "image/jpeg");
        r.data = null;
      });
    }

    // Scoring is the last timed step, so every earlier step (including saving) has its real duration.
    step("Scoring");
    const score = computeScore(checks);
    steps[steps.length - 1].ms = Math.round(performance.now() - stepStart);
    meta.steps = steps;

    await prisma.$transaction([
      ...(fileRows.length ? [prisma.auditFile.createMany({ data: fileRows })] : []),
      ...(shotRows.length ? [prisma.screenshot.createMany({ data: shotRows })] : []),
      prisma.audit.update({
        where: { id: audit.id },
        data: {
          status: "COMPLETED",
          score: score.score,
          checks: checks as unknown as Prisma.InputJsonValue,
          meta: meta as unknown as Prisma.InputJsonValue,
          finalUrl,
          label: input.source === "GITHUB" && meta.github ? meta.github.repo : label,
          durationMs: Math.round(performance.now() - started),
        },
      }),
    ]);
    emit({ type: "done", id: audit.id, score: score.score });
  } catch (err) {
    const message = (err as Error).message || "The audit failed.";
    // Record the failure first: cleanup talks to storage, and a slow storage call must never delay the result.
    await prisma.audit.update({ where: { id: audit.id }, data: { status: "FAILED", error: message, durationMs: Math.round(performance.now() - started) } });
    emit({ type: "error", message, id: audit.id });
    await Promise.race([deleteByPrefix([auditPrefix(audit.id)]).catch(() => {}), new Promise((r) => setTimeout(r, 15_000))]);
  }
  return audit.id;
}
