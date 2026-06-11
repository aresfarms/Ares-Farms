/**
 * Per-state property counts feed — SERVER-ONLY (SOURCE-INTELLIGENCE unit).
 *
 * THE governed source for the property counts map. Counts come from the same
 * machinery as everything else honest on the site:
 *   - only Module 22/23-APPROVED live sources (isSourceLiveRuntime),
 *   - only records that are CURRENT right now (recordIsCurrent — auction-date
 *     aware, so expired auctions / stale snapshots are never counted),
 *   - state-level only (never an exact address).
 *
 * Type buckets (the map's color "versions"):
 *   residential = home/multifamily · land = land/farm/ranch · commercial = rest.
 * "All" = residential + land + commercial (same denominator — a state with zero
 * of a type reads 0, never blank).
 */

import { PROPERTY_SOURCE_IDS, recordsForReview } from "./propertyData";
import { isSourceLiveRuntime } from "./sourceActivationStore";
import { recordIsCurrent } from "./propertyTypes";
import { renderableListings } from "@/lib/source-intelligence/listing-intake/listingStore";

export type CountType = "residential" | "land" | "commercial";

export interface StateCounts {
  abbr: string;
  residential: number;
  land: number;
  commercial: number;
  total: number;
}

export interface PropertyStateCountsFeed {
  asOf: string; // ISO date the counts were computed (render-time currency)
  states: StateCounts[];
  totals: { residential: number; land: number; commercial: number; total: number };
}

function bucketOf(propertyType: string): CountType {
  const t = propertyType.toLowerCase();
  if (t === "home" || t === "multifamily" || t === "house" || t === "residential") return "residential";
  if (t === "land" || t === "farm" || t === "ranch" || t === "lot" || t === "vacant") return "land";
  return "commercial";
}

/** Compute the per-state counts feed (live sources, current records only). */
export function propertyStateCounts(now: Date = new Date()): PropertyStateCountsFeed {
  const byState = new Map<string, StateCounts>();
  const totals = { residential: 0, land: 0, commercial: 0, total: 0 };

  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      if (!recordIsCurrent(c, now)) continue; // honest count: never stale/expired
      const r = c.source_records[0];
      const abbr = (r.state ?? "").toUpperCase();
      if (!/^[A-Z]{2}$/.test(abbr)) continue;
      const bucket = bucketOf(r.propertyType);
      const entry =
        byState.get(abbr) ?? { abbr, residential: 0, land: 0, commercial: 0, total: 0 };
      entry[bucket] += 1;
      entry.total += 1;
      byState.set(abbr, entry);
      totals[bucket] += 1;
      totals.total += 1;
    }
  }

  // Furlong-originated DIRECT listings (broker / bank-REO) — counted only when
  // fully renderable (operator-approved + counsel-cleared state + every gate),
  // so the map's honest-count guarantee extends to the listing engine.
  for (const d of renderableListings()) {
    const abbr = d.state.toUpperCase();
    if (!/^[A-Z]{2}$/.test(abbr)) continue;
    const bucket = bucketOf(d.propertyType);
    const entry = byState.get(abbr) ?? { abbr, residential: 0, land: 0, commercial: 0, total: 0 };
    entry[bucket] += 1;
    entry.total += 1;
    byState.set(abbr, entry);
    totals[bucket] += 1;
    totals.total += 1;
  }

  return {
    asOf: now.toISOString().slice(0, 10),
    states: [...byState.values()].sort((a, b) => a.abbr.localeCompare(b.abbr)),
    totals,
  };
}
