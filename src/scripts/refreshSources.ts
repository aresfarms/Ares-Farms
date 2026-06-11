/**
 * sources:refresh — the daily auto-refresh job (run on a cron / scheduled
 * function). Refreshes every APPROVED + live property source, recomputes
 * freshness, logs each result to the audit ledger, skips unapproved sources, and
 * never auto-activates anything.
 *
 *   npm run sources:refresh
 *   npm run sources:refresh -- --simulate-failure hud   (proves graceful degrade)
 *
 * Schedule daily (government data has low churn; daily keeps "current listing"
 * honest), e.g. cron `0 9 * * *` or a platform scheduled function calling this.
 */

import { refreshAllSources } from "../lib/property/sourceRefresh";

const failIdx = process.argv.indexOf("--simulate-failure");
const failSource = failIdx >= 0 ? process.argv[failIdx + 1] : undefined;

async function main(): Promise<void> {
  const results = await refreshAllSources({ failSource });

  console.log(`source auto-refresh — ${new Date().toISOString()}${failSource ? ` (simulating failure: ${failSource})` : ""}`);
  for (const r of results) {
    const mark = r.status === "FAILED" ? "✗" : r.status === "SKIPPED" ? "–" : "✓";
    console.log(
      `  ${mark} ${r.sourceId.padEnd(14)} ${r.status.padEnd(10)} checked=${r.checked} fresh-flipped=${r.freshnessFlipped} current=${r.currentNow} historical=${r.historicalNow} +${r.addedFromFeed}/-${r.removedFromFeed}`,
    );
    console.log(`      ${r.reason}`);
  }
  const failed = results.filter((r) => r.status === "FAILED");
  console.log(
    `\n${results.length} source(s): ${results.filter((r) => r.status === "REFRESHED" || r.status === "NO_CHANGE").length} refreshed/no-change, ${results.filter((r) => r.status === "SKIPPED").length} skipped (unapproved), ${failed.length} failed (last-good kept live).`,
  );
  console.log("All actions logged to the audit ledger (domain: source-refresh). No source was activated.");
}

main().then(() => process.exit(0)).catch((e) => { console.error("source-refresh FAILED —", e); process.exit(1); });
