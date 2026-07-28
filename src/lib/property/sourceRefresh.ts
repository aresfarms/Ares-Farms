/**
 * Daily source auto-refresh — SERVER-ONLY (the scheduled backend job).
 *
 * Keeps APPROVED, live property sources current without anyone re-ingesting by
 * hand. For every source that is Module 22/23 APPROVED + sourceLive, it
 * re-validates the feed, recomputes each record's freshness (is_current per the
 * freshness rule), and writes a refresh log entry (counts + timestamp) to the
 * audit ledger. Runs per-source — one source failing never blocks the others.
 *
 * HARD GUARANTEES:
 *   - NEVER auto-activates a source. It only READS runtime liveness; it never
 *     writes the activation overlay / flips sourceLive. A newly added source
 *     stays PENDING until a human approves it on the Source Review screen.
 *   - Vintage/historical sources (USDA snapshot) refresh to a logged NO_CHANGE.
 *   - On fetch failure: keep last-good data live, log FAILURE + an operator
 *     ALERT, and continue — never blank the lane.
 *   - Official feeds only (the source's own adapter); no commercial scraping.
 *
 * Belongs to the source-intelligence unit; logs through the property audit
 * ledger (same unit) → data/audit-ledger.ndjson.
 */

import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import * as fs from "node:fs";
import * as path from "node:path";

import { SOURCE_ACTIVATION } from "./sourceActivation";
import { getRuntimeActivation, isSourceLiveRuntime } from "./sourceActivationStore";
import { recordsForReview } from "./propertyData";
import { recordIsCurrent, type CanonicalProperty, type PropertySourceId } from "./propertyTypes";
import { writeLiveRecords } from "./liveOverlay";
import { runtimeStatePath } from "./runtimeStatePath";
import { fetchHudReoRecords } from "./hudAdapter";
import { fetchTreasuryRealProperty } from "./treasuryAdapter";
import { fetchGsaRealEstate } from "./gsaRealEstateAdapter";

/**
 * Per-source LIVE fetcher (official feed → canonical records). A source with a
 * fetcher gets a genuine pull + diff each run; one without (USDA's source is a
 * 2018 static archive) is revalidated as a historical snapshot.
 */
const LIVE_FETCHERS: Partial<Record<string, () => Promise<{ records: CanonicalProperty[]; fetchedAt: string }>>> = {
  hud: fetchHudReoRecords,
  // Auction feeds: genuine daily re-pull so the auction set stays current —
  // concluded auctions drop off the official feed (removedFromFeed), new ones
  // appear (addedFromFeed). Combined with auction-date freshness, expired
  // auctions that linger are relabeled historical.
  treasury: fetchTreasuryRealProperty,
  "gsa-realestate": fetchGsaRealEstate,
};

const REFRESH_STATE_PATH = runtimeStatePath("source-refresh-state.json");
const DOMAIN = "source-refresh";

export type RefreshStatus = "REFRESHED" | "NO_CHANGE" | "SKIPPED" | "FAILED";

export interface SourceRefreshResult {
  sourceId: string;
  sourceName: string;
  status: RefreshStatus;
  checked: number;
  freshnessFlipped: number;
  currentNow: number;
  historicalNow: number;
  addedFromFeed: number;
  removedFromFeed: number;
  reason: string;
}

function writeRefreshState(sourceId: string, r: SourceRefreshResult, now: Date): void {
  let state: Record<string, unknown> = {};
  try {
    state = JSON.parse(fs.readFileSync(REFRESH_STATE_PATH, "utf8"));
  } catch {
    /* first run */
  }
  state[sourceId] = {
    lastRefreshedAt: now.toISOString(),
    status: r.status,
    checked: r.checked,
    currentNow: r.currentNow,
    historicalNow: r.historicalNow,
    freshnessFlipped: r.freshnessFlipped,
  };
  fs.mkdirSync(path.dirname(REFRESH_STATE_PATH), { recursive: true });
  fs.writeFileSync(REFRESH_STATE_PATH, JSON.stringify(state, null, 2) + "\n", "utf8");
}

function log(sourceId: string, decision: string, r: SourceRefreshResult): void {
  canonicalLandRegisterAuthority.append({
    actorId: "system:source-refresh",
    actorName: "source-refresh-job",
    domain: DOMAIN,
    subject: sourceId,
    decision,
    reason: r.reason,
    detail: {
      status: r.status,
      checked: r.checked,
      freshnessFlipped: r.freshnessFlipped,
      currentNow: r.currentNow,
      historicalNow: r.historicalNow,
      addedFromFeed: r.addedFromFeed,
      removedFromFeed: r.removedFromFeed,
    },
  });
}

