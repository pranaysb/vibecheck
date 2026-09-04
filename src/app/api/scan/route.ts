import { NextResponse } from 'next/server';

// Strict SSRF Guard against private subnets & loopbacks
function isPrivateSubnet(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname === '169.254.169.254' || // AWS metadata
    hostname === '0.0.0.0'
  );
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP/HTTPS URLs allowed' }, { status: 400 });
    }

    if (isPrivateSubnet(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Target URL resolves to a protected or private subnet' }, { status: 403 });
    }

    const startTime = Date.now();
    const response = await fetch(parsedUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'VibeCheck-Security-Scanner/1.0 (+https://vibecheck.dev)'
      }
    });
    const ttfb = Date.now() - startTime;

    const headers = response.headers;
    const findings: Array<{ id: string; category: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; title: string; description: string; passed: boolean }> = [];

    // 1. Content Security Policy
    const hasCsp = headers.has('content-security-policy');
    findings.push({
      id: 'sec-csp',
      category: 'Security',
      severity: 'HIGH',
      title: hasCsp ? 'Content-Security-Policy Active' : 'Missing Content-Security-Policy',
      description: hasCsp ? 'Protects against XSS and malicious script injections.' : 'No CSP header found. App is vulnerable to cross-site script injection.',
      passed: hasCsp
    });

    // 2. Strict Transport Security (HSTS)
    const hasHsts = headers.has('strict-transport-security');
    findings.push({
      id: 'sec-hsts',
      category: 'Security',
      severity: 'HIGH',
      title: hasHsts ? 'Strict HSTS Enabled' : 'Missing Strict-Transport-Security (HSTS)',
      description: hasHsts ? 'Enforces TLS connections.' : 'Missing HSTS header. Insecure HTTP downgrades are possible.',
      passed: hasHsts
    });

    // 3. X-Frame-Options (Clickjacking)
    const xfo = headers.get('x-frame-options');
    const hasFrameProtection = xfo === 'DENY' || xfo === 'SAMEORIGIN' || hasCsp;
    findings.push({
      id: 'sec-xfo',
      category: 'Security',
      severity: 'MEDIUM',
      title: hasFrameProtection ? 'Frame Protection Active' : 'Missing X-Frame-Options',
      description: hasFrameProtection ? 'Site cannot be embedded in malicious iframes.' : 'Site permits arbitrary iframe embedding (clickjacking risk).',
      passed: hasFrameProtection
    });

    // 4. X-Content-Type-Options
    const hasNoSniff = headers.get('x-content-type-options') === 'nosniff';
    findings.push({
      id: 'sec-sniff',
      category: 'Security',
      severity: 'LOW',
      title: hasNoSniff ? 'MIME Sniffing Disabled' : 'Missing X-Content-Type-Options: nosniff',
      description: hasNoSniff ? 'MIME sniffing prevention is configured.' : 'Browsers may sniff response payloads into executable types.',
      passed: hasNoSniff
    });

    // 5. Performance / TTFB Check
    const ttfbPassed = ttfb < 600;
    findings.push({
      id: 'perf-ttfb',
      category: 'Performance',
      severity: ttfb > 1200 ? 'HIGH' : 'MEDIUM',
      title: `Server TTFB: ${ttfb}ms`,
      description: ttfbPassed ? 'Optimal server response latency.' : 'High Time-to-First-Byte indicates unoptimized server-side rendering or cold starts.',
      passed: ttfbPassed
    });

    // Calculate Real Score
    const totalChecks = findings.length;
    const passedChecks = findings.filter(f => f.passed).length;
    const calculatedScore = Math.round((passedChecks / totalChecks) * 100);

    return NextResponse.json({
      targetUrl: url,
      statusCode: response.status,
      vibeScore: calculatedScore,
      ttfbMs: ttfb,
      findings
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to analyze target deployment' }, { status: 500 });
  }
}
