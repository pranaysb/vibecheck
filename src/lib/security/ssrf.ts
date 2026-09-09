import dns from "node:dns/promises";
import net from "node:net";

export interface SSRFValidationResult {
  allowed: boolean;
  reason?: string;
  normalizedHost?: string;
  resolvedIp?: string;
}

/**
 * Parses numeric (decimal, hex, octal) IPv4 representations
 * e.g., 2130706433 -> 127.0.0.1, 0x7f000001 -> 127.0.0.1
 */
function parseNumericIpv4(hostname: string): string | null {
  const clean = hostname.trim();

  // Pure integer / decimal representation (e.g., 2130706433)
  if (/^\d+$/.test(clean)) {
    const num = Number(clean);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join(".");
    }
  }

  // Hex representation (e.g., 0x7f000001)
  if (/^0x[0-9a-fA-F]+$/i.test(clean)) {
    const num = parseInt(clean, 16);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join(".");
    }
  }

  return null;
}

/**
 * Verifies whether an IP address belongs to reserved, private, loopback, or cloud metadata ranges.
 */
export function isForbiddenIp(ip: string): boolean {
  // Normalize IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
  const mappedMatch = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const cleanIp = mappedMatch ? mappedMatch[1] : ip;

  // IPv6 loopback & private checks
  if (cleanIp === "::1" || cleanIp === "::") return true;
  if (cleanIp.toLowerCase().startsWith("fe80:")) return true; // Link-local
  if (cleanIp.toLowerCase().startsWith("fc00:") || cleanIp.toLowerCase().startsWith("fd00:")) return true; // Unique local

  // If not IPv4, reject by default for safe scanning
  if (!net.isIPv4(cleanIp)) {
    return true;
  }

  const parts = cleanIp.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true;
  }

  const [b0, b1, b2, b3] = parts;

  // 0.0.0.0/8 Current network (only valid as source address)
  if (b0 === 0) return true;

  // 127.0.0.0/8 Loopback
  if (b0 === 127) return true;

  // 10.0.0.0/8 Private network
  if (b0 === 10) return true;

  // 172.16.0.0/12 Private network (172.16.0.0 - 172.31.255.255)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

  // 192.168.0.0/16 Private network
  if (b0 === 192 && b1 === 168) return true;

  // 169.254.0.0/16 Link-local / Cloud Metadata (AWS/GCP/Azure)
  if (b0 === 169 && b1 === 254) return true;

  // 100.64.0.0/10 Carrier-Grade NAT (Shared Address Space)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

  // 224.0.0.0/4 Multicast
  if (b0 >= 224 && b0 <= 239) return true;

  // 240.0.0.0/4 Reserved for future use
  if (b0 >= 240) return true;

  // 255.255.255.255 Broadcast
  if (b0 === 255 && b1 === 255 && b2 === 255 && b3 === 255) return true;

  return false;
}

/**
 * Validates a target URL destination prior to socket dispatch.
 * Resolves DNS and inspects every returned IP record.
 */
export async function validateTargetDestination(targetUrl: string): Promise<SSRFValidationResult> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { allowed: false, reason: "Invalid URL syntax" };
  }

  // Enforce protocol whitelist
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { allowed: false, reason: "Protocol not allowed (only HTTP and HTTPS supported)" };
  }

  // Strip credentials in URL
  if (parsed.username || parsed.password) {
    return { allowed: false, reason: "Embedded URL credentials not permitted" };
  }

  let hostname = parsed.hostname.toLowerCase();

  // Strip IPv6 enclosing brackets e.g. [::1] -> ::1
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    hostname = hostname.slice(1, -1);
  }

  // Check for common loopback domain names
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal" ||
    hostname === "instance-data"
  ) {
    return { allowed: false, reason: "Localhost or internal cloud metadata hostname blocked" };
  }

  // Check if hostname is numeric IPv4 (decimal or hex)
  const numericIp = parseNumericIpv4(hostname);
  if (numericIp) {
    if (isForbiddenIp(numericIp)) {
      return { allowed: false, reason: `Numeric IP (${hostname} -> ${numericIp}) resolves to forbidden subnet` };
    }
    return { allowed: true, normalizedHost: numericIp, resolvedIp: numericIp };
  }

  // If already a literal IP address
  if (net.isIP(hostname)) {
    if (isForbiddenIp(hostname)) {
      return { allowed: false, reason: `Literal IP ${hostname} is a protected or private subnet` };
    }
    return { allowed: true, normalizedHost: hostname, resolvedIp: hostname };
  }

  // Perform DNS resolution of A and AAAA records
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { allowed: false, reason: "DNS resolution returned zero records" };
    }

    for (const addr of addresses) {
      if (isForbiddenIp(addr.address)) {
        return {
          allowed: false,
          reason: `DNS resolution for ${hostname} resolved to forbidden IP: ${addr.address}`,
          resolvedIp: addr.address,
        };
      }
    }

    return {
      allowed: true,
      normalizedHost: hostname,
      resolvedIp: addresses[0].address,
    };
  } catch (err: any) {
    return { allowed: false, reason: `DNS resolution failed: ${err.message}` };
  }
}
