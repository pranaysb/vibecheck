import type { NextConfig } from "next";

import { execSync } from "node:child_process";

function getGitCommitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: getGitCommitSha(),
  },
};

export default nextConfig;
