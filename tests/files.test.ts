import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import { readZip, normalizePath, findSiteRoot, LIMITS } from "../src/lib/audit/archive";
import { findSecrets, isEnvFile, envAssignments } from "../src/lib/audit/secrets";
import { parsePackageLock, parsePnpmLock, parseYarnLock, parseRequirements, parseTomlLock } from "../src/lib/audit/osv";
import { parseRepo } from "../src/lib/audit/github";

const jwt = (payload: object) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.c2lnbmF0dXJlc2lnbmF0dXJlc2ln`;

describe("secrets", () => {
  test("detects real credential shapes and masks them", () => {
    const text = [
      `const a = "AKIAIOSFODNN7EXAMPLE";`,
      `stripe("sk_live_${"a".repeat(24)}")`,
      `const gh = "ghp_${"A".repeat(36)}"`,
      `-----BEGIN RSA PRIVATE KEY-----\n${"MIIEowIBAAKCAQEAu1SU1LfVLPHCozMxH2Mo4lgOEePzNm0tRgeLezV6ffAt0gun".repeat(1)}\n${"VTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u+qKhbwKfBstIs+bMY2Zkp18gnTxK".repeat(1)}\n-----END RSA PRIVATE KEY-----`,
      `DATABASE_URL="postgres://admin:s3cr3tpw@db.prod.example.com:5432/app"`,
    ].join("\n");
    const hits = findSecrets(text);
    assert.deepEqual(hits.map((h) => h.kind).sort(), ["AWS access key ID", "Database URL with password", "GitHub token", "Private key", "Stripe live secret key"].sort());
    const stripe = hits.find((h) => h.kind.startsWith("Stripe"))!;
    assert.equal(stripe.line, 2);
    assert.ok(!stripe.sample.includes("a".repeat(24)), "full secret must never be stored");
  });

  test("PEM headers in library code are not leaks; real key blocks are", () => {
    // Real excerpt from jose's PKCS#8 parser as bundled by Clerk; this used to be reported as critical.
    const jose = `async function eH(e,t,r){if("string"!=typeof e||0!==e.indexOf("-----BEGIN PRIVATE KEY-----"))throw TypeError('"pkcs8" must be PKCS#8 formatted string');return eT(/(?:-----(?:BEGIN|END) PRIVATE KEY-----|\\s)/g,"pkcs8",e,t,r)}`;
    assert.equal(findSecrets(jose).length, 0);
    const body = Array.from({ length: 4 }, () => "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7" + "x".repeat(12)).join("\n");
    assert.equal(findSecrets(`-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`)[0]?.kind, "Private key", "real newlines");
    assert.equal(findSecrets(`{"key":"-----BEGIN RSA PRIVATE KEY-----\\n${body.replace(/\n/g, "\\n")}\\n-----END RSA PRIVATE KEY-----"}`)[0]?.kind, "Private key", "escaped \\n in JSON");
  });

  test("Supabase: service_role JWT is flagged, anon key is not", () => {
    assert.equal(findSecrets(`createClient(url, "${jwt({ role: "anon", iss: "supabase" })}")`).length, 0);
    const hits = findSecrets(`createClient(url, "${jwt({ role: "service_role", iss: "supabase" })}")`);
    assert.equal(hits[0]?.kind, "Supabase service_role key");
  });

  test("placeholder and localhost database URLs are ignored", () => {
    assert.equal(findSecrets(`postgres://user:password@localhost:5432/db`).length, 0);
    assert.equal(findSecrets(`postgres://postgres:\${PASSWORD}@db.example.com/app`).length, 0);
  });

  test("env file detection excludes templates", () => {
    assert.ok(isEnvFile(".env"));
    assert.ok(isEnvFile("apps/web/.env.production.local"));
    assert.ok(!isEnvFile(".env.example"));
    assert.ok(!isEnvFile("config/.env.sample"));
    assert.ok(!isEnvFile("environment.ts"));
    assert.deepEqual(envAssignments("# c\nA=1\nexport B = two\nC=\nD=changeme\nE=<your-key>"), ["A", "B"]);
  });
});

