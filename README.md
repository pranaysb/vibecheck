# VibeCheck

[![CI](https://github.com/pranaysb/vibecheck/actions/workflows/ci.yml/badge.svg)](https://github.com/pranaysb/vibecheck/actions/workflows/ci.yml)

Audit a website three ways (a live URL, a public GitHub repo, or a `.zip` upload), then get a written review from a human expert.

- **Automated audit.** 52 deterministic checks across security, performance, accessibility, SEO, reliability and dependencies. Every result shows its raw evidence. There is no LLM in the loop. The full list is rendered from [`src/lib/audit/catalog.ts`](src/lib/audit/catalog.ts) at `/methodology`.
- **Expert review.** Builders post a request. Admin-approved experts claim it, study the audit, live site and files, and deliver a verdict with prioritized findings. Requesters rate reviews, and the ratings are public.

## How the audit works

| Input | What runs |
| --- | --- |
| Live URL | Pinned-IP HTTP fetch (TLS, redirects, headers, cookies), probes for `/.env`, `/.git`, source maps, `robots.txt`, `sitemap.xml`; secret scan of HTML and same-origin JS; headless Chromium at 1280px and 390px (contrast, overflow, tap targets, LCP, CLS, console errors, failed requests, screenshots); HTML structure checks on the rendered DOM. |
| GitHub / .zip | Secret and `.env` scan of every text file; lockfiles (npm, pnpm, yarn, pip, poetry, uv) checked against [OSV.dev](https://osv.dev); if a built `index.html` exists, every HTML file is checked, broken local references are found, and the site is rendered in Chromium from memory. |

**Score.** The score is the weighted share of checks that ran and passed: critical 10, high 6, medium 3, low 1; a warning earns half. A failed critical check caps the score at 40. Checks that couldn't run are excluded, never counted as passes.

**Accounts.** [Clerk](https://clerk.com) handles sign-up and sign-in (email code, Google, GitHub; password optional) and verifies every email address. Each Clerk user is linked to a VibeCheck user row by `clerkId`; on first sign-in, an existing row with the same verified email is claimed. Admin access requires a Clerk-verified email listed in `ADMIN_EMAILS`.

**Safety.** All outbound requests (including Chromium's subrequests) are blocked from private, loopback, link-local and metadata ranges, and sockets are pinned to the validated IP to defeat DNS rebinding. Uploaded sites are previewed under `Content-Security-Policy: sandbox` (opaque origin) via expiring HMAC-signed links. Real `.env` files are never stored.

## Running locally

```bash
cp .env.example .env      # DATABASE_URL, ADMIN_EMAILS, SESSION_SECRET, Clerk keys (`clerk env pull`)
npm install
npx playwright-core install chromium   # browser checks; skipped (not faked) if missing
npm run db:push
npm run dev
```

Sign in with an email listed in `ADMIN_EMAILS` to get `/admin`, where you approve expert applications.

```bash
npm test          # unit tests for checks, scoring, secrets, archives, lockfiles, SSRF, preview tokens
npm run typecheck
npm run lint
npm run build
```

## Platform

- **Storage.** Uploaded files and screenshots live in a private Vercel Blob store (keys prefixed by environment) and are only served through routes that check access. Without a store (local dev, CI) they are kept in Postgres. `.zip` uploads go straight from the browser to Blob (up to `MAX_DIRECT_UPLOAD_MB`, default 50), so the 4.5 MB request limit doesn't apply.
- **Retention.** A daily Vercel Cron (`/api/cron/cleanup`, authorized by `CRON_SECRET`) deletes files and screenshots 90 days after an audit unless a review is in progress, fails abandoned audits, removes orphaned uploads, and prunes rate-limit counters.
- **Rate limiting.** Counters live in Postgres (`RateLimit`), so limits hold across serverless instances.
- **Moderation.** Users report reviews or experts; admins dismiss, hide reviews, or revoke experts from `/admin`. Everyone involved gets an in-app notification.
- **CI.** Every push runs lint, typecheck, tests (against Postgres), build, and a smoke test that audits a real site in Chromium (`scripts/smoke.mjs`, also usable against any deployment).

## Deploying

- Set `DATABASE_URL`, `ADMIN_EMAILS`, `SESSION_SECRET`, `CRON_SECRET`, the four `CLERK` variables, and connect a **private** Blob store (`vercel blob create-store <name> --access private`). Run `npm run db:push` yourself; the build never changes the schema.
- Clerk session tokens must include the claim `{"email": "{{user.primary_email_address}}"}` so email changes reach `ADMIN_EMAILS` matching.
- A Clerk production instance needs a domain you own; until then the deployment can run on Clerk development keys ("Development mode" badge, user cap).

## Not built yet

- **Payments** for expert reviews (needs a Stripe account). Reviews are free and nothing on the site claims otherwise.
- **Email notifications.** Notifications are in-app only; email needs a sending domain.
- **Private GitHub repos** (needs a GitHub OAuth app with `repo` scope configured in Clerk). Upload a `.zip` instead.

MIT licensed.
