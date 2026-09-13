import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { analyzeVibeFromHtml } from "../src/lib/scanner/vibe-analyzer";

describe("Vibe & Product UI/UX Analyzer Engine", () => {
  const sampleHeaders = {
    "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
    "x-frame-options": "DENY",
    "content-security-policy": "default-src 'self'",
  };

  test("1. Detects missing <h1> heading defect", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Corp — Modern Cloud Storage</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body>
          <p>Welcome to our cloud</p>
          <button>Get Started</button>
        </body>
      </html>
    `;
    const result = analyzeVibeFromHtml(html, sampleHeaders, 120, "https://acme.com", "https://acme.com");
    const missingH1 = result.critiques.find((c) => c.id === "vibe-heading-missing");
    assert.ok(missingH1, "Should flag missing <h1>");
    assert.equal(missingH1.status, "NEEDS_WORK");
    assert.equal(missingH1.impact, "HIGH");
    assert.ok(result.scores.visualDesign < 90, "Visual score should be penalized");
  });

  test("2. Detects single clean <h1> and extracts text", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Corp — Intelligent Analytics</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body>
          <h1 class="text-4xl font-bold">Deploy faster with automated insight</h1>
          <button>Try Free</button>
        </body>
      </html>
    `;
    const result = analyzeVibeFromHtml(html, sampleHeaders, 150, "https://acme.com", "https://acme.com");
    const h1Pass = result.critiques.find((c) => c.id === "vibe-heading-good");
    assert.ok(h1Pass, "Should pass with clean h1");
    assert.equal(result.productSnapshot.headingsHierarchy.sampleH1, "Deploy faster with automated insight");
  });

  test("3. Flags zero interactive buttons", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme — Static Readonly Page</title></head>
        <body><h1>Only text here</h1><p>No buttons at all</p></body>
      </html>
    `;
    const result = analyzeVibeFromHtml(html, sampleHeaders, 100, "https://acme.com", "https://acme.com");
    const noBtn = result.critiques.find((c) => c.id === "vibe-btn-none");
    assert.ok(noBtn, "Should flag zero interactive buttons");
    assert.equal(noBtn.impact, "CRITICAL");
    assert.ok(result.scores.uiButtonCraft < 75);
  });

  test("4. Flags icon-only buttons missing aria-label accessibility", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme App</title></head>
        <body>
          <h1>App Dashboard</h1>
          <button><svg viewBox="0 0 24 24"></svg></button>
          <button class="btn">Clean text button</button>
        </body>
      </html>
    `;
    const result = analyzeVibeFromHtml(html, sampleHeaders, 100, "https://acme.com", "https://acme.com");
    const emptyBtn = result.critiques.find((c) => c.id === "vibe-btn-empty");
    assert.ok(emptyBtn, "Should flag icon-only button without aria-label");
    assert.equal(emptyBtn.status, "NEEDS_WORK");
  });

  test("5. Flags low-conversion generic CTA copy (Click Here, Submit)", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme App</title></head>
        <body>
          <h1>My SaaS</h1>
          <button>click here</button>
          <button>submit</button>
          <button>more</button>
        </body>
      </html>
    `;
    const result = analyzeVibeFromHtml(html, sampleHeaders, 100, "https://acme.com", "https://acme.com");
    const genericCta = result.critiques.find((c) => c.id === "vibe-btn-generic-copy");
    assert.ok(genericCta, "Should flag repeated generic CTA labels");
  });

  test("6. Flags unlabelled form inputs", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Form</title></head>
        <body>
          <h1>Registration</h1>
          <input type="text" />
          <input type="email" />
        </body>
      </html>
    `;
    const result = analyzeVibeFromHtml(html, sampleHeaders, 100, "https://acme.com", "https://acme.com");
    const unlabeled = result.critiques.find((c) => c.id === "vibe-input-unlabeled");
    assert.ok(unlabeled, "Should flag inputs lacking labels, placeholders, or aria-labels");
  });

  test("7. Detects Tailwind CSS and UI design tokens", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Tailwind App</title></head>
        <body class="flex flex-col p-4 bg-slate-50 text-slate-900">
          <h1 class="text-3xl">Styled App</h1>
          <button class="px-4 py-2 bg-black text-white">Action</button>
        </body>
      </html>
    `;
    const result = analyzeVibeFromHtml(html, sampleHeaders, 80, "https://acme.com", "https://acme.com");
    assert.ok(result.productSnapshot.detectedFrameworks.includes("Tailwind CSS"), "Should detect Tailwind CSS");
    const designPass = result.critiques.find((c) => c.id === "vibe-design-system");
    assert.ok(designPass, "Should pass design token check");
  });

  test("8. Flags missing mobile viewport meta tag", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Non-responsive</title></head>
        <body><h1>Title</h1><button>Action</button></body>
      </html>
    `;
    const result = analyzeVibeFromHtml(html, sampleHeaders, 90, "https://acme.com", "https://acme.com");
    const viewportFail = result.critiques.find((c) => c.id === "vibe-resp-viewport-missing");
    assert.ok(viewportFail, "Should detect missing viewport");
    assert.equal(viewportFail.impact, "CRITICAL");
    assert.ok(result.scores.responsiveCraft <= 60);
  });

  test("9. Detects images missing alt text", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Gallery</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body>
          <h1>Gallery</h1>
          <img src="/hero.png" />
          <img src="/avatar.jpg" />
        </body>
      </html>
    `;
    const result = analyzeVibeFromHtml(html, sampleHeaders, 100, "https://acme.com", "https://acme.com");
    const altFail = result.critiques.find((c) => c.id === "vibe-resp-img-alt");
    assert.ok(altFail, "Should detect images missing alt tags");
  });

  test("10. Produces deterministic composite VibeScore and SHA-256 digest", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Linear — Issue Tracking for High-Performance Teams</title>
          <meta name="description" content="Linear is an issue tracker built for high-performance software engineering teams.">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body class="flex flex-col bg-black text-white">
          <nav><a href="/">Home</a></nav>
          <h1 class="text-5xl font-bold">Issue tracking that engineers love</h1>
          <button aria-label="Sign Up" class="px-5 py-2.5 rounded-lg bg-white text-black font-semibold">Get Started Free</button>
          <footer><a href="/privacy">Privacy</a></footer>
        </body>
      </html>
    `;
    const r1 = analyzeVibeFromHtml(html, sampleHeaders, 65, "https://linear.app", "https://linear.app");
    const r2 = analyzeVibeFromHtml(html, sampleHeaders, 65, "https://linear.app", "https://linear.app");

    assert.equal(r1.vibeScore, r2.vibeScore, "VibeScore must be strictly deterministic");
    assert.equal(r1.grade, r2.grade, "Grade must be deterministic");
    assert.equal(r1.sha256Digest.length, 64, "Must generate valid SHA-256 hex digest");
    assert.ok(r1.vibeScore >= 90, "High craft application should achieve Grade A/A+");
    assert.equal(r1.grade, "A+");
  });
});
