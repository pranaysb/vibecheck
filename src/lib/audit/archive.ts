import { unzipSync } from "fflate";

export const LIMITS = {
  maxFiles: 5000,
  maxUncompressedBytes: 120 * 1024 * 1024,
  maxFileBytes: 15 * 1024 * 1024,
};

export interface ArchiveFile {
  path: string;
  data: Uint8Array;
}

export interface Archive {
  files: ArchiveFile[];
  /** Files skipped because they live in dependency/VCS folders. */
  skippedVendored: number;
  hasNodeModules: boolean;
  hasGitDir: boolean;
}

const VENDORED = /(^|\/)(node_modules|\.git|\.next|\.nuxt|\.svelte-kit|\.vercel|\.turbo|__pycache__|\.venv|venv|vendor\/bundle)\//;

export function normalizePath(raw: string): string | null {
  const p = raw.replace(/\\/g, "/");
  if (p.startsWith("/") || /^[a-z]:/i.test(p)) return null;
  const parts: string[] = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") return null;
    parts.push(seg);
  }
  return parts.length ? parts.join("/") : null;
}

/** Unzips with hard limits, rejects path traversal, and strips a single wrapping folder (as GitHub zipballs have). */
export function readZip(buf: Uint8Array): Archive {
  let entries = 0;
  let total = 0;
  let skippedVendored = 0;
  let hasNodeModules = false;
  let hasGitDir = false;
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(buf, {
      filter: (f) => {
        if (f.name.endsWith("/")) return false;
        if (/(^|\/)node_modules\//.test(f.name)) hasNodeModules = true;
        if (/(^|\/)\.git\//.test(f.name)) hasGitDir = true;
        if (VENDORED.test(f.name) || /(^|\/)(__MACOSX|\.DS_Store)/.test(f.name)) {
          skippedVendored++;
          return false;
        }
        if (++entries > LIMITS.maxFiles) throw new Error(`The archive has more than ${LIMITS.maxFiles} files (excluding node_modules and .git).`);
        if (f.originalSize > LIMITS.maxFileBytes) return false;
        total += f.originalSize;
        if (total > LIMITS.maxUncompressedBytes) throw new Error(`The archive expands to more than ${LIMITS.maxUncompressedBytes / 1024 / 1024} MB.`);
        return true;
      },
    });
  } catch (err) {
    const msg = (err as Error).message;
    if (/archive has more|expands to more/.test(msg)) throw err;
    throw new Error("That file is not a readable .zip archive.");
  }

  let files: ArchiveFile[] = [];
  for (const [name, data] of Object.entries(unzipped)) {
    const path = normalizePath(name);
    if (path) files.push({ path, data });
  }
  // Strip a single top-level directory shared by every file.
  const tops = new Set(files.map((f) => f.path.split("/")[0]));
  if (tops.size === 1 && files.every((f) => f.path.includes("/"))) {
    const prefix = [...tops][0] + "/";
    files = files.map((f) => ({ ...f, path: f.path.slice(prefix.length) }));
  }
  if (!files.length) throw new Error("The archive is empty.");
  return { files, skippedVendored, hasNodeModules, hasGitDir };
}

const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json",
  map: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  txt: "text/plain; charset=utf-8",
  md: "text/plain; charset=utf-8",
  xml: "application/xml",
  webmanifest: "application/manifest+json",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  pdf: "application/pdf",
  wasm: "application/wasm",
};

export function contentTypeFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return TYPES[ext] ?? (isTextPath(path) ? "text/plain; charset=utf-8" : "application/octet-stream");
}

const TEXT_EXT =
  /\.(html?|css|scss|sass|less|m?[jt]sx?|cjs|cts|mts|json|jsonc|md|mdx|txt|ya?ml|toml|ini|cfg|conf|env|xml|svg|vue|svelte|astro|py|rb|go|rs|java|kt|swift|php|sh|bash|zsh|sql|prisma|graphql|gql|lock|gitignore|dockerignore|editorconfig|properties|gradle|tf|hcl)$/i;

export function isTextPath(path: string): boolean {
  const name = path.split("/").pop() ?? "";
  return TEXT_EXT.test(path) || /^(\.env.*|Dockerfile|Makefile|Procfile|LICENSE|README|\.gitignore|\.npmrc)$/i.test(name);
}

export function isProbablyBinary(data: Uint8Array): boolean {
  const n = Math.min(data.length, 4096);
  for (let i = 0; i < n; i++) if (data[i] === 0) return true;
  return false;
}

/** Picks the folder to render: the shallowest index.html, preferring common build output dirs. */
export function findSiteRoot(paths: string[]): string | null {
  const preferred = ["", "dist", "build", "out", "_site", "docs", "public", "site", "www"];
  const set = new Set(paths);
  for (const dir of preferred) if (set.has(dir ? `${dir}/index.html` : "index.html")) return dir;
  const candidates = paths.filter((p) => p.endsWith("/index.html")).sort((a, b) => a.split("/").length - b.split("/").length);
  return candidates.length ? candidates[0].slice(0, -"/index.html".length) : null;
}
