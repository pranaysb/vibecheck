# VibeCheck

Audit a website three ways (a live URL, a public GitHub repo, or a `.zip` upload), then get a written review from a human expert.

- **Automated audit.** 52 deterministic checks across security, performance, accessibility, SEO, reliability and dependencies. Every result shows its raw evidence. There is no LLM in the loop. The full list is rendered from [`src/lib/audit/catalog.ts`](src/lib/audit/catalog.ts) at `/methodology`.
- **Expert review.** Builders post a request. Admin-approved experts claim it, study the audit, live site and files, and deliver a verdict with prioritized findings. Requesters rate reviews, and the ratings are public.

## How the audit works

| Input | What runs |
| --- | --- |
| Live URL | Pinned-IP HTTP fetch (TLS, redirects, headers, cookies), probes for `/.env`, `/.git`, source maps, `robots.txt`, `sitemap.xml`; secret scan of HTML and same-origin JS; headless Chromium at 1280px and 390px (contrast, overflow, tap targets, LCP, CLS, console errors, failed requests, screenshots); HTML structure checks on the rendered DOM. |
| GitHub / .zip | Secret and `.env` scan of every text file; lockfiles (npm, pnpm, yarn, pip, poetry, uv) checked against [OSV.dev](https://osv.dev); if a built `index.html` exists, every HTML file is checked, broken local references are found, and the site is rendered in Chromium from memory. |

**Score.** The score is the weighted share of checks that ran and passed: critical 10, high 6, medium 3, low 1; a warning earns half. A failed critical check caps the score at 40. Checks that couldn't run are excluded, never counted as passes.

**Accounts.** Email + password or passwordless email codes (via Resend). New accounts verify their email with a 6-digit code before they can upload, request reviews, apply as experts, or get admin. Codes are stored as HMACs, expire in 10 minutes, allow 5 attempts, and are rate-limited per email in the database.

**Safety.** All outbound requests (including Chromium's subrequests) are blocked from private, loopback, link-local and metadata ranges, and sockets are pinned to the validated IP to defeat DNS rebinding. Uploaded sites are previewed under `Content-Security-Policy: sandbox` (opaque origin) via expiring HMAC-signed links. Real `.env` files are never stored.

## Running locally

```bash
cp .env.example .env      # DATABASE_URL, ADMIN_EMAILS, SESSION_SECRET; RESEND_API_KEY + EMAIL_FROM optional locally
npm install
npx playwright-core install chromium   # browser checks; skipped (not faked) if missing
npm run db:push
npm run dev
```

Sign up with an email listed in `ADMIN_EMAILS` to get `/admin`, where you approve expert applications.

```bash
npm test          # unit tests for checks, scoring, secrets, archives, lockfiles, SSRF, preview tokens
npm run typecheck
npm run lint
npm run build
```

## Deploying

- Set `DATABASE_URL`, `ADMIN_EMAILS`, `SESSION_SECRET`, `RESEND_API_KEY` and `EMAIL_FROM`. Run `npm run db:push` yourself; the build no longer pushes the schema (it used to run `--accept-data-loss` on every deploy).
- On Vercel, Chromium comes from `@sparticuz/chromium-min`, and request bodies are capped at 4.5 MB, so set `MAX_UPLOAD_MB=4` there or self-host for larger uploads.
- Rate limits are in-memory per instance. Put a shared store (Redis/Upstash) behind `src/lib/security/rate-limit.ts` before scaling out.

## Not built yet

- Payments. Review requests are free; nothing on the site claims otherwise.
- Email notifications for review status. Status changes show on the dashboard and review queue (email is only used for sign-in codes).
- Private GitHub repos. These need a GitHub OAuth app; upload a `.zip` for now.

MIT licensed.
