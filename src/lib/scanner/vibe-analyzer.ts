/**
 * VibeCheck Comprehensive Product, UI, UX, and Vibe Analyzer.
 * Evaluates real-world product ergonomics, button craft, visual ambience,
 * navigation flow, typography hierarchy, and mobile responsiveness.
 */

export type VibePillar =
  | "VISUAL_DESIGN_AMBIENCE"
  | "UI_BUTTON_CRAFT"
  | "PRODUCT_FLOW_USABILITY"
  | "RESPONSIVE_MOBILE"
  | "TECHNICAL_FOUNDATION";

export type VibeGrade = "A+" | "A" | "B" | "C" | "D" | "F";
export type VibeVerdict =
  | "ELITE CRAFT & VIBE"
  | "HIGH CRAFT - READY TO SHIP"
  | "SOLID VIBE - MINOR POLISH NEEDED"
  | "ROUGH VIBE - UX & DESIGN ATTENTION REQUIRED"
  | "POOR VIBE - CRITICAL PRODUCT DEFECTS";

export interface VibeCritique {
  id: string;
  pillar: VibePillar;
  title: string;
  impact: "CRITICAL" | "HIGH" | "MEDIUM" | "POLISH" | "EXCELLENT";
  status: "PASSED" | "NEEDS_WORK" | "WARNING";
  summary: string;
  recommendation: string;
  codeSnippet?: string;
  detectedDetail?: string;
}

export interface VibeAnalysisResult {
  targetUrl: string;
  finalUrl: string;
  domain: string;
  vibeScore: number;
  grade: VibeGrade;
  verdict: VibeVerdict;
  scannedAt: string;
  ttfbMs: number;
  scores: {
    visualDesign: number;      // 0-100 (30% weight)
    uiButtonCraft: number;     // 0-100 (25% weight)
    productFlow: number;       // 0-100 (25% weight)
    responsiveCraft: number;   // 0-100 (10% weight)
    technicalFoundation: number; // 0-100 (10% weight)
  };
  productSnapshot: {
    pageTitle: string;
    metaDescription: string;
    ogImage?: string;
    detectedFrameworks: string[];
    buttonCount: number;
    headingsHierarchy: { h1Count: number; h2Count: number; h3Count: number; sampleH1?: string };
    navigationDetected: boolean;
    footerDetected: boolean;
    colorPaletteHints: string[];
    fontFamilies: string[];
    hasHeroCTA: boolean;
  };
  critiques: VibeCritique[];
  summaryFeedback: string[];
  sha256Digest: string;
}

