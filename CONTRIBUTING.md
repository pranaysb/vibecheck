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

4. **Initialize database schema & seeds**:
   ```bash
   npx prisma db push
   npm run seed
   ```

5. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Security Guidelines

VibeCheck is a security-focused audit system. Any pull request affecting:
- Destination resolution (`src/lib/security/ssrf.ts`)
- Cryptographic attestation (`src/lib/audit/self-audit-engine.ts`)
- Verification endpoints (`src/app/api/scan/*`)

**Must**:
1. Pass the full 34-vector SSRF normalization probe suite (`npm run build` and `/api/scan/test-adversarial`).
2. Pass genuine network-level redirect traversal tests (`/api/scan/test-redirect-chain`).
3. Never weaken IP normalization (support octal, hex, decimal, shorthand, and IPv6 encodings).
4. Maintain zero socket dispatch to private, cloud metadata (169.254.169.254), loopback (127.0.0.0/8), and RFC 1918 subnets.

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
