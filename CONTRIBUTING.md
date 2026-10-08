# Contributing to VibeCheck

Thank you for your interest in contributing to VibeCheck! We are building an open-source, enterprise-grade code quality benchmark and security audit platform.

---

## Code of Conduct

All contributors and maintainers are expected to uphold a respectful, inclusive, and collaborative environment. Be thoughtful, constructive, and adhere to industry security standards.

---

## Development Setup

### Prerequisites
- **Node.js**: >= 20.0.0
- **npm** (or pnpm / bun)
- **PostgreSQL**: local instance or cloud connection (Neon / Vercel Postgres)

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pranaysb/vibecheck.git
   cd vibecheck
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/vibecheck?schema=public"
   ```

4. **Create the database schema**:
   ```bash
   npm run db:push
   ```

5. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

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

If you discover a potential vulnerability in VibeCheck's scanner or server:
- **Do not open a public GitHub issue.**
- Email details and reproduction steps to **security@vibecheck.dev** or report directly via our Coordinated Disclosure Program at [`/security`](https://vibecheck-ten-omega.vercel.app/security).
