import { parse, type HTMLElement } from "node-html-parser";
import type { CheckResult } from "./types";

export interface HtmlDoc {
  /** URL or file path, used in evidence. */
  label: string;
  html: string;
}

interface DocFacts {
  label: string;
  lang: string;
  title: string;
  description: string;
  viewport: string | null;
  canonical: boolean;
  ogTitle: boolean;
  ogImage: boolean;
  favicon: boolean;
  robotsNoindex: boolean;
  h1Count: number;
  headingSkips: string[];
  imgNoAlt: string[];
  unlabeledInputs: string[];
  unnamedButtons: string[];
  unnamedLinks: string[];
  duplicateIds: string[];
  insecureRefs: string[];
  scripts: string[];
  localRefs: string[];
}

const MAX_EVIDENCE = 8;

function describe(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const id = el.getAttribute("id");
  const cls = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const name = el.getAttribute("name");
  const src = el.getAttribute("src") || el.getAttribute("href");
  let s = tag + (id ? `#${id}` : "") + (cls.length ? "." + cls.join(".") : "");
  if (name) s += `[name="${name}"]`;
  if (src && !id) s += ` ${truncate(src, 60)}`;
  return s;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function text(el: HTMLElement) {
  return el.textContent.replace(/\s+/g, " ").trim();
}

function isHidden(el: HTMLElement): boolean {
  for (let cur: HTMLElement | null = el; cur && cur.tagName; cur = cur.parentNode as HTMLElement | null) {
    if (cur.hasAttribute?.("hidden") || cur.getAttribute?.("aria-hidden") === "true") return true;
    if (/display\s*:\s*none/i.test(cur.getAttribute?.("style") || "")) return true;
  }
  return false;
}

function accessibleName(el: HTMLElement, root: HTMLElement): string {
  const aria = el.getAttribute("aria-label")?.trim();
  if (aria) return aria;
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const t = labelledBy
      .split(/\s+/)
      .map((id) => root.querySelector(`#${CSS_escape(id)}`))
      .filter(Boolean)
      .map((e) => text(e!))
      .join(" ")
      .trim();
    if (t) return t;
  }
  const own = text(el);
  if (own) return own;
  const imgAlt = el.querySelectorAll("img[alt]").map((i) => i.getAttribute("alt")?.trim()).find(Boolean);
  if (imgAlt) return imgAlt;
  const svgTitle = el.querySelector("svg title");
  if (svgTitle && text(svgTitle)) return text(svgTitle);
  const labelled = el.querySelector("[aria-label], [title]");
  const inner = labelled?.getAttribute("aria-label")?.trim() || labelled?.getAttribute("title")?.trim();
  if (inner) return inner;
  if (el.tagName === "INPUT") return el.getAttribute("value")?.trim() || "";
  return el.getAttribute("title")?.trim() || "";
}

function CSS_escape(id: string) {
  return id.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
}

