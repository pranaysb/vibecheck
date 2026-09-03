import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const force = searchParams.get("force") === "true";

  if (secret !== "vibecheck-deploy-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.project.count();
    if (existing >= 10 && !force) {
      return NextResponse.json({
        message: `Database already fully populated with ${existing} projects.`,
        projectsCount: existing,
      });
    }

    // Ensure core users exist
    let alex = await prisma.user.findUnique({ where: { username: "alexrivera" } });
    if (!alex) {
      alex = await prisma.user.create({
        data: {
          email: "alex@example.com",
          username: "alexrivera",
          name: "Alex Rivera",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          bio: "Building peer-to-peer campus essentials with AI tools.",
          role: "CREATOR",
          reputationPoints: 340,
        },
      });
    }

    let rahul = await prisma.user.findUnique({ where: { username: "rahul" } });
    if (!rahul) {
      rahul = await prisma.user.create({
        data: {
          email: "rahul@example.com",
          username: "rahul",
          name: "Rahul Sharma",
          avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
          bio: "Staff Frontend Engineer & accessibility enthusiast.",
          role: "REVIEWER",
          reputationPoints: 1284,
        },
      });
    }

    let sarah = await prisma.user.findUnique({ where: { username: "sarahchen" } });
    if (!sarah) {
      sarah = await prisma.user.create({
        data: {
          email: "sarah@example.com",
          username: "sarahchen",
          name: "Sarah Chen",
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
          bio: "Ex-Stripe Senior Software Engineer (8 yrs). Auditing systems for security and performance.",
          role: "EXPERT",
          reputationPoints: 2450,
          expertProfile: {
            create: {
              title: "Senior Software Engineer (ex-Stripe)",
              bio: "Ex-Stripe Senior Software Engineer (8 yrs). Auditing systems for security and performance.",
              yearsExperience: 8,
              hourlyRateInr: 2499,
              reviewRateInr: 2499,
              specialties: ["Security", "Architecture", "Backend", "System Design"],
              verificationStatus: "VERIFIED",
              reviewsCount: 137,
              rating: 4.9,
            },
          },
        },
      });
    }

    // Array of remaining projects to ensure full catalog exists
    const extraProjects = [
      {
        slug: "resumeforge-ai",
        title: "ResumeForge AI",
        tagline: "Real-time AI resume tailoring and ATS compatibility scoring.",
        description: "Paste a job description and resume markdown to receive keyword gap analysis, bullet point restructuring, and ATS parseability metrics.",
        liveUrl: "https://resumeforge-ai.dev",
        vibeScore: 78,
        scoreProduct: 88, scoreUx: 84, scoreEngineering: 74, scoreSecurity: 68, scorePerformance: 82, scoreAccessibility: 73, scoreDocumentation: 76,
        techStack: ["Next.js", "OpenAI API", "Tailwind CSS", "PostgreSQL"],
        aiInvolvement: "ALMOST_ENTIRELY",
      },
      {
        slug: "flowstate-workspace",
        title: "FlowState",
        tagline: "Minimalist, distraction-free markdown scratchpad with local sync.",
        description: "An instant-boot browser scratchpad for developers. Zero sign-up required, offline-first with IndexedDB, and GitHub Gist sync.",
        liveUrl: "https://flowstate.dev",
        vibeScore: 84,
        scoreProduct: 90, scoreUx: 92, scoreEngineering: 85, scoreSecurity: 80, scorePerformance: 96, scoreAccessibility: 78, scoreDocumentation: 82,
        techStack: ["React", "Vite", "IndexedDB", "Tailwind CSS"],
        aiInvolvement: "MODERATE",
      },
      {
        slug: "habitpulse",
        title: "HabitPulse",
        tagline: "Offline-first daily micro-habits tracker with peer accountability.",
        description: "Build lasting routines with 60-second micro-checkins and streak preservation.",
        liveUrl: "https://habitpulse.app",
        vibeScore: 79,
        scoreProduct: 84, scoreUx: 85, scoreEngineering: 76, scoreSecurity: 78, scorePerformance: 85, scoreAccessibility: 74, scoreDocumentation: 72,
        techStack: ["Next.js", "PWA", "Dexie.js", "Tailwind CSS"],
        aiInvolvement: "MODERATE",
      },
      {
        slug: "devcanvas",
        title: "DevCanvas",
        tagline: "Interactive cloud architecture topology diagrammer with export to Terraform.",
        description: "Draw system architecture nodes, calculate estimated monthly AWS costs, and generate Terraform templates.",
        liveUrl: "https://devcanvas.io",
        vibeScore: 88,
        scoreProduct: 92, scoreUx: 90, scoreEngineering: 89, scoreSecurity: 82, scorePerformance: 87, scoreAccessibility: 82, scoreDocumentation: 88,
        techStack: ["Next.js", "Canvas", "Zustand", "Tailwind CSS"],
        aiInvolvement: "MINIMAL",
      },
      {
        slug: "saaskit",
        title: "SaaSKit",
        tagline: "Open-source privacy-friendly analytics SDK for indie web apps.",
        description: "Lightweight 1.8KB event tracking beacon with real-time dashboards and GDPR compliant anonymization.",
        liveUrl: "https://saaskit.org",
        vibeScore: 89,
        scoreProduct: 90, scoreUx: 88, scoreEngineering: 93, scoreSecurity: 88, scorePerformance: 95, scoreAccessibility: 80, scoreDocumentation: 89,
        techStack: ["Go", "Next.js", "ClickHouse", "Tailwind CSS"],
        aiInvolvement: "MINIMAL",
      },
    ];

    for (const ep of extraProjects) {
      const exists = await prisma.project.findUnique({ where: { slug: ep.slug } });
      if (!exists) {
        await prisma.project.create({
          data: {
            slug: ep.slug,
            title: ep.title,
            tagline: ep.tagline,
            description: ep.description,
            liveUrl: ep.liveUrl,
            vibeScore: ep.vibeScore,
            scoreProduct: ep.scoreProduct,
            scoreUx: ep.scoreUx,
            scoreEngineering: ep.scoreEngineering,
            scoreSecurity: ep.scoreSecurity,
            scorePerformance: ep.scorePerformance,
            scoreAccessibility: ep.scoreAccessibility,
            scoreDocumentation: ep.scoreDocumentation,
            techStack: ep.techStack,
            aiInvolvement: ep.aiInvolvement as any,
            isFeatured: true,
            isPublished: true,
            userId: alex.id,
            versions: {
              create: [{ versionNumber: "v1", vibeScore: ep.vibeScore, scoreDelta: 0, changelog: "Launch release." }],
            },
          },
        });
      }
    }

    const totalNow = await prisma.project.count();
    return NextResponse.json({
      success: true,
      message: `Full catalog populated successfully! Total projects: ${totalNow}`,
      totalProjects: totalNow,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
