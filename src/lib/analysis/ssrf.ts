import dns from "node:dns/promises";
import net from "node:net";

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  bodySnippet: string;
  durationMs: number;
  finalUrl: string;
  tlsInfo?: {
    isHttps: boolean;
  };
  error?: string;
}

// IP range checkers
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // invalid -> treat as unsafe
  }

  // 127.0.0.0/8 (loopback)
  if (parts[0] === 127) return true;
  // 0.0.0.0/8
  if (parts[0] === 0) return true;
  // 10.0.0.0/8 (private)
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (private: 172.16.0.0 - 172.31.255.255)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16 (private)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (link-local & AWS/cloud metadata)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 100.64.0.0/10 (carrier-grade NAT)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  // fc00::/7 (unique local)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  // fe80::/10 (link-local)
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }
  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.includes("::ffff:")) {
    const v4 = normalized.split("::ffff:")[1];
    if (v4 && isPrivateIPv4(v4)) return true;
  }
  return false;
}

export function validateTargetUrl(rawUrl: string): { isValid: boolean; reason?: string; url?: URL } {
  try {
    const url = new URL(rawUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { isValid: false, reason: "Only HTTP and HTTPS protocols are permitted." };
    }

    const hostname = url.hostname.toLowerCase();

    // Check banned local hostnames
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".lan") ||
      hostname.endsWith(".test")
    ) {
      return { isValid: false, reason: "Requests to localhost or internal network domains are blocked." };
    }

    // Direct IP address check
    if (net.isIPv4(hostname) && isPrivateIPv4(hostname)) {
      return { isValid: false, reason: "Requests to private/reserved IPv4 addresses are prohibited." };
    }
    if (net.isIPv6(hostname) && isPrivateIPv6(hostname)) {
      return { isValid: false, reason: "Requests to private/reserved IPv6 addresses are prohibited." };
    }

    return { isValid: true, url };
  } catch {
    return { isValid: false, reason: "Invalid target URL format." };
  }
}

export async function safeFetchUrl(rawUrl: string): Promise<SafeFetchResult> {
  const validation = validateTargetUrl(rawUrl);
  if (!validation.isValid || !validation.url) {
    return {
      ok: false,
      status: 0,
      headers: {},
      bodySnippet: "",
      durationMs: 0,
      finalUrl: rawUrl,
      error: validation.reason || "Invalid URL",
    };
  }

  const url = validation.url;

  try {
    // Resolve DNS and verify all resolved addresses against private ranges
    const addresses = await dns.lookup(url.hostname, { all: true });
    for (const record of addresses) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return {
          ok: false,
          status: 0,
          headers: {},
          bodySnippet: "",
          durationMs: 0,
          finalUrl: rawUrl,
          error: `DNS resolution returned protected internal address: ${record.address}`,
        };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return {
          ok: false,
          status: 0,
          headers: {},
          bodySnippet: "",
          durationMs: 0,
          finalUrl: rawUrl,
          error: `DNS resolution returned protected IPv6 address: ${record.address}`,
        };
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const startTime = Date.now();

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "VibeCheck-Scanner/1.0 (+https://vibecheck.dev/bot)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);
    const durationMs = Date.now() - startTime;

    const headersRecord: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      headersRecord[key.toLowerCase()] = val;
    });

    const text = await response.text();
    // Cap text to 100KB for inspection
    const bodySnippet = text.slice(0, 100_000);

    return {
      ok: response.ok,
      status: response.status,
      headers: headersRecord,
      bodySnippet,
      durationMs,
      finalUrl: response.url || url.toString(),
      tlsInfo: {
        isHttps: url.protocol === "https:",
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      headers: {},
      bodySnippet: "",
      durationMs: 0,
      finalUrl: rawUrl,
      error: err.name === "AbortError" ? "Connection timed out after 4500ms" : err.message,
    };
  }
}