/**
 * Run the refresh across ALL known sources. Approved/live ones are refreshed;
 * everything else is SKIPPED (and never activated). `failSource` simulates a
 * feed-fetch failure for one source to exercise graceful degradation.
 */
export async function refreshAllSources(opts?: { now?: Date; failSource?: string }): Promise<SourceRefreshResult[]> {
  const now = opts?.now ?? new Date();
  const results: SourceRefreshResult[] = [];

  for (const sourceId of Object.keys(SOURCE_ACTIVATION)) {
    const act = getRuntimeActivation(sourceId);
    const sourceName = act?.sourceName ?? sourceId;
    const base = (over: Partial<SourceRefreshResult>): SourceRefreshResult => ({
      sourceId, sourceName, status: "NO_CHANGE", checked: 0, freshnessFlipped: 0,
      currentNow: 0, historicalNow: 0, addedFromFeed: 0, removedFromFeed: 0, reason: "", ...over,
    });

    try {
      // GUARDRAIL: only refresh sources a human already approved. Never activate.
      if (!isSourceLiveRuntime(sourceId)) {
        const r = base({
          status: "SKIPPED",
          reason: "not Module 22/23 approved — not refreshed; refresh never activates a source",
        });
        log(sourceId, "SKIP", r);
        results.push(r);
        continue;
      }

      // Simulated failure hook (proof of graceful degradation).
      if (opts?.failSource === sourceId) throw new Error("simulated official-feed fetch failure");

      // LIVE PULL: a source with a fetcher pulls fresh listings from its official
      // feed and diffs against what's currently served (overlay, else committed).
      // A source without one (USDA static archive) is revalidated in place.
      let records: CanonicalProperty[];
      let added = 0;
      let removed = 0;
      let updated = 0;
      const fetcher = LIVE_FETCHERS[sourceId];
      if (fetcher) {
        const prev = recordsForReview(sourceId as PropertySourceId);
        const fresh = await fetcher(); // official feed only
        const prevHash = new Map(prev.map((c) => [c.canonical_property_id, c.content_hash]));
        const freshIds = new Set(fresh.records.map((c) => c.canonical_property_id));
        for (const c of fresh.records) {
          const ph = prevHash.get(c.canonical_property_id);
          if (ph === undefined) added += 1;
          else if (ph !== c.content_hash) updated += 1;
        }
        for (const id of prevHash.keys()) if (!freshIds.has(id)) removed += 1;
        writeLiveRecords(sourceId, fresh.records, fresh.fetchedAt); // hub serves this now
        records = fresh.records;
      } else {
        records = recordsForReview(sourceId as PropertySourceId);
      }

      // Recompute freshness for every record against the freshness anchor
      // (per-listing date, else the snapshot's fetched_at). Evaluate "now" AFTER
      // the pull so a just-fetched snapshot isn't counted as historical due to a
      // sub-second clock skew (its fetched_at lands just after the run's start).
      const evalNow = opts?.now ?? new Date();
      let flipped = 0;
      let currentNow = 0;
      let historicalNow = 0;
      for (const c of records) {
        const rec = c.source_records[0];
        const nowCurrent = recordIsCurrent(c, evalNow); // auction-date aware
        if (nowCurrent !== rec.isCurrent) flipped += 1;
        if (nowCurrent) currentNow += 1;
        else historicalNow += 1;
      }

      const changed = added + removed + updated > 0 || flipped > 0;
      const status: RefreshStatus = changed ? "REFRESHED" : "NO_CHANGE";
      const reason = fetcher
        ? `pulled ${records.length} from official feed (+${added} / -${removed}, ${updated} updated)`
        : currentNow > 0
          ? "feed re-validated — no freshness change this run"
          : "historical snapshot — no change";
      const r = base({
        status, checked: records.length, freshnessFlipped: flipped, currentNow, historicalNow,
        addedFromFeed: added, removedFromFeed: removed, reason,
      });
      writeRefreshState(sourceId, r, now);
      log(sourceId, status === "REFRESHED" ? "REFRESH" : "NO_CHANGE", r);
      results.push(r);
    } catch (e) {
      // Keep last-good data live; log the failure + an operator alert; continue.
      const r = base({
        status: "FAILED",
        reason: `feed fetch failed — last-good data kept live: ${(e as Error).message}`,
      });
      log(sourceId, "FAILURE", r);
      canonicalLandRegisterAuthority.append({
        actorId: "system:source-refresh",
        actorName: "source-refresh-job",
        domain: DOMAIN,
        subject: sourceId,
        decision: "ALERT",
        reason: "operator alert: source refresh failed; lane kept on last-good data",
      });
      results.push(r);
    }
  }

  // Place-fact pipeline step: resolve OZ/HUBZone for any newly-added property
  // (auctions rotate), so a missing badge always means "checked, not designated".
  // Gate-respecting (skips when a place-fact source isn't Module 22/23 approved).
  // Never blocks the source results; failure is swallowed + would surface in its
  // own audit-ledger entry.
  try {
    const { refreshPropertyPlaceFacts } = await import("./placeFactRefresh");
    await refreshPropertyPlaceFacts({ now });
  } catch {
    /* place-fact refresh is best-effort; property refresh results stand */
  }

  // Market capital-rate refresh: pull keyless FRED (prime / 5-yr Treasury /
  // SOFR) into the runtime-state overlay so the displayed rates track the
  // Fed/market. Best-effort — a failure keeps the committed snapshot live.
  try {
    const { refreshCapitalRates } = await import("./capitalRatesRefresh");
    const rate = await refreshCapitalRates();
    canonicalLandRegisterAuthority.append({
      actorId: "system:source-refresh",
      actorName: "source-refresh-job",
      domain: DOMAIN,
      subject: "capital-rates",
      decision: rate.status === "FAILED" ? "ALERT" : "REFRESH",
      reason:
        rate.status === "FAILED"
          ? "capital-rate refresh failed — committed snapshot kept live"
          : `capital rates ${rate.status.toLowerCase()} (prime ${rate.prime ?? "—"}, 5yr ${rate.treasury5yr ?? "—"}, SOFR ${rate.sofr ?? "—"}) as of ${rate.asOf}`,
    });
  } catch {
    /* capital-rate refresh is best-effort; committed snapshot stands */
  }

  // Market commodity + livestock refresh: pull USDA NASS price-received (grain
  // $/bu, livestock $/cwt) into the runtime-state overlay so the market tiles
  // track USDA. Needs NASS_API_KEY in the job env; SKIPPED without it. Best-effort
  // — a failure keeps the committed snapshot live.
  try {
    const { refreshCommodityPrices } = await import("./commodityPricesRefresh");
    const c = await refreshCommodityPrices();
    canonicalLandRegisterAuthority.append({
      actorId: "system:source-refresh",
      actorName: "source-refresh-job",
      domain: DOMAIN,
      subject: "commodity-prices",
      decision: c.status === "FAILED" ? "ALERT" : "REFRESH",
      reason:
        c.status === "SKIPPED"
          ? "commodity refresh skipped — NASS_API_KEY not set in the refresh job"
          : c.status === "FAILED"
            ? "commodity/livestock refresh failed — committed snapshot kept live"
            : `commodity prices ${c.status.toLowerCase()} (${c.grain} grain, ${c.livestock} livestock)`,
    });
  } catch {
    /* commodity refresh is best-effort; committed snapshot stands */
  }

  // Weekly ag refresh (Tier-1 activation 2026-07-28): drought severity (USDM,
  // keyless) + corn/soybean crop conditions (NASS, same key as above) into the
  // weekly-ag overlay, so the "local truth" leads — this week's drought map and
  // crop ratings — track their weekly sources instead of aging in a snapshot.
  // Best-effort: a thin pull never overwrites the served picture.
  try {
    const { refreshWeeklyAg } = await import("./weeklyAgRefresh");
    const w = await refreshWeeklyAg();
    canonicalLandRegisterAuthority.append({
      actorId: "system:source-refresh",
      actorName: "source-refresh-job",
      domain: DOMAIN,
      subject: "weekly-ag",
      decision: w.status === "FAILED" ? "ALERT" : "REFRESH",
      reason:
        w.status === "FAILED"
          ? `weekly-ag refresh failed (drought ${w.droughtStates} states) — committed snapshot kept live`
          : `weekly-ag ${w.status.toLowerCase()} (drought ${w.droughtStates} states, crop conditions ${w.cropStates} states)`,
    });
  } catch {
    /* weekly-ag refresh is best-effort; committed snapshot stands */
  }

  // Official parcel-tax and well-permit evidence refresh. The governed writers
  // persist immutable versions and receipts in the shared runtime-state mount,
  // so state survives Cloud Run revisions and scheduled job executions.
  try {
    const { refreshOfficialEvidenceSources } = await import("./officialEvidenceScheduledRefresh");
    await refreshOfficialEvidenceSources(now);
  } catch (error) {
    canonicalLandRegisterAuthority.append({
      actorId: "system:source-refresh", actorName: "source-refresh-job",
      domain: "official-evidence-refresh", subject: "all", decision: "ALERT",
      reason: `official evidence refresh failed; last-good durable state retained: ${(error as Error).message}`,
    });
  }

  return results;
}