describe("archive", () => {
  test("rejects path traversal and absolute paths", () => {
    assert.equal(normalizePath("../etc/passwd"), null);
    assert.equal(normalizePath("a/../../b"), null);
    assert.equal(normalizePath("/abs"), null);
    assert.equal(normalizePath("C:\\win"), null);
    assert.equal(normalizePath("./a//b/./c"), "a/b/c");
  });

  test("strips a single wrapper folder and skips vendored dirs", () => {
    const zip = zipSync({
      "repo-abc123/index.html": strToU8("<h1>x</h1>"),
      "repo-abc123/src/app.js": strToU8("1"),
      "repo-abc123/node_modules/left-pad/index.js": strToU8("x"),
      "repo-abc123/.git/HEAD": strToU8("ref: refs/heads/main"),
      "__MACOSX/._index.html": strToU8("junk"),
    });
    const a = readZip(zip);
    assert.deepEqual(a.files.map((f) => f.path).sort(), ["index.html", "src/app.js"]);
    assert.ok(a.hasNodeModules);
    assert.ok(a.hasGitDir);
  });

  test("enforces the file-count limit", () => {
    const many: Record<string, Uint8Array> = {};
    for (let i = 0; i <= LIMITS.maxFiles; i++) many[`f${i}.txt`] = strToU8("x");
    assert.throws(() => readZip(zipSync(many)), /more than/);
  });

  test("garbage input gives a readable error", () => {
    assert.throws(() => readZip(strToU8("not a zip")), /not a readable \.zip/);
  });

  test("finds the site root, preferring build output", () => {
    assert.equal(findSiteRoot(["index.html", "dist/index.html"]), "");
    assert.equal(findSiteRoot(["src/main.ts", "public/index.html", "dist/index.html"]), "dist");
    assert.equal(findSiteRoot(["packages/web/site/index.html"]), "packages/web/site");
    assert.equal(findSiteRoot(["README.md"]), null);
  });
});

describe("lockfile parsers", () => {
  test("package-lock v3", () => {
    const lock = JSON.stringify({ lockfileVersion: 3, packages: { "": { name: "app" }, "node_modules/lodash": { version: "4.17.15" }, "node_modules/a/node_modules/@scope/b": { version: "1.0.0" }, "node_modules/linked": { link: true } } });
    assert.deepEqual(parsePackageLock(lock), [
      { name: "lodash", version: "4.17.15", ecosystem: "npm" },
      { name: "@scope/b", version: "1.0.0", ecosystem: "npm" },
    ]);
  });
  test("package-lock v1", () => {
    const lock = JSON.stringify({ lockfileVersion: 1, dependencies: { express: { version: "4.16.0", dependencies: { qs: { version: "6.5.1" } } } } });
    assert.deepEqual(parsePackageLock(lock).map((p) => `${p.name}@${p.version}`), ["express@4.16.0", "qs@6.5.1"]);
  });
  test("pnpm, yarn, requirements, poetry", () => {
    assert.deepEqual(parsePnpmLock("packages:\n\n  /lodash@4.17.15:\n    resolution: x\n  '@babel/core@7.20.0':\n    resolution: y\n").map((p) => `${p.name}@${p.version}`), ["lodash@4.17.15", "@babel/core@7.20.0"]);
    assert.deepEqual(parseYarnLock(`lodash@^4.17.0:\n  version "4.17.15"\n  resolved "x"\n\n"@types/node@^20":\n  version "20.1.0"\n`).map((p) => `${p.name}@${p.version}`), ["lodash@4.17.15", "@types/node@20.1.0"]);
    assert.deepEqual(parseRequirements("Django==3.2.0 # web\nrequests>=2\nflask[async]==2.0.1").map((p) => `${p.name}@${p.version}`), ["django@3.2.0", "flask@2.0.1"]);
    assert.deepEqual(parseTomlLock(`[[package]]\nname = "Jinja2"\nversion = "2.10"\n`).map((p) => `${p.name}@${p.version}`), ["jinja2@2.10"]);
  });
});

describe("GitHub input parsing", () => {
  test("accepts common forms", () => {
    assert.deepEqual(parseRepo("vercel/next.js"), { owner: "vercel", repo: "next.js", ref: undefined });
    assert.deepEqual(parseRepo("https://github.com/vercel/next.js.git"), { owner: "vercel", repo: "next.js", ref: undefined });
    assert.deepEqual(parseRepo("github.com/a/b/tree/feature/x"), { owner: "a", repo: "b", ref: "feature/x" });
    assert.throws(() => parseRepo("https://gitlab.com/a/b"));
    assert.throws(() => parseRepo("../../etc"));
  });
});
