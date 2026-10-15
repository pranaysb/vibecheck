import { test } from "node:test";
import assert from "node:assert/strict";
import { crawlChecks, discoverLinks, robotsAllows, sitemapUrls } from "../src/lib/audit/crawl";
import { isNecessaryCookie, siteOf, trackerFor } from "../src/lib/audit/privacy";

test("robots.txt: * group applies, longest match wins, Allow wins ties, other agents ignored", () => {
  const allows = robotsAllows("User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nDisallow: /admin\nDisallow: /*.pdf$\nAllow: /admin/public\n");
  assert.equal(allows("/"), true);
  assert.equal(allows("/admin/users"), false);
  assert.equal(allows("/admin/public/page"), true);
  assert.equal(allows("/files/a.pdf"), false);
  assert.equal(allows("/files/a.pdf?x"), true);
  assert.equal(robotsAllows(null)("/anything"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow:\n")("/x"), true, "empty Disallow allows all");
});

test("link discovery keeps same-origin pages only, without fragments or assets", () => {
  const html = `<a href="/about#team">a</a><a href="pricing">p</a><a href="https://other.com/x">o</a><a href="mailto:a@b.c">m</a><a href="/logo.png">i</a><a href="#top">t</a><a href="/about">dup</a>`;
  assert.deepEqual(discoverLinks(html, "https://site.com/home/"), ["https://site.com/about", "https://site.com/home/pricing"]);
  assert.deepEqual(sitemapUrls("<urlset><url><loc>https://site.com/a</loc></url><url><loc>https://evil.com/b</loc></url></urlset>", "https://site.com"), ["https://site.com/a"]);
  assert.deepEqual(sitemapUrls("<sitemapindex><sitemap><loc>https://site.com/s.xml</loc></sitemap></sitemapindex>", "https://site.com"), []);
});

test("crawl checks: real errors fail, auth/rate-limit/timeouts don't, JS shells aren't judged", () => {
  const start = { url: "https://s.com/", title: "Home", description: "d" };
  const [links, seo, a11y] = crawlChecks(
    {
      pages: [
        { url: "https://s.com/gone", status: 404, linkedFrom: "/" },
        { url: "https://s.com/private", status: 403, linkedFrom: "/" },
        { url: "https://s.com/slow", status: null, error: "Timed out after 10000ms", linkedFrom: "/" },
        { url: "https://s.com/a", status: 200, linkedFrom: "/", title: "Home", description: "", h1Count: 0, imgNoAlt: 2 },
        { url: "https://s.com/app", status: 200, linkedFrom: "/", title: "Home", description: "", h1Count: 0, imgNoAlt: 0, shell: true },
      ],
      unvisited: 0,
      disallowed: 0,
    },
    start
  );
  assert.equal(links.status, "fail");
  assert.deepEqual(links.evidence, ["404 /gone (linked from /)"]);
  assert.equal(seo.status, "fail", "duplicate title Home on / and /a");
  assert.match(seo.detail, /1 page\(s\) are rendered by JavaScript/);
  assert.equal(a11y.status, "fail");
  const onlyShells = crawlChecks({ pages: [{ url: "https://s.com/app", status: 200, linkedFrom: "/", title: "Home", description: "", shell: true }], unvisited: 0, disallowed: 0 }, start);
  assert.deepEqual(onlyShells.map((c) => c.status), ["pass", "skip", "skip"]);
  assert.deepEqual(crawlChecks({ pages: [], unvisited: 0, disallowed: 0 }, start).map((c) => c.status), ["skip", "skip", "skip"]);
});

test("pages sharing a canonical URL count as one page for duplicate titles", () => {
  const start = { url: "https://v.com/", title: "Vercel", description: "d", canonical: "https://v.com/" };
  const [, seo] = crawlChecks({ pages: [{ url: "https://v.com/home", status: 200, linkedFrom: "/", title: "Vercel", description: "d", h1Count: 1, imgNoAlt: 0, canonical: "https://v.com/" }], unvisited: 0, disallowed: 0 }, start);
  assert.equal(seo.status, "pass");
  const [, dup] = crawlChecks({ pages: [{ url: "https://v.com/other", status: 200, linkedFrom: "/", title: "Vercel", description: "d", h1Count: 1, imgNoAlt: 0 }], unvisited: 0, disallowed: 0 }, start);
  assert.equal(dup.status, "fail");
});

test("trackers are matched by domain suffix; sites are registrable domains", () => {
  assert.equal(trackerFor("www.googletagmanager.com"), "Google Tag Manager");
  assert.equal(trackerFor("securepubads.g.doubleclick.net"), "Google Ads (DoubleClick)");
  assert.equal(trackerFor("notgoogletagmanager.com"), null);
  assert.equal(trackerFor("plausible.io"), null);
  assert.equal(siteOf("www.bbc.co.uk"), "bbc.co.uk");
  assert.equal(siteOf(".cdn.example.com"), "example.com");
  assert.equal(siteOf("127.0.0.1"), "127.0.0.1");
  assert.equal(isNecessaryCookie("__cf_bm"), true);
  assert.equal(isNecessaryCookie("incap_ses_123_456"), true);
  assert.equal(isNecessaryCookie("_ga"), false);
});
