import dns from "node:dns/promises";
import net from "node:net";

export interface SSRFValidationResult {
  allowed: boolean;
  reason?: string;
  normalizedHost?: string;
  resolvedIp?: string;
}

/**
 * Parses all IPv4 representations:
 * - Dotted-quad decimal (127.0.0.1)
 * - Shorthand notation (127.1 -> 127.0.0.1, 127.0.1 -> 127.0.0.1)
 * - Pure 32-bit integer / decimal (2130706433 -> 127.0.0.1)
 * - Hexadecimal (0x7f000001 -> 127.0.0.1)
 * - Octal components (0177.0.0.1 -> 127.0.0.1)
 * - Mixed hex/octal/decimal components (0x7f.0.0.1 -> 127.0.0.1)
 */
export function parseAnyIpv4(raw: string): string | null {
  const clean = raw.trim();

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

  // Pure hex representation without dots (e.g., 0x7f000001)
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

  // Dot-separated notation with 1 to 4 parts (decimal, hex, octal components)
  const parts = clean.split(".");
  if (parts.length > 0 && parts.length <= 4) {
    const parsedParts: number[] = [];
    for (const p of parts) {
      if (!p) return null;
      if (/^0x[0-9a-fA-F]+$/i.test(p)) {
        const val = parseInt(p, 16);
        if (isNaN(val) || val < 0) return null;
        parsedParts.push(val);
      } else if (/^0[0-7]+$/.test(p) && p !== "0") {
        const val = parseInt(p, 8);
        if (isNaN(val) || val < 0) return null;
        parsedParts.push(val);
      } else if (/^\d+$/.test(p)) {
        const val = parseInt(p, 10);
        if (isNaN(val) || val < 0) return null;
        parsedParts.push(val);
      } else {
        return null;
      }
    }

    if (parsedParts.length === 1) {
      const num = parsedParts[0];
      if (num > 4294967295) return null;
      return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".");
    } else if (parsedParts.length === 2) {
      const a = parsedParts[0];
      const b = parsedParts[1];
      if (a > 255 || b > 16777215) return null;
      return [a, (b >>> 16) & 255, (b >>> 8) & 255, b & 255].join(".");
    } else if (parsedParts.length === 3) {
      const a = parsedParts[0];
      const b = parsedParts[1];
      const c = parsedParts[2];
      if (a > 255 || b > 255 || c > 65535) return null;
      return [a, b, (c >>> 8) & 255, c & 255].join(".");
    } else if (parsedParts.length === 4) {
      if (parsedParts.some((v) => v > 255)) return null;
      return parsedParts.join(".");
    }
  }

  return null;
}

/**
 * Checks if IPv6 address falls into special-use, loopback, private, link-local, or multicast ranges
 */
function isForbiddenIPv6(ip: string): { blocked: boolean; reason?: string } {
  let clean = ip.toLowerCase();
  if (clean.startsWith("[") && clean.endsWith("]")) clean = clean.slice(1, -1);
  if (clean.includes("%")) clean = clean.split("%")[0]; // Strip zone identifier

  // ::1/128 Loopback
  if (clean === "::1" || clean === "0:0:0:0:0:0:0:1") {
    return { blocked: true, reason: "IPv6 ::1/128 (Loopback)" };
  }
  // ::/128 Unspecified
  if (clean === "::" || clean === "0:0:0:0:0:0:0:0") {
    return { blocked: true, reason: "IPv6 ::/128 (Unspecified Address)" };
  }

  // Check first hextet
  const firstHextet = clean.split(":")[0];
  const num = parseInt(firstHextet, 16);
  if (!isNaN(num)) {
    // fe80::/10 Link-Local Unicast (fe80 - febf)
    if (num >= 0xfe80 && num <= 0xfebf) {
      return { blocked: true, reason: "IPv6 fe80::/10 (Link-Local Unicast)" };
    }
    // fc00::/7 Unique Local Address (fc00 - fdff, RFC 4193)
    if (num >= 0xfc00 && num <= 0xfdff) {
      return { blocked: true, reason: "IPv6 fc00::/7 (Unique Local Address)" };
    }
    // ff00::/8 Multicast (ff00 - ffff)
    if (num >= 0xff00 && num <= 0xffff) {
      return { blocked: true, reason: "IPv6 ff00::/8 (Multicast)" };
    }
    // 2001:db8::/32 Documentation prefix
    if (num === 0x2001 && clean.split(":")[1] === "db8") {
      return { blocked: true, reason: "IPv6 2001:db8::/32 (Documentation Prefix)" };
    }
    // 2001::/23 IETF Protocol Assignments (TEREDO etc)
    if (num === 0x2001 && (parseInt(clean.split(":")[1] || "0", 16) & 0xfe00) === 0) {
      return { blocked: true, reason: "IPv6 2001::/23 (Protocol Assignments)" };
    }
    // 64:ff9b::/96 IPv4/IPv6 Translation (RFC 6052)
    if (clean.startsWith("64:ff9b:")) {
      return { blocked: true, reason: "IPv6 64:ff9b::/96 (Translation Prefix)" };
    }
    // 100::/64 Discard-only prefix (RFC 6666)
    if (num === 0x100) {
      return { blocked: true, reason: "IPv6 100::/64 (Discard Prefix)" };
    }
  }

  return { blocked: false };
}

/**
 * Verifies whether an IP address belongs to reserved, private, loopback, or cloud metadata ranges.
 */
