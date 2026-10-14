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

/** The zip's archive comment. GitHub writes the exact commit SHA there. */
export function zipComment(zip: Uint8Array): string {
  // End of central directory record: signature 0x06054b50, comment length at +20, comment at +22.
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 0xffff); i--) {
    if (zip[i] === 0x50 && zip[i + 1] === 0x4b && zip[i + 2] === 0x05 && zip[i + 3] === 0x06) {
      const len = zip[i + 20] | (zip[i + 21] << 8);
      return new TextDecoder().decode(zip.subarray(i + 22, i + 22 + len));
    }
  }
  return "";
}

/** The single top-level folder GitHub wraps archives in: `<repo>-<branch or tag>/`. */
export function zipTopFolder(zip: Uint8Array): string | null {
  // First local file header: signature 0x04034b50, name length at +26, extra length at +28, name at +30.
  if (!(zip[0] === 0x50 && zip[1] === 0x4b && zip[2] === 0x03 && zip[3] === 0x04)) return null;
  const nameLen = zip[26] | (zip[27] << 8);
  const name = new TextDecoder().decode(zip.subarray(30, 30 + nameLen));
  return name.split("/")[0] || null;
}

export interface RepoDownload {
  zip: Uint8Array;
  fullName: string;
  ref: string;
  sha: string;
  htmlUrl: string;
}

/**
 * Downloads a public repository archive straight from codeload.github.com. No GitHub API calls: the API
 * allows 60 unauthenticated requests per hour per IP, which a shared serverless IP exhausts quickly.
 * The commit SHA comes from the archive comment, so the audit is still pinned to an exact commit.
 */
export async function downloadRepo(ref: RepoRef): Promise<RepoDownload> {
  const archiveRef = ref.ref ?? "HEAD"; // HEAD = the default branch
  const res = await fetch(`https://codeload.github.com/${ref.owner}/${ref.repo}/zip/${encodeURI(archiveRef)}`, { signal: AbortSignal.timeout(45_000) });
  if (res.status === 404) {
    throw new Error(
      ref.ref
        ? `github.com/${ref.owner}/${ref.repo} has no branch or tag "${ref.ref}", or the repository is private. Private repositories aren't supported yet; upload a .zip instead.`
        : `github.com/${ref.owner}/${ref.repo} wasn't found. Check the name; private repositories aren't supported yet, so upload a .zip of those instead.`
    );
  }
  if (!res.ok || !res.body) throw new Error(`Downloading the repository failed (GitHub answered ${res.status}). Try again in a minute.`);

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

  const sha = /^[0-9a-f]{40}$/.test(zipComment(zip)) ? zipComment(zip) : "";
  const folder = zipTopFolder(zip);
  const fromFolder = folder?.startsWith(`${ref.repo}-`) ? folder.slice(ref.repo.length + 1) : null;
  const branch = ref.ref ?? (fromFolder && fromFolder !== "HEAD" ? fromFolder : "default branch");
  const htmlUrl = `https://github.com/${ref.owner}/${ref.repo}`;
  return { zip, fullName: `${ref.owner}/${ref.repo}`, ref: branch, sha, htmlUrl };
}
