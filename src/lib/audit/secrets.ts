export interface SecretHit {
  kind: string;
  /** Masked value: the first and last few characters only. Never store full secrets. */
  sample: string;
  line?: number;
}

interface Pattern {
  kind: string;
  re: RegExp;
  validate?: (match: string) => boolean;
}

const PATTERNS: Pattern[] = [
  { kind: "AWS access key ID", re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { kind: "Stripe live secret key", re: /\b(?:sk|rk)_live_[0-9a-zA-Z]{20,}\b/g },
  { kind: "Anthropic API key", re: /\bsk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{80,}\b/g },
  { kind: "OpenAI API key", re: /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}T3BlbkFJ[A-Za-z0-9_-]{20,}\b/g },
  { kind: "OpenAI project key", re: /\bsk-proj-[A-Za-z0-9_-]{100,}\b/g },
  { kind: "GitHub token", re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{80,}\b/g },
  { kind: "Slack token", re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
  { kind: "SendGrid API key", re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g },
  { kind: "Twilio API key", re: /\bSK[0-9a-f]{32}\b/g },
  { kind: "Google OAuth client secret", re: /\bGOCSPX-[A-Za-z0-9_-]{28}\b/g },
  { kind: "Private key", re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY(?: BLOCK)?-----/g },
  {
    kind: "Supabase service_role key",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
    validate: (jwt) => jwtRole(jwt) === "service_role",
  },
  {
    kind: "Database URL with password",
    re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s/"'`]+:[^@\s"'`]{3,}@[^\s"'`]+/g,
    validate: (m) => !/:(?:password|pass|\$\{|<|\*{3}|xxx|YOUR_|your-)/i.test(m) && !/@(?:localhost|127\.0\.0\.1|host|db)(?:[:/]|$)/i.test(m),
  },
];

function jwtRole(jwt: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
    return typeof payload?.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function mask(value: string): string {
  if (value.startsWith("-----BEGIN")) return value;
  if (value.length <= 12) return value.slice(0, 3) + "…";
  return `${value.slice(0, 6)}…${value.slice(-4)} (${value.length} chars)`;
}

export function findSecrets(text: string, max = 10): SecretHit[] {
  const hits: SecretHit[] = [];
  const seen = new Set<string>();
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.re.exec(text)) && hits.length < max) {
      const value = m[0];
      if (seen.has(value) || (p.validate && !p.validate(value))) continue;
      seen.add(value);
      hits.push({ kind: p.kind, sample: mask(value), line: lineOf(text, m.index) });
    }
  }
  return hits;
}

function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

/** True for real env files, false for committed templates like `.env.example`. */
export function isEnvFile(path: string): boolean {
  const name = path.split("/").pop() ?? "";
  if (!/^\.env(\..+)?$/.test(name)) return false;
  return !/\.(example|sample|template|dist|defaults?)$/i.test(name);
}

/** Lines in an env file that assign a non-empty, non-placeholder value. */
export function envAssignments(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^(export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=\s*\S/.test(l))
    .filter((l) => !/=\s*["']?(?:|changeme|your[-_].*|<.*>|xxx+|\.\.\.)["']?$/i.test(l))
    .map((l) => l.split("=")[0].replace(/^export\s+/, "").trim());
}
