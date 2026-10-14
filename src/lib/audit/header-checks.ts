import type { CheckResult } from "./types";

type Headers = Record<string, string>;

function directive(csp: string, name: string): string | null {
  for (const part of csp.split(";")) {
    const [k, ...v] = part.trim().split(/\s+/);
    if (k?.toLowerCase() === name) return v.join(" ");
  }
  return null;
}

export function headerChecks(h: Headers, setCookies: string[], isHttps: boolean): CheckResult[] {
  const out: CheckResult[] = [];
  const csp = h["content-security-policy"] ?? "";

  // Content-Security-Policy
  const scriptSrc = csp ? directive(csp, "script-src") ?? directive(csp, "default-src") : null;
  const hasNonceOrHash = scriptSrc ? /'nonce-|'sha(256|384|512)-|'strict-dynamic'/.test(scriptSrc) : false;
  const unsafeInline = scriptSrc ? scriptSrc.includes("'unsafe-inline'") && !hasNonceOrHash : false;
  const unsafeEval = scriptSrc ? scriptSrc.includes("'unsafe-eval'") : false;
  out.push({
    id: "sec-csp",
    category: "security",
    severity: "medium",
    method: "http",
    title: "Content-Security-Policy",
    status: !csp ? "fail" : !scriptSrc || unsafeInline ? "warn" : "pass",
    detail: !csp
      ? "No Content-Security-Policy. If an attacker ever manages to inject code into your page (cross-site scripting), browsers will run it with nothing to stop them."
      : !scriptSrc
        ? "A CSP is set but defines neither script-src nor default-src, so scripts are unrestricted."
        : unsafeInline
          ? "The policy allows inline scripts ('unsafe-inline') without a nonce or hash, which cancels most of its protection against injected code."
          : `script-src is restricted${unsafeEval ? " (allows 'unsafe-eval')" : ""}.`,
    evidence: csp ? [csp.length > 300 ? csp.slice(0, 300) + "…" : csp] : undefined,
    fix: "Start with Content-Security-Policy-Report-Only, then enforce. Prefer nonces over 'unsafe-inline'.",
  });

  // HSTS
  if (isHttps) {
    const hsts = h["strict-transport-security"];
    const maxAge = Number(hsts?.match(/max-age\s*=\s*"?(\d+)/i)?.[1] ?? 0);
    out.push({
      id: "sec-hsts",
      category: "security",
      severity: "medium",
      method: "http",
      title: "Strict-Transport-Security",
      status: !hsts ? "fail" : maxAge < 15_552_000 ? "warn" : "pass",
      detail: !hsts
        ? "Browsers aren't told to always use HTTPS (no HSTS header), so a visit that starts on http:// can be intercepted on public Wi-Fi before it switches to HTTPS."
        : `max-age is ${Math.round(maxAge / 86400)} days${maxAge < 15_552_000 ? "; at least 180 days is recommended" : ""}.`,
      evidence: hsts ? [hsts] : undefined,
      fix: "Strict-Transport-Security: max-age=63072000; includeSubDomains",
    });
  }

  // Clickjacking
  const xfo = h["x-frame-options"]?.toUpperCase();
  const frameAncestors = csp ? directive(csp, "frame-ancestors") : null;
  const framed = xfo === "DENY" || xfo === "SAMEORIGIN" || Boolean(frameAncestors);
  out.push({
    id: "sec-framing",
    category: "security",
    severity: "medium",
    method: "http",
    title: "Clickjacking protection",
    status: framed ? "pass" : "fail",
    detail: framed
      ? `Framing is restricted via ${frameAncestors ? `CSP frame-ancestors ${frameAncestors}` : `X-Frame-Options: ${xfo}`}.`
      : "Any other website can load this page invisibly inside its own and trick visitors into clicking your buttons (clickjacking).",
    fix: "Content-Security-Policy: frame-ancestors 'self'  (or X-Frame-Options: DENY)",
  });

  const nosniff = h["x-content-type-options"]?.toLowerCase() === "nosniff";
  out.push({
    id: "sec-nosniff",
    category: "security",
    severity: "low",
    method: "http",
    title: "X-Content-Type-Options: nosniff",
    status: nosniff ? "pass" : "fail",
    detail: nosniff ? "Browsers are told not to guess file types." : "Browsers may guess what a file is, so an uploaded text or image file could be run as code.",
    fix: "X-Content-Type-Options: nosniff",
  });

  const rp = h["referrer-policy"];
  const leakyRp = rp && /(^|,\s*)(unsafe-url|no-referrer-when-downgrade)\s*$/i.test(rp);
  out.push({
    id: "sec-referrer",
    category: "security",
    severity: "low",
    method: "http",
    title: "Referrer-Policy",
    status: !rp ? "warn" : leakyRp ? "warn" : "pass",
    detail: !rp
      ? "Not set. Modern browsers default to strict-origin-when-cross-origin, but an explicit policy documents intent."
      : leakyRp
        ? `"${rp}" sends full URLs (including query tokens) to other sites.`
        : `Set to "${rp}".`,
    fix: "Referrer-Policy: strict-origin-when-cross-origin",
  });

  // Version disclosure
  const leaks = [h["x-powered-by"] && `X-Powered-By: ${h["x-powered-by"]}`, h["server"] && /\d/.test(h["server"]) && `Server: ${h["server"]}`].filter(Boolean) as string[];
  out.push({
    id: "sec-version-leak",
    category: "security",
    severity: "low",
    method: "http",
    title: "No software version disclosure",
    status: leaks.length ? "warn" : "pass",
    detail: leaks.length ? "Your server announces exactly which software it runs, which helps attackers look up known security holes for that version." : "Headers don't reveal software versions.",
    evidence: leaks.length ? leaks : undefined,
    fix: "In Next.js set poweredByHeader: false; in nginx set server_tokens off.",
  });

  // Cookies
  if (setCookies.length) {
    const problems: string[] = [];
    for (const c of setCookies) {
      const name = c.split("=")[0].trim();
      const attrs = c.toLowerCase();
      const missing: string[] = [];
      if (isHttps && !/;\s*secure/.test(attrs)) missing.push("Secure");
      if (!/;\s*samesite=/.test(attrs)) missing.push("SameSite");
      const looksLikeSession = /sess|sid|auth|token|jwt/i.test(name);
      if (looksLikeSession && !/;\s*httponly/.test(attrs)) missing.push("HttpOnly");
      if (missing.length) problems.push(`${name}: missing ${missing.join(", ")}`);
    }
    out.push({
      id: "sec-cookies",
      category: "security",
      severity: "medium",
      method: "http",
      title: "Cookie attributes",
      status: problems.length ? "fail" : "pass",
      detail: problems.length
        ? `${problems.length} of ${setCookies.length} cookie(s) are missing protective settings, which can let them leak over insecure connections or to other sites.`
        : `All ${setCookies.length} cookie(s) set on the first response have Secure and SameSite.`,
      evidence: problems.length ? problems : undefined,
      fix: "Set-Cookie: name=value; Secure; HttpOnly; SameSite=Lax; Path=/",
    });
  }
  return out;
}