export function isForbiddenIp(ip: string): { blocked: boolean; reason?: string } {
  // 1. Normalize IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 -> 127.0.0.1 or ::ffff:7f00:1)
  let cleanIp = ip;
  const mappedMatch = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mappedMatch) {
    cleanIp = mappedMatch[1];
  } else if (/^::ffff:[0-9a-f]{1,4}:[0-9a-f]{1,4}$/i.test(ip)) {
    // Hex IPv4-mapped IPv6 e.g. ::ffff:7f00:1
    const parts = ip.slice(7).split(":");
    const high = parseInt(parts[0], 16);
    const low = parseInt(parts[1], 16);
    const b0 = (high >>> 8) & 255;
    const b1 = high & 255;
    const b2 = (low >>> 8) & 255;
    const b3 = low & 255;
    cleanIp = `${b0}.${b1}.${b2}.${b3}`;
  }

  // 2. IPv6 checks
  if (net.isIPv6(cleanIp)) {
    const v6Check = isForbiddenIPv6(cleanIp);
    if (v6Check.blocked) return v6Check;
    return { blocked: false };
  }

  // 3. Normalize IPv4 representations (octal, hex, decimal)
  const normalizedV4 = parseAnyIpv4(cleanIp);
  if (!normalizedV4) {
    return { blocked: true, reason: "Invalid or unrecognized IP address format" };
  }

  const parts = normalizedV4.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return { blocked: true, reason: "Malformed IPv4 octets" };
  }

  const [b0, b1, b2, b3] = parts;

  // 0.0.0.0/8 Current network (RFC 1122)
  if (b0 === 0) return { blocked: true, reason: "0.0.0.0/8 Current Network" };

  // 127.0.0.0/8 Loopback (RFC 1122)
  if (b0 === 127) return { blocked: true, reason: "127.0.0.0/8 Loopback Network" };

  // 10.0.0.0/8 Private network (RFC 1918)
  if (b0 === 10) return { blocked: true, reason: "10.0.0.0/8 Private Network (RFC 1918)" };

  // 172.16.0.0/12 Private network (RFC 1918: 172.16.0.0 - 172.31.255.255)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return { blocked: true, reason: "172.16.0.0/12 Private Network (RFC 1918)" };

  // 192.168.0.0/16 Private network (RFC 1918)
  if (b0 === 192 && b1 === 168) return { blocked: true, reason: "192.168.0.0/16 Private Network (RFC 1918)" };

  // 169.254.0.0/16 Link-local / Cloud Metadata (AWS/GCP/Azure, RFC 3927)
  if (b0 === 169 && b1 === 254) return { blocked: true, reason: "169.254.0.0/16 Link-Local / Cloud Metadata (RFC 3927)" };

  // 100.64.0.0/10 Carrier-Grade NAT (RFC 6598: 100.64.0.0 - 100.127.255.255)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return { blocked: true, reason: "100.64.0.0/10 Carrier-Grade NAT (RFC 6598)" };

  // 192.0.0.0/24 IETF Protocol Assignments (RFC 6890)
  if (b0 === 192 && b1 === 0 && b2 === 0) return { blocked: true, reason: "192.0.0.0/24 Protocol Assignments" };

  // 192.0.2.0/24 TEST-NET-1 Documentation (RFC 5737)
  if (b0 === 192 && b1 === 0 && b2 === 2) return { blocked: true, reason: "192.0.2.0/24 TEST-NET-1 (Documentation)" };

  // 198.51.100.0/24 TEST-NET-2 Documentation (RFC 5737)
  if (b0 === 198 && b1 === 51 && b2 === 100) return { blocked: true, reason: "198.51.100.0/24 TEST-NET-2 (Documentation)" };

  // 203.0.113.0/24 TEST-NET-3 Documentation (RFC 5737)
  if (b0 === 203 && b1 === 0 && b2 === 113) return { blocked: true, reason: "203.0.113.0/24 TEST-NET-3 (Documentation)" };

  // 198.18.0.0/15 Benchmark testing (RFC 2544)
  if (b0 === 198 && (b1 === 18 || b1 === 19)) return { blocked: true, reason: "198.18.0.0/15 Benchmark Testing (RFC 2544)" };

  // 224.0.0.0/4 Multicast (RFC 5771: 224.0.0.0 - 239.255.255.255)
  if (b0 >= 224 && b0 <= 239) return { blocked: true, reason: "224.0.0.0/4 Multicast (RFC 5771)" };

  // 240.0.0.0/4 Reserved for future use (RFC 1112: 240.0.0.0 - 255.255.255.254)
  if (b0 >= 240) return { blocked: true, reason: "240.0.0.0/4 Reserved for Future Use (RFC 1112)" };

  // 255.255.255.255 Broadcast (RFC 919)
  if (b0 === 255 && b1 === 255 && b2 === 255 && b3 === 255) return { blocked: true, reason: "255.255.255.255 Broadcast" };

  return { blocked: false };
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

  // Check if hostname is any numeric IPv4 notation (decimal, hex, octal, shorthand)
  const normalizedV4 = parseAnyIpv4(hostname);
  if (normalizedV4) {
    const v4Check = isForbiddenIp(normalizedV4);
    if (v4Check.blocked) {
      return { allowed: false, reason: `Numeric IP (${hostname} -> ${normalizedV4}) resolves to forbidden subnet: ${v4Check.reason}` };
    }
    return { allowed: true, normalizedHost: normalizedV4, resolvedIp: normalizedV4 };
  }

  // Check if hostname is literal IPv6 address
  if (net.isIPv6(hostname)) {
    const v6Check = isForbiddenIp(hostname);
    if (v6Check.blocked) {
      return { allowed: false, reason: `Literal IPv6 address (${hostname}) blocked: ${v6Check.reason}` };
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
      const ipCheck = isForbiddenIp(addr.address);
      if (ipCheck.blocked) {
        return {
          allowed: false,
          reason: `DNS resolution for ${hostname} resolved to forbidden IP (${addr.address}): ${ipCheck.reason}`,
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
