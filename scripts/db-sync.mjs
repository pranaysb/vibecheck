#!/usr/bin/env node
// Runs before `next build` on Vercel (package.json "vercel-build"). Applies schema changes from
// prisma/schema.prisma to the deployment's database, additive changes only: without --accept-data-loss,
// Prisma refuses anything that would drop or alter data, and this script then fails the build, so
// production keeps running the previous deployment instead of losing data. Elsewhere it does nothing.
import { execSync } from "node:child_process";

const env = process.env.VERCEL_ENV;
if (!process.env.VERCEL || (env !== "production" && env !== "preview")) {
  console.log("db-sync: not a Vercel production/preview build, skipping");
  process.exit(0);
}
// Schema changes need a direct connection; Neon's pooled URL runs through PgBouncer.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!url) {
  console.error("db-sync: no database URL in this environment");
  process.exit(1);
}
try {
  execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
  console.log(`db-sync: ${env} database schema is up to date`);
} catch {
  console.error("db-sync: the schema change was refused (it would lose data, or the database is unreachable). Nothing was changed; the build stops here.");
  process.exit(1);
}
