import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Protect the endpoint
  if (secret !== "vibecheck-deploy-2026") {
    return NextResponse.json({ error: "Unauthorized. Pass ?secret=vibecheck-deploy-2026" }, { status: 401 });
  }

  try {
    const existingProjects = await prisma.project.count();
    if (existingProjects > 0) {
      return NextResponse.json({
        message: `Database already populated with ${existingProjects} projects.`,
        projectsCount: existingProjects,
      });
    }

    // Seed Badges
    const badge1 = await prisma.badge.create({
      data: { name: "Verified Builder", slug: "verified-builder", description: "Shipped a project scoring 80+ on VibeCheck", icon: "CheckCircle2", category: "BUILDER" },
    });
    const badge2 = await prisma.badge.create({
      data: { name: "Bug Hunter", slug: "bug-hunter", description: "Submitted 10+ validated bug reports", icon: "Bug", category: "REVIEWER" },
    });

    // Seed Users
    const alex = await prisma.user.create({
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

    const rahul = await prisma.user.create({
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

    const sarah = await prisma.user.create({
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

    // Seed CampusConnect
    const cc = await prisma.project.create({
      data: {
        slug: "campusconnect",
        title: "CampusConnect",
        tagline: "Student peer-to-peer textbook and dorm essentials marketplace.",
        description: "A student marketplace connecting campus residents to buy, sell, or trade used textbooks and furniture.",
        liveUrl: "https://campusconnect-demo.vercel.app",
        githubUrl: "https://github.com/alexrivera/campusconnect",
        aiInvolvement: "HEAVY",
        aiTools: ["Cursor", "v0", "Claude Code"],
        techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Zod"],
        vibeScore: 86,
        scoreProduct: 88,
        scoreUx: 90,
        scoreEngineering: 84,
        scoreSecurity: 86,
        scorePerformance: 85,
        scoreAccessibility: 82,
        scoreDocumentation: 80,
        isFeatured: true,
        isPublished: true,
        userId: alex.id,
        versions: {
          create: [
            { versionNumber: "v1", vibeScore: 61, scoreDelta: 0, changelog: "Initial prototype." },
            { versionNumber: "v2", vibeScore: 73, scoreDelta: 12, changelog: "Fixed auth error handling and responsive layout." },
            { versionNumber: "v3", vibeScore: 86, scoreDelta: 13, changelog: "Hardened Supabase RLS policies and fixed WCAG contrast." },
          ],
        },
        findings: {
          create: [
            { category: "SECURITY", severity: "HIGH", title: "Unprotected trade status mutation endpoint", description: "Endpoint allowed any caller to cancel trades.", recommendation: "Verify session ownership in server action.", status: "FIXED", confidence: "HIGH", versionFixed: "v3" },
            { category: "PERFORMANCE", severity: "MEDIUM", title: "Uncompressed PNG assets on listing grid", description: "Hero images served as raw 4MB files.", recommendation: "Use WebP/AVIF format and Next Image.", status: "FIXED", confidence: "HIGH", versionFixed: "v2" },
          ],
        },
        reviews: {
          create: [
            {
              userId: rahul.id,
              productScore: 9,
              designScore: 9,
              engineeringScore: 8,
              docScore: 8,
              wouldShip: "YES",
              whatLiked: "Crisp UX, great spacing, and rapid item search.",
              whatToImprove: "Add keyboard navigation.",
              biggestIssue: "Initial cold start was a bit slow.",
              helpfulVotesCount: 15,
            },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      created: { campusConnectId: cc.id },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
