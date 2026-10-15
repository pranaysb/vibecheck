import { runBrowserAudit } from "@/lib/audit/browser";
(async () => {
  for (const url of process.argv.slice(2)) {
    const t = Date.now();
    const r = await runBrowserAudit({ url, fetchedStatus: 200 });
    console.log(`== ${url} ran=${r.ran} ${((Date.now() - t) / 1000).toFixed(1)}s ${r.reason ?? ""}`);
    for (const c of r.checks.filter((c) => c.id === "a11y-axe" || c.id === "priv-trackers")) {
      console.log(`  ${c.id} ${c.status}: ${c.detail}`);
      for (const e of c.evidence ?? []) console.log(`     ${e.slice(0, 160)}`);
    }
  }
})();
