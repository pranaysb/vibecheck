import type { AuditSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { readZip } from "./archive";
import { auditFiles, type StoredFile } from "./files-audit";
import { downloadRepo, parseRepo } from "./github";
import { computeScore, type AuditMeta, type CheckResult } from "./types";
import { auditUrl, normalizeUrl } from "./url-audit";

export type AuditInput =
  | { source: "URL"; url: string }
  | { source: "ZIP"; filename: string; data: Uint8Array }
  | { source: "GITHUB"; repo: string };

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
      const out = await auditUrl(input.url, step);
      ({ checks, meta, finalUrl, screenshots } = out);
    } else {
      let zip: Uint8Array;
      let github: AuditMeta["github"];
      if (input.source === "GITHUB") {
        step("Downloading the repository from GitHub");
        const dl = await downloadRepo(parseRepo(input.repo));
        zip = dl.zip;
        github = { repo: dl.fullName, ref: dl.ref, htmlUrl: dl.htmlUrl, commitUrl: `${dl.htmlUrl}/tree/${dl.sha}` };
      } else {
        zip = input.data;
      }
      step("Unpacking files");
      const archive = readZip(zip);
      const out = await auditFiles(archive, { source: input.source }, step);
      ({ checks, meta, stored, screenshots } = out);
      if (github) meta.github = github;
    }

    step("Scoring");
    const score = computeScore(checks);
    steps[steps.length - 1].ms = Math.round(performance.now() - stepStart);
    meta.steps = steps;

    await prisma.$transaction([
      ...(stored.length
        ? [prisma.auditFile.createMany({ data: stored.map((f) => ({ auditId: audit.id, path: f.path, contentType: f.contentType, size: f.data.length, data: new Uint8Array(f.data) })) })]
        : []),
      ...(screenshots.length ? [prisma.screenshot.createMany({ data: screenshots.map((s) => ({ auditId: audit.id, kind: s.kind, width: s.width, height: s.height, data: new Uint8Array(s.data) })) })] : []),
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
    await prisma.audit.update({ where: { id: audit.id }, data: { status: "FAILED", error: message, durationMs: Math.round(performance.now() - started) } });
    emit({ type: "error", message, id: audit.id });
  }
  return audit.id;
}