export function analyzeVibeFromHtml(
  html: string,
  rawHeaders: Record<string, string>,
  ttfbMs: number,
  targetUrl: string,
  finalUrl: string
): VibeAnalysisResult {
  const parsed = new URL(finalUrl || targetUrl);
  const domain = parsed.hostname;

  // 1. Extract Meta & Head Information
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch?.[1] ? titleMatch[1].trim() : domain;

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const metaDescription = descMatch?.[1] ? descMatch[1].trim() : "";

  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = ogImageMatch?.[1] ? ogImageMatch[1].trim() : undefined;

  const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["']/i);
  const hasResponsiveViewport = Boolean(viewportMatch?.[1] && viewportMatch[1].includes("width=device-width"));

  // 2. Headings & Visual Hierarchy Analysis
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];

  const firstH1 = h1Matches[0];
  const cleanH1 = firstH1
    ? firstH1.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : undefined;

  // 3. Interactive Buttons & Controls
  const buttonTags = html.match(/<button[^>]*>([\s\S]*?)<\/button>/gi) || [];
  const inputButtons = html.match(/<input[^>]+type=["'](?:submit|button)["'][^>]*>/gi) || [];
  const linkButtons = html.match(/<a[^>]+class=["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi) || [];
  const totalButtons = buttonTags.length + inputButtons.length + linkButtons.length;

  let emptyButtonsCount = 0;
  let genericCtaCount = 0;
  const genericLabels = ["click here", "submit", "button", "link", "read more", "more", "learn more"];

  for (const btn of buttonTags) {
    const textOnly = btn.replace(/<[^>]+>/g, "").trim().toLowerCase();
    const hasAria = /aria-label=["'][^"']+["']/i.test(btn) || /title=["'][^"']+["']/i.test(btn);
    const hasSvg = /<svg/i.test(btn);

    // If button has an SVG icon or no text, but lacks aria-label/title
    const isIconOnly = (!textOnly || textOnly.length === 0) && hasSvg;
    const isCompletelyEmpty = !textOnly && !hasAria && !hasSvg;

    if ((isIconOnly && !hasAria) || isCompletelyEmpty) {
      emptyButtonsCount++;
    } else if (genericLabels.includes(textOnly)) {
      genericCtaCount++;
    }
  }

  // 4. Form Inputs & Accessibility
  const inputTags = html.match(/<input[^>]*>/gi) || [];
  let inputsWithoutLabels = 0;
  for (const inp of inputTags) {
    const isHiddenOrSubmit = /type=["'](?:hidden|submit|button|checkbox|radio)["']/i.test(inp);
    if (!isHiddenOrSubmit) {
      const hasAria = /aria-label=["'][^"']+["']/i.test(inp) || /aria-labelledby/i.test(inp);
      const hasPlaceholder = /placeholder=["'][^"']+["']/i.test(inp);
      const hasId = /id=["']([^"']+)["']/i.test(inp);
      if (!hasAria && !hasPlaceholder && !hasId) {
        inputsWithoutLabels++;
      }
    }
  }

  // 5. Design System, Frameworks & Ambience
  const detectedFrameworks: string[] = [];
  if (/class=["'][^"']*(?:flex|grid|p-\d|m-\d|text-|bg-)[^"']*["']/i.test(html)) detectedFrameworks.push("Tailwind CSS");
  if (/data-radix-/i.test(html)) detectedFrameworks.push("Radix UI / Shadcn");
  if (/lucide/i.test(html) || /<svg[^>]+class=["'][^"']*lucide[^"']*["']/i.test(html)) detectedFrameworks.push("Lucide Icons");
  if (/__next/i.test(html) || /_next\/static/i.test(html)) detectedFrameworks.push("Next.js");
  if (/class=["'][^"']*(?:Mui|css-)[^"']*["']/i.test(html)) detectedFrameworks.push("MUI / Emotion");

  // Font family extraction
  const fontFamilies: string[] = [];
  const googleFonts = html.match(/fonts\.googleapis\.com\/css2\?family=([^&"']+)/gi) || [];
  for (const gf of googleFonts) {
    const match = gf.match(/family=([^&"']+)/i);
    if (match?.[1]) {
      const names = match[1].split(":")[0]?.replace(/\+/g, " ");
      if (names && !fontFamilies.includes(names)) fontFamilies.push(names);
    }
  }
  if (html.includes("Google Sans") || html.includes("Inter") || html.includes("Geist")) {
    if (!fontFamilies.includes("Inter / Geist modern sans")) fontFamilies.push("Inter / Geist modern sans");
  }

  // Navigation & Footer
  const hasNav = /<nav/i.test(html) || /class=["'][^"']*(?:navbar|header-nav)[^"']*["']/i.test(html);
  const hasFooter = /<footer/i.test(html) || /class=["'][^"']*(?:footer)[^"']*["']/i.test(html);

  // Hero Section & Primary CTA
  const hasHeroCTA = totalButtons > 0 && Boolean(cleanH1);

  // Images without alt
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  let imagesWithoutAlt = 0;
  for (const img of imgTags) {
    if (!/alt=["'][^"']*["']/i.test(img)) {
      imagesWithoutAlt++;
    }
  }

  // =========================================================================
  // PILLAR 1: VISUAL DESIGN & AMBIENCE (30%)
  // =========================================================================
  let visualScore = 95;
  const visualCritiques: VibeCritique[] = [];

  // Heading hierarchy check
  if (h1Matches.length === 0) {
    visualScore -= 20;
    visualCritiques.push({
      id: "vibe-heading-missing",
      pillar: "VISUAL_DESIGN_AMBIENCE",
      title: "Missing Primary Heading (<h1>)",
      impact: "HIGH",
      status: "NEEDS_WORK",
      summary: "The page has no semantic <h1> title. Visual hierarchy begins abruptly without a clear primary focal anchor.",
      recommendation: "Wrap your headline hook in a prominent <h1> tag with tight letter-spacing and responsive font size.",
      codeSnippet: `<h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900">\n  Your Compelling Headline\n</h1>`,
    });
  } else if (h1Matches.length > 1) {
    visualScore -= 8;
    visualCritiques.push({
      id: "vibe-heading-multiple",
      pillar: "VISUAL_DESIGN_AMBIENCE",
      title: `Multiple <h1> Headings Found (${h1Matches.length})`,
      impact: "MEDIUM",
      status: "WARNING",
      summary: "Multiple <h1> tags compete for primary visual dominance, diluting typographic hierarchy.",
      recommendation: "Keep exactly one <h1> for the main value proposition, and use <h2> and <h3> for supporting sections.",
    });
  } else {
    visualCritiques.push({
      id: "vibe-heading-good",
      pillar: "VISUAL_DESIGN_AMBIENCE",
      title: "Clean Typographic Focal Hierarchy",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: `Found single crisp <h1>: "${cleanH1?.slice(0, 65)}${cleanH1 && cleanH1.length > 65 ? "..." : ""}"`,
      recommendation: "Maintain strong contrast between <h1> and supporting body text.",
      detectedDetail: cleanH1,
    });
  }

  // Modern design system tokens
  if (detectedFrameworks.length > 0) {
    visualCritiques.push({
      id: "vibe-design-system",
      pillar: "VISUAL_DESIGN_AMBIENCE",
      title: `Design System Coherence (${detectedFrameworks.join(", ")})`,
      impact: "EXCELLENT",
      status: "PASSED",
      summary: `Consistent design system detected powered by ${detectedFrameworks.join(" & ")}.`,
      recommendation: "Continue adhering to design tokens for colors, shadows, and radii.",
    });
  } else {
    visualScore -= 10;
    visualCritiques.push({
      id: "vibe-design-system-none",
      pillar: "VISUAL_DESIGN_AMBIENCE",
      title: "Unstandardized Design System",
      impact: "MEDIUM",
      status: "WARNING",
      summary: "No standard design token framework detected. Visual rhythm may suffer from inconsistent padding and color scales.",
      recommendation: "Adopt Tailwind CSS or a tokenized component library like Radix / Shadcn to harmonize whitespace and typography.",
    });
  }

  // Typography pairing check
  if (fontFamilies.length >= 4) {
    visualScore -= 12;
    visualCritiques.push({
      id: "vibe-font-overload",
      pillar: "VISUAL_DESIGN_AMBIENCE",
      title: `Too Many Competing Typefaces (${fontFamilies.length})`,
      impact: "HIGH",
      status: "NEEDS_WORK",
      summary: "Loading 4+ different font families creates visual dissonance and slows down page rendering.",
      recommendation: "Standardize on 1 primary brand typeface (e.g., Inter or Geist) and 1 monospace accent.",
    });
  } else {
    visualCritiques.push({
      id: "vibe-font-harmony",
      pillar: "VISUAL_DESIGN_AMBIENCE",
      title: "Harmonious Typography Palette",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: fontFamilies.length > 0 ? `Clean font pairing: ${fontFamilies.join(", ")}` : "Clean modern system fonts utilized.",
      recommendation: "Keep line-height at 1.5 - 1.6 for comfortable reading rhythm.",
    });
  }

  visualScore = Math.max(10, Math.min(100, visualScore));

  // =========================================================================
  // PILLAR 2: UI & BUTTON CRAFT (25%)
  // =========================================================================
  let uiScore = 95;
  const uiCritiques: VibeCritique[] = [];

  if (totalButtons === 0) {
    uiScore -= 30;
    uiCritiques.push({
      id: "vibe-btn-none",
      pillar: "UI_BUTTON_CRAFT",
      title: "Zero Interactive Action Buttons Detected",
      impact: "CRITICAL",
      status: "NEEDS_WORK",
      summary: "The application contains no detectable <button> or Call-to-Action controls. Visitors have no clear path to interact or convert.",
      recommendation: "Introduce high-contrast primary and secondary action buttons above the fold.",
      codeSnippet: `<button className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-xs">\n  Get Started Free\n</button>`,
    });
  } else {
    uiCritiques.push({
      id: "vibe-btn-count",
      pillar: "UI_BUTTON_CRAFT",
      title: `Rich Interactive Control Surfaces (${totalButtons} buttons/CTAs)`,
      impact: "EXCELLENT",
      status: "PASSED",
      summary: `Found ${totalButtons} interactive button and CTA elements across the viewport.`,
      recommendation: "Ensure primary vs secondary buttons are visually distinct.",
    });
  }

  if (emptyButtonsCount > 0) {
    uiScore -= 18;
    uiCritiques.push({
      id: "vibe-btn-empty",
      pillar: "UI_BUTTON_CRAFT",
      title: `${emptyButtonsCount} Icon-Only Buttons Missing Accessible Labels`,
      impact: "HIGH",
      status: "NEEDS_WORK",
      summary: `${emptyButtonsCount} button(s) contain icons without text or aria-label attributes. Screen readers and users cannot decipher their purpose.`,
      recommendation: "Add aria-label and title attributes to all icon buttons.",
      codeSnippet: `<button aria-label="Toggle navigation menu" className="...">\n  <Menu className="w-5 h-5" />\n</button>`,
    });
  }

  if (genericCtaCount > 2) {
    uiScore -= 10;
    uiCritiques.push({
      id: "vibe-btn-generic-copy",
      pillar: "UI_BUTTON_CRAFT",
      title: `Low-Conversion Generic Button Copy ("${genericCtaCount}" generic labels)`,
      impact: "MEDIUM",
      status: "WARNING",
      summary: "Multiple buttons use generic phrasing like 'Click Here' or 'Submit'.",
      recommendation: "Replace passive labels with action-oriented value verbs like 'Launch Scanner', 'Start Free Trial', or 'Claim Access'.",
    });
  }

  if (inputsWithoutLabels > 0) {
    uiScore -= 15;
    uiCritiques.push({
      id: "vibe-input-unlabeled",
      pillar: "UI_BUTTON_CRAFT",
      title: `${inputsWithoutLabels} Form Inputs Lack Labels or Clear Placeholders`,
      impact: "HIGH",
      status: "NEEDS_WORK",
      summary: "Inputs missing visible labels or aria-label cause friction during data entry and fail WCAG form accessibility standards.",
      recommendation: "Pair inputs with descriptive <label> elements or explicit aria-label tags.",
    });
  } else if (inputTags.length > 0) {
    uiCritiques.push({
      id: "vibe-input-good",
      pillar: "UI_BUTTON_CRAFT",
      title: "Accessible & Labeled Form Controls",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: `All ${inputTags.length} form inputs have labels or clear placeholder guidance.`,
      recommendation: "Ensure high-contrast focus rings for keyboard navigation (:focus-visible).",
    });
  }

  uiScore = Math.max(10, Math.min(100, uiScore));

  // =========================================================================
  // PILLAR 3: PRODUCT FLOW & USABILITY (25%)
  // =========================================================================
  let flowScore = 95;
  const flowCritiques: VibeCritique[] = [];

  // Value Proposition / Hook
  if (!pageTitle || pageTitle === "React App" || pageTitle === "Home" || pageTitle === domain) {
    flowScore -= 15;
    flowCritiques.push({
      id: "vibe-flow-title",
      pillar: "PRODUCT_FLOW_USABILITY",
      title: "Weak or Default Document Title",
      impact: "HIGH",
      status: "NEEDS_WORK",
      summary: `Document title ("${pageTitle}") is generic. Users and bookmarks cannot identify your brand value.`,
      recommendation: "Format your page title as: '[Product Name] — [Primary Benefit / Hook]'.",
    });
  } else {
    flowCritiques.push({
      id: "vibe-flow-title-good",
      pillar: "PRODUCT_FLOW_USABILITY",
      title: "Strong Brand & Product Identity",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: `Document title clearly conveys purpose: "${pageTitle}"`,
      recommendation: "Ensure open-graph social share cards match this title.",
    });
  }

  // Meta description
  if (!metaDescription || metaDescription.length < 20) {
    flowScore -= 10;
    flowCritiques.push({
      id: "vibe-flow-desc-missing",
      pillar: "PRODUCT_FLOW_USABILITY",
      title: "Missing Product Description Meta Tag",
      impact: "MEDIUM",
      status: "WARNING",
      summary: "No concise meta description found. Search engines and link previews will display unformatted page text.",
      recommendation: "Add a 120-160 character meta description explaining what problem your product solves.",
    });
  } else {
    flowCritiques.push({
      id: "vibe-flow-desc-good",
      pillar: "PRODUCT_FLOW_USABILITY",
      title: "Clear 5-Second Pitch Meta Summary",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: `Found descriptive meta summary: "${metaDescription.slice(0, 80)}..."`,
      recommendation: "Keep description aligned with your hero heading.",
    });
  }

  // Navigation structure
  if (!hasNav) {
    flowScore -= 15;
    flowCritiques.push({
      id: "vibe-flow-nav-missing",
      pillar: "PRODUCT_FLOW_USABILITY",
      title: "Missing Semantic Navigation Bar",
      impact: "HIGH",
      status: "NEEDS_WORK",
      summary: "No <nav> header structure detected. Visitors have no visual anchors to explore features, pricing, or docs.",
      recommendation: "Add a sticky or top navigation bar with your logo, 3-5 core links, and a primary CTA.",
    });
  } else {
    flowCritiques.push({
      id: "vibe-flow-nav-good",
      pillar: "PRODUCT_FLOW_USABILITY",
      title: "Clear Navigation Architecture",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: "Top navigation structure provides clear visual wayfinding.",
      recommendation: "Include active link highlights and a mobile drawer.",
    });
  }

  // Footer & Trust anchors
  if (!hasFooter) {
    flowScore -= 10;
    flowCritiques.push({
      id: "vibe-flow-footer-missing",
      pillar: "PRODUCT_FLOW_USABILITY",
      title: "Missing Footer & Trust Signals",
      impact: "MEDIUM",
      status: "WARNING",
      summary: "No <footer> section detected. Professional apps rely on footers for privacy, copyright, status, and company info.",
      recommendation: "Add a clean footer with copyright, legal links, and social/repository links.",
    });
  } else {
    flowCritiques.push({
      id: "vibe-flow-footer-good",
      pillar: "PRODUCT_FLOW_USABILITY",
      title: "Trust Anchors & Legal Transparency",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: "Footer structure grounds the page and builds visitor trust.",
      recommendation: "Ensure terms, privacy policy, and support channels are clearly reachable.",
    });
  }

  flowScore = Math.max(10, Math.min(100, flowScore));

  // =========================================================================
  // PILLAR 4: RESPONSIVE & MOBILE ERGONOMICS (10%)
  // =========================================================================
  let responsiveScore = 95;
  const responsiveCritiques: VibeCritique[] = [];

  if (!hasResponsiveViewport) {
    responsiveScore -= 40;
    responsiveCritiques.push({
      id: "vibe-resp-viewport-missing",
      pillar: "RESPONSIVE_MOBILE",
      title: "CRITICAL: Missing Mobile Viewport Tag",
      impact: "CRITICAL",
      status: "NEEDS_WORK",
      summary: "Missing <meta name='viewport'> tag. Mobile browsers will render the desktop site at tiny unreadable scale.",
      recommendation: "Add the standard responsive viewport meta tag inside <head>.",
      codeSnippet: `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    });
  } else {
    responsiveCritiques.push({
      id: "vibe-resp-viewport-good",
      pillar: "RESPONSIVE_MOBILE",
      title: "Standard Mobile Viewport Configured",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: "Mobile scaling correctly set to width=device-width, initial-scale=1.",
      recommendation: "Prevent horizontal overflow on small 320px-375px screens with overflow-x: clip.",
    });
  }

  if (imagesWithoutAlt > 0) {
    responsiveScore -= 15;
    responsiveCritiques.push({
      id: "vibe-resp-img-alt",
      pillar: "RESPONSIVE_MOBILE",
      title: `${imagesWithoutAlt} Image(s) Missing Alt Text`,
      impact: "MEDIUM",
      status: "WARNING",
      summary: "Images without alt descriptions break accessibility for vision-impaired users and reduce SEO image indexing.",
      recommendation: "Add descriptive alt attributes or alt='' for decorative assets.",
    });
  } else if (imgTags.length > 0) {
    responsiveCritiques.push({
      id: "vibe-resp-img-good",
      pillar: "RESPONSIVE_MOBILE",
      title: "Accessible Media Assets",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: `All ${imgTags.length} media assets include alt descriptions.`,
      recommendation: "Use modern WebP/AVIF formats with responsive srcset for mobile performance.",
    });
  }

  responsiveScore = Math.max(10, Math.min(100, responsiveScore));

  // =========================================================================
  // PILLAR 5: TECHNICAL & SECURITY FOUNDATION (10%)
  // =========================================================================
  let techScore = 90;
  const techCritiques: VibeCritique[] = [];

  // TTFB Performance
  if (ttfbMs < 400) {
    techCritiques.push({
      id: "vibe-tech-ttfb-fast",
      pillar: "TECHNICAL_FOUNDATION",
      title: `Lightning-Fast Edge Response (${ttfbMs}ms)`,
      impact: "EXCELLENT",
      status: "PASSED",
      summary: `Server response time of ${ttfbMs}ms ensures immediate perceived page responsiveness.`,
      recommendation: "Keep bundle sizes light to prevent layout shifts (CLS).",
    });
  } else if (ttfbMs < 1000) {
    techScore -= 10;
    techCritiques.push({
      id: "vibe-tech-ttfb-mid",
      pillar: "TECHNICAL_FOUNDATION",
      title: `Average Server Latency (${ttfbMs}ms)`,
      impact: "MEDIUM",
      status: "WARNING",
      summary: `Time-to-First-Byte of ${ttfbMs}ms is acceptable but could benefit from CDN edge caching.`,
      recommendation: "Cache static assets and API routes at edge locations.",
    });
  } else {
    techScore -= 25;
    techCritiques.push({
      id: "vibe-tech-ttfb-slow",
      pillar: "TECHNICAL_FOUNDATION",
      title: `Sluggish Server Response (${ttfbMs}ms)`,
      impact: "HIGH",
      status: "NEEDS_WORK",
      summary: `Cold-start latency of ${ttfbMs}ms causes visible delay before first contentful paint (FCP).`,
      recommendation: "Inspect server-side database bottlenecks and optimize cold starts.",
    });
  }

  // Security headers check
  const hasHsts = Boolean(rawHeaders["strict-transport-security"]);
  const hasCsp = Boolean(rawHeaders["content-security-policy"]);
  const hasXfo = Boolean(rawHeaders["x-frame-options"]);

  if (hasHsts && hasXfo) {
    techCritiques.push({
      id: "vibe-tech-headers-good",
      pillar: "TECHNICAL_FOUNDATION",
      title: "Hardened Transport & Frame Defense",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: "Strict-Transport-Security (HSTS) and anti-clickjacking frame protections are properly configured.",
      recommendation: "Keep headers updated in production deployment configs.",
    });
  } else {
    techScore -= 15;
    techCritiques.push({
      id: "vibe-tech-headers-missing",
      pillar: "TECHNICAL_FOUNDATION",
      title: "Baseline Security Headers Incomplete",
      impact: "MEDIUM",
      status: "WARNING",
      summary: `Missing ${[!hasHsts ? "HSTS" : "", !hasXfo ? "X-Frame-Options" : "", !hasCsp ? "CSP" : ""].filter(Boolean).join(", ")}.`,
      recommendation: "Add security headers in your next.config.js or reverse proxy.",
    });
  }

  techScore = Math.max(10, Math.min(100, techScore));

  // =========================================================================
  // COMPOSITE VIBESCORE CALCULATION
  // Weights:
  // - Visual Design & Ambience: 30%
  // - UI & Button Craft: 25%
  // - Product Flow & Usability: 25%
  // - Responsive Craft: 10%
  // - Technical Foundation: 10%
  // =========================================================================
  const weightedVibeScore = Math.round(
    visualScore * 0.30 +
    uiScore * 0.25 +
    flowScore * 0.25 +
    responsiveScore * 0.10 +
    techScore * 0.10
  );

  const vibeScore = Math.max(10, Math.min(100, weightedVibeScore));

  let grade: VibeGrade = "F";
  let verdict: VibeVerdict = "POOR VIBE - CRITICAL PRODUCT DEFECTS";

  if (vibeScore >= 93) {
    grade = "A+";
    verdict = "ELITE CRAFT & VIBE";
  } else if (vibeScore >= 88) {
    grade = "A";
    verdict = "HIGH CRAFT - READY TO SHIP";
  } else if (vibeScore >= 78) {
    grade = "B";
    verdict = "SOLID VIBE - MINOR POLISH NEEDED";
  } else if (vibeScore >= 65) {
    grade = "C";
    verdict = "ROUGH VIBE - UX & DESIGN ATTENTION REQUIRED";
  } else if (vibeScore >= 50) {
    grade = "D";
    verdict = "POOR VIBE - CRITICAL PRODUCT DEFECTS";
  } else {
    grade = "F";
    verdict = "POOR VIBE - CRITICAL PRODUCT DEFECTS";
  }

  const allCritiques = [
    ...visualCritiques,
    ...uiCritiques,
    ...flowCritiques,
    ...responsiveCritiques,
    ...techCritiques,
  ];

  // High-level feedback bullet points
  const summaryFeedback: string[] = [];
  const topIssues = allCritiques.filter((c) => c.status === "NEEDS_WORK");
  const topWins = allCritiques.filter((c) => c.status === "PASSED");

  const firstIssue = topIssues[0];
  if (firstIssue) {
    summaryFeedback.push(
      `Priority Fix: ${firstIssue.title} — ${firstIssue.summary}`
    );
  }
  const secondIssue = topIssues[1];
  if (secondIssue) {
    summaryFeedback.push(
      `UX Friction: ${secondIssue.title} — ${secondIssue.summary}`
    );
  }
  const firstWin = topWins[0];
  if (firstWin) {
    summaryFeedback.push(
      `Design Win: ${firstWin.title} (${firstWin.summary})`
    );
  }

  const scannedAt = new Date().toISOString();

  // Cryptographic SHA-256 digest
  const canonicalPayload = JSON.stringify({
    domain,
    vibeScore,
    grade,
    verdict,
    scores: { visualScore, uiScore, flowScore, responsiveScore, techScore },
    scannedAt,
  });
  const sha256Digest = require("node:crypto").createHash("sha256").update(canonicalPayload).digest("hex");

  return {
    targetUrl,
    finalUrl,
    domain,
    vibeScore,
    grade,
    verdict,
    scannedAt,
    ttfbMs,
    scores: {
      visualDesign: visualScore,
      uiButtonCraft: uiScore,
      productFlow: flowScore,
      responsiveCraft: responsiveScore,
      technicalFoundation: techScore,
    },
    productSnapshot: {
      pageTitle,
      metaDescription,
      ogImage,
      detectedFrameworks,
      buttonCount: totalButtons,
      headingsHierarchy: {
        h1Count: h1Matches.length,
        h2Count: h2Matches.length,
        h3Count: h3Matches.length,
        sampleH1: cleanH1,
      },
      navigationDetected: hasNav,
      footerDetected: hasFooter,
      colorPaletteHints: detectedFrameworks.includes("Tailwind CSS") ? ["Utility Slate/Neutral Scale", "Semantic Accents"] : ["Custom Palette"],
      fontFamilies: fontFamilies.length > 0 ? fontFamilies : ["Modern System Sans (-apple-system, BlinkMacSystemFont)"],
      hasHeroCTA,
    },
    critiques: allCritiques,
    summaryFeedback,
    sha256Digest,
  };
}
