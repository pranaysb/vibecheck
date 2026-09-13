/**
 * VibeCheck Comprehensive Product, UI, UX, and Vibe Analyzer.
 * Evaluates real-world product ergonomics, button craft, visual ambience,
 * navigation flow, typography hierarchy, and mobile responsiveness.
 */

import type { HeadlessRenderResult } from "./headless-renderer";
import { parse } from "node-html-parser";

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
  headlessRender?: {
    used: boolean;
    hasHorizontalOverflow?: boolean;
    lowContrastElementsCount?: number;
    smallTapTargetsCount?: number;
    renderTimeMs?: number;
  };
}

export function analyzeVibeFromHtml(
  rawHtml: string,
  rawHeaders: Record<string, string>,
  ttfbMs: number,
  targetUrl: string,
  finalUrl: string,
  headlessData?: HeadlessRenderResult | null
): VibeAnalysisResult {
  // If headless rendering captured hydrated DOM, audit the rendered DOM; otherwise use raw static HTML
  const html = headlessData?.rendered && headlessData.renderedHtml ? headlessData.renderedHtml : rawHtml;
  const parsed = new URL(finalUrl || targetUrl);
  const domain = parsed.hostname;

  const root = parse(html);

  // 1. Extract Meta & Head Information via AST
  const titleEl = root.querySelector("title");
  const pageTitle = titleEl?.textContent?.trim() || domain;

  const descEl = root.querySelector("meta[name='description'], meta[content][name='description']");
  const metaDescription = descEl?.getAttribute("content")?.trim() || "";

  const ogImageEl = root.querySelector("meta[property='og:image']");
  const ogImage = ogImageEl?.getAttribute("content")?.trim() || undefined;

  const viewportEl = root.querySelector("meta[name='viewport']");
  const viewportContent = viewportEl?.getAttribute("content") || "";
  const hasResponsiveViewport = viewportContent.includes("width=device-width");

  // 2. Headings & Visual Hierarchy Analysis via AST
  const h1Elements = root.querySelectorAll("h1");
  const h2Elements = root.querySelectorAll("h2");
  const h3Elements = root.querySelectorAll("h3");
  const h1Count = h1Elements.length;
  const h2Count = h2Elements.length;
  const h3Count = h3Elements.length;

  const firstH1 = h1Elements[0];
  const cleanH1 = firstH1
    ? firstH1.textContent.replace(/\s+/g, " ").trim()
    : undefined;

  // 3. Interactive Buttons & Controls (native buttons, [role="button"], input buttons, CTA links)
  const standardButtons = root.querySelectorAll("button");
  const roleButtons = root.querySelectorAll("[role='button']").filter((el) => el.tagName.toLowerCase() !== "button");
  const inputButtons = root.querySelectorAll("input[type='submit'], input[type='button']");
  const linkButtons = root.querySelectorAll("a.btn, a.button, a.cta, a[class*='btn'], a[class*='button']");

  const totalButtons = standardButtons.length + roleButtons.length + inputButtons.length + linkButtons.length;

  let emptyButtonsCount = 0;
  let genericCtaCount = 0;
  let roleButtonsMissingTabindex = 0;
  const genericLabels = ["click here", "submit", "button", "link", "read more", "more", "learn more"];

  for (const btn of standardButtons) {
    const textOnly = btn.textContent.trim().toLowerCase();
    const ariaLabel = btn.getAttribute("aria-label")?.trim() || btn.getAttribute("title")?.trim();
    const hasSvg = Boolean(btn.querySelector("svg"));
    const hasImg = Boolean(btn.querySelector("img"));

    const isIconOnly = (!textOnly || textOnly.length === 0) && (hasSvg || hasImg);
    const isCompletelyEmpty = !textOnly && !ariaLabel && !hasSvg && !hasImg;

    if ((isIconOnly && !ariaLabel) || isCompletelyEmpty) {
      emptyButtonsCount++;
    } else if (genericLabels.includes(textOnly)) {
      genericCtaCount++;
    }
  }

  // Accessibility check for simulated [role="button"] elements (styled-components, custom divs)
  for (const roleBtn of roleButtons) {
    const textOnly = roleBtn.textContent.trim().toLowerCase();
    const ariaLabel = roleBtn.getAttribute("aria-label")?.trim() || roleBtn.getAttribute("title")?.trim();
    const hasSvg = Boolean(roleBtn.querySelector("svg"));
    const hasImg = Boolean(roleBtn.querySelector("img"));

    const isIconOnly = (!textOnly || textOnly.length === 0) && (hasSvg || hasImg);
    const isCompletelyEmpty = !textOnly && !ariaLabel && !hasSvg && !hasImg;

    if ((isIconOnly && !ariaLabel) || isCompletelyEmpty) {
      emptyButtonsCount++;
    } else if (genericLabels.includes(textOnly)) {
      genericCtaCount++;
    }

    if (!roleBtn.hasAttribute("tabindex")) {
      roleButtonsMissingTabindex++;
    }
  }

  // 4. Form Inputs & Accessibility via AST (including <label for="..."> association)
  const inputTags = root.querySelectorAll("input, textarea, select");
  let inputsWithoutLabels = 0;
  let totalInspectableInputs = 0;

  for (const inp of inputTags) {
    const type = inp.getAttribute("type")?.toLowerCase() || "text";
    const isHiddenOrSubmit = ["hidden", "submit", "button", "checkbox", "radio"].includes(type);
    if (!isHiddenOrSubmit) {
      totalInspectableInputs++;
      const hasAria = Boolean(inp.getAttribute("aria-label") || inp.getAttribute("aria-labelledby"));
      const hasPlaceholder = Boolean(inp.getAttribute("placeholder")?.trim());
      const inputId = inp.getAttribute("id");
      let hasAssociatedLabel = false;
      if (inputId) {
        try {
          hasAssociatedLabel = Boolean(root.querySelector(`label[for="${inputId}"]`));
        } catch {
          hasAssociatedLabel = false;
        }
      }
      const isInsideLabel = Boolean(inp.closest("label"));

      if (!hasAria && !hasPlaceholder && !hasAssociatedLabel && !isInsideLabel) {
        inputsWithoutLabels++;
      }
    }
  }

  // 5. Design System, Frameworks & Ambience
  const detectedFrameworks: string[] = [];
  if (root.querySelector("[class*='flex'], [class*='grid'], [class*='p-'], [class*='m-'], [class*='text-'], [class*='bg-']") || /class=["'][^"']*(?:flex|grid|p-\d|m-\d|text-|bg-)[^"']*["']/i.test(html)) {
    detectedFrameworks.push("Tailwind CSS");
  }
  if (root.querySelector("[data-radix-collection-item], [data-state], [data-orientation]") || /data-radix-/i.test(html)) {
    detectedFrameworks.push("Radix UI / Shadcn");
  }
  if (root.querySelector("svg.lucide, svg[class*='lucide']") || /lucide/i.test(html)) {
    detectedFrameworks.push("Lucide Icons");
  }
  if (root.querySelector("#__next, script[src*='/_next/static/']") || /__next/i.test(html) || /_next\/static/i.test(html)) {
    detectedFrameworks.push("Next.js");
  }
  if (root.querySelector("[class*='Mui'], [class*='css-']") || /class=["'][^"']*(?:Mui|css-)[^"']*["']/i.test(html)) {
    detectedFrameworks.push("MUI / Emotion");
  }

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

  // Navigation & Footer via AST
  const hasNav = root.querySelectorAll("nav, [role='navigation'], header nav").length > 0 ||
                 root.querySelectorAll("[class*='navbar'], [class*='header-nav']").length > 0 ||
                 /<nav/i.test(html);
  const hasFooter = root.querySelectorAll("footer, [role='contentinfo']").length > 0 ||
                   root.querySelectorAll("[class*='footer']").length > 0 ||
                   /<footer/i.test(html);

  // Hero Section & Primary CTA
  const hasHeroCTA = totalButtons > 0 && Boolean(cleanH1);

  // Images without alt via AST
  const imgTags = root.querySelectorAll("img");
  let imagesWithoutAlt = 0;
  for (const img of imgTags) {
    if (!img.hasAttribute("alt")) {
      imagesWithoutAlt++;
    }
  }

  // =========================================================================
  // PILLAR 1: VISUAL DESIGN & AMBIENCE (30%)
  // =========================================================================
  let visualScore = 95;
  const visualCritiques: VibeCritique[] = [];

  // Heading hierarchy check
  if (h1Count === 0) {
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
  } else if (h1Count > 1) {
    visualScore -= 8;
    visualCritiques.push({
      id: "vibe-heading-multiple",
      pillar: "VISUAL_DESIGN_AMBIENCE",
      title: `Multiple <h1> Headings Found (${h1Count})`,
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

  // Heading hierarchy skip check (WCAG 1.3.1)
  if (h3Count > 0 && h2Count === 0) {
    visualScore -= 6;
    visualCritiques.push({
      id: "vibe-heading-skip",
      pillar: "VISUAL_DESIGN_AMBIENCE",
      title: "Broken Heading Hierarchy (Skipped <h2>)",
      impact: "MEDIUM",
      status: "WARNING",
      summary: "Found <h3> headings without any preceding <h2> headings, breaking the semantic document outline.",
      recommendation: "Ensure heading levels ascend progressively (<h1> -> <h2> -> <h3>).",
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

  // Headless Real Visual Inspection (Overflow & Computed Color Contrast)
  if (headlessData?.rendered) {
    if (headlessData.hasHorizontalOverflow) {
      visualScore -= 15;
      visualCritiques.push({
        id: "vibe-visual-overflow",
        pillar: "VISUAL_DESIGN_AMBIENCE",
        title: `Horizontal Layout Overflow Detected (${headlessData.scrollWidth}px on ${headlessData.viewportWidth}px viewport)`,
        impact: "HIGH",
        status: "NEEDS_WORK",
        summary: "Rendered page content exceeds viewport boundaries, forcing horizontal scrolling.",
        recommendation: "Ensure full-width containers use max-width: 100vw and enforce overflow-x: clip on body.",
        codeSnippet: "html, body { max-width: 100vw; overflow-x: clip; }",
      });
    }

    if (headlessData.lowContrastElementsCount && headlessData.lowContrastElementsCount > 0) {
      visualScore -= Math.min(20, headlessData.lowContrastElementsCount * 5);
      visualCritiques.push({
        id: "vibe-visual-contrast-low",
        pillar: "VISUAL_DESIGN_AMBIENCE",
        title: `Low Visual Color Contrast on ${headlessData.lowContrastElementsCount} Elements`,
        impact: "HIGH",
        status: "NEEDS_WORK",
        summary: `${headlessData.lowContrastElementsCount} rendered text or button elements fail the WCAG 4.5:1 color contrast threshold.`,
        recommendation: "Increase foreground text luminance against dark backgrounds or darken text on light surfaces.",
      });
    } else {
      visualCritiques.push({
        id: "vibe-visual-contrast-pass",
        pillar: "VISUAL_DESIGN_AMBIENCE",
        title: "High Visual Color Contrast & Legibility",
        impact: "EXCELLENT",
        status: "PASSED",
        summary: "All tested text and button elements meet WCAG 4.5:1 color contrast standards.",
        recommendation: "Maintain contrast ratio across light/dark mode themes.",
      });
    }
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

  if (roleButtonsMissingTabindex > 0) {
    uiScore -= Math.min(12, roleButtonsMissingTabindex * 4);
    uiCritiques.push({
      id: "vibe-btn-role-unfocusable",
      pillar: "UI_BUTTON_CRAFT",
      title: `${roleButtonsMissingTabindex} Custom [role="button"] Elements Not Keyboard Focusable`,
      impact: "HIGH",
      status: "NEEDS_WORK",
      summary: `${roleButtonsMissingTabindex} custom element(s) declare role="button" but lack tabindex="0", making them inaccessible to keyboard navigation.`,
      recommendation: "Prefer native <button> elements or add tabindex='0' and keyboard handlers to custom role='button' elements.",
      codeSnippet: `<div role="button" tabIndex={0} onKeyDown={handleKeyDown} className="...">Action</div>`,
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
  } else if (totalInspectableInputs > 0) {
    uiCritiques.push({
      id: "vibe-input-good",
      pillar: "UI_BUTTON_CRAFT",
      title: "Accessible & Labeled Form Controls",
      impact: "EXCELLENT",
      status: "PASSED",
      summary: `All ${totalInspectableInputs} form inputs have labels or clear placeholder guidance.`,
      recommendation: "Ensure high-contrast focus rings for keyboard navigation (:focus-visible).",
    });
  }

  // Headless tap target dimensions check
  if (headlessData?.rendered && typeof headlessData.smallTapTargetsCount === "number") {
    if (headlessData.smallTapTargetsCount > 0) {
      uiScore -= Math.min(15, headlessData.smallTapTargetsCount * 3);
      uiCritiques.push({
        id: "vibe-btn-small-tap-targets",
        pillar: "UI_BUTTON_CRAFT",
        title: `${headlessData.smallTapTargetsCount} Interactive Controls Below Accessible Touch Target (24px)`,
        impact: "MEDIUM",
        status: "WARNING",
        summary: `Found ${headlessData.smallTapTargetsCount} interactive control(s) smaller than 24x24px, which causes touch mis-taps on mobile devices.`,
        recommendation: "Ensure interactive elements provide at least a 44x44px touch target (or minimum 24x24px with appropriate padding).",
      });
    } else {
      uiCritiques.push({
        id: "vibe-btn-tap-targets-pass",
        pillar: "UI_BUTTON_CRAFT",
        title: "Ergonomic Touch Target Sizing",
        impact: "EXCELLENT",
        status: "PASSED",
        summary: "All tested interactive buttons and links satisfy minimum touch target size constraints.",
        recommendation: "Maintain ample spacing between adjacent touch targets.",
      });
    }
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
      buttonCount: headlessData?.rendered && typeof headlessData.renderedButtonCount === "number" ? headlessData.renderedButtonCount : totalButtons,
      headingsHierarchy: {
        h1Count: headlessData?.rendered && headlessData.renderedHeadings ? headlessData.renderedHeadings.h1Count : h1Count,
        h2Count: headlessData?.rendered && headlessData.renderedHeadings ? headlessData.renderedHeadings.h2Count : h2Count,
        h3Count: headlessData?.rendered && headlessData.renderedHeadings ? headlessData.renderedHeadings.h3Count : h3Count,
        sampleH1: headlessData?.rendered && headlessData.renderedHeadings?.sampleH1 ? headlessData.renderedHeadings.sampleH1 : cleanH1,
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
    headlessRender: headlessData?.rendered ? {
      used: true,
      hasHorizontalOverflow: headlessData.hasHorizontalOverflow,
      lowContrastElementsCount: headlessData.lowContrastElementsCount,
      smallTapTargetsCount: headlessData.smallTapTargetsCount,
      renderTimeMs: headlessData.renderTimeMs,
    } : undefined,
  };
}
