# VibeCheck

[![CI](https://github.com/pranaysb/vibecheck/actions/workflows/ci.yml/badge.svg)](https://github.com/pranaysb/vibecheck/actions/workflows/ci.yml)

Audit a website three ways (a live URL, a public GitHub repo, or a `.zip` upload), then get a written review from a human expert.

- **Automated audit.** 52 deterministic checks across security, performance, accessibility, SEO, reliability and dependencies. Every result shows its raw evidence. There is no LLM in the loop. The full list is rendered from [`src/lib/audit/catalog.ts`](src/lib/audit/catalog.ts) at `/methodology`.
- **Expert review.** Builders post a request. Admin-approved experts claim it, study the audit, live site and files, and deliver a verdict with prioritized findings. Requesters rate reviews, and the ratings are public.

## How the audit works

| Input | What runs |
| --- | --- |
| Live URL | Pinned-IP HTTP fetch (TLS, redirects, headers, cookies), probes for `/.env`, `/.git`, source maps, `robots.txt`, `sitemap.xml`; secret scan of HTML and same-origin JS; headless Chromium at 1280px and 390px (contrast, overflow, tap targets, LCP, CLS, console errors, failed requests, screenshots); a full WCAG 2.2 A/AA scan with [axe-core](https://github.com/dequelabs/axe-core); trackers and third-party cookies loaded before any consent; HTML structure checks on the rendered DOM; then a polite crawl of up to 20 more pages (honours robots.txt, stops when rate-limited) for broken links, duplicate titles, missing descriptions, headings and alt text. |
| GitHub / .zip | Secret and `.env` scan of every text file; lockfiles (npm, pnpm, yarn, pip, poetry, uv) checked against [OSV.dev](https://osv.dev); if a built `index.html` exists, every HTML file is checked, broken local references are found, and the site is rendered in Chromium from memory. Source-only web projects (Vite, Next.js, Astro, SvelteKit, …) are first installed and built in a [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) microVM; static output is audited like an upload, and server apps are started and audited while running. |

**Score.** The score is the weighted share of checks that ran and passed: critical 10, high 6, medium 3, low 1; a warning earns half. A failed critical check caps the score at 40. Checks that couldn't run are excluded, never counted as passes.

**Accounts.** [Clerk](https://clerk.com) handles sign-up and sign-in (email code, Google, GitHub; password optional) and verifies every email address. Each Clerk user is linked to a VibeCheck user row by `clerkId`; on first sign-in, an existing row with the same verified email is claimed. Admin access requires a Clerk-verified email listed in `ADMIN_EMAILS`.

**Safety.** All outbound requests (including Chromium's subrequests) are blocked from private, loopback, link-local and metadata ranges, and sockets are pinned to the validated IP to defeat DNS rebinding. Uploaded sites are previewed under `Content-Security-Policy: sandbox` (opaque origin) via expiring HMAC-signed links. Real `.env` files are never stored. Build sandboxes are throwaway microVMs that get no secrets and no `.env` files; their network allows only package registries while installing, adds font hosts while building, and is cut off entirely while the app runs. Each sandbox is deleted when the audit ends.

## Running locally

Requirements: Node 24, PostgreSQL 16+.

```bash
git clone https://github.com/pranaysb/vibecheck.git && cd vibecheck
npm install
cp .env.example .env
createdb vibecheck                      # then set DATABASE_URL in .env, including your Postgres user
npx clerk@latest init                   # writes Clerk dev keys to .env; no Clerk account needed
npx playwright-core install chromium    # browser checks; without it they're reported as "not run"
npm run db:push
npm run dev                             # http://localhost:3000
```

Sign in with an email listed in `ADMIN_EMAILS` to get `/admin`, where you approve expert applications. Use `npx clerk@latest link` instead of `init` to point at an existing Clerk app.

### Checks

```bash
npm test                 # unit + database tests (checks, scoring, secrets, archives, lockfiles, SSRF, storage, moderation)
npm run typecheck
npm run lint
npm run build
```

With a production build running (`npm run build && npm start`), two end-to-end scripts drive it like real users:

```bash
node scripts/smoke.mjs http://localhost:3000 --require-browser                 # pages + one real audit
E2E_AUTH_SECRET=dev-only E2E_ADMIN_EMAIL=admin@example.test \
  node scripts/e2e.mjs http://localhost:3000                                   # the whole workflow, 27 steps
```

`e2e.mjs` needs the server started with the same `E2E_AUTH_SECRET` and with `E2E_ADMIN_EMAIL` in `ADMIN_EMAILS`. That enables a test-only sign-in (four throwaway users, cleaned up afterwards). It never activates on Vercel. CI runs all of the above on every push.

## Platform

- **Build sandboxes.** On Vercel the SDK authenticates with the project's OIDC token automatically. Locally it uses `VERCEL_OIDC_TOKEN` from `vercel env pull` (valid 12 hours); without credentials, builds are reported as not run. Set `SANDBOX_BUILDS=off` to disable them. Each build uses a 4 vCPU sandbox for up to about 4.5 minutes, billed to the Vercel team.
- **Storage.** Uploaded files and screenshots live in a private Vercel Blob store (keys prefixed by environment) and are only served through routes that check access. Without a store (local dev, CI) they are kept in Postgres. `.zip` uploads go straight from the browser to Blob (up to `MAX_DIRECT_UPLOAD_MB`, default 50), so the 4.5 MB request limit doesn't apply.
- **Retention.** A daily Vercel Cron (`/api/cron/cleanup`, authorized by `CRON_SECRET`) deletes files and screenshots 90 days after an audit unless a review is in progress, fails abandoned audits, removes orphaned uploads, and prunes rate-limit counters.
- **Rate limiting.** Counters live in Postgres (`RateLimit`), so limits hold across serverless instances.
- **Moderation.** Users report reviews or experts; admins dismiss, hide reviews, or revoke experts from `/admin`. Everyone involved gets an in-app notification.
- **CI.** Every push runs lint, typecheck, tests (against Postgres), build, and a smoke test that audits a real site in Chromium (`scripts/smoke.mjs`, also usable against any deployment). After each production deploy, `.github/workflows/production-smoke.yml` runs the same smoke test against the live site.
- **Health.** `GET /api/health` answers 200 when the database responds and 503 when it doesn't, for uptime monitors.

## Deploying

- Set `DATABASE_URL`, `ADMIN_EMAILS`, `SESSION_SECRET`, `CRON_SECRET`, the four `CLERK` variables, and connect a **private** Blob store (`vercel blob create-store <name> --access private`). Run `npm run db:push` yourself; the build never changes the schema.
- Clerk session tokens must include the claim `{"email": "{{user.primary_email_address}}"}` so email changes reach `ADMIN_EMAILS` matching.
- A Clerk production instance needs a domain you own; until then the deployment can run on Clerk development keys ("Development mode" badge, user cap).

## Not built yet

- **Payments** for expert reviews (needs a Stripe account). Reviews are free and nothing on the site claims otherwise.
- **Email notifications.** Notifications are in-app only; email needs a sending domain.
- **Private GitHub repos** (needs a GitHub OAuth app with `repo` scope configured in Clerk). Upload a `.zip` instead.

MIT licensed.
