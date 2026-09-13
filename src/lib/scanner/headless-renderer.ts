import { validateTargetDestination } from "@/lib/security/ssrf";

export interface HeadlessRenderResult {
  rendered: boolean;
  renderedHtml?: string;
  hasHorizontalOverflow?: boolean;
  scrollWidth?: number;
  viewportWidth?: number;
  lowContrastElementsCount?: number;
  contrastDetails?: Array<{ selector: string; contrastRatio: number; textColor: string; bgColor: string }>;
  smallTapTargetsCount?: number;
  renderedButtonCount?: number;
  renderedHeadings?: { h1Count: number; h2Count: number; h3Count: number; sampleH1?: string };
  screenshotBase64?: string;
  renderTimeMs?: number;
  error?: string;
}

/**
 * Computes WCAG 2.1 relative luminance for an sRGB component
 */
function sRgbLuminance(channel: number): number {
  const norm = channel / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

/**
 * Parses rgb(...) or rgba(...) string and computes relative luminance
 */
export function getRelativeLuminance(colorStr: string): number {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match || !match[1] || !match[2] || !match[3]) return 1; // Default to white
  const r = sRgbLuminance(parseInt(match[1], 10));
  const g = sRgbLuminance(parseInt(match[2], 10));
  const b = sRgbLuminance(parseInt(match[3], 10));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG contrast ratio between two colors (e.g. 4.5:1)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Optional Headless Browser Render Pass via Playwright.
 * Renders target URL in headless Chromium, waits for hydration, and extracts:
 * - Hydrated DOM (for client-rendered SPAs)
 * - Real computed layout overflow (detects horizontal scroll bugs)
 * - Actual computed color contrast on text and buttons
 * - Interactive tap target dimensions
 *
 * Gracefully falls back to undefined/unrendered if Chromium is not available or times out.
 */
export async function renderPageWithPlaywright(
  targetUrl: string,
  options: { timeoutMs?: number; captureScreenshot?: boolean } = {}
): Promise<HeadlessRenderResult> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const startTime = performance.now();

  // 1. Validate destination against SSRF
  const ssrf = await validateTargetDestination(targetUrl);
  if (!ssrf.allowed) {
    return {
      rendered: false,
      error: `SSRF Sandbox Blocked: ${ssrf.reason}`,
    };
  }

  let chromiumModule: any;
  try {
    chromiumModule = await import("playwright");
  } catch (err: any) {
    return {
      rendered: false,
      error: `Playwright module not available: ${err.message}`,
    };
  }

  let browser: any = null;
  try {
    browser = await chromiumModule.chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 VibeCheck/2.0",
    });

    const page = await context.newPage();

    // Abort media/font requests to save bandwidth and ensure fast execution under timeout
    await page.route("**/*", (route: any) => {
      const resourceType = route.request().resourceType();
      if (["image", "media"].includes(resourceType) && !options.captureScreenshot) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Navigate with timeout
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });

    // Brief wait for hydration microtasks to mount client DOM
    await page.waitForTimeout(400);

    const renderedHtml = await page.content();

    // Visual & Computed Styles Inspection inside the rendered DOM
    const visualData = await page.evaluate(() => {
      const docElem = document.documentElement;
      const body = document.body;

      // 1. Layout Overflow Detection
      const viewportWidth = window.innerWidth;
      const scrollWidth = Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0);
      const hasHorizontalOverflow = scrollWidth > viewportWidth + 2; // Tolerance of 2px

      // 2. Computed Color Contrast Evaluation
      const contrastDetails: Array<{ selector: string; contrastRatio: number; textColor: string; bgColor: string }> = [];
      const textElements = Array.from(document.querySelectorAll("h1, h2, h3, button, a.btn, [role='button']")).slice(0, 30);

      for (const el of textElements) {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;

        const textColor = style.color;
        let bgColor = style.backgroundColor;

        // Traverse upwards if background is transparent
        let parent = el.parentElement;
        while (parent && (bgColor === "transparent" || bgColor === "rgba(0, 0, 0, 0)")) {
          bgColor = window.getComputedStyle(parent).backgroundColor;
          parent = parent.parentElement;
        }

        if (bgColor && textColor && bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)") {
          contrastDetails.push({
            selector: el.tagName.toLowerCase(),
            contrastRatio: 0, // Will be computed outside evaluate
            textColor,
            bgColor,
          });
        }
      }

      // 3. Small Tap Targets (< 24px)
      const interactives = Array.from(document.querySelectorAll("button, [role='button'], a[href], input[type='submit'], input[type='button']"));
      let smallTapTargetsCount = 0;
      let renderedButtonCount = 0;

      for (const el of interactives) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;

        renderedButtonCount++;
        if ((rect.width > 0 && rect.width < 24) || (rect.height > 0 && rect.height < 24)) {
          smallTapTargetsCount++;
        }
      }

      // 4. Rendered Headings
      const h1s = Array.from(document.querySelectorAll("h1")).map((h) => h.textContent?.trim()).filter(Boolean);
      const h2Count = document.querySelectorAll("h2").length;
      const h3Count = document.querySelectorAll("h3").length;

      return {
        hasHorizontalOverflow,
        scrollWidth,
        viewportWidth,
        contrastDetails,
        smallTapTargetsCount,
        renderedButtonCount,
        renderedHeadings: {
          h1Count: h1s.length,
          h2Count,
          h3Count,
          sampleH1: h1s[0],
        },
      };
    });

    // Compute contrast ratios on extracted colors
    let lowContrastElementsCount = 0;
    const finalContrastDetails: Array<{ selector: string; contrastRatio: number; textColor: string; bgColor: string }> = [];

    for (const item of visualData.contrastDetails) {
      const ratio = calculateContrastRatio(item.textColor, item.bgColor);
      if (ratio < 4.0 && ratio > 1.0) {
        lowContrastElementsCount++;
        finalContrastDetails.push({
          ...item,
          contrastRatio: ratio,
        });
      }
    }

    let screenshotBase64: string | undefined = undefined;
    if (options.captureScreenshot) {
      const buffer = await page.screenshot({ type: "jpeg", quality: 70 });
      screenshotBase64 = buffer.toString("base64");
    }

    const renderTimeMs = Math.round(performance.now() - startTime);

    return {
      rendered: true,
      renderedHtml,
      hasHorizontalOverflow: visualData.hasHorizontalOverflow,
      scrollWidth: visualData.scrollWidth,
      viewportWidth: visualData.viewportWidth,
      lowContrastElementsCount,
      contrastDetails: finalContrastDetails.slice(0, 5),
      smallTapTargetsCount: visualData.smallTapTargetsCount,
      renderedButtonCount: visualData.renderedButtonCount,
      renderedHeadings: visualData.renderedHeadings,
      screenshotBase64,
      renderTimeMs,
    };
  } catch (err: any) {
    return {
      rendered: false,
      error: err.message || "Headless render failed",
      renderTimeMs: Math.round(performance.now() - startTime),
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
