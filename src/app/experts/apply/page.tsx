import { CLAIM_TIMEOUT_DAYS } from "@/lib/retention";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { ApplyForm } from "./ApplyForm";

export const metadata = { title: "Apply as an expert" };
export const dynamic = "force-dynamic";

export default async function Apply() {
  const user = await requireUser("/experts/apply");
  const profile = await prisma.expertProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold">{profile?.status === "APPROVED" ? "Your expert profile" : "Apply as an expert"}</h1>
      <p className="mt-3 text-muted leading-relaxed">
        Experts review real people&rsquo;s sites and code. An admin checks the links you give, so include places your work can be verified: GitHub, a portfolio, published audits, LinkedIn.
      </p>
      {profile?.status !== "APPROVED" && (
        <details className="mt-6 card px-5 py-4">
          <summary className="cursor-pointer text-sm font-medium">How reviewing works</summary>
          <ul className="mt-3 space-y-2 text-sm text-muted list-disc pl-5">
            <li>Builders request a review of one of their audits and pick focus areas. You&rsquo;re notified when a request matches the areas you review.</li>
            <li>Claiming a request locks it to you. You have {CLAIM_TIMEOUT_DAYS} days to deliver; after that it goes back to the queue. You can release it earlier.</li>
            <li>You see the full automated audit, the live site or uploaded files, and the builder&rsquo;s notes, then write a verdict and prioritized findings.</li>
            <li>The builder rates your review from 1 to 5. Ratings and review counts are shown on your public profile, and anyone can report a review to an admin.</li>
            <li>Reviewing is unpaid during early access.</li>
          </ul>
        </details>
      )}
      {profile && (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          Status:{" "}
          <span className="font-medium">
            {profile.status === "PENDING" ? "Pending admin review" : profile.status === "APPROVED" ? "Approved" : "Not approved. You can update your application and resubmit."}
          </span>
        </p>
      )}
      <ApplyForm initial={profile ? { headline: profile.headline, bio: profile.bio, expertise: profile.expertise, links: profile.links.join("\n") } : undefined} approved={profile?.status === "APPROVED"} />
    </div>
  );
}
