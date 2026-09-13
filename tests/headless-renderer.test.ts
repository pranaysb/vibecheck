import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getRelativeLuminance,
  calculateContrastRatio,
  renderPageWithPlaywright,
  type HeadlessRenderResult,
} from "../src/lib/scanner/headless-renderer";
import { analyzeVibeFromHtml } from "../src/lib/scanner/vibe-analyzer";

describe("Playwright Headless Renderer & Visual Inspection Engine", () => {
  const sampleHeaders = {
    "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
    "x-frame-options": "DENY",
    "content-security-policy": "default-src 'self'",
  };

  test("1. Computes exact WCAG 2.1 relative luminance", () => {
    const whiteLuminance = getRelativeLuminance("rgb(255, 255, 255)");
    assert.equal(whiteLuminance, 1, "White should have luminance of 1");

    const blackLuminance = getRelativeLuminance("rgb(0, 0, 0)");
    assert.equal(blackLuminance, 0, "Black should have luminance of 0");
  });

  test("2. Computes exact WCAG contrast ratios", () => {
    const maxContrast = calculateContrastRatio("rgb(255, 255, 255)", "rgb(0, 0, 0)");
    assert.equal(maxContrast, 21, "Black and white must yield maximum 21:1 contrast ratio");

    const sameContrast = calculateContrastRatio("rgb(120, 120, 120)", "rgb(120, 120, 120)");
    assert.equal(sameContrast, 1, "Identical colors must yield 1:1 contrast ratio");

    // Standard low-contrast light gray on white: #999999 (153, 153, 153) on white (255, 255, 255)
    const lowContrast = calculateContrastRatio("rgb(153, 153, 153)", "rgb(255, 255, 255)");
    assert.ok(lowContrast < 4.5, `Should detect low contrast (${lowContrast} < 4.5)`);
  });

  test("3. Strictly sandboxes SSRF targets before launching Playwright Chromium", async () => {
    const result1 = await renderPageWithPlaywright("http://169.254.169.254/latest/meta-data");
    assert.equal(result1.rendered, false);
    assert.ok(result1.error?.includes("SSRF Sandbox Blocked"));

    const result2 = await renderPageWithPlaywright("http://127.0.0.1:8080/admin");
    assert.equal(result2.rendered, false);
    assert.ok(result2.error?.includes("SSRF Sandbox Blocked"));
  });

  test("4. Vibe analyzer incorporates headless horizontal layout overflow defects", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Overflow Demo</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body>
          <h1>Wide Container</h1>
          <button>Click</button>
        </body>
      </html>
    `;

    const mockHeadless: HeadlessRenderResult = {
      rendered: true,
      hasHorizontalOverflow: true,
      scrollWidth: 1600,
      viewportWidth: 1280,
      lowContrastElementsCount: 0,
      smallTapTargetsCount: 0,
      renderTimeMs: 120,
    };

    const result = analyzeVibeFromHtml(html, sampleHeaders, 80, "https://acme.com", "https://acme.com", mockHeadless);
    const overflowCritique = result.critiques.find((c) => c.id === "vibe-visual-overflow");

    assert.ok(overflowCritique, "Must flag horizontal layout overflow");
    assert.equal(overflowCritique.status, "NEEDS_WORK");
    assert.equal(overflowCritique.impact, "HIGH");
    assert.ok(result.headlessRender?.used, "Must report headlessRender used");
    assert.equal(result.headlessRender?.hasHorizontalOverflow, true);
  });

  test("5. Vibe analyzer incorporates low visual color contrast and tap target defects", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Contrast Demo</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body>
          <h1>Unreadable Content</h1>
          <button>Tiny</button>
        </body>
      </html>
    `;

    const mockHeadless: HeadlessRenderResult = {
      rendered: true,
      hasHorizontalOverflow: false,
      scrollWidth: 1280,
      viewportWidth: 1280,
      lowContrastElementsCount: 4,
      smallTapTargetsCount: 2,
      renderTimeMs: 140,
    };

    const result = analyzeVibeFromHtml(html, sampleHeaders, 80, "https://acme.com", "https://acme.com", mockHeadless);
    const contrastCritique = result.critiques.find((c) => c.id === "vibe-visual-contrast-low");
    const tapTargetCritique = result.critiques.find((c) => c.id === "vibe-btn-small-tap-targets");

    assert.ok(contrastCritique, "Must flag low contrast elements");
    assert.equal(contrastCritique.status, "NEEDS_WORK");
    assert.ok(tapTargetCritique, "Must flag undersized tap targets");
    assert.equal(tapTargetCritique.status, "WARNING");
  });
});
