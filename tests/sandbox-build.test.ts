import { test } from "node:test";
import assert from "node:assert/strict";
import { strToU8 } from "fflate";
import { buildPlan } from "../src/lib/audit/sandbox-build";

const f = (path: string, content = "") => ({ path, data: strToU8(content) });
const pkg = (o: object) => f("package.json", JSON.stringify(o));

test("builds source-only web projects and picks the package manager from the lockfile", () => {
  const vite = buildPlan([pkg({ scripts: { build: "vite build" }, devDependencies: { vite: "^7" } }), f("index.html"), f("pnpm-lock.yaml")], "", true);
  assert.deepEqual(vite, { pm: "pnpm", hasStart: false, framework: "vite" });
  const next = buildPlan([pkg({ scripts: { build: "next build", start: "next start" }, dependencies: { next: "15" } }), f("yarn.lock")], null, false);
  assert.deepEqual(next, { pm: "yarn", hasStart: true, framework: "next" });
  assert.equal(buildPlan([pkg({ scripts: { build: "x" }, dependencies: { astro: "5" } }), f("bun.lock")], null, false)?.pm, "bun");
});

test("skips projects with nothing to build, libraries, and uploads that already contain build output", () => {
  assert.equal(buildPlan([f("index.html")], "", false), null, "no package.json");
  assert.equal(buildPlan([pkg({ scripts: { test: "node --test" } })], null, false), null, "no build script");
  assert.equal(buildPlan([pkg({ scripts: { build: "tsc" }, devDependencies: { typescript: "5" } })], null, false), null, "a library, not a website");
  assert.equal(buildPlan([pkg({ scripts: { build: "vite build" }, devDependencies: { vite: "7" } }), f("dist/index.html")], "dist", false), null, "dist/ already built");
  assert.equal(buildPlan([f("package.json", "{not json")], null, false), null, "unreadable package.json");
});
