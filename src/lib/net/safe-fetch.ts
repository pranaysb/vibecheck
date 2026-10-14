import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import type { TLSSocket } from "node:tls";
import { validateTargetDestination } from "@/lib/security/ssrf";
import { CookieJar } from "./cookie-jar";

// A browser-style UA with VibeCheck appended (the convention Lighthouse uses). Some sites silently drop
// requests from bot-only UAs (stripe.com never answers "compatible; VibeCheckAudit"), which made them look
// down. The VibeCheckAudit token still identifies us to anyone reading their logs.
export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 VibeCheckAudit/2.0 (+https://github.com/pranaysb/vibecheck)";

export interface TlsInfo {
  authorized: boolean;
  authorizationError?: string;
  validTo?: string;
  issuer?: string;
  protocol?: string | null;
}

export interface FetchResult {
  url: string;
  status: number;
  headers: Record<string, string>;
  setCookies: string[];
  body: Buffer;
  /** Bytes on the wire before decompression. */
  transferBytes: number;
  truncated: boolean;
  ttfbMs: number;
  totalMs: number;
  resolvedIp: string;
  tls?: TlsInfo;
  redirects: { url: string; status: number }[];
}

export interface SafeFetchOptions {
  maxRedirects?: number;
  maxBytes?: number;
  timeoutMs?: number;
  followRedirects?: boolean;
}

export class BlockedDestinationError extends Error {}

/**
 * GET a URL with SSRF protection. Every hop is validated, and the socket is pinned to the
 * exact IP that passed validation, so a DNS answer cannot change between check and connect.
 */
export async function safeFetch(input: string, opts: SafeFetchOptions = {}): Promise<FetchResult> {
  const { maxRedirects = 8, maxBytes = 2 * 1024 * 1024, timeoutMs = 10_000, followRedirects = true } = opts;
  const redirects: { url: string; status: number }[] = [];
  const jar = new CookieJar();
  let url = input;
  const started = performance.now();

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const check = await validateTargetDestination(url);
    if (!check.allowed || !check.resolvedIp) {
      throw new BlockedDestinationError(`Blocked destination ${url}: ${check.reason ?? "not allowed"}`);
    }
    const res = await requestOnce(url, check.resolvedIp, maxBytes, timeoutMs, jar.header(url));
    jar.store(res.setCookies, url);
    const location = res.headers["location"];
    if (followRedirects && res.status >= 300 && res.status < 400 && location) {
      redirects.push({ url, status: res.status });
      url = new URL(location, url).toString();
      continue;
    }
    return { ...res, redirects, totalMs: Math.round(performance.now() - started) };
  }
  throw new Error(`Too many redirects (more than ${maxRedirects})`);
}

function requestOnce(
  url: string,
  pinnedIp: string,
  maxBytes: number,
  timeoutMs: number,
  cookie?: string
): Promise<Omit<FetchResult, "redirects" | "totalMs">> {
  const parsed = new URL(url);
  const isHttps = parsed.protocol === "https:";
  const family = net.isIPv6(pinnedIp) ? 6 : 4;
  const started = performance.now();

  return new Promise((resolve, reject) => {
    const req = (isHttps ? https : http).request(
      {
        method: "GET",
        hostname: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : isHttps ? 443 : 80,
        path: parsed.pathname + parsed.search,
        servername: isHttps && !net.isIP(parsed.hostname) ? parsed.hostname : undefined,
        lookup: ((_host: string, options: { all?: boolean }, cb: (...args: unknown[]) => void) => {
          if (options?.all) cb(null, [{ address: pinnedIp, family }]);
          else cb(null, pinnedIp, family);
        }) as unknown as net.LookupFunction,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US,en;q=0.9",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const ttfbMs = Math.round(performance.now() - started);
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (v !== undefined && k !== "set-cookie") headers[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : v;
        }
        const setCookies = res.headers["set-cookie"] ?? [];

        let tls: TlsInfo | undefined;
        if (isHttps) {
          const sock = res.socket as TLSSocket;
          const cert = sock.getPeerCertificate?.();
          tls = {
            authorized: sock.authorized,
            authorizationError: sock.authorizationError ? String(sock.authorizationError) : undefined,
            validTo: cert?.valid_to,
            issuer: [cert?.issuer?.O ?? cert?.issuer?.CN].flat()[0],
            protocol: sock.getProtocol?.(),
          };
        }

        const chunks: Buffer[] = [];
        let received = 0;
        let truncated = false;
        res.on("data", (chunk: Buffer) => {
          if (received >= maxBytes) {
            truncated = true;
            res.destroy();
            return;
          }
          chunks.push(chunk);
          received += chunk.length;
        });
        const finish = () => {
          const raw = Buffer.concat(chunks);
          resolve({
            url,
            status: res.statusCode ?? 0,
            headers,
            setCookies,
            body: decode(raw, headers["content-encoding"], truncated),
            transferBytes: raw.length,
            truncated,
            ttfbMs,
            resolvedIp: pinnedIp,
            tls,
          });
        };
        res.on("end", finish);
        res.on("close", () => truncated && finish());
        res.on("error", (e) => (truncated ? finish() : reject(e)));
      }
    );
    req.on("timeout", () => req.destroy(new Error(`Timed out after ${timeoutMs}ms`)));
    req.on("error", (e: NodeJS.ErrnoException) => {
      const err = new Error(`Could not reach ${parsed.host}: ${e.message}`) as Error & { code?: string };
      err.code = e.code;
      reject(err);
    });
    req.end();
  });
}

function decode(raw: Buffer, encoding: string | undefined, truncated: boolean): Buffer {
  if (!encoding || !raw.length) return raw;
  const flush = truncated ? { finishFlush: zlib.constants.Z_SYNC_FLUSH } : {};
  try {
    if (encoding.includes("br")) return zlib.brotliDecompressSync(raw, truncated ? { finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH } : {});
    if (encoding.includes("gzip")) return zlib.gunzipSync(raw, flush);
    if (encoding.includes("deflate")) return zlib.inflateSync(raw, flush);
  } catch {
    return raw;
  }
  return raw;
}
