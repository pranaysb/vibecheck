/** Dependency vulnerability lookup against the public OSV.dev database (https://osv.dev). */

export type Ecosystem = "npm" | "PyPI";

export interface Pkg {
  name: string;
  version: string;
  ecosystem: Ecosystem;
}

export interface Vuln {
  id: string;
  pkg: Pkg;
  summary: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "UNKNOWN";
  fixed?: string;
}

/** package-lock.json v1, v2 and v3. */
export function parsePackageLock(text: string): Pkg[] {
  const lock = JSON.parse(text);
  const out: Pkg[] = [];
  if (lock.packages) {
    for (const [path, info] of Object.entries<{ version?: string; link?: boolean }>(lock.packages)) {
      if (!path || info.link || !info.version) continue;
      const name = path.slice(path.lastIndexOf("node_modules/") + "node_modules/".length);
      out.push({ name, version: info.version, ecosystem: "npm" });
    }
  } else if (lock.dependencies) {
    const walk = (deps: Record<string, { version: string; dependencies?: object }>) => {
      for (const [name, info] of Object.entries(deps)) {
        if (info.version && /^\d/.test(info.version)) out.push({ name, version: info.version, ecosystem: "npm" });
        if (info.dependencies) walk(info.dependencies as typeof deps);
      }
    };
    walk(lock.dependencies);
  }
  return out;
}

/** pnpm-lock.yaml (v5–v9): package keys like `/name@1.2.3:` or `name@1.2.3(peer):`. */
export function parsePnpmLock(text: string): Pkg[] {
  const out: Pkg[] = [];
  const re = /^ {2}['"]?\/?((?:@[^/@\s]+\/)?[^@/\s'"]+)[@/](\d+\.\d+\.\d+[^:('"\s]*)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ name: m[1], version: m[2], ecosystem: "npm" });
  return out;
}

/** yarn.lock v1 and berry. */
export function parseYarnLock(text: string): Pkg[] {
  const out: Pkg[] = [];
  const blocks = text.split(/\n(?=\S)/);
  for (const block of blocks) {
    const header = block.split("\n")[0];
    const name = header.match(/^"?((?:@[^/@"]+\/)?[^@"]+)@/)?.[1];
    const version = block.match(/\n\s+version:?\s+"?([^"\s]+)"?/)?.[1];
    if (name && version && /^\d/.test(version)) out.push({ name, version, ecosystem: "npm" });
  }
  return out;
}

/** requirements.txt: only exact `==` pins can be resolved to a version. */
export function parseRequirements(text: string): Pkg[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, "").trim())
    .map((l) => l.match(/^([A-Za-z0-9._-]+)(?:\[[^\]]*\])?\s*==\s*([A-Za-z0-9.+!-]+)/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ name: m[1].toLowerCase(), version: m[2], ecosystem: "PyPI" as const }));
}

/** poetry.lock / uv.lock: [[package]] tables with name and version. */
export function parseTomlLock(text: string): Pkg[] {
  const out: Pkg[] = [];
  for (const block of text.split(/\[\[package\]\]/).slice(1)) {
    const name = block.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1];
    const version = block.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1];
    if (name && version) out.push({ name: name.toLowerCase(), version, ecosystem: "PyPI" });
  }
  return out;
}

export function dedupe(pkgs: Pkg[]): Pkg[] {
  const seen = new Map<string, Pkg>();
  for (const p of pkgs) seen.set(`${p.ecosystem}:${p.name}@${p.version}`, p);
  return [...seen.values()];
}

const OSV = "https://api.osv.dev/v1";

async function osvFetch(path: string, init?: RequestInit) {
  const res = await fetch(OSV + path, { ...init, signal: AbortSignal.timeout(15_000), headers: { "content-type": "application/json" } });
  if (!res.ok) throw new Error(`OSV.dev answered ${res.status}`);
  return res.json();
}

export async function queryOsv(pkgs: Pkg[], maxDetails = 60): Promise<{ vulns: Vuln[]; queried: number; truncatedDetails: boolean }> {
  const list = pkgs.slice(0, 3000);
  const hits: { pkg: Pkg; id: string }[] = [];
  for (let i = 0; i < list.length; i += 1000) {
    const batch = list.slice(i, i + 1000);
    const data = await osvFetch("/querybatch", {
      method: "POST",
      body: JSON.stringify({ queries: batch.map((p) => ({ package: { name: p.name, ecosystem: p.ecosystem }, version: p.version })) }),
    });
    (data.results as { vulns?: { id: string }[] }[]).forEach((r, j) => r.vulns?.forEach((v) => hits.push({ pkg: batch[j], id: v.id })));
  }

  const ids = [...new Set(hits.map((h) => h.id))];
  const details = new Map<string, { summary: string; severity: Vuln["severity"]; affected: { package: { name: string }; ranges?: { events: Record<string, string>[] }[] }[] }>();
  const toFetch = ids.slice(0, maxDetails);
  for (let i = 0; i < toFetch.length; i += 8) {
    await Promise.all(
      toFetch.slice(i, i + 8).map(async (id) => {
        try {
          const v = await osvFetch(`/vulns/${encodeURIComponent(id)}`);
          const sev = String(v.database_specific?.severity ?? "UNKNOWN").toUpperCase();
          details.set(id, {
            summary: v.summary ?? v.details?.slice(0, 140) ?? id,
            severity: (["CRITICAL", "HIGH", "MODERATE", "LOW"].includes(sev) ? sev : "UNKNOWN") as Vuln["severity"],
            affected: v.affected ?? [],
          });
        } catch {
          /* leave as unknown */
        }
      })
    );
  }

  // OSV lists GHSA and CVE aliases separately; keep one entry per package+id.
  const vulns: Vuln[] = hits.map(({ pkg, id }) => {
    const d = details.get(id);
    const fixed = d?.affected
      .find((a) => a.package.name.toLowerCase() === pkg.name.toLowerCase())
      ?.ranges?.flatMap((r) => r.events)
      .map((e) => e.fixed)
      .filter(Boolean)
      .pop();
    return { id, pkg, summary: d?.summary ?? "See advisory", severity: d?.severity ?? "UNKNOWN", fixed };
  });
  return { vulns, queried: list.length, truncatedDetails: ids.length > maxDetails };
}
