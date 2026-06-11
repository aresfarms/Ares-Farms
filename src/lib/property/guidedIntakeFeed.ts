/**
 * Guided-intake feed — SERVER-ONLY (SOURCE-INTELLIGENCE unit).
 *
 * Powers the anonymous, INTERESTS-ONLY guided path ("What are you interested
 * in?"). Carries ONLY property-side verified data: per-state × per-category
 * counts of CURRENT listings (same recordIsCurrent machinery as the counts map)
 * plus per-state counts of properties whose tract/area is a VERIFIED designated
 * Opportunity Zone / HUBZone (frozen snapshots; current designations only).
 *
 * NO PII, NO qualification data — the feed describes inventory and places,
 * never a person. Person-qualification lives in the licensed modules, off
 * Furlong surfaces ("Furlong stays property-centric").
 */

import { PROPERTY_SOURCE_IDS, recordsForReview } from "./propertyData";
import { isSourceLiveRuntime } from "./sourceActivationStore";
import { recordIsCurrent } from "./propertyTypes";
import { categoryForRecord, type PropertyCategoryId } from "./propertyCategories";
import { PROPERTY_OZ_FACTS } from "./propertyOpportunityZonesGenerated";
import { PROPERTY_HUBZONE_FACTS } from "./propertyHubzonesGenerated";
import { renderableListings } from "@/lib/source-intelligence/listing-intake/listingStore";
import { categoryForType } from "./propertyCategories";

export interface GuidedStateEntry {
  abbr: string;
  /** Current listings per category (zero categories omitted). */
  byCategory: Partial<Record<PropertyCategoryId, number>>;
  total: number;
  /** Properties whose tract is a designated OZ (verified snapshot). */
  ozDesignated: number;
  /** Properties in a CURRENT designated HUBZone (expired never counted). */
  hubzoneDesignated: number;
}

export interface GuidedIntakeFeed {
  asOf: string;
  states: GuidedStateEntry[];
}

export function guidedIntakeFeed(now: Date = new Date()): GuidedIntakeFeed {
  const byState = new Map<string, GuidedStateEntry>();
  const entry = (abbr: string): GuidedStateEntry => {
    const e = byState.get(abbr) ?? { abbr, byCategory: {}, total: 0, ozDesignated: 0, hubzoneDesignated: 0 };
    byState.set(abbr, e);
    return e;
  };

  for (const sourceId of PROPERTY_SOURCE_IDS) {
    if (!isSourceLiveRuntime(sourceId)) continue;
    for (const c of recordsForReview(sourceId)) {
      if (!recordIsCurrent(c, now)) continue;
      const r = c.source_records[0];
      const abbr = (r.state ?? "").toUpperCase();
      if (!/^[A-Z]{2}$/.test(abbr)) continue;
      const e = entry(abbr);
      const cat = categoryForRecord(r);
      e.byCategory[cat] = (e.byCategory[cat] ?? 0) + 1;
      e.total += 1;
      if (PROPERTY_OZ_FACTS[c.canonical_property_id]?.designated) e.ozDesignated += 1;
      const hz = PROPERTY_HUBZONE_FACTS[c.canonical_property_id];
      if (hz && (!hz.expiration || new Date(`${hz.expiration}T23:59:59Z`).getTime() >= now.getTime())) {
        e.hubzoneDesignated += 1;
      }
    }
  }

  // Direct (broker/bank) listings — counted only when fully renderable.
  for (const d of renderableListings()) {
    const abbr = d.state.toUpperCase();
    if (!/^[A-Z]{2}$/.test(abbr)) continue;
    const e = entry(abbr);
    const cat = categoryForType(d.propertyType);
    e.byCategory[cat] = (e.byCategory[cat] ?? 0) + 1;
    e.total += 1;
  }

  return {
    asOf: now.toISOString().slice(0, 10),
    states: [...byState.values()].sort((a, b) => a.abbr.localeCompare(b.abbr)),
  };
}
