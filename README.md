<div align="center">

# VibeCheck

**Enterprise Code Quality Benchmarks, SSRF-Defended Automated Remote Probes & Cryptographic Attestation Platform**

[![Vercel Deployment](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat&logo=vercel)](https://vibecheck-ten-omega.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Security Gate](https://img.shields.io/badge/Security%20Gate-READY%20TO%20SHIP-emerald)](https://vibecheck-ten-omega.vercel.app/ci-gate)
[![SSRF Suite](https://img.shields.io/badge/SSRF%20Defense-34%2F34%20Passed-emerald)](https://vibecheck-ten-omega.vercel.app/api/scan/test-adversarial)

<br />

<a href="https://vercel.com?utm_source=vibecheck&utm_campaign=oss">
  <img src="https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/powered-by-vercel.svg" alt="Powered by Vercel" height="32" />
</a>

<br /><br />

[Live Production](https://vibecheck-ten-omega.vercel.app) • [Security Model](https://vibecheck-ten-omega.vercel.app/security) • [Self-Audit Report](https://vibecheck-ten-omega.vercel.app/security/self-audit) • [CI/CD Gate Simulator](https://vibecheck-ten-omega.vercel.app/ci-gate)

</div>

---

## 🌟 Overview

**VibeCheck** is an open-source engineering platform built to replace superficial "vibe coding" with rigorous, verifiable software quality standards. It combines:

1. **SSRF-Sandboxed Remote Endpoint Scanner**: Headless HTTP probe evaluating live targets across CSP, HSTS, X-Frame-Options, MIME sniffing, TLS validity, and TTFB latency with connection-time anti-rebinding protections.
2. **Deterministic CI/CD Security Gate**: AST and route analysis enforcing zero-tolerance merge policies for high/critical security regressions (BOLA/IDOR, broken authentication, secret leaks).
3. **Cryptographic Attestation Engine**: Tamper-proof, SHA-256 digest-bound audit reports tied directly to git commit SHAs, accompanied by Ed25519 tamper-detection suites.
4. **Verified Peer & Architecture Review System**: Structured technical review forms and reputation tracking across engineering personas (Creator, Community Reviewer, Staff Architect, Admin).

---

## 🔒 Security & SSRF Defense Architecture

VibeCheck's remote analysis worker implements defense-in-depth to safely evaluate untrusted URLs submitted by users without risking intranet traversal or cloud metadata extraction.

```
Submitted Target URL
        │
        ▼
[ URL Parsing & Protocol Whitelist ] ──(Non HTTP/HTTPS / Embedded Credentials)──► ❌ 403 Forbidden
        │
        ▼
[ Hostname & IP Normalization ] ──(Octal / Hex / Decimal / IPv4-mapped IPv6)
        │
        ▼
[ Subnet Range Evaluation ] ──(127.0.0.0/8, 169.254.0.0/16, RFC 1918, CGNAT)──► ❌ 403 Forbidden
        │
        ▼
[ Connection-Time DNS Resolution ] ──(Any A / AAAA IP in forbidden subnet)──────► ❌ 403 Forbidden
        │
        ▼
[ Safe Socket Dispatch (redirect: manual) ]
        │
        ├─► [ 302 Found with Location ] ──► [ Re-validate Location Hop ] (Max 3 hops)
        │
        ▼
[ Target Payload & Header Inspection ] (Strict 4s timeout, 5MB body cap)
```

### Defended Vector Matrix (34/34 Vectors)
- **IPv4 Representations**: Dotted-decimal, shorthand (`127.1`), pure 32-bit integer (`2130706433`), hexadecimal (`0x7f000001`), octal (`0177.0.0.1`), mixed hex/dot (`0x7f.0.0.1`), and zero-source address (`0.0.0.0`).
- **Cloud Metadata & Internal Hostnames**: Explicit drops for `169.254.169.254`, `metadata.google.internal`, and `instance-data`.
- **IPv6 Normalizations**: `::1`, `::/128`, `::ffff:127.0.0.1`, hex-mapped `::ffff:7f00:1`, link-local (`fe80::/10`), unique local (`fc00::/7`), multicast (`ff00::/8`), documentation prefixes, and malformed zone identifiers.
- **RFC 1918 Subnets**: Class A (`10.0.0.0/8`), Class B (`172.16.0.0/12`), Class C (`192.168.0.0/16`), and Carrier-Grade NAT (`100.64.0.0/10`).
- **Multi-Hop Redirect Traversal**: Safe redirect inspection enforcing `redirect: 'manual'`—inspects every HTTP `301/302/307/308` redirect header before any socket dispatch occurs.

Run the live adversarial test suite:
```bash
curl https://vibecheck-ten-omega.vercel.app/api/scan/test-adversarial
curl https://vibecheck-ten-omega.vercel.app/api/scan/test-redirect-chain
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org) with Turbopack
- **Language**: [TypeScript 5](https://www.typescriptlang.org)
- **Database**: PostgreSQL with [Prisma ORM 6](https://www.prisma.io)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Deployment & Edge Infrastructure**: [Vercel](https://vercel.com) Edge Network
- **Icons & Motion**: Lucide React, Motion (Framer Motion v13)
- **Validation**: Zod schema validation

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js >= 20.x
- npm / pnpm / bun
- PostgreSQL database (local Docker or cloud connection)

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pranaysb/vibecheck.git
   cd vibecheck
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vibecheck?schema=public"
   ```

4. **Synchronize Prisma Schema & Seed Catalog**:
   ```bash
   npx prisma db push
   npm run seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to interact with the platform.

6. **Run Production Build & Test Suites**:
   ```bash
   npm run build
   ```

---

## 📡 API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/scan` | SSRF-sandboxed live HTTP evaluation with TTFB and security header auditing |
| `GET` | `/api/version` | Dynamic deployment commit SHA & canonical ruleset versions |
| `GET` | `/api/scan/test-adversarial` | 34-vector SSRF normalization probe regression suite |
| `GET` | `/api/scan/test-redirect-chain` | Genuine network-level E2E multi-hop HTTP redirect inspection suite |
| `GET` | `/api/projects` | Filterable project catalog (with Prisma pagination) |
| `POST` | `/api/reviews` | Structured peer review submission with role permissions |

---

## 🤝 Contributing

We welcome community contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

To report security vulnerabilities, please consult our [Responsible Disclosure Policy](https://vibecheck-ten-omega.vercel.app/security) or email `security@vibecheck.dev`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <p>Engineered with open-source integrity • Deployed on <b><a href="https://vercel.com?utm_source=vibecheck&utm_campaign=oss">Vercel</a></b></p>
</div>
