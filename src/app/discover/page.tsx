import React from "react";
import { prisma } from "@/lib/db";
import { DiscoverTableView } from "@/components/discover/DiscoverTableView";
import Link from "next/link";
import { Search, Plus } from "lucide-react";

export const revalidate = 0;

interface DiscoverPageProps {
  searchParams: Promise<{
    filter?: string;
    q?: string;
    tech?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const currentFilter = params.filter || "trending";
  const searchQuery = params.q || "";
  const techFilter = params.tech || "";

  const where: any = { isPublished: true };

  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { tagline: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  if (techFilter) {
    where.techStack = { has: techFilter };
  }

  if (currentFilter === "expert_reviewed") {
    where.expertReviews = { some: { status: "COMPLETED" } };
  } else if (currentFilter === "security_reviewed") {
    where.findings = { some: { category: "SECURITY", status: "FIXED" } };
  } else if (currentFilter === "ai_built") {
    where.aiInvolvement = { in: ["HEAVY", "ALMOST_ENTIRELY"] };
  } else if (currentFilter === "open_source") {
    where.githubUrl = { not: null };
  }

  let orderBy: any = { createdAt: "desc" };
  if (currentFilter === "trending") {
    orderBy = [{ vibeScore: "desc" }, { viewsCount: "desc" }];
  } else if (currentFilter === "highest_rated") {
    orderBy = { vibeScore: "desc" };
  } else if (currentFilter === "new") {
    orderBy = { createdAt: "desc" };
  }

  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      where,
      orderBy,
      include: {
        creator: { select: { name: true, username: true, avatar: true } },
        versions: { orderBy: { createdAt: "desc" } },
        reviews: { select: { id: true } },
        expertReviews: { where: { status: "COMPLETED" }, select: { id: true } },
        findings: { select: { id: true, severity: true, status: true } },
      },
    });
  } catch (err) {
    console.warn("Discover DB fetch fallback:", err);
    projects = [
      {
        id: "demo-cc",
        slug: "campusconnect",
        title: "CampusConnect",
        tagline: "Student peer-to-peer textbook and dorm essentials marketplace.",
        vibeScore: 86,
        techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
        aiInvolvement: "HEAVY",
        creator: { name: "Alex Rivera", username: "alexrivera", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
        versions: [{ versionNumber: "v3", scoreDelta: 13 }],
        reviews: [{ id: "r1" }],
        expertReviews: [{ id: "er1" }],
        findings: [{ id: "f1", status: "FIXED", severity: "HIGH" }],
      }
    ];
  }

  let finalProjects = projects;
  if (currentFilter === "most_improved") {
    finalProjects = [...projects].sort((a, b) => {
      const deltaA = a.versions.reduce((sum: number, v: any) => sum + v.scoreDelta, 0);
      const deltaB = b.versions.reduce((sum: number, v: any) => sum + v.scoreDelta, 0);
      return deltaB - deltaA;
    });
  }

  const formattedProjects = finalProjects.map((p) => {
    const latestV = p.versions[0];
    const totalDelta = p.versions.reduce((sum: number, v: any) => sum + v.scoreDelta, 0);
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      tagline: p.tagline,
      vibeScore: p.vibeScore,
      techStack: p.techStack,
      aiInvolvement: p.aiInvolvement,
      creator: p.creator,
      reviewsCount: p.reviews.length,
      expertReviews: p.expertReviews,
      findings: p.findings,
      isExpertReviewed: p.expertReviews.length > 0,
      isSecurityReviewed: p.findings.some((f: any) => f.status === "FIXED"),
      scoreDelta: totalDelta > 0 ? totalDelta : undefined,
      latestVersion: latestV?.versionNumber,
      screenshotUrl: p.screenshotUrl,
    };
  });

  const filterTabs = [
    { id: "trending", label: "All Repositories" },
    { id: "highest_rated", label: "Top Security Score" },
    { id: "expert_reviewed", label: "Staff Sign-Off" },
    { id: "security_reviewed", label: "Defects Resolved" },
    { id: "most_improved", label: "Score Improvements" },
    { id: "new", label: "Recent Audits" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Repository Directory & Audit Register
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Standardized repository inventory, OWASP security header compliance, and architectural sign-offs.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="self-start sm:self-auto h-8 px-3 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>New Audit</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {filterTabs.map((tab) => {
            const isActive = currentFilter === tab.id;
            const queryParams = new URLSearchParams();
            queryParams.set("filter", tab.id);
            if (searchQuery) queryParams.set("q", searchQuery);

            return (
              <Link
                key={tab.id}
                href={`/discover?${queryParams.toString()}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                  isActive
                    ? "bg-neutral-900 border-neutral-900 text-white"
                    : "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table & Grid Container */}
      <DiscoverTableView initialProjects={formattedProjects} />
    </div>
  );
}
