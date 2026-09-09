export const VIBECHECK_CANONICAL_VERSION = {
  scannerVersion: "vibecheck-core-v1.4.2",
  rulesetVersion: "owasp-asvs-l2-2026.09",
  scoringVersion: "engineering-health-v3",
  ssrfPolicyVersion: "outbound-destination-v2",
};

/**
 * Returns the verified deployment commit SHA.
 * If the deployment identity cannot be resolved from the runtime environment,
 * returns "UNKNOWN_COMMIT" rather than silently substituting a historical commit.
 */
export function getDeploymentCommitSha(): string {
  const sha =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA;

  if (sha && sha.length >= 7) {
    return sha.slice(0, 7);
  }

  // If in a non-Vercel environment without commit info, fail closed
  return "UNKNOWN_COMMIT";
}

export function isDeploymentIdentityVerified(): boolean {
  const sha = getDeploymentCommitSha();
  return sha !== "UNKNOWN_COMMIT" && /^[0-9a-f]{7,40}$/i.test(sha);
}
