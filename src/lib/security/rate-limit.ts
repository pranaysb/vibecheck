import { prisma } from "@/lib/db";

/**
 * Fixed-window rate limiting stored in Postgres, so limits hold across serverless instances
 * (an in-memory limiter resets per instance and is trivially bypassed on Vercel).
 * One atomic upsert per check: the window resets when it has expired, otherwise the count increments.
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number, now = new Date()): Promise<RateLimitResult> {
  // Prisma stores DateTime as UTC "timestamp without time zone"; pin raw parameters to UTC too,
  // or the database session's timezone would shift them.
  const ts = now.toISOString();
  const rows = await prisma.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO vibecheck."RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, (${ts}::timestamptz AT TIME ZONE 'UTC'), 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" <= (${ts}::timestamptz AT TIME ZONE 'UTC') - make_interval(secs => ${windowSeconds}) THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" <= (${ts}::timestamptz AT TIME ZONE 'UTC') - make_interval(secs => ${windowSeconds}) THEN (${ts}::timestamptz AT TIME ZONE 'UTC') ELSE "RateLimit"."windowStart" END
    RETURNING "count", "windowStart"`;
  const { count, windowStart } = rows[0];
  const resetsAt = windowStart.getTime() + windowSeconds * 1000;
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: count <= limit ? 0 : Math.max(1, Math.ceil((resetsAt - now.getTime()) / 1000)),
  };
}

/** Deletes counters whose window ended long ago. Called from the daily maintenance cron. */
export async function pruneRateLimits(olderThanSeconds = 24 * 3600, now = new Date()) {
  const { count } = await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - olderThanSeconds * 1000) } } });
  return count;
}

/** Client IP as seen by the platform. Vercel sets x-real-ip / x-forwarded-for itself, so clients can't spoof the first hop. */
export function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "127.0.0.1";
}

export function extractTargetDomain(urlStr: string): string | null {
  try {
    const target = urlStr.trim();
    const withProto = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(target) ? target : `https://${target}`;
    const parsed = new URL(withProto);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}
