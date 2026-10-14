import { Sandbox } from "@vercel/sandbox";
import { strFromU8 } from "fflate";
import type { ArchiveFile } from "./archive";
import { isEnvFile } from "./secrets";
import type { ProgressFn } from "./types";

/**
 * Builds an uploaded project inside a Vercel Sandbox (a throwaway Firecracker microVM), so source-only
 * React/Vite/Next projects can be rendered and audited. Nothing from VibeCheck's own environment is passed in,
 * real .env files are never copied, and the network is narrowed per phase:
 *   install → package registries only, build → registries + font hosts, run → no outbound network at all.
 */

const APP_DIR = "/vercel/sandbox/app";
const PORT = 3000;
/** Directories a build commonly writes a static site to, in the order we prefer them. */
export const OUTPUT_DIRS = ["out", "dist", "build", ".output/public", "_site", "dist/client", "build/client", "storybook-static"];
const PREBUILT_DIRS = new Set(["dist", "build", "out", "_site"]);

const REGISTRIES = [
  "registry.npmjs.org", "*.npmjs.org", "registry.yarnpkg.com", "repo.yarnpkg.com", "*.yarnpkg.com",
  "github.com", "codeload.github.com", "objects.githubusercontent.com", "*.githubusercontent.com",
  "binaries.prisma.sh", "nodejs.org",
];
const BUILD_EXTRA = ["fonts.googleapis.com", "fonts.gstatic.com"];

const LIMITS = { installMs: 120_000, buildMs: 120_000, startMs: 30_000, outputFiles: 3000, outputBytes: 60 * 1024 * 1024, fileBytes: 15 * 1024 * 1024 };

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface BuildPlan {
  pm: PackageManager;
  hasStart: boolean;
  framework: string | null;
}

/** Sandbox builds need Vercel credentials: OIDC on Vercel (or a pulled dev token), or an access token. */
export function sandboxAvailable(): boolean {
  if (process.env.SANDBOX_BUILDS === "off") return false;
  return Boolean(process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL_TOKEN);
}

/**
 * Decides whether a project needs building. Returns null when there's nothing to build (no root package.json
 * with a build script, or not a website) or when the upload already contains its build output.
 */
export function buildPlan(files: ArchiveFile[], siteRoot: string | null, unbuilt: boolean): BuildPlan | null {
  const pkgFile = files.find((f) => f.path === "package.json");
  if (!pkgFile) return null;
  let pkg: { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(strFromU8(pkgFile.data));
  } catch {
    return null;
  }
  if (!pkg.scripts?.build) return null;
  if (siteRoot !== null && PREBUILT_DIRS.has(siteRoot) && !unbuilt) return null;

  const paths = new Set(files.map((f) => f.path));
  const pm: PackageManager = paths.has("pnpm-lock.yaml") ? "pnpm" : paths.has("yarn.lock") ? "yarn" : paths.has("bun.lock") || paths.has("bun.lockb") ? "bun" : "npm";
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const framework = ["next", "astro", "@sveltejs/kit", "nuxt", "@remix-run/dev", "@react-router/dev", "gatsby", "vite", "react-scripts", "@angular/core"].find((d) => d in deps) ?? null;
  // Libraries and CLIs have build scripts too; only build what looks like a website.
  if (!framework && siteRoot === null) return null;
  return { pm, hasStart: Boolean(pkg.scripts.start), framework };
}

const INSTALL: Record<PackageManager, string> = {
  npm: "npm install --no-audit --no-fund --loglevel=error",
  // pnpm 10+ blocks dependency build scripts until approved; inside a throwaway microVM that approval is safe.
  pnpm: "pnpm install --reporter=append-only --config.dangerously-allow-all-builds=true",
  yarn: "COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack yarn install",
  bun: "bun install",
};
const RUN: Record<PackageManager, string> = { npm: "npm run", pnpm: "pnpm run", yarn: "COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack yarn run", bun: "bun run" };

export type BuildOutcome =
  | { kind: "static"; dir: string; files: ArchiveFile[]; log: string[]; ms: number }
  | { kind: "server"; url: string; log: string[]; ms: number }
  | { kind: "failed"; phase: "install" | "build" | "output"; message: string; log: string[]; ms: number }
  | { kind: "unavailable"; message: string };

export interface SandboxBuild {
  outcome: BuildOutcome;
  /** Stops and deletes the microVM. Always call it, after auditing a server outcome. */
  dispose: () => Promise<void>;
}

function tail(text: string, lines = 25): string[] {
  return text
    .replace(/\x1b\[[0-9;]*m/g, "")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean)
    .slice(-lines);
}

