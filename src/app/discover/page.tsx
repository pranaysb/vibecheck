import React from "react";
import { prisma } from "@/lib/db";
import { ProjectCard } from "@/components/project/ProjectCard";
import Link from "next/link";
import { Search, Filter, Sparkles, TrendingUp, ShieldCheck, Plus } from "lucide-react";

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

  // Handle "most_improved" in memory: calculate total score jump
  let finalProjects = projects;
  if (currentFilter === "most_improved") {
    finalProjects = [...projects].sort((a, b) => {
      const deltaA = a.versions.reduce((sum: number, v: any) => sum + v.scoreDelta, 0);
      const deltaB = b.versions.reduce((sum: number, v: any) => sum + v.scoreDelta, 0);
      return deltaB - deltaA;
    });
  }

  const filterTabs = [
    { id: "trending", label: "Trending" },
    { id: "new", label: "New" },
    { id: "highest_rated", label: "Highest rated" },
    { id: "most_improved", label: "Most improved" },
    { id: "expert_reviewed", label: "Expert reviewed" },
    { id: "security_reviewed", label: "Security reviewed" },
    { id: "ai_built", label: "AI-built" },
    { id: "open_source", label: "Open source" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white font-sans tracking-tight">
            Discover Projects
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-normal">
            Explore applications built with AI assistance, verified by automated checks and peer reviews.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="self-start md:self-auto px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-medium text-xs transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Project</span>
        </Link>
      </div>

      {/* Search Input Bar */}
      <form method="GET" action="/discover" className="relative">
        <input type="hidden" name="filter" value={currentFilter} />
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search projects by name, problem solved, or description..."
            className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 px-3 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-medium border border-white/[0.08]"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = currentFilter === tab.id;
          const queryParams = new URLSearchParams();
          queryParams.set("filter", tab.id);
          if (searchQuery) queryParams.set("q", searchQuery);

          return (
            <Link
              key={tab.id}
              href={`/discover?${queryParams.toString()}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-white/[0.1] border-white/[0.18] text-white font-medium shadow-sm"
                  : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Projects Grid */}
      {finalProjects.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-white/[0.08] bg-[#0c0c0e] space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No projects found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No projects matched the selected filters. Be the first developer to submit something in this category!
          </p>
          <div className="pt-2">
            <Link
              href="/projects/new"
              className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-medium text-xs inline-block"
            >
              Submit your project
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {finalProjects.map((p) => {
            const latestV = p.versions[0];
            const totalDelta = p.versions.reduce((sum: number, v: any) => sum + v.scoreDelta, 0);
            return (
              <ProjectCard
                key={p.id}
                project={{
                  id: p.id,
                  slug: p.slug,
                  title: p.title,
                  tagline: p.tagline,
                  vibeScore: p.vibeScore,
                  techStack: p.techStack,
                  aiInvolvement: p.aiInvolvement,
                  creator: p.creator,
                  reviewsCount: p.reviews.length,
                  isExpertReviewed: p.expertReviews.length > 0,
                  isSecurityReviewed: p.findings.some((f: any) => f.status === "FIXED"),
                  scoreDelta: totalDelta > 0 ? totalDelta : undefined,
                  latestVersion: latestV?.versionNumber,
                  screenshotUrl: p.screenshotUrl,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
