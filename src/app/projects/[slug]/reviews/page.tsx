import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ArrowLeft, MessageSquare, Plus, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { ProjectActionBar } from "@/components/project/ProjectActionBar";

export const revalidate = 0;

interface ReviewsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectReviewsPage({ params }: ReviewsPageProps) {
  const { slug } = await params;

  const project = await prisma.project.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      creator: true,
      reviews: {
        include: {
          author: true,
          comments: {
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { helpfulVotesCount: "desc" },
      },
    },
  });

  if (!project) notFound();

  // Compute average rating metrics
  const revCount = project.reviews.length;
  const avgProduct = revCount ? (project.reviews.reduce((acc, r) => acc + r.productScore, 0) / revCount).toFixed(1) : "0";
  const avgDesign = revCount ? (project.reviews.reduce((acc, r) => acc + r.designScore, 0) / revCount).toFixed(1) : "0";
  const avgEng = revCount ? (project.reviews.reduce((acc, r) => acc + r.engineeringScore, 0) / revCount).toFixed(1) : "0";
  const avgDoc = revCount ? (project.reviews.reduce((acc, r) => acc + r.docScore, 0) / revCount).toFixed(1) : "0";

  const shipYes = project.reviews.filter((r) => r.wouldShip === "YES").length;
  const shipAlmost = project.reviews.filter((r) => r.wouldShip === "ALMOST").length;
  const shipNotYet = project.reviews.filter((r) => r.wouldShip === "NOT_YET").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 mb-2 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {project.title}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            Community Reviews ({revCount})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Structured peer engineering feedback for {project.title}.
          </p>
        </div>

        <ProjectActionBar project={{ id: project.id, slug: project.slug, title: project.title, liveUrl: project.liveUrl, githubUrl: project.githubUrl, userId: project.creator.id }} />
      </div>

      {/* Consensus Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs text-center">
        <div className="p-2 rounded bg-slate-950/60">
          <div className="text-[10px] text-slate-500 uppercase">Avg Product</div>
          <div className="text-base font-bold font-mono text-slate-100">{avgProduct} / 10</div>
        </div>
        <div className="p-2 rounded bg-slate-950/60">
          <div className="text-[10px] text-slate-500 uppercase">Avg Design</div>
          <div className="text-base font-bold font-mono text-slate-100">{avgDesign} / 10</div>
        </div>
        <div className="p-2 rounded bg-slate-950/60">
          <div className="text-[10px] text-slate-500 uppercase">Avg Engineering</div>
          <div className="text-base font-bold font-mono text-slate-100">{avgEng} / 10</div>
        </div>
        <div className="p-2 rounded bg-slate-950/60">
          <div className="text-[10px] text-slate-500 uppercase">Avg Docs</div>
          <div className="text-base font-bold font-mono text-slate-100">{avgDoc} / 10</div>
        </div>
        <div className="col-span-2 sm:col-span-1 p-2 rounded bg-slate-950/60 flex flex-col justify-center">
          <div className="text-[10px] text-slate-500 uppercase mb-1">Shipping Consensus</div>
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
            <span className="text-emerald-400">{shipYes} Ship</span>
            <span className="text-amber-400">{shipAlmost} Almost</span>
            <span className="text-rose-400">{shipNotYet} Hold</span>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {project.reviews.length === 0 ? (
          <div className="p-16 text-center rounded-xl border border-white/10 bg-slate-900/30 space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No community reviews yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first engineer to review {project.title} and earn +15 reviewer reputation points.
            </p>
          </div>
        ) : (
          project.reviews.map((rev) => (
            <ReviewCard key={rev.id} review={rev as any} />
          ))
        )}
      </div>
    </div>
  );
}
