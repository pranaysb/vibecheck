import { clerkMiddleware } from "@clerk/nextjs/server";

// Attaches Clerk's auth state to every request. Pages and actions enforce access themselves
// (lib/auth/session.ts requireUser, lib/access.ts canViewAudit), so no route is blocked here.
//
// Content-Security-Policy: Clerk's strict mode issues a per-request nonce with 'strict-dynamic' (Next.js
// applies the nonce to its own scripts), on top of the origins Clerk itself needs. We add only what the
// app uses: Vercel Blob client uploads and no framing by other sites (fonts are self-hosted).
export default clerkMiddleware({
  contentSecurityPolicy: {
    strict: true,
    directives: {
      "font-src": ["self"],
      "img-src": ["data:"],
      "connect-src": ["https://vercel.com", "https://*.blob.vercel-storage.com"],
      "frame-ancestors": ["none"],
      "base-uri": ["self"],
      "object-src": ["none"],
    },
  },
});

export const config = {
  matcher: [
    // Skip Next internals, static files, and /preview: sandboxed uploads carry their own CSP and use
    // signed-token access, so Clerk must not touch them (its CSP would replace the sandbox policy).
    "/((?!_next|preview/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
