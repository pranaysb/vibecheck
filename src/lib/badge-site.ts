/**
 * The short form of an audited URL used in badge links: "https://site.com/" → "site.com". Paths keep their exact
 * form ("https://site.com/en/" → "site.com/en/"), because /en and /en/ are different targets.
 */
export function badgeSite(target: string): string {
  const s = target.replace(/^https:\/\//, "");
  return /^[^/]+\/$/.test(s) ? s.slice(0, -1) : s;
}
