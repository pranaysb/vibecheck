#!/usr/bin/env node
// Points the test run at its own database so tests never touch the app's data (they create and delete rows,
// and the retention test runs the real cleanup job). CI already provides a throwaway database.
// Locally: TEST_DATABASE_URL if set, otherwise DATABASE_URL with "_test" appended to the database name.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function fromDotenv() {
  try {
    return readFileSync(".env", "utf8").match(/^DATABASE_URL=["']?([^"'\n]+)/m)?.[1];
  } catch {
    return undefined;
  }
}

const base = process.env.DATABASE_URL ?? fromDotenv();
let url = process.env.TEST_DATABASE_URL;
if (!url && process.env.CI) url = base;
if (!url && base) {
  const u = new URL(base);
  u.pathname = u.pathname.replace(/\/?([^/]+)$/, (_, db) => `/${db.endsWith("_test") ? db : `${db}_test`}`);
  url = u.toString();
}
const env = { ...process.env, ...(url ? { DATABASE_URL: url } : {}) };
if (url && !process.env.CI) execSync("npx prisma db push --skip-generate --accept-data-loss", { env, stdio: "ignore" });
const files = process.argv.slice(2).length ? process.argv.slice(2) : ["tests/*.test.ts"];
execSync(`npx tsx --test ${files.join(" ")}`, { env, stdio: "inherit" });
