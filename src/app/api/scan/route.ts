import { NextResponse } from 'next/server';
import { validateTargetDestination } from '@/lib/security/ssrf';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawUrl = body.url || body.targetUrl;
    if (!rawUrl) return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    const url = rawUrl;

    // 1. Initial Destination Validation (DNS A/AAAA, numeric IP, and subnet checks)
    const validation = await validateTargetDestination(url);
    if (!validation.allowed) {
      return NextResponse.json(
        {
          error: `SSRF Sandbox Blocked: ${validation.reason}`,
          securityGateBlocked: true,
          resolvedIp: validation.resolvedIp,
        },
        { status: 403 }
      );
    }

    // 2. Safe Redirect Traversal with Per-Hop Validation (Max 3 hops)
    let currentUrl = url;
    let hops = 0;
    let response: Response | null = null;
    const startTime = Date.now();

    while (hops < 3) {
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual', // Never auto-follow redirects!
        headers: {
          'User-Agent': 'VibeCheck-Security-Scanner/1.0 (+https://vibecheck.dev)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(4000), // Hard 4-second timeout
      });

      // Handle 301 / 302 / 307 / 308 redirects
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) break;

        const nextUrl = new URL(location, currentUrl).toString();

        // CRITICAL: Re-validate redirect target through SSRF validator!
        const redirectCheck = await validateTargetDestination(nextUrl);
        if (!redirectCheck.allowed) {
          return NextResponse.json(
            {
              error: `SSRF Sandbox Blocked: Redirect to forbidden subnet (${redirectCheck.reason})`,
              securityGateBlocked: true,
              resolvedIp: redirectCheck.resolvedIp,
            },
            { status: 403 }
          );
        }

        currentUrl = nextUrl;
        hops++;
      } else {
        break;
      }
    }

    if (!response) {
      return NextResponse.json({ error: 'No response received from target' }, { status: 502 });
    }

    const ttfb = Date.now() - startTime;
    const headers = response.headers;
    const findings: Array<{
      id: string;
      category: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      title: string;
      description: string;
      passed: boolean;
    }> = [];

    // 1. Content Security Policy
    const hasCsp = headers.has('content-security-policy');
    findings.push({
      id: 'sec-csp',
      category: 'Security',
      severity: 'HIGH',
      title: hasCsp ? 'Content-Security-Policy Active' : 'Missing Content-Security-Policy',
      description: hasCsp
        ? 'Protects against XSS and malicious script injections.'
        : 'No CSP header found. App is vulnerable to cross-site script injection.',
      passed: hasCsp,
    });

    // 2. Strict Transport Security (HSTS)
    const hasHsts = headers.has('strict-transport-security');
    findings.push({
      id: 'sec-hsts',
      category: 'Security',
      severity: 'HIGH',
      title: hasHsts ? 'Strict HSTS Enabled' : 'Missing Strict-Transport-Security (HSTS)',
      description: hasHsts
        ? 'Enforces TLS connections.'
        : 'Missing HSTS header. Insecure HTTP downgrades are possible.',
      passed: hasHsts,
    });

    // 3. X-Frame-Options (Clickjacking)
    const xfo = headers.get('x-frame-options');
    const hasFrameProtection = xfo === 'DENY' || xfo === 'SAMEORIGIN' || hasCsp;
    findings.push({
      id: 'sec-xfo',
      category: 'Security',
      severity: 'MEDIUM',
      title: hasFrameProtection ? 'Frame Protection Active' : 'Missing X-Frame-Options',
      description: hasFrameProtection
        ? 'Site cannot be embedded in malicious iframes.'
        : 'Site permits arbitrary iframe embedding (clickjacking risk).',
      passed: hasFrameProtection,
    });

    // 4. X-Content-Type-Options
    const hasNoSniff = headers.get('x-content-type-options') === 'nosniff';
    findings.push({
      id: 'sec-sniff',
      category: 'Security',
      severity: 'LOW',
      title: hasNoSniff ? 'MIME Sniffing Disabled' : 'Missing X-Content-Type-Options: nosniff',
      description: hasNoSniff
        ? 'MIME sniffing prevention is configured.'
        : 'Browsers may sniff response payloads into executable types.',
      passed: hasNoSniff,
    });

    // 5. Performance / TTFB Check
    const ttfbPassed = ttfb < 600;
    findings.push({
      id: 'perf-ttfb',
      category: 'Performance',
      severity: ttfb > 1200 ? 'HIGH' : 'MEDIUM',
      title: `Server TTFB: ${ttfb}ms`,
      description: ttfbPassed
        ? 'Optimal server response latency.'
        : 'High Time-to-First-Byte indicates unoptimized server-side rendering or cold starts.',
      passed: ttfbPassed,
    });

    // Calculate Real Score & Deterministic Security Gate
    const totalChecks = findings.length;
    const passedChecks = findings.filter((f) => f.passed).length;
    const calculatedScore = Math.round((passedChecks / totalChecks) * 100);

    const criticalFailures = findings.filter((f) => !f.passed && f.severity === 'CRITICAL').length;
    const highFailures = findings.filter((f) => !f.passed && f.severity === 'HIGH').length;
    const securityGateVerdict = criticalFailures === 0 && highFailures === 0 ? 'READY TO SHIP' : 'NOT SAFE TO SHIP';

    return NextResponse.json({
      targetUrl: url,
      resolvedFinalUrl: currentUrl,
      redirectHops: hops,
      statusCode: response.status,
      vibeScore: calculatedScore,
      securityGateVerdict,
      ttfbMs: ttfb,
      findings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to analyze target deployment' }, { status: 500 });
  }
}
