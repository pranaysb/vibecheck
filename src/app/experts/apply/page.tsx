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
