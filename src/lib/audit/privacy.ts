/**
 * Tracker detection for the privacy check. A request counts as tracking when its host is (or is under) one of
 * these domains: advertising, cross-site analytics and session-replay services. Cookieless, privacy-focused
 * analytics (Plausible, Fathom, Vercel Analytics, Cloudflare Web Analytics) are deliberately not listed.
 */
export const TRACKERS: Record<string, string> = {
  "google-analytics.com": "Google Analytics",
  "analytics.google.com": "Google Analytics",
  "googletagmanager.com": "Google Tag Manager",
  "doubleclick.net": "Google Ads (DoubleClick)",
  "googlesyndication.com": "Google AdSense",
  "googleadservices.com": "Google Ads",
  "connect.facebook.net": "Meta Pixel",
  "facebook.com": "Meta Pixel",
  "hotjar.com": "Hotjar",
  "hotjar.io": "Hotjar",
  "clarity.ms": "Microsoft Clarity",
  "bat.bing.com": "Microsoft Ads",
  "segment.com": "Segment",
  "segment.io": "Segment",
  "mixpanel.com": "Mixpanel",
  "amplitude.com": "Amplitude",
  "heapanalytics.com": "Heap",
  "fullstory.com": "FullStory",
  "posthog.com": "PostHog",
  "analytics.tiktok.com": "TikTok Pixel",
  "ads-twitter.com": "X (Twitter) Ads",
  "static.ads-twitter.com": "X (Twitter) Ads",
  "snap.licdn.com": "LinkedIn Insight",
  "px.ads.linkedin.com": "LinkedIn Ads",
  "ct.pinterest.com": "Pinterest Tag",
  "alb.reddit.com": "Reddit Pixel",
  "tr.snapchat.com": "Snap Pixel",
  "sc-static.net": "Snap Pixel",
  "mc.yandex.ru": "Yandex Metrica",
  "quantserve.com": "Quantcast",
  "scorecardresearch.com": "Comscore",
  "criteo.com": "Criteo",
  "criteo.net": "Criteo",
  "taboola.com": "Taboola",
  "outbrain.com": "Outbrain",
  "adnxs.com": "Xandr",
  "adroll.com": "AdRoll",
  "hs-analytics.net": "HubSpot Analytics",
  "track.hubspot.com": "HubSpot Analytics",
  "mouseflow.com": "Mouseflow",
  "crazyegg.com": "Crazy Egg",
  "luckyorange.com": "Lucky Orange",
};

export function trackerFor(host: string): string | null {
  const h = host.toLowerCase().replace(/^\.+/, "");
  for (const [domain, name] of Object.entries(TRACKERS)) if (h === domain || h.endsWith("." + domain)) return name;
  return null;
}

/** Second-level registry suffixes where the registrable domain has three labels (example.co.uk). */
const TWO_LEVEL = /\.(co|com|net|org|gov|edu|ac|ne|or)\.[a-z]{2}$/;

/** The registrable site of a host, close enough to tell first-party from third-party. */
export function siteOf(host: string): string {
  const h = host.toLowerCase().replace(/^\.+/, "").replace(/\.$/, "");
  if (/^[\d.]+$/.test(h) || h.includes(":")) return h;
  const parts = h.split(".");
  return parts.slice(TWO_LEVEL.test(h) ? -3 : -2).join(".");
}

/**
 * Cookies that bot protection and load balancers set to keep a site working. They are "strictly necessary"
 * under ePrivacy, so they need no consent and are not counted.
 */
const NECESSARY_COOKIE = /^(__cf_bm|cf_clearance|__cfruid|_cfuvid|__cflb|cf_ob_info|cf_use_ob|AWSALB|AWSALBCORS|AWSALBTG|AWSALBTGCORS|ak_bmsc|bm_sv|bm_sz|bm_mi|_abck|incap_ses_.*|visid_incap_.*|nlbi_.*|__ddg\d*_?|datadome)$/;

export function isNecessaryCookie(name: string): boolean {
  return NECESSARY_COOKIE.test(name);
}
