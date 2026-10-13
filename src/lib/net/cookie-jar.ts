/**
 * Minimal RFC 6265 cookie jar for following redirect chains like a browser does. Many sites (auth
 * handshakes, consent walls, load balancers) set a cookie and redirect back; without replaying it the
 * chain loops forever. Lives for a single fetch only; nothing is persisted.
 */
interface Cookie {
  name: string;
  value: string;
  domain: string;
  hostOnly: boolean;
  path: string;
  secure: boolean;
  expires: number | null;
}

function defaultPath(url: URL): string {
  const p = url.pathname;
  if (!p.startsWith("/") || p.lastIndexOf("/") === 0) return "/";
  return p.slice(0, p.lastIndexOf("/"));
}

function domainMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith("." + domain);
}

function pathMatches(reqPath: string, cookiePath: string): boolean {
  if (reqPath === cookiePath) return true;
  if (!reqPath.startsWith(cookiePath)) return false;
  return cookiePath.endsWith("/") || reqPath[cookiePath.length] === "/";
}

export class CookieJar {
  private cookies: Cookie[] = [];

  store(setCookies: string[], requestUrl: string, now = Date.now()) {
    const url = new URL(requestUrl);
    const host = url.hostname.toLowerCase();
    for (const header of setCookies) {
      const [pair, ...attrs] = header.split(";");
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      let domain = host;
      let hostOnly = true;
      let path = defaultPath(url);
      let secure = false;
      let expires: number | null = null;
      let maxAge: number | null = null;
      for (const raw of attrs) {
        const [k, ...v] = raw.trim().split("=");
        const val = v.join("=").trim();
        switch (k.toLowerCase()) {
          case "domain": {
            const d = val.replace(/^\./, "").toLowerCase();
            if (!d || !domainMatches(host, d)) {
              domain = ""; // a cookie for an unrelated domain is rejected
            } else {
              domain = d;
              hostOnly = false;
            }
            break;
          }
          case "path":
            if (val.startsWith("/")) path = val;
            break;
          case "secure":
            secure = true;
            break;
          case "max-age":
            if (/^-?\d+$/.test(val)) maxAge = Number(val);
            break;
          case "expires": {
            const t = Date.parse(val);
            if (!Number.isNaN(t)) expires = t;
            break;
          }
        }
      }
      if (!domain) continue;
      if (maxAge !== null) expires = maxAge <= 0 ? 0 : now + maxAge * 1000;
      this.cookies = this.cookies.filter((c) => !(c.name === name && c.domain === domain && c.path === path));
      if (expires !== null && expires <= now) continue; // deletion
      this.cookies.push({ name, value, domain, hostOnly, path, secure, expires });
    }
  }

  header(requestUrl: string, now = Date.now()): string | undefined {
    const url = new URL(requestUrl);
    const host = url.hostname.toLowerCase();
    const matching = this.cookies
      .filter((c) => (c.expires === null || c.expires > now) && (c.hostOnly ? host === c.domain : domainMatches(host, c.domain)))
      .filter((c) => pathMatches(url.pathname || "/", c.path) && (!c.secure || url.protocol === "https:"))
      .sort((a, b) => b.path.length - a.path.length);
    return matching.length ? matching.map((c) => `${c.name}=${c.value}`).join("; ") : undefined;
  }
}
