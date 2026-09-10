import { NextResponse } from "next/server";
import { VIBECHECK_CANONICAL_VERSION, getDeploymentCommitSha, isDeploymentIdentityVerified } from "@/lib/version";

export const dynamic = "force-dynamic";

export async function GET() {
  const commitSha = getDeploymentCommitSha();
  const isVerified = isDeploymentIdentityVerified();

  return NextResponse.json(
    {
      deploymentCommitSha: commitSha,
      isDeploymentIdentityVerified: isVerified,
      canonicalVersions: VIBECHECK_CANONICAL_VERSION,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