export async function buildInSandbox(files: ArchiveFile[], plan: BuildPlan, step: ProgressFn): Promise<SandboxBuild> {
  const started = Date.now();
  let sandbox: Sandbox;
  try {
    sandbox = await Sandbox.create({
      resources: { vcpus: 4 },
      timeout: 6 * 60_000,
      ports: [PORT],
      persistent: false,
      networkPolicy: { allow: REGISTRIES },
      env: { CI: "1", NEXT_TELEMETRY_DISABLED: "1", ASTRO_TELEMETRY_DISABLED: "1", NUXT_TELEMETRY_DISABLED: "1", DO_NOT_TRACK: "1" },
      tags: { app: "vibecheck", purpose: "audit-build" },
    });
  } catch (err) {
    return { outcome: { kind: "unavailable", message: `The build sandbox could not be started (${(err as Error).message.split("\n")[0]}).` }, dispose: async () => {} };
  }
  const dispose = async () => {
    await sandbox.stop().catch(() => {});
    await sandbox.delete().catch(() => {});
  };
  const ms = () => Date.now() - started;
  const sh = async (cmd: string, timeoutMs: number) => {
    const r = await sandbox.runCommand("bash", ["-lc", `cd ${APP_DIR} && ${cmd}`], { timeoutMs });
    return { ok: r.exitCode === 0, exitCode: r.exitCode, out: await r.output("both").catch(() => "") };
  };

  try {
    // Copy the project in, minus real env files. Batches keep each upload request a reasonable size.
    const toWrite = files.filter((f) => !isEnvFile(f.path));
    let batch: { path: string; content: Uint8Array }[] = [];
    let size = 0;
    for (const f of toWrite) {
      batch.push({ path: `${APP_DIR}/${f.path}`, content: f.data });
      size += f.data.length;
      if (size > 8 * 1024 * 1024 || batch.length >= 400) {
        await sandbox.writeFiles(batch);
        batch = [];
        size = 0;
      }
    }
    if (batch.length) await sandbox.writeFiles(batch);

    step(`Installing dependencies with ${plan.pm} in an isolated Vercel Sandbox`);
    const install = await sh(`${INSTALL[plan.pm]} 2>&1`, LIMITS.installMs);
    if (!install.ok) {
      return { outcome: { kind: "failed", phase: "install", message: `\`${INSTALL[plan.pm].replace(/^\S+=\S+ /, "")}\` exited with code ${install.exitCode} (time limit ${LIMITS.installMs / 1000}s).`, log: tail(install.out), ms: ms() }, dispose };
    }

    step(`Building the project (${RUN[plan.pm].replace(/^\S+=\S+ /, "")} build)`);
    await sandbox.updateNetworkPolicy({ allow: [...REGISTRIES, ...BUILD_EXTRA] });
    const build = await sh(`${RUN[plan.pm]} build 2>&1`, LIMITS.buildMs);
    if (!build.ok) {
      return { outcome: { kind: "failed", phase: "build", message: `The build script exited with code ${build.exitCode} (time limit ${LIMITS.buildMs / 1000}s).`, log: tail(build.out), ms: ms() }, dispose };
    }
    const log = tail(build.out, 15);

    // From here on the project's own code runs with no outbound network.
    await sandbox.updateNetworkPolicy("deny-all");

    const found = await sh(`for d in ${OUTPUT_DIRS.join(" ")}; do [ -f "$d/index.html" ] && echo "$d" && break; done`, 10_000);
    const dir = found.out.trim().split("\n")[0];
    if (dir && OUTPUT_DIRS.includes(dir)) {
      step(`Collecting the built site from ${dir}/`);
      const listing = await sh(`find ${dir} -type f -size -${LIMITS.fileBytes / 1024}k | head -n ${LIMITS.outputFiles}`, 20_000);
      const paths = listing.out.split("\n").map((p) => p.trim()).filter((p) => p.startsWith(`${dir}/`) && !p.includes(".."));
      const out: ArchiveFile[] = [];
      let total = 0;
      let i = 0;
      await Promise.all(Array.from({ length: 8 }, async () => {
        while (i < paths.length && total < LIMITS.outputBytes) {
          const p = paths[i++];
          const buf = await sandbox.readFileToBuffer({ path: `${APP_DIR}/${p}` }).catch(() => null);
          if (!buf) continue;
          total += buf.length;
          out.push({ path: p, data: new Uint8Array(buf) });
        }
      }));
      await dispose();
      return { outcome: { kind: "static", dir, files: out, log, ms: ms() }, dispose: async () => {} };
    }

    if (!plan.hasStart) {
      return { outcome: { kind: "failed", phase: "output", message: `The build succeeded but produced no index.html in ${OUTPUT_DIRS.slice(0, 4).join(", ")}…, and package.json has no start script to serve it.`, log, ms: ms() }, dispose };
    }

    step("Starting the built app (no outbound network)");
    await sandbox.runCommand({
      cmd: "bash",
      args: ["-lc", `cd ${APP_DIR} && PORT=${PORT} HOST=0.0.0.0 HOSTNAME=0.0.0.0 NODE_ENV=production ${RUN[plan.pm]} start > /tmp/start.log 2>&1`],
      detached: true,
    });
    const up = await sh(`for i in $(seq 1 ${LIMITS.startMs / 1000}); do code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:${PORT}/); [ "$code" != "000" ] && echo "$code" && exit 0; sleep 1; done; tail -n 25 /tmp/start.log; exit 1`, LIMITS.startMs + 10_000);
    if (!up.ok) {
      return { outcome: { kind: "failed", phase: "output", message: `The build succeeded, but \`start\` didn't answer on port ${PORT} within ${LIMITS.startMs / 1000}s. VibeCheck sets PORT=${PORT}; apps that hardcode another port can't be served.`, log: tail(up.out), ms: ms() }, dispose };
    }
    return { outcome: { kind: "server", url: sandbox.domain(PORT), log, ms: ms() }, dispose };
  } catch (err) {
    await dispose();
    return { outcome: { kind: "unavailable", message: `The build sandbox stopped unexpectedly (${(err as Error).message.split("\n")[0]}).` }, dispose: async () => {} };
  }
}
