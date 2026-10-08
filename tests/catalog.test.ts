import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CATALOG } from "../src/lib/audit/catalog";

test("every check id the engine can emit is documented in the methodology catalog, and vice versa", () => {
  const dir = join(__dirname, "../src/lib/audit");
  const emitted = new Set<string>();
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "catalog.ts")) {
    for (const m of readFileSync(join(dir, f), "utf8").matchAll(/\bid: "([a-z0-9]+-[a-z0-9-]+)"/g)) emitted.add(m[1]);
  }
  const documented = new Set(CATALOG.map((c) => c.id));
  assert.deepEqual([...emitted].filter((id) => !documented.has(id)), [], "emitted but undocumented");
  assert.deepEqual([...documented].filter((id) => !emitted.has(id)), [], "documented but never emitted");
  assert.equal(documented.size, CATALOG.length, "duplicate catalog ids");
});