export function extractFacts(doc: HtmlDoc): DocFacts {
  const root = parse(doc.html, { comment: false, blockTextElements: { script: true, style: true, noscript: true, pre: true } });
  const htmlEl = root.querySelector("html");
  const meta = (sel: string) => root.querySelector(sel)?.getAttribute("content")?.trim() ?? "";

  // Headings
  const headings = root.querySelectorAll("h1, h2, h3, h4, h5, h6").filter((h) => !isHidden(h));
  const headingSkips: string[] = [];
  let prev = 0;
  for (const h of headings) {
    const lvl = Number(h.tagName[1]);
    if (prev && lvl > prev + 1) headingSkips.push(`h${prev} → h${lvl} "${truncate(text(h), 50)}"`);
    prev = lvl;
  }

  // Images: missing alt attribute entirely (alt="" is valid for decorative images)
  const imgNoAlt = root
    .querySelectorAll("img")
    .filter((img) => !img.hasAttribute("alt") && img.getAttribute("role") !== "presentation" && !isHidden(img))
    .map(describe);

  // Form controls without an accessible label
  const labelsFor = new Set(root.querySelectorAll("label[for]").map((l) => l.getAttribute("for")));
  const unlabeledInputs = root
    .querySelectorAll("input, select, textarea")
    .filter((el) => {
      const type = (el.getAttribute("type") || "text").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image"].includes(type)) return false;
      if (isHidden(el)) return false;
      const id = el.getAttribute("id");
      if (id && labelsFor.has(id)) return false;
      if (el.getAttribute("aria-label")?.trim() || el.getAttribute("aria-labelledby") || el.getAttribute("title")?.trim()) return false;
      for (let p = el.parentNode as HTMLElement | null; p && p.tagName; p = p.parentNode as HTMLElement | null) {
        if (p.tagName === "LABEL") return false;
      }
      return true;
    })
    .map((el) => describe(el) + (el.getAttribute("placeholder") ? ` (placeholder only: "${truncate(el.getAttribute("placeholder")!, 30)}")` : ""));

  const unnamedButtons = root
    .querySelectorAll("button, [role='button'], input[type='submit'], input[type='button']")
    .filter((el) => !isHidden(el) && !accessibleName(el, root) && !(el.tagName === "INPUT" && el.getAttribute("type") === "submit"))
    .map(describe);

  const unnamedLinks = root
    .querySelectorAll("a[href]")
    .filter((el) => !isHidden(el) && !accessibleName(el, root))
    .map(describe);

  const idCounts = new Map<string, number>();
  for (const el of root.querySelectorAll("[id]")) {
    const id = el.getAttribute("id")!;
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }
  const duplicateIds = [...idCounts].filter(([, n]) => n > 1).map(([id, n]) => `#${id} ×${n}`);

  const insecureRefs = root
    .querySelectorAll("script[src], link[rel~='stylesheet'][href], img[src], iframe[src], video[src], audio[src], source[src], form[action]")
    .map((el) => el.getAttribute("src") || el.getAttribute("href") || el.getAttribute("action") || "")
    .filter((u) => u.startsWith("http://"));

  const scripts = root.querySelectorAll("script[src]").map((s) => s.getAttribute("src")!);

  const localRefs = root
    .querySelectorAll("script[src], link[href], img[src], source[src], video[src], audio[src], a[href], iframe[src]")
    .map((el) => el.getAttribute("src") || el.getAttribute("href") || "")
    .concat(
      root
        .querySelectorAll("img[srcset], source[srcset]")
        .flatMap((el) => (el.getAttribute("srcset") || "").split(",").map((s) => s.trim().split(/\s+/)[0]))
    )
    .filter((u) => u && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\{\{|\$\{)/i.test(u));

  return {
    label: doc.label,
    lang: htmlEl?.getAttribute("lang")?.trim() ?? "",
    title: text(root.querySelector("title") ?? parse("")),
    description: meta("meta[name='description']"),
    viewport: root.querySelector("meta[name='viewport']")?.getAttribute("content") ?? null,
    canonical: Boolean(root.querySelector("link[rel='canonical'][href]")),
    ogTitle: Boolean(meta("meta[property='og:title']")),
    ogImage: Boolean(meta("meta[property='og:image']")),
    favicon: Boolean(root.querySelector("link[rel~='icon'][href], link[rel='apple-touch-icon'][href]")),
    robotsNoindex: /noindex/i.test(meta("meta[name='robots']")),
    h1Count: headings.filter((h) => h.tagName === "H1").length,
    headingSkips,
    imgNoAlt,
    unlabeledInputs,
    unnamedButtons,
    unnamedLinks,
    duplicateIds,
    insecureRefs,
    scripts,
    localRefs,
  };
}

function collect(facts: DocFacts[], pick: (f: DocFacts) => string[], multi: boolean): string[] {
  const out: string[] = [];
  for (const f of facts) for (const item of pick(f)) out.push(multi ? `${f.label}: ${item}` : item);
  return out;
}

function listCheck(
  base: Omit<CheckResult, "status" | "detail" | "evidence">,
  items: string[],
  passDetail: string,
  failDetail: (n: number) => string,
  warnBelow = 0
): CheckResult {
  const status = items.length === 0 ? "pass" : items.length <= warnBelow ? "warn" : "fail";
  return {
    ...base,
    status,
    detail: items.length === 0 ? passDetail : failDetail(items.length),
    evidence: items.length ? items.slice(0, MAX_EVIDENCE).concat(items.length > MAX_EVIDENCE ? [`…and ${items.length - MAX_EVIDENCE} more`] : []) : undefined,
  };
}

/**
 * Deterministic checks over one or more HTML documents.
 * `primary` is the page whose head metadata (title, description, OG) is judged: the URL or index.html.
 */
export function htmlChecks(docs: HtmlDoc[], opts: { isHttps: boolean }): CheckResult[] {
  if (!docs.length) return [];
  const facts = docs.map(extractFacts);
  const p = facts[0];
  const multi = docs.length > 1;
  const where = multi ? ` across ${docs.length} HTML files` : "";
  const out: CheckResult[] = [];

  // --- SEO & sharing (judged on the primary page) ---
  const t = p.title;
  out.push({
    id: "seo-title",
    category: "seo",
    severity: "medium",
    method: "html",
    title: "Page title",
    status: !t ? "fail" : t.length < 10 || t.length > 70 ? "warn" : "pass",
    detail: !t ? "No <title> element, so tabs, bookmarks and search results show the bare URL." : `${t.length} characters. Search results typically show 50–60.`,
    evidence: t ? [`<title>${t}</title>`] : undefined,
    fix: "Write a specific <title> of roughly 30–60 characters.",
  });
  const d = p.description;
  out.push({
    id: "seo-description",
    category: "seo",
    severity: "low",
    method: "html",
    title: "Meta description",
    status: !d ? "fail" : d.length < 50 || d.length > 170 ? "warn" : "pass",
    detail: !d ? "No meta description; search engines will pick arbitrary page text for the snippet." : `${d.length} characters (50–160 is the usual target).`,
    evidence: d ? [truncate(d, 200)] : undefined,
    fix: '<meta name="description" content="One or two sentences on what this page is for.">',
  });
  out.push({
    id: "seo-social",
    category: "seo",
    severity: "low",
    method: "html",
    title: "Social preview tags",
    status: p.ogTitle && p.ogImage ? "pass" : p.ogTitle || p.ogImage ? "warn" : "fail",
    detail: `og:title ${p.ogTitle ? "present" : "missing"}, og:image ${p.ogImage ? "present" : "missing"}. Without them, links shared in Slack, X or iMessage render as plain text.`,
    fix: 'Add <meta property="og:title"> and a 1200×630 <meta property="og:image">.',
  });
  out.push({
    id: "seo-canonical",
    category: "seo",
    severity: "low",
    method: "html",
    title: "Canonical URL",
    status: p.canonical ? "pass" : "warn",
    detail: p.canonical ? "A rel=canonical link is declared." : "No rel=canonical link; duplicate URLs (query strings, trailing slashes) may split ranking.",
    fix: '<link rel="canonical" href="https://your.domain/path">',
  });
  out.push({
    id: "seo-favicon",
    category: "seo",
    severity: "low",
    method: "html",
    title: "Favicon declared",
    status: p.favicon ? "pass" : "warn",
    detail: p.favicon ? "An icon link is declared in <head>." : "No <link rel=icon>; browsers fall back to /favicon.ico if it exists.",
  });
  if (p.robotsNoindex) {
    out.push({
      id: "seo-noindex",
      category: "seo",
      severity: "high",
      method: "html",
      title: "Page is excluded from search",
      status: "warn",
      detail: "meta robots contains noindex. Fine for staging; a launch blocker in production.",
      evidence: ["<meta name=\"robots\" content=\"…noindex…\">"],
    });
  }

  // --- Accessibility ---
  const noLang = facts.filter((f) => !f.lang).map((f) => f.label);
  out.push({
    id: "a11y-lang",
    category: "accessibility",
    severity: "medium",
    method: "html",
    title: "Document language",
    status: noLang.length ? "fail" : "pass",
    detail: noLang.length ? `<html> has no lang attribute${multi ? ` in ${noLang.length} file(s)` : ""}; screen readers may read it in the wrong voice.` : `lang="${p.lang}" is set${where}.`,
    evidence: multi && noLang.length ? noLang.slice(0, MAX_EVIDENCE) : undefined,
    fix: '<html lang="en">',
  });

  const vp = p.viewport;
  const blocksZoom = vp ? /user-scalable\s*=\s*(no|0)/i.test(vp) || /maximum-scale\s*=\s*(0?\.\d+|1(\.0+)?)\b/i.test(vp) : false;
  out.push({
    id: "a11y-viewport",
    category: "accessibility",
    severity: "medium",
    method: "html",
    title: "Mobile viewport and zoom",
    status: !vp || !/width\s*=\s*device-width/i.test(vp) ? "fail" : blocksZoom ? "fail" : "pass",
    detail: !vp
      ? "No viewport meta tag; phones render the page at desktop width and shrink it."
      : blocksZoom
        ? "The viewport disables pinch-zoom, which fails WCAG 1.4.4 for low-vision users."
        : "width=device-width is set and zoom is allowed.",
    evidence: vp ? [`content="${vp}"`] : undefined,
    fix: '<meta name="viewport" content="width=device-width, initial-scale=1">',
  });

  out.push(
    listCheck(
      { id: "a11y-img-alt", category: "accessibility", severity: "medium", method: "html", title: "Images have alt text", fix: 'Add alt="description", or alt="" for purely decorative images.' },
      collect(facts, (f) => f.imgNoAlt, multi),
      `Every visible <img> has an alt attribute${where}.`,
      (n) => `${n} image(s) have no alt attribute, so screen readers announce the file name.`
    )
  );
  out.push(
    listCheck(
      { id: "a11y-form-labels", category: "accessibility", severity: "medium", method: "html", title: "Form fields are labelled", fix: "Associate a <label for=…>, wrap the input in <label>, or add aria-label. Placeholders vanish on input and do not count." },
      collect(facts, (f) => f.unlabeledInputs, multi),
      `Every visible form field has a programmatic label${where}.`,
      (n) => `${n} form field(s) have no label a screen reader can announce.`
    )
  );
  out.push(
    listCheck(
      { id: "a11y-button-names", category: "accessibility", severity: "medium", method: "html", title: "Buttons have accessible names", fix: 'Icon-only buttons need aria-label="Close" (or visually hidden text).' },
      collect(facts, (f) => f.unnamedButtons, multi),
      `Every button exposes a name${where}.`,
      (n) => `${n} button(s) have no text, aria-label, or labelled image; they are announced as just "button".`
    )
  );
  out.push(
    listCheck(
      { id: "a11y-link-names", category: "accessibility", severity: "medium", method: "html", title: "Links have accessible names", fix: "Give icon links an aria-label, or alt text on the image inside them." },
      collect(facts, (f) => f.unnamedLinks, multi),
      `Every link exposes a name${where}.`,
      (n) => `${n} link(s) have no discernible text.`
    )
  );

  const noH1 = facts.filter((f) => f.h1Count === 0).map((f) => f.label);
  const manyH1 = facts.filter((f) => f.h1Count > 1).map((f) => `${f.label}: ${f.h1Count} × <h1>`);
  out.push({
    id: "a11y-h1",
    category: "accessibility",
    severity: "low",
    method: "html",
    title: "One main heading",
    status: noH1.length ? "fail" : manyH1.length ? "warn" : "pass",
    detail: noH1.length
      ? `${multi ? `${noH1.length} page(s) have` : "The page has"} no <h1>. Screen-reader users jump to it to learn what the page is.`
      : manyH1.length
        ? "Multiple <h1> elements; usually one per page reads more clearly."
        : `Exactly one <h1>${multi ? " per page" : ""}.`,
    evidence: multi ? (noH1.length ? noH1 : manyH1).slice(0, MAX_EVIDENCE) : undefined,
  });
  out.push(
    listCheck(
      { id: "a11y-heading-order", category: "accessibility", severity: "low", method: "html", title: "Heading levels don't skip" },
      collect(facts, (f) => f.headingSkips, multi),
      "Heading levels increase one step at a time.",
      (n) => `${n} place(s) where a heading level is skipped, which breaks the outline screen readers navigate by.`,
      2
    )
  );
  out.push(
    listCheck(
      { id: "a11y-duplicate-ids", category: "accessibility", severity: "low", method: "html", title: "Element IDs are unique" },
      collect(facts, (f) => f.duplicateIds, multi),
      "No duplicate id attributes.",
      (n) => `${n} id value(s) are used more than once; label[for] and aria references may point at the wrong element.`,
      2
    )
  );

  if (opts.isHttps) {
    out.push(
      listCheck(
        { id: "sec-mixed-content", category: "security", severity: "medium", method: "html", title: "No insecure (http://) subresources", fix: "Load every script, stylesheet, image and form target over https://." },
        collect(facts, (f) => f.insecureRefs, multi),
        "Every subresource is referenced over HTTPS.",
        (n) => `${n} subresource(s) are referenced over plain http://. Browsers block active mixed content outright.`
      )
    );
  }
  return out;
}
