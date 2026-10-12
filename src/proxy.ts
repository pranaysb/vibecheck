import { clerkMiddleware } from "@clerk/nextjs/server";

// Attaches Clerk's auth state to every request. Pages and actions enforce access themselves
// (lib/auth/session.ts requireUser, lib/access.ts canViewAudit), so no route is blocked here.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
