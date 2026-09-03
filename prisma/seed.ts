import { PrismaClient, Role, AIInvolvement, FindingCategory, Severity, FindingStatus, Confidence, WouldShip, ExpertVerificationStatus, ExpertReviewStatus, ReviewPackage, ReportTargetType, ReportReason, ReportStatus, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning existing database records...");
  await prisma.productEvent.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.challengeSubmission.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.expertReviewReport.deleteMany({});
  await prisma.expertReview.deleteMany({});
  await prisma.expertProfile.deleteMany({});
  await prisma.reviewVote.deleteMany({});
  await prisma.reviewComment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.finding.deleteMany({});
  await prisma.analysis.deleteMany({});
  await prisma.projectVersion.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Seeding badges...");
  const badges = await Promise.all([
    prisma.badge.create({
      data: {
        name: "Verified Engineer",
        slug: "verified-engineer",
        description: "Vetted senior engineering professional with 5+ years of verified industry experience.",
        icon: "ShieldCheck",
        category: "EXPERT",
      },
    }),
    prisma.badge.create({
      data: {
        name: "Bug Hunter",
        slug: "bug-hunter",
        description: "Discovered and documented 10+ critical architectural or functional issues.",
        icon: "Bug",
        category: "REVIEWER",
      },
    }),
    prisma.badge.create({
      data: {
        name: "Product Reviewer",
        slug: "product-reviewer",
        description: "Provides top-tier structural feedback on UX, onboarding, and product clarity.",
        icon: "Compass",
        category: "REVIEWER",
      },
    }),
    prisma.badge.create({
      data: {
        name: "Most Improved",
        slug: "most-improved",
        description: "Shipped updates yielding a +20 point jump in project Vibe Score.",
        icon: "TrendingUp",
        category: "CREATOR",
      },
    }),
    prisma.badge.create({
      data: {
        name: "Top Contributor",
        slug: "top-contributor",
        description: "Over 50 community members voted their feedback as genuinely helpful.",
        icon: "Award",
        category: "COMMUNITY",
      },
    }),
    prisma.badge.create({
      data: {
        name: "Backend Reviewer",
        slug: "backend-reviewer",
        description: "Specialist in database modeling, API design, and system scalability.",
        icon: "Server",
        category: "REVIEWER",
      },
    }),
  ]);

  const badgeMap = Object.fromEntries(badges.map((b) => [b.slug, b.id]));

  console.log("Seeding users...");
  // 1. Alex Rivera (Creator)
  const alex = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      username: "alexrivera",
      email: "alex@example.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: Role.CREATOR,
      reputationPoints: 480,
      bio: "CS sophomore building tools for students and indie hackers. Heavy Cursor & Claude Code user.",
      githubUrl: "https://github.com/alexrivera",
      profile: {
        create: {
          headline: "Student & AI Builder",
          bio: "Passionate about full-stack web and decentralized campus tools.",
          experienceYears: 2,
          company: "Stanford University",
          location: "Palo Alto, CA",
        },
      },
    },
  });

  // 2. Rahul Sharma (Reviewer)
  const rahul = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      username: "rahul",
      email: "rahul@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      role: Role.REVIEWER,
      reputationPoints: 1284,
      bio: "Full-stack developer & open source enthusiast. 142 projects reviewed, 89 helpful votes.",
      githubUrl: "https://github.com/rahulsharma",
      profile: {
        create: {
          headline: "Senior Frontend Engineer & OSS Contributor",
          bio: "Constantly checking indie AI projects to help developers ship production-grade code.",
          experienceYears: 6,
          company: "DevSync",
          location: "Bengaluru, India",
        },
      },
    },
  });

  // 3. Sarah Chen (Expert Reviewer)
  const sarah = await prisma.user.create({
    data: {
      name: "Sarah Chen",
      username: "sarahchen",
      email: "sarah@example.com",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      role: Role.EXPERT,
      reputationPoints: 2950,
      bio: "Senior Software Engineer. 8+ years experience. Ex-Stripe, distributed systems & cloud security.",
      githubUrl: "https://github.com/sarahchen",
      profile: {
        create: {
          headline: "Senior Software Engineer & Systems Architect",
          bio: "Specializing in high-throughput APIs, authentication architectures, and authz boundary modeling.",
          experienceYears: 8,
          company: "Infrastructure Lab",
          location: "San Francisco, CA",
        },
      },
      expertProfile: {
        create: {
          title: "Senior Software Engineer",
          yearsExperience: 8,
          hourlyRateInr: 4500,
          reviewRateInr: 2499,
          specialties: ["Backend", "Security", "System Design", "Distributed Systems"],
          bio: "I provide rigorous code reviews covering authorization flaws, database bottleneck mitigation, and production hardening.",
          rating: 4.9,
          reviewsCount: 137,
          verificationStatus: ExpertVerificationStatus.VERIFIED,
        },
      },
    },
  });

  // 4. Marcus Vance (Expert Reviewer)
  const marcus = await prisma.user.create({
    data: {
      name: "Marcus Vance",
      username: "marcusv",
      email: "marcus@example.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      role: Role.EXPERT,
      reputationPoints: 3400,
      bio: "Principal Cloud Architect. 11 years in production scale, Kubernetes & database optimization.",
      githubUrl: "https://github.com/marcusvance",
      profile: {
        create: {
          headline: "Principal Cloud Architect",
          experienceYears: 11,
          location: "Seattle, WA",
        },
      },
      expertProfile: {
        create: {
          title: "Principal Cloud Architect",
          yearsExperience: 11,
          hourlyRateInr: 6000,
          reviewRateInr: 3499,
          specialties: ["Cloud Architecture", "Scalability", "Database Optimization", "DevOps"],
          bio: "Ensuring your AI prototype won't fold under 10k concurrent users or leak customer data across tenants.",
          rating: 4.95,
          reviewsCount: 94,
          verificationStatus: ExpertVerificationStatus.VERIFIED,
        },
      },
    },
  });

  // 5. Priya Murali (Expert Reviewer)
  const priya = await prisma.user.create({
    data: {
      name: "Priya Murali",
      username: "priyam",
      email: "priya@example.com",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      role: Role.EXPERT,
      reputationPoints: 2780,
      bio: "Staff Frontend & Accessibility Lead. Passionate about semantic web, Core Web Vitals, and WCAG AAA.",
      githubUrl: "https://github.com/priyamurali",
      profile: {
        create: {
          headline: "Staff Frontend Engineer & A11y Lead",
          experienceYears: 7,
          location: "London, UK",
        },
      },
      expertProfile: {
        create: {
          title: "Staff Frontend Engineer & A11y Lead",
          yearsExperience: 7,
          hourlyRateInr: 3500,
          reviewRateInr: 1999,
          specialties: ["Frontend", "Accessibility", "Performance", "Design Systems"],
          bio: "Reviewing DOM hierarchy, screen reader compliance, keyboard navigation, and bundle payload optimization.",
          rating: 4.88,
          reviewsCount: 82,
          verificationStatus: ExpertVerificationStatus.VERIFIED,
        },
      },
    },
  });

  // 6. Elena Rostova (Reviewer / Designer)
  const elena = await prisma.user.create({
    data: {
      name: "Elena Rostova",
      username: "elena_ux",
      email: "elena@example.com",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      role: Role.REVIEWER,
      reputationPoints: 940,
      bio: "Product Designer & UX Researcher. I audit empty states, microcopy, and user onboarding friction.",
      githubUrl: "https://github.com/elenarostova",
    },
  });

  // 7. David Kim (Reviewer / Security)
  const david = await prisma.user.create({
    data: {
      name: "David Kim",
      username: "davidk",
      email: "david@example.com",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      role: Role.REVIEWER,
      reputationPoints: 810,
      bio: "Security engineer & ethical hacker. Checking CORS, JWT leaks, and SSRF vulnerabilities in new apps.",
      githubUrl: "https://github.com/davidkimsec",
    },
  });

  // 8. Aisha Patel (Creator)
  const aisha = await prisma.user.create({
    data: {
      name: "Aisha Patel",
      username: "aishap",
      email: "aisha@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      role: Role.CREATOR,
      reputationPoints: 620,
      bio: "Building AI-powered career tools. Exploring Cursor and v0 to prototype in hours instead of months.",
      githubUrl: "https://github.com/aishapatel",
    },
  });

  // 9. Jordan Taylor (Creator)
  const jordan = await prisma.user.create({
    data: {
      name: "Jordan Taylor",
      username: "jordan_t",
      email: "jordan@example.com",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      role: Role.CREATOR,
      reputationPoints: 350,
      bio: "Indie hacker. Building lightweight tools with Claude Code and Next.js.",
      githubUrl: "https://github.com/jordantaylor",
    },
  });

  // 10. Platform Admin
  const admin = await prisma.user.create({
    data: {
      name: "VibeCheck Admin",
      username: "admin",
      email: "admin@vibecheck.dev",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      role: Role.ADMIN,
      reputationPoints: 5000,
      bio: "Official VibeCheck Platform Moderation & Safety Team.",
    },
  });

  // 11-15 More Community Members
  const sam = await prisma.user.create({
    data: {
      name: "Samir Patel",
      username: "sam_dev",
      email: "sam@example.com",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      role: Role.CREATOR,
      reputationPoints: 410,
    },
  });

  const maya = await prisma.user.create({
    data: {
      name: "Maya Lin",
      username: "maya_code",
      email: "maya@example.com",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      role: Role.CREATOR,
      reputationPoints: 530,
    },
  });

  const liam = await prisma.user.create({
    data: {
      name: "Liam O'Connor",
      username: "liam_ai",
      email: "liam@example.com",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      role: Role.CREATOR,
      reputationPoints: 390,
    },
  });

  const zoe = await prisma.user.create({
    data: {
      name: "Zoe Kravitz",
      username: "zoe_hack",
      email: "zoe@example.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: Role.CREATOR,
      reputationPoints: 440,
    },
  });

  const arjun = await prisma.user.create({
    data: {
      name: "Arjun Verma",
      username: "arjun_v",
      email: "arjun@example.com",
      avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80",
      role: Role.CREATOR,
      reputationPoints: 310,
    },
  });

  // Assign user badges
  await prisma.userBadge.createMany({
    data: [
      { userId: sarah.id, badgeId: badgeMap["verified-engineer"] },
      { userId: marcus.id, badgeId: badgeMap["verified-engineer"] },
      { userId: priya.id, badgeId: badgeMap["verified-engineer"] },
      { userId: rahul.id, badgeId: badgeMap["bug-hunter"] },
      { userId: rahul.id, badgeId: badgeMap["top-contributor"] },
      { userId: elena.id, badgeId: badgeMap["product-reviewer"] },
      { userId: david.id, badgeId: badgeMap["bug-hunter"] },
      { userId: alex.id, badgeId: badgeMap["most-improved"] },
    ],
  });

  console.log("Seeding Project 1: CampusConnect (Flagship with 3 versions: 61 -> 73 -> 86)...");
  const campusConnect = await prisma.project.create({
    data: {
      slug: "campusconnect",
      title: "CampusConnect",
      tagline: "A peer-to-peer student marketplace built for campus item exchanges.",
      description: "CampusConnect connects university students to safely buy, sell, and borrow textbooks, dorm furniture, electronics, and lab equipment on verified campus domains.",
      liveUrl: "https://campusconnect-demo.vercel.app",
      githubUrl: "https://github.com/alexrivera/campusconnect",
      aiInvolvement: AIInvolvement.HEAVY,
      aiTools: ["Cursor", "Claude Code", "v0"],
      techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL"],
      framework: "Next.js 14 App Router",
      database: "PostgreSQL (Supabase)",
      hosting: "Vercel",
      screenshotUrl: "/mockups/campusconnect.png",
      whatBuilt: "A mobile-first student marketplace with institutional SSO, escrow item reservation, and in-app campus rendezvous scheduling.",
      whyBuilt: "Students regularly get scammed or ghosted on Facebook Marketplace and Craigslist when trying to exchange course books and dorm mini-fridges.",
      problemSolved: "Guarantees student-only identity verification with .edu email validation and structured meeting points near student centers.",
      difficultParts: "Handling optimistic concurrency when two students click 'Reserve Textbook' simultaneously.",
      unsureParts: "Whether our row-level security policies on Supabase completely prevent someone from modifying someone else's listing status.",
      feedbackWanted: "Security audit on the listing modification endpoints, keyboard accessibility for screen-readers, and performance when browsing 500+ listings.",
      vibeScore: 86,
      scoreProduct: 91,
      scoreUx: 86,
      scoreEngineering: 78,
      scoreSecurity: 73,
      scorePerformance: 88,
      scoreAccessibility: 81,
      scoreDocumentation: 79,
      isFeatured: true,
      isPublished: true,
      userId: alex.id,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // CampusConnect Versions
  const ccV1 = await prisma.projectVersion.create({
    data: {
      projectId: campusConnect.id,
      versionNumber: "v1",
      vibeScore: 61,
      scoreDelta: 0,
      changelog: "Initial vibe-coded release. Built core feed, basic listing creation, and Supabase integration.",
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  const ccV2 = await prisma.projectVersion.create({
    data: {
      projectId: campusConnect.id,
      versionNumber: "v2",
      vibeScore: 73,
      scoreDelta: 12,
      changelog: "Fixed mobile navigation drawer, added input validation with Zod, and resolved image loading layout shift.",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  });

  const ccV3 = await prisma.projectVersion.create({
    data: {
      projectId: campusConnect.id,
      versionNumber: "v3",
      vibeScore: 86,
      scoreDelta: 13,
      changelog: "Addressed Sarah Chen's expert security audit: hardened row-level security on trade cancellation endpoints, fixed WCAG contrast ratios on form buttons, and added integration tests for reservation race conditions.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // CampusConnect Findings
  await prisma.finding.createMany({
    data: [
      {
        projectId: campusConnect.id,
        versionDiscovered: "v1",
        versionFixed: "v3",
        category: FindingCategory.SECURITY,
        severity: Severity.CRITICAL,
        title: "Authorization check missing on trade cancel endpoint",
        description: "This endpoint appears to rely on a resource identifier without verifying that the requesting user owns or initiated the trade.",
        evidence: "POST /api/trades/[id]/cancel - Missing session user verification before executing `db.trade.update({ where: { id } })`",
        recommendation: "Verify `session.user.id === trade.sellerId || session.user.id === trade.buyerId` in middleware before executing state changes.",
        confidence: Confidence.HIGH,
        status: FindingStatus.FIXED,
        fixedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: campusConnect.id,
        versionDiscovered: "v1",
        versionFixed: "v2",
        category: FindingCategory.PERFORMANCE,
        severity: Severity.HIGH,
        title: "Unoptimized full-resolution camera uploads causing LCP degradation",
        description: "Student listing photos were loaded directly from storage buckets without compression or responsive srcSet sizing, resulting in 4.5MB image downloads.",
        evidence: "Hero card images loading raw 3024x4032 JPEGs directly onto mobile viewports.",
        recommendation: "Implement Next.js `<Image>` component with automated sharp compression and responsive device widths.",
        confidence: Confidence.HIGH,
        status: FindingStatus.FIXED,
        fixedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: campusConnect.id,
        versionDiscovered: "v1",
        versionFixed: "v3",
        category: FindingCategory.ACCESSIBILITY,
        severity: Severity.MEDIUM,
        title: "Missing accessible names on filter modal close buttons",
        description: "The listing filter drawer uses an icon-only `<button>` element lacking an `aria-label` attribute, making it invisible to screen readers.",
        evidence: `<button onClick={onClose}><XIcon className="w-5 h-5"/></button>`,
        recommendation: 'Add `aria-label="Close filter options"` and verify keyboard `Escape` dismissal listener.',
        confidence: Confidence.HIGH,
        status: FindingStatus.FIXED,
        fixedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: campusConnect.id,
        versionDiscovered: "v3",
        category: FindingCategory.SECURITY,
        severity: Severity.MEDIUM,
        title: "Missing Content-Security-Policy (CSP) header",
        description: "The application responses do not include a strict Content-Security-Policy header to restrict unauthorized script execution.",
        evidence: "Headers inspect: 'content-security-policy' header is absent.",
        recommendation: "Configure security headers in `next.config.js` or middleware with script-src 'self' and strict domain allowances.",
        confidence: Confidence.HIGH,
        status: FindingStatus.OPEN,
      },
      {
        projectId: campusConnect.id,
        versionDiscovered: "v3",
        category: FindingCategory.DEPENDENCY,
        severity: Severity.LOW,
        title: "Sub-dependency advisory detected in transitive package",
        description: "Transitive dependency `cookie` has an advisory regarding max-age parsing.",
        evidence: "npm audit report indicates non-breaking update available for session adapter.",
        recommendation: "Run `npm update` to elevate session library to latest patch version.",
        confidence: Confidence.MEDIUM,
        status: FindingStatus.OPEN,
      },
    ],
  });

  // CampusConnect Community Reviews
  const revRahul = await prisma.review.create({
    data: {
      projectId: campusConnect.id,
      userId: rahul.id,
      productScore: 9,
      designScore: 8,
      engineeringScore: 7,
      docScore: 8,
      wouldShip: WouldShip.ALMOST,
      whatLiked: "The localized campus map and student verification via .edu email addresses is brilliant. The UI feels brisk and clean.",
      whatToImprove: "The search bar doesn't debounce keystrokes, which triggered redundant Supabase queries as I typed. Also add empty states for obscure search queries.",
      biggestIssue: "Race condition if two users claim an item simultaneously; needed pessimistic or transaction locking.",
      bugReport: "When scrolling fast through listings on Safari iOS, images sometimes flash white before rendering.",
      suggestion: "Add a 'Meet on Campus' default checklist showing safe, well-lit campus landmarks like the student union or main library.",
      helpfulVotesCount: 19,
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.reviewComment.create({
    data: {
      reviewId: revRahul.id,
      userId: alex.id,
      content: "Thanks Rahul! We just added `useDebounce` on the search bar in v2, and we're adding transactional locks in Supabase RPC right now.",
      createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    },
  });

  const revElena = await prisma.review.create({
    data: {
      projectId: campusConnect.id,
      userId: elena.id,
      productScore: 9,
      designScore: 9,
      engineeringScore: 8,
      docScore: 8,
      wouldShip: WouldShip.YES,
      whatLiked: "The typography and information hierarchy on listing cards is stellar. High contrast tags make item conditions (Brand New, Good, Fair) instantly readable.",
      whatToImprove: "The multi-step photo upload on mobile could use drag-to-reorder for the primary hero thumbnail.",
      biggestIssue: "The bottom action bar on mobile overlaps iOS home bar if safe-area-inset isn't padded.",
      suggestion: "Use `padding-bottom: env(safe-area-inset-bottom)` on sticky floating bars.",
      helpfulVotesCount: 14,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
  });

  const revDavid = await prisma.review.create({
    data: {
      projectId: campusConnect.id,
      userId: david.id,
      productScore: 8,
      designScore: 8,
      engineeringScore: 8,
      docScore: 7,
      wouldShip: WouldShip.YES,
      whatLiked: "Clean separation of public read-only views versus authenticated trading actions.",
      whatToImprove: "Rate limit the contact-seller form to prevent automated spamming bots.",
      biggestIssue: "Initial trade endpoint lacked caller ownership validation (now fixed in v3!).",
      helpfulVotesCount: 11,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Sarah Chen's Expert Review on CampusConnect
  const expertReview = await prisma.expertReview.create({
    data: {
      projectId: campusConnect.id,
      expertId: sarah.id,
      creatorId: alex.id,
      focusAreas: ["Security", "Architecture", "System Design"],
      packageType: ReviewPackage.STANDARD,
      packagePriceInr: 2499,
      notes: "Please evaluate our Supabase RLS policies and trade cancellation endpoints for potential multi-tenant leakage.",
      status: ExpertReviewStatus.COMPLETED,
      report: {
        create: {
          overallScore: 84,
          executiveSummary: "CampusConnect exhibits strong product sense and great developer execution for a student project. The primary vulnerability in v1 was missing authorization verification on trade mutations; Alex promptly addressed this in v3 with robust RLS policies and server-side session checks. The application is now in an excellent state to pilot across campus.",
          architectureScore: 82,
          securityScore: 86,
          performanceScore: 88,
          codeQualityScore: 81,
          scalabilityScore: 80,
          recommendations: JSON.stringify([
            { title: "Implement Strict Content-Security-Policy", description: "Prevent cross-site scripting by disallowing inline scripts and restricting image sources in next.config.js.", priority: "HIGH" },
            { title: "Introduce Supabase RPC for Atomic Item Claiming", description: "Use a Postgres function with `SELECT FOR UPDATE` to eliminate duplicate claim attempts in concurrent scenarios.", priority: "HIGH" },
            { title: "Add Integration Test Suite for Trade Lifecycle", description: "Write 5 Vitest/Playwright specs simulating Seller cancels, Buyer claims, and Escrow timeouts.", priority: "MEDIUM" },
            { title: "Automate Image Compression with Cloudflare Images or Next Image Optimizer", description: "Ensure avatars and listing photos are served in WebP/AVIF with cached headers.", priority: "LOW" },
          ]),
          wouldShip: WouldShip.YES,
        },
      },
    },
  });

  console.log("Seeding Project 2: ResumeForge AI (Score: 78)...");
  const resumeForge = await prisma.project.create({
    data: {
      slug: "resumeforge-ai",
      title: "ResumeForge AI",
      tagline: "Real-time AI resume tailoring and ATS compatibility scoring.",
      description: "Paste a job description and your resume markdown to instantly receive keyword gap analysis, bullet point restructuring, and ATS parseability metrics.",
      liveUrl: "https://resumeforge-ai.dev",
      githubUrl: "https://github.com/aishapatel/resumeforge",
      aiInvolvement: AIInvolvement.ALMOST_ENTIRELY,
      aiTools: ["Cursor", "v0", "Claude Code"],
      techStack: ["Next.js", "OpenAI API", "Tailwind CSS", "Prisma", "PostgreSQL"],
      framework: "Next.js 14",
      database: "PostgreSQL",
      hosting: "Vercel",
      screenshotUrl: "/mockups/resumeforge.png",
      whatBuilt: "An ATS resume analyzer that breaks down match percentages by hard skills, soft skills, and quantifiable metrics.",
      whyBuilt: "Job hunting in tech is exhausting; candidates spend hours rewriting bullets for each job posting.",
      problemSolved: "Produces tailored LaTeX and PDF outputs with zero hallucinated credentials.",
      vibeScore: 78,
      scoreProduct: 88,
      scoreUx: 84,
      scoreEngineering: 74,
      scoreSecurity: 68,
      scorePerformance: 82,
      scoreAccessibility: 73,
      scoreDocumentation: 76,
      isFeatured: true,
      isPublished: true,
      userId: aisha.id,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.projectVersion.create({
    data: {
      projectId: resumeForge.id,
      versionNumber: "v1",
      vibeScore: 78,
      scoreDelta: 0,
      changelog: "First public beta with OpenAI GPT-4o-mini integration and PDF export.",
    },
  });

  await prisma.finding.createMany({
    data: [
      {
        projectId: resumeForge.id,
        category: FindingCategory.SECURITY,
        severity: Severity.HIGH,
        title: "Potential client-side API key leak risk in error trace",
        description: "When OpenAI requests fail, the raw server response error is serialized back to the client toast message.",
        evidence: "Catch block serializes `err.message` containing OpenAI organization identifier to user alert.",
        recommendation: "Sanitize upstream errors; return generic error codes to clients while logging details server-side.",
        confidence: Confidence.HIGH,
        status: FindingStatus.OPEN,
      },
      {
        projectId: resumeForge.id,
        category: FindingCategory.ACCESSIBILITY,
        severity: Severity.MEDIUM,
        title: "Progress score bar lacks ARIA value attributes",
        description: "ATS Match percentage ring does not declare `aria-valuenow` or `aria-valuemin`.",
        recommendation: "Add role='progressbar' aria-valuenow={matchScore} aria-valuemin={0} aria-valuemax={100}.",
        confidence: Confidence.HIGH,
        status: FindingStatus.OPEN,
      },
    ],
  });

  await prisma.review.create({
    data: {
      projectId: resumeForge.id,
      userId: rahul.id,
      productScore: 8,
      designScore: 9,
      engineeringScore: 7,
      docScore: 7,
      wouldShip: WouldShip.ALMOST,
      whatLiked: "The live side-by-side diff comparing the original resume bullet to the AI improved bullet is fantastic.",
      whatToImprove: "Make sure you don't leak OpenAI error messages when users hit rate limits.",
      biggestIssue: "Exporting to PDF sometimes truncates long bullet points if they cross a page boundary.",
      helpfulVotesCount: 9,
    },
  });

  console.log("Seeding Project 3: FlowState (Score: 84)...");
  const flowState = await prisma.project.create({
    data: {
      slug: "flowstate-workspace",
      title: "FlowState",
      tagline: "Minimalist, distraction-free markdown scratchpad with local sync.",
      description: "An instant-boot browser scratchpad for developers. Zero sign-up required, offline-first with IndexedDB, and automatic GitHub Gist sync.",
      liveUrl: "https://flowstate.dev",
      githubUrl: "https://github.com/jordantaylor/flowstate",
      aiInvolvement: AIInvolvement.MODERATE,
      aiTools: ["Claude Code"],
      techStack: ["React", "Vite", "IndexedDB", "Tailwind CSS", "Web Workers"],
      vibeScore: 84,
      scoreProduct: 90,
      scoreUx: 92,
      scoreEngineering: 85,
      scoreSecurity: 80,
      scorePerformance: 96,
      scoreAccessibility: 78,
      scoreDocumentation: 82,
      isFeatured: true,
      isPublished: true,
      userId: jordan.id,
    },
  });

  await prisma.projectVersion.create({
    data: {
      projectId: flowState.id,
      versionNumber: "v1",
      vibeScore: 84,
      scoreDelta: 0,
      changelog: "Launch release featuring Web Worker markdown syntax highlighting and IndexedDB persistence.",
    },
  });

  console.log("Seeding Projects 4-11...");
  const p4 = await prisma.project.create({
    data: {
      slug: "habitpulse",
      title: "HabitPulse",
      tagline: "Offline-first daily micro-habits tracker with peer accountability.",
      description: "Build lasting routines with 60-second micro-checkins, streak preservation, and zero notifications spam.",
      liveUrl: "https://habitpulse.app",
      githubUrl: "https://github.com/mayalin/habitpulse",
      aiInvolvement: AIInvolvement.MODERATE,
      aiTools: ["Bolt", "ChatGPT"],
      techStack: ["Next.js", "PWA", "Dexie.js", "Tailwind CSS"],
      vibeScore: 79,
      scoreProduct: 84,
      scoreUx: 85,
      scoreEngineering: 76,
      scoreSecurity: 78,
      scorePerformance: 85,
      scoreAccessibility: 74,
      scoreDocumentation: 72,
      isFeatured: false,
      isPublished: true,
      userId: maya.id,
    },
  });

  const p5 = await prisma.project.create({
    data: {
      slug: "pocketcfo",
      title: "PocketCFO",
      tagline: "Runway forecasting and cashflow simulator for indie micro-SaaS founders.",
      description: "Plug in Stripe MRR and monthly SaaS expenses to visualize runway curves, churn cliffs, and break-even targets.",
      liveUrl: "https://pocketcfo.dev",
      githubUrl: "https://github.com/samdev/pocketcfo",
      aiInvolvement: AIInvolvement.HEAVY,
      aiTools: ["Replit", "Claude Code"],
      techStack: ["SvelteKit", "TypeScript", "Chart.js", "Supabase"],
      vibeScore: 74,
      scoreProduct: 82,
      scoreUx: 75,
      scoreEngineering: 72,
      scoreSecurity: 70,
      scorePerformance: 80,
      scoreAccessibility: 69,
      scoreDocumentation: 70,
      isFeatured: false,
      isPublished: true,
      userId: sam.id,
    },
  });

  const p6 = await prisma.project.create({
    data: {
      slug: "meetscribe",
      title: "MeetScribe",
      tagline: "In-browser WebAssembly audio transcription with action item extraction.",
      description: "Transcribe standups and client calls locally without sending your raw audio to third-party servers.",
      liveUrl: "https://meetscribe.ai",
      githubUrl: "https://github.com/liamoconnor/meetscribe",
      aiInvolvement: AIInvolvement.HEAVY,
      aiTools: ["Cursor", "Windsurf"],
      techStack: ["Next.js", "WebAssembly", "Whisper", "Tailwind CSS"],
      vibeScore: 81,
      scoreProduct: 87,
      scoreUx: 80,
      scoreEngineering: 86,
      scoreSecurity: 84,
      scorePerformance: 75,
      scoreAccessibility: 76,
      scoreDocumentation: 80,
      isFeatured: true,
      isPublished: true,
      userId: liam.id,
    },
  });

  const p7 = await prisma.project.create({
    data: {
      slug: "devcanvas",
      title: "DevCanvas",
      tagline: "Interactive cloud architecture topology diagrammer with export to Terraform.",
      description: "Draw system architecture nodes, calculate estimated AWS monthly costs, and generate Terraform templates.",
      liveUrl: "https://devcanvas.io",
      githubUrl: "https://github.com/alexrivera/devcanvas",
      aiInvolvement: AIInvolvement.MINIMAL,
      aiTools: ["Cursor"],
      techStack: ["Next.js", "HTML5 Canvas", "Zustand", "Tailwind CSS"],
      vibeScore: 88,
      scoreProduct: 92,
      scoreUx: 90,
      scoreEngineering: 89,
      scoreSecurity: 82,
      scorePerformance: 87,
      scoreAccessibility: 82,
      scoreDocumentation: 88,
      isFeatured: true,
      isPublished: true,
      userId: alex.id,
    },
  });

  const p8 = await prisma.project.create({
    data: {
      slug: "eventpulse",
      title: "EventPulse",
      tagline: "Curated university hackathon and tech meetup aggregator.",
      description: "Discover upcoming hackathons, filter by travel stipends, team requirements, and prize pools.",
      liveUrl: "https://eventpulse.live",
      githubUrl: "https://github.com/arjunverma/eventpulse",
      aiInvolvement: AIInvolvement.ALMOST_ENTIRELY,
      aiTools: ["Lovable", "ChatGPT"],
      techStack: ["Remix", "Tailwind CSS", "PostgreSQL"],
      vibeScore: 70,
      scoreProduct: 78,
      scoreUx: 72,
      scoreEngineering: 68,
      scoreSecurity: 66,
      scorePerformance: 75,
      scoreAccessibility: 68,
      scoreDocumentation: 64,
      isFeatured: false,
      isPublished: true,
      userId: arjun.id,
    },
  });

  const p9 = await prisma.project.create({
    data: {
      slug: "leancrm",
      title: "LeanCRM",
      tagline: "Zero-bloat sales pipeline tracker designed for freelance engineers.",
      description: "Simple deal stages, follow-up reminders, and quote generation without Salesforce complexity.",
      liveUrl: "https://leancrm.dev",
      githubUrl: "https://github.com/zoekravitz/leancrm",
      aiInvolvement: AIInvolvement.MODERATE,
      aiTools: ["Claude Code", "Cursor"],
      techStack: ["Next.js", "Prisma", "PostgreSQL", "Tailwind CSS"],
      vibeScore: 83,
      scoreProduct: 86,
      scoreUx: 88,
      scoreEngineering: 82,
      scoreSecurity: 80,
      scorePerformance: 88,
      scoreAccessibility: 78,
      scoreDocumentation: 81,
      isFeatured: false,
      isPublished: true,
      userId: zoe.id,
    },
  });

  const p10 = await prisma.project.create({
    data: {
      slug: "studysync",
      title: "StudySync",
      tagline: "AI flashcard generator and active recall spaced-repetition scheduler.",
      description: "Turn PDF lecture notes and textbooks into Anki-compatible flashcard decks with automatic difficulty leveling.",
      liveUrl: "https://studysync-ai.com",
      githubUrl: "https://github.com/jordantaylor/studysync",
      aiInvolvement: AIInvolvement.HEAVY,
      aiTools: ["ChatGPT", "Cursor"],
      techStack: ["Next.js", "OpenAI", "Tailwind CSS", "Prisma"],
      vibeScore: 76,
      scoreProduct: 83,
      scoreUx: 78,
      scoreEngineering: 74,
      scoreSecurity: 72,
      scorePerformance: 79,
      scoreAccessibility: 71,
      scoreDocumentation: 75,
      isFeatured: false,
      isPublished: true,
      userId: jordan.id,
    },
  });

  const p11 = await prisma.project.create({
    data: {
      slug: "saaskit",
      title: "SaaSKit",
      tagline: "Open-source privacy-friendly analytics SDK for indie web apps.",
      description: "Lightweight 1.8KB event tracking beacon with real-time dashboards and GDPR compliant anonymization.",
      liveUrl: "https://saaskit.org",
      githubUrl: "https://github.com/samdev/saaskit",
      aiInvolvement: AIInvolvement.MINIMAL,
      aiTools: ["Cursor"],
      techStack: ["Go", "Next.js", "ClickHouse", "Tailwind CSS"],
      vibeScore: 89,
      scoreProduct: 90,
      scoreUx: 88,
      scoreEngineering: 93,
      scoreSecurity: 88,
      scorePerformance: 95,
      scoreAccessibility: 80,
      scoreDocumentation: 89,
      isFeatured: true,
      isPublished: true,
      userId: sam.id,
    },
  });

  // Seed versions for projects 4-11
  const otherProjects = [p4, p5, p6, p7, p8, p9, p10, p11];
  for (const proj of otherProjects) {
    await prisma.projectVersion.create({
      data: {
        projectId: proj.id,
        versionNumber: "v1",
        vibeScore: proj.vibeScore,
        scoreDelta: 0,
        changelog: "Initial public submission on VibeCheck.",
      },
    });
  }

  // Seed Reviews for other projects
  await prisma.review.createMany({
    data: [
      {
        projectId: p6.id,
        userId: rahul.id,
        productScore: 9,
        designScore: 8,
        engineeringScore: 9,
        docScore: 8,
        wouldShip: WouldShip.YES,
        whatLiked: "Running Whisper locally via WebAssembly inside the browser is jaw-dropping. No API fees and zero privacy risk!",
        whatToImprove: "Initial 40MB WASM model download needs a clearer progress percentage bar so users don't think it hung.",
        biggestIssue: "Audio input device selection crashes on Firefox if microphone permission is toggled twice.",
        helpfulVotesCount: 16,
      },
      {
        projectId: p7.id,
        userId: marcus.id,
        productScore: 9,
        designScore: 9,
        engineeringScore: 9,
        docScore: 9,
        wouldShip: WouldShip.YES,
        whatLiked: "Terrific architecture tool. The cost calculator accurately matches AWS pricing for EC2 and RDS instances.",
        whatToImprove: "Support VPC peering lines and multi-region transit gateway links.",
        biggestIssue: "Canvas zoom pan on trackpads is a bit jittery.",
        helpfulVotesCount: 22,
      },
      {
        projectId: p4.id,
        userId: elena.id,
        productScore: 8,
        designScore: 9,
        engineeringScore: 8,
        docScore: 7,
        wouldShip: WouldShip.YES,
        whatLiked: "Love the playful micro-animations when completing habits. The dark mode theme is gentle on the eyes.",
        whatToImprove: "Allow setting flexible weekly frequency goals (e.g. 3 times per week instead of strict daily streaks).",
        biggestIssue: "Export data button doesn't trigger on Android Chrome PWA.",
        helpfulVotesCount: 8,
      },
      {
        projectId: p9.id,
        userId: david.id,
        productScore: 8,
        designScore: 8,
        engineeringScore: 8,
        docScore: 8,
        wouldShip: WouldShip.YES,
        whatLiked: "Honest, fast CRM. No bloatware, loaded in 340ms on my 4G connection.",
        whatToImprove: "Add webhook integrations to sync leads from Cal.com or Calendly.",
        biggestIssue: "Session cookie lacked the SameSite=Strict flag.",
        helpfulVotesCount: 12,
      },
    ],
  });

  console.log("Seeding Community Challenges...");
  const challenge1 = await prisma.challenge.create({
    data: {
      title: "Build a Productivity Tool with AI",
      slug: "ai-productivity-challenge",
      description: "Build and submit an AI-assisted productivity application that solves a real everyday bottleneck for developers, students, or knowledge workers.",
      requirements: "Must be built with AI assistance (disclosed). Must have a working live URL. Must achieve a Vibe Score of at least 75 and address all Critical security findings.",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      prize: "1-on-1 Engineering Review with Sarah Chen + VibeCheck Homepage Spotlight + ₹15,000 cloud credits.",
      submissionsCount: 128,
      isActive: true,
    },
  });

  const challenge2 = await prisma.challenge.create({
    data: {
      title: "Ship a Micro-SaaS in 48 Hours",
      slug: "micro-saas-sprint",
      description: "Take an idea from zero to deployed revenue-capable micro-SaaS over a single weekend with AI copilot tools.",
      requirements: "Must include authentication, payment integration or mock checkout, and public project story writeup.",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      prize: "₹25,000 cash grant + Full Security Architecture Audit by Marcus Vance.",
      submissionsCount: 64,
      isActive: true,
    },
  });

  await prisma.challengeSubmission.createMany({
    data: [
      {
        challengeId: challenge1.id,
        projectId: campusConnect.id,
        userId: alex.id,
        rank: 1,
      },
      {
        challengeId: challenge1.id,
        projectId: flowState.id,
        userId: jordan.id,
        rank: 2,
      },
      {
        challengeId: challenge1.id,
        projectId: p6.id,
        userId: liam.id,
        rank: 3,
      },
    ],
  });

  console.log("Seeding Notifications for Alex Rivera...");
  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        type: NotificationType.REVIEW_RECEIVED,
        title: "New Review on CampusConnect",
        message: "Rahul Sharma gave CampusConnect a Product score of 9/10 and noted 1 bug.",
        link: "/projects/campusconnect/reviews",
      },
      {
        userId: alex.id,
        type: NotificationType.EXPERT_UPDATE,
        title: "Expert Review Completed",
        message: "Sarah Chen completed your requested Engineering Review with a score of 84/100.",
        link: `/expert-reports/${expertReview.id}`,
      },
      {
        userId: alex.id,
        type: NotificationType.SCORE_IMPROVED,
        title: "Score Jump! +13 points",
        message: "Your v3 release elevated CampusConnect's Vibe Score from 73 to 86.",
        link: "/projects/campusconnect/versions",
      },
      {
        userId: alex.id,
        type: NotificationType.HELPFUL_VOTE,
        title: "Helpful feedback badge",
        message: "14 developers found your reply to Elena Rostova's review helpful.",
        link: "/projects/campusconnect",
      },
    ],
  });

  console.log("Seeding Moderation Reports for Admin...");
  await prisma.report.create({
    data: {
      reporterId: david.id,
      targetType: ReportTargetType.PROJECT,
      targetId: p8.id,
      reason: ReportReason.MISLEADING,
      details: "The project demo states all universities in India are supported, but only 3 demo campuses have active listings.",
      status: ReportStatus.PENDING,
    },
  });

  console.log("Seeding product analytics events...");
  await prisma.productEvent.createMany({
    data: [
      { eventName: "project_created", userId: alex.id, projectId: campusConnect.id },
      { eventName: "project_published", userId: alex.id, projectId: campusConnect.id },
      { eventName: "review_submitted", userId: rahul.id, projectId: campusConnect.id },
      { eventName: "finding_fixed", userId: alex.id, projectId: campusConnect.id, metadata: JSON.stringify({ findingId: "auth-check" }) },
      { eventName: "project_resubmitted", userId: alex.id, projectId: campusConnect.id, metadata: JSON.stringify({ version: "v3" }) },
      { eventName: "expert_review_requested", userId: alex.id, projectId: campusConnect.id },
      { eventName: "expert_review_completed", userId: sarah.id, projectId: campusConnect.id },
    ],
  });

  
  console.log("Seeding comprehensive community reviews across all projects...");
  const allProjects = await prisma.project.findMany();
  const allUsers = await prisma.user.findMany();
  const reviewAuthors = allUsers.filter((u) => u.username !== "admin");

  const reviewTemplates = [
    {
      productScore: 9, designScore: 8, engineeringScore: 8, docScore: 7, wouldShip: "YES",
      whatLiked: "Great responsive design and crisp micro-interactions. The problem statement is solved directly without unnecessary bloat.",
      whatToImprove: "Could use keyboard shortcut navigation (like j/k) for rapid item browsing.",
      biggestIssue: "Initial render on cold start took ~1.2s before hydration finished.",
      bugReport: "Dark mode toggle flickers slightly on Safari mobile.",
      suggestion: "Add a theme-color meta tag in head to match the browser address bar.",
      helpfulVotesCount: 14,
    },
    {
      productScore: 8, designScore: 9, engineeringScore: 7, docScore: 8, wouldShip: "ALMOST",
      whatLiked: "Clean typography and excellent spacing hierarchy. Contrast ratios pass WCAG AA across all primary text.",
      whatToImprove: "Error states on API failures return a blank screen instead of a retry toast.",
      biggestIssue: "Lack of offline caching when connection drops mid-session.",
      bugReport: "Submitting the form with enter key submits twice if double-clicked.",
      suggestion: "Disable submit button during pending mutation state.",
      helpfulVotesCount: 9,
    },
    {
      productScore: 8, designScore: 8, engineeringScore: 9, docScore: 8, wouldShip: "YES",
      whatLiked: "Very impressed by the database schema modeling. Foreign keys and indexes are set up cleanly.",
      whatToImprove: "Add rate limiting on public unauthenticated endpoints.",
      biggestIssue: "API returns sensitive stack traces when in non-production environments.",
      bugReport: "Token refresh loop triggered if user changes password in another tab.",
      suggestion: "Implement sliding session expiry with Redis or encrypted cookies.",
      helpfulVotesCount: 18,
    },
    {
      productScore: 7, designScore: 8, engineeringScore: 8, docScore: 7, wouldShip: "ALMOST",
      whatLiked: "The onboarding walkthrough makes the core product value clear within 10 seconds.",
      whatToImprove: "Needs clearer empty states when search returns zero results.",
      biggestIssue: "Table layout on 375px mobile view causes horizontal overflow.",
      bugReport: "Table columns truncate without horizontal scroll indicators.",
      suggestion: "Switch from HTML table to stacked cards on viewports under 640px.",
      helpfulVotesCount: 7,
    },
  ];

  let rCount = 0;
  for (const pr of allProjects) {
    for (let k = 0; k < 3; k++) {
      const author = reviewAuthors[(rCount + k) % reviewAuthors.length];
      const tmpl = reviewTemplates[(rCount + k) % reviewTemplates.length];
      if (author.id !== pr.userId) {
        await prisma.review.create({
          data: {
            projectId: pr.id,
            userId: author.id,
            productScore: tmpl.productScore,
            designScore: tmpl.designScore,
            engineeringScore: tmpl.engineeringScore,
            docScore: tmpl.docScore,
            wouldShip: tmpl.wouldShip as any,
            whatLiked: `${tmpl.whatLiked} (Reviewed ${pr.title})`,
            whatToImprove: tmpl.whatToImprove,
            biggestIssue: tmpl.biggestIssue,
            bugReport: tmpl.bugReport,
            suggestion: tmpl.suggestion,
            helpfulVotesCount: tmpl.helpfulVotesCount,
          },
        });
        rCount++;
      }
    }
  }
  console.log(`Added ${rCount} community reviews!`);

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

