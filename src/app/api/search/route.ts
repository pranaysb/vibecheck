import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({ projects: [], users: [], experts: [] });
    }

    const [projects, users, experts] = await Promise.all([
      prisma.project.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { tagline: { contains: q, mode: "insensitive" } },
            { techStack: { has: q } },
          ],
        },
        select: {
          id: true,
          slug: true,
          title: true,
          tagline: true,
          vibeScore: true,
          techStack: true,
          creator: { select: { name: true, username: true } },
        },
        take: 6,
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
            { bio: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
          reputationPoints: true,
        },
        take: 5,
      }),
      prisma.expertProfile.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { specialties: { has: q } },
            { bio: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatar: true },
          },
        },
        take: 4,
      }),
    ]);

    return NextResponse.json({ projects, users, experts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
