export const VIBECHECK_CANONICAL_VERSION = {
  scannerVersion: "vibecheck-core-v1.4.2",
  rulesetVersion: "owasp-asvs-l2-2026.09",
  scoringVersion: "engineering-health-v3",
  ssrfPolicyVersion: "outbound-destination-v2",
  // In Vercel deployments, process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA provides the commit.
  // Fallback resolves to the canonical release commit SHA.
  releaseCommitSha:
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    "94fe2df",
  auditId: "VC-SELF-CANONICAL",
  lastAuditDate: "September 9, 2026",
};

export function getDeploymentCommitSha(): string {
  const sha =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    VIBECHECK_CANONICAL_VERSION.releaseCommitSha;
  return sha.slice(0, 7);
}
