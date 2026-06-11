/**
 * Unified property data access — SERVER-ONLY (imports exact addresses + coords).
 *
 * Aggregates every property source (USDA historical, HUD current), each gated by
 * its OWN Module 22/23 activation. A source's listings appear only when it is
 * live (APPROVED). Coordinates are never projected (the projections in
 * propertyTypes.ts omit lat/long). Use from server components only; the homepage
 * map uses propertyPublicSafe.ts (client-safe).
 */

import {
  type CanonicalProperty,
  type ExploreDetailProperty,
  type PropertySourceId,
  toExploreDetail,
} from "./propertyTypes";
import {
  PROPERTY_CATEGORIES,
  type PropertyCategoryId,
  categoryForRecord,
} from "./propertyCategories";
import { SOURCE_ACTIVATION } from "./sourceActivation";
import { getRuntimeActivation, isSourceLiveRuntime } from "./sourceActivationStore";
import { HUD_INGEST_PROVENANCE, HUD_REO_PROPERTIES } from "./hudReoGenerated";
import { TREASURY_INGEST_PROVENANCE, TREASURY_PROPERTIES } from "./treasuryGenerated";
import { GSA_RE_INGEST_PROVENANCE, GSA_RE_PROPERTIES } from "./gsaRealEstateGenerated";
import { readLiveRecords } from "./liveOverlay";
import { USDA_INGEST_PROVENANCE, USDA_RESALE_PROPERTIES } from "./usdaResaleGenerated";

// Server data layer reads RUNTIME activation (operator overlay over the static
// defaults), so an approval on the Source Review screen takes effect immediately.
const isSourceLive = isSourceLiveRuntime;

const SOURCES: Array<{ id: PropertySourceId; records: CanonicalProperty[]; fetchedAt: string }> = [
  { id: "hud", records: HUD_REO_PROPERTIES, fetchedAt: HUD_INGEST_PROVENANCE.fetchedAt },
  { id: "usda", records: USDA_RESALE_PROPERTIES, fetchedAt: USDA_INGEST_PROVENANCE.fetchedAt },
  { id: "treasury", records: TREASURY_PROPERTIES, fetchedAt: TREASURY_INGEST_PROVENANCE.fetchedAt },
  { id: "gsa-realestate", records: GSA_RE_PROPERTIES, fetchedAt: GSA_RE_INGEST_PROVENANCE.fetchedAt },
];

/**
 * The records served for a source: the live overlay (freshly pulled by the daily
 * refresh) when present, else the committed snapshot (last-good). Likewise the
 * effective fetchedAt — so freshness reflects the most recent successful pull.
 */
function recordsOf(s: { id: PropertySourceId; records: CanonicalProperty[] }): CanonicalProperty[] {
  return readLiveRecords(s.id)?.records ?? s.records;
}
function fetchedAtOf(s: { id: PropertySourceId; fetchedAt: string }): string {
  return readLiveRecords(s.id)?.fetchedAt ?? s.fetchedAt;
}

export type PropertyFilters = {
  state?: string | null;
  type?: string | null;
  category?: string | null;
};

export interface SourceStatus {
  sourceId: PropertySourceId;
  sourceName: string;
  live: boolean;
  total: number;
  module22: string;
  module23: string;
  fetchedAt: string;
}

export function propertySourceStatuses(): SourceStatus[] {
  return SOURCES.map((s) => {
    const id = s.id;
    const a = getRuntimeActivation(id) ?? {
      sourceName: SOURCE_ACTIVATION[id]?.sourceName ?? id,
      module22: "UNKNOWN", module23: "UNKNOWN",
    } as ReturnType<typeof getRuntimeActivation> & object;
    return {
      sourceId: id,
      sourceName: a.sourceName,
      live: isSourceLive(id),
      total: recordsOf(s).length,
      module22: a.module22,
      module23: a.module23,
      fetchedAt: fetchedAtOf(s),
    };
  });
}

export function anySourceLive(): boolean {
  return SOURCES.some((s) => isSourceLive(s.id));
}

export const PROPERTY_SOURCE_IDS = SOURCES.map((s) => s.id);

/** ALL ingested records for a source, regardless of live state — for the internal review screen only. */
export function recordsForReview(sourceId: PropertySourceId): CanonicalProperty[] {
  const s = SOURCES.find((x) => x.id === sourceId);
  return s ? recordsOf(s) : [];
}

/** All states present across all sources (for the filter UI), regardless of live. */
export function propertyStates(): string[] {
  const set = new Set<string>();
  for (const s of SOURCES) for (const c of recordsOf(s)) set.add(c.source_records[0].state);
  return [...set].sort();
}

function matches(c: CanonicalProperty, f: PropertyFilters): boolean {
  const r = c.source_records[0];
  if (f.state && r.state.toUpperCase() !== f.state.toUpperCase()) return false;
  if (f.type && r.propertyType !== f.type) return false;
  if (f.category && categoryForRecord(r) !== f.category) return false;
  return true;
}

/**
 * Explore-hub detail listings across all LIVE sources. Current (HUD) listings
 * sort before historical (USDA) examples. `total` is the full ingested count
 * (so the pending UI can say how many will appear after activation).
 */
export function listExploreDetail(
  filters: PropertyFilters = {},
): { anyLive: boolean; total: number; listings: ExploreDetailProperty[] } {
  const total = SOURCES.reduce((n, s) => n + recordsOf(s).length, 0);
  const listings: ExploreDetailProperty[] = [];
  for (const s of SOURCES) {
    if (!isSourceLive(s.id)) continue;
    for (const c of recordsOf(s)) if (matches(c, filters)) listings.push(toExploreDetail(c));
  }
  listings.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  return { anyLive: anySourceLive(), total, listings };
}

export interface CategoryStateCount {
  abbr: string;
  count: number;
}
export interface CategoryNode {
  id: PropertyCategoryId;
  label: string;
  count: number;
  states: CategoryStateCount[];
}

/**
 * The CATEGORY → STATE inventory tree across all LIVE sources. Empty categories
 * and empty states are omitted entirely (the hub never renders a bucket with no
 * inventory). Counts are accurate at every level. `liveTotal` is the count of
 * displayable (live) listings; `total` is the full ingested count.
 */
export function buildCategoryTree(): {
  anyLive: boolean;
  total: number;
  liveTotal: number;
  categories: CategoryNode[];
} {
  const total = SOURCES.reduce((n, s) => n + recordsOf(s).length, 0);
  // category id -> (state abbr -> count)
  const counts = new Map<PropertyCategoryId, Map<string, number>>();
  let liveTotal = 0;
  for (const s of SOURCES) {
    if (!isSourceLive(s.id)) continue;
    for (const c of recordsOf(s)) {
      const r = c.source_records[0];
      const cat = categoryForRecord(r);
      const abbr = r.state.toUpperCase();
      const byState = counts.get(cat) ?? new Map<string, number>();
      byState.set(abbr, (byState.get(abbr) ?? 0) + 1);
      counts.set(cat, byState);
      liveTotal += 1;
    }
  }
  const categories: CategoryNode[] = [];
  for (const def of PROPERTY_CATEGORIES) {
    const byState = counts.get(def.id);
    if (!byState || byState.size === 0) continue; // hide empty categories
    const states = [...byState.entries()]
      .map(([abbr, count]) => ({ abbr, count }))
      .sort((a, b) => a.abbr.localeCompare(b.abbr));
    const count = states.reduce((n, s) => n + s.count, 0);
    categories.push({ id: def.id, label: def.label, count, states });
  }
  return { anyLive: anySourceLive(), total, liveTotal, categories };
}
