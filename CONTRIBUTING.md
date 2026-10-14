# Contributing to VibeCheck

Thanks for your interest in contributing. VibeCheck is an open-source website audit (deterministic checks with evidence) plus human expert reviews.

---

## Code of Conduct

All contributors and maintainers are expected to uphold a respectful, inclusive, and collaborative environment. Be thoughtful, constructive, and adhere to industry security standards.

---

## Development Setup

Follow **Running locally** in the [README](README.md#running-locally): Node 24, PostgreSQL 16+, `npx clerk@latest init` for dev keys, `npm run db:push`, `npm run dev`.

Before opening a pull request, run what CI runs:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

and, against a production build, `scripts/smoke.mjs` and `scripts/e2e.mjs` (see the README).

---

## Security Guidelines

Any pull request touching destination resolution (`src/lib/security/ssrf.ts`, `src/lib/net/safe-fetch.ts`), the browser router (`src/lib/audit/browser.ts`), or the upload preview (`src/app/preview/`, `src/lib/preview.ts`) **must**:

1. Keep `npm test` green, including the SSRF and preview-token suites.
2. Never dispatch a socket to private, loopback, link-local or metadata ranges, and keep connections pinned to the validated IP.
3. Never serve uploaded content without the CSP `sandbox` header.

New automated checks must be added to `src/lib/audit/catalog.ts`; `tests/catalog.test.ts` fails otherwise.

---

## Pull Request Workflow

1. Create a feature branch: `git checkout -b feat/your-feature-name`.
2. Ensure TypeScript and build checks pass:
   ```bash
   npm run build
   ```
3. Commit using conventional commit format:
   - `feat(...)`: new functionality
   - `fix(...)`: bug or security fix
   - `docs(...)`: documentation improvements
4. Open a Pull Request targeting `main`.

---

## Reporting Security Vulnerabilities

If you find a vulnerability in VibeCheck's scanner or server, please don't open a public issue. Report it privately through GitHub: the repository's **Security** tab → **Report a vulnerability**
([direct link](https://github.com/pranaysb/vibecheck/security/advisories/new)). Include the steps to reproduce it.
