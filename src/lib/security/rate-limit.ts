/**
 * In-Memory Sliding-Window Rate Limiter for VibeCheck Endpoints.
 * Defends public unauthenticated scanner against:
 * 1. Volumetric request abuse from a single client IP (max 15 scans / minute)
 * 2. Distributed target domain hammering (max 5 scans / minute per destination host)
 */

export interface RateLimitConfig {
  windowMs: number;
  maxPerIp: number;
  maxPerDomain: number;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute sliding window
  maxPerIp: 15,        // 15 scans per minute per IP
  maxPerDomain: 5,     // 5 scans per minute per target domain
};

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
}

// In-memory sliding timestamp logs: key -> Array of epoch milliseconds
const ipStore = new Map<string, number[]>();
const domainStore = new Map<string, number[]>();
let lastCleanup = Date.now();

/**
 * Periodically purge timestamps older than the sliding window to prevent memory leaks
 */
function cleanupExpiredRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 30 * 1000) return; // Cleanup at most once every 30s
  lastCleanup = now;

  const threshold = now - windowMs;

  for (const [key, timestamps] of ipStore.entries()) {
    const valid = timestamps.filter((t) => t > threshold);
    if (valid.length === 0) {
      ipStore.delete(key);
    } else {
      ipStore.set(key, valid);
    }
  }

  for (const [key, timestamps] of domainStore.entries()) {
    const valid = timestamps.filter((t) => t > threshold);
    if (valid.length === 0) {
      domainStore.delete(key);
    } else {
      domainStore.set(key, valid);
    }
  }
}

/**
 * Extract client IP from incoming request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const clientIp = forwarded.split(",")[0]?.trim();
    if (clientIp) return clientIp;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Parse and normalize target destination domain
 */
export function extractTargetDomain(urlStr: string): string | null {
  try {
    const target = urlStr.trim();
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(target);
    const withProto = hasScheme ? target : `https://${target}`;
    const parsed = new URL(withProto);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * Evaluate rate limits for requester IP and destination domain.
 * Records the request if allowed.
 */
export function checkRateLimit(
  params: { ip: string; domain?: string | null },
  customConfig?: Partial<RateLimitConfig>
): RateLimitCheckResult {
  const config: RateLimitConfig = {
    ...DEFAULT_RATE_LIMIT_CONFIG,
    ...customConfig,
  };

  const now = Date.now();
  const windowStart = now - config.windowMs;
  cleanupExpiredRecords(config.windowMs);

  // 1. Check Requester IP Limit
  const ipKey = params.ip.trim();
  const rawIpTimestamps = ipStore.get(ipKey) || [];
  const validIpTimestamps = rawIpTimestamps.filter((t) => t > windowStart);
  ipStore.set(ipKey, validIpTimestamps);

  if (validIpTimestamps.length >= config.maxPerIp) {
    const oldestTimestamp = validIpTimestamps[0] || now;
    const resetMs = Math.max(1000, config.windowMs - (now - oldestTimestamp));
    const retryAfterSeconds = Math.ceil(resetMs / 1000);

    return {
      allowed: false,
      reason: `Rate limit exceeded: Maximum ${config.maxPerIp} requests per minute per IP. Please retry in ${retryAfterSeconds}s.`,
      limit: config.maxPerIp,
      remaining: 0,
      resetMs,
      retryAfterSeconds,
    };
  }

  // 2. Check Target Domain Limit (preventing third-party harassment / DoS)
  if (params.domain) {
    const domainKey = params.domain.trim().toLowerCase();
    const rawDomainTimestamps = domainStore.get(domainKey) || [];
    const validDomainTimestamps = rawDomainTimestamps.filter((t) => t > windowStart);
    domainStore.set(domainKey, validDomainTimestamps);

    if (validDomainTimestamps.length >= config.maxPerDomain) {
      const oldestTimestamp = validDomainTimestamps[0] || now;
      const resetMs = Math.max(1000, config.windowMs - (now - oldestTimestamp));
      const retryAfterSeconds = Math.ceil(resetMs / 1000);

      return {
        allowed: false,
        reason: `Target domain cooldown: Maximum ${config.maxPerDomain} scans per minute against ${params.domain} to prevent upstream overload. Please retry in ${retryAfterSeconds}s.`,
        limit: config.maxPerDomain,
        remaining: 0,
        resetMs,
        retryAfterSeconds,
      };
    }
  }

  // Record this scan
  validIpTimestamps.push(now);
  ipStore.set(ipKey, validIpTimestamps);

  if (params.domain) {
    const domainKey = params.domain.trim().toLowerCase();
    const domainTimestamps = domainStore.get(domainKey) || [];
    domainTimestamps.push(now);
    domainStore.set(domainKey, domainTimestamps);
  }

  const remaining = Math.max(0, config.maxPerIp - validIpTimestamps.length);
  const oldestTimestamp = validIpTimestamps[0] || now;
  const resetMs = Math.max(1000, config.windowMs - (now - oldestTimestamp));

  return {
    allowed: true,
    limit: config.maxPerIp,
    remaining,
    resetMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Clear rate limit store (used in test suites)
 */
export function resetRateLimitStore(): void {
  ipStore.clear();
  domainStore.clear();
  lastCleanup = 0;
}
