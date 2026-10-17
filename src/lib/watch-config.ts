// Settings for weekly re-audits, kept apart from lib/watch so pages can show them without loading the audit engine.

/** How often a watched site is re-audited. Vercel Hobby cron runs once a day, so runs land within a day of this. */
export const WATCH_INTERVAL_DAYS = 7;
/** Sites one account can watch; each weekly run is a full audit with headless Chromium. */
export const WATCH_LIMIT = 3;
/** Re-audits started per daily run; any beyond this wait for the next day. */
export const DAILY_RUN_CAP = 25;
/** After this many failed re-audits in a row the watch pauses, so a dead site doesn't keep failing silently. */
export const PAUSE_AFTER_FAILURES = 3;
/** A drop this large is worth telling the owner about even with no newly failing check. */
export const SCORE_DROP_ALERT = 5;
