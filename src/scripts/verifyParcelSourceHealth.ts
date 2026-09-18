/**
 * verify:parcel-source-health — live check that every government ArcGIS parcel
 * endpoint in parcelSourceRegistry is still reachable and answering queries. Run
 * this after adding a new state/county, or periodically to catch a source that
 * moved/retired silently (governments rename services without notice).
 *
 * Exits non-zero if any source is unhealthy, so it can gate CI or a deploy check
 * the same way the other verify:* scripts do.
 */

import { checkAllParcelSources } from "@/lib/property/parcelSourceHealthCheck";

async function main() {
  const report = await checkAllParcelSources();

  for (const source of report.sources) {
    const label = source.county ? `${source.state} — ${source.county}` : source.state;
    const status = source.ok ? "OK" : "DOWN";
    console.log(`[${status}] ${label} — ${source.sourceName}`);
    if (!source.ok) {
      for (const ep of source.endpoints.filter((e) => !e.ok)) {
        console.log(`    ${ep.label}: ${ep.error} (${ep.url})`);
      }
    }
  }

  console.log(JSON.stringify({
    checkedAt: report.checkedAt,
    total: report.total,
    healthy: report.healthy,
    unhealthy: report.unhealthy,
  }, null, 2));

  if (report.unhealthy > 0) {
    console.error(`${report.unhealthy}/${report.total} parcel source(s) unreachable.`);
    process.exit(1);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
