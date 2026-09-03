import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { User, Role } from "@prisma/client";

export const DEFAULT_USER_USERNAME = "alexrivera";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("vibecheck_user_id")?.value;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user) return user;
    }

    // Default to Alex Rivera for demo if no cookie set
    const defaultUser = await prisma.user.findUnique({
      where: { username: DEFAULT_USER_USERNAME },
    });
    return defaultUser;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
