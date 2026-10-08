const MAX_REPO_KB = 80 * 1024;
const MAX_ZIP_BYTES = 60 * 1024 * 1024;

export interface RepoRef {
  owner: string;
  repo: string;
  ref?: string;
}

/** Accepts `owner/repo`, `github.com/owner/repo`, `https://github.com/owner/repo/tree/branch`, or a `.git` URL. */
export function parseRepo(input: string): RepoRef {
  const s = input.trim().replace(/\.git$/, "").replace(/\/+$/, "");
  const m =
    s.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)(?:\/tree\/(.+))?$/i) ??
    s.match(/^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/);
  if (!m) throw new Error("Enter a GitHub repository as owner/repo or https://github.com/owner/repo.");
  return { owner: m[1], repo: m[2], ref: m[3] };
}

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "VibeCheckAudit", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export interface RepoDownload {
  zip: Uint8Array;
  fullName: string;
  ref: string;
  sha: string;
  htmlUrl: string;
  description: string | null;
}

export async function downloadRepo(ref: RepoRef): Promise<RepoDownload> {
  const api = `https://api.github.com/repos/${ref.owner}/${ref.repo}`;
  const meta = await fetch(api, { headers: ghHeaders(), signal: AbortSignal.timeout(10_000) });
  if (meta.status === 404) throw new Error(`github.com/${ref.owner}/${ref.repo} was not found. Private repositories aren't supported yet; upload a .zip instead.`);
  if (meta.status === 403 || meta.status === 429) throw new Error("GitHub's API rate limit was hit. Try again in a few minutes.");
  if (!meta.ok) throw new Error(`GitHub answered ${meta.status}.`);
  const info = await meta.json();
  if (info.private) throw new Error("This repository is private. Upload a .zip of it instead.");
  if (info.size > MAX_REPO_KB) throw new Error(`This repository is ${Math.round(info.size / 1024)} MB; the limit is ${MAX_REPO_KB / 1024} MB.`);

  const branch = ref.ref ?? info.default_branch;
  const commit = await fetch(`${api}/commits/${encodeURIComponent(branch)}`, { headers: ghHeaders(), signal: AbortSignal.timeout(10_000) });
  if (!commit.ok) throw new Error(`Branch or ref "${branch}" was not found.`);
  const sha: string = (await commit.json()).sha;

  // Download by exact commit so the audit is pinned to what was checked.
  const res = await fetch(`https://codeload.github.com/${info.full_name}/zip/${sha}`, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok || !res.body) throw new Error(`Downloading the repository failed (${res.status}).`);
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_ZIP_BYTES) {
      await reader.cancel();
      throw new Error(`The repository archive is larger than ${MAX_ZIP_BYTES / 1024 / 1024} MB.`);
    }
    chunks.push(value);
  }
  const zip = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    zip.set(c, off);
    off += c.length;
  }
  return { zip, fullName: info.full_name, ref: branch, sha, htmlUrl: info.html_url, description: info.description };
}
