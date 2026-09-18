/**
 * vedpCanonical — VEDP snapshot → canonical property records (SERVER-ONLY).
 *
 * Tier-2 wiring 2026-07-28: 1,712 for-sale Virginia buildings/sites sat in
 * vedpPropertiesGenerated.ts with ZERO importers — ingested, never wired. This
 * converter joins the VEDP pipeline to the same canonical spine as HUD /
 * Treasury / GSA, so the standard governance path applies end to end.
 *
 * DISPLAY REMAINS DARK until Module 23 (legal — VEDP's terms are
 * disclaimer-style STATE terms, not federal public domain; a reuse
 * confirmation with VEDP is the outstanding item) and Module 22 (activation)
 * are BOTH approved by the founder on /source-legal-review. This module only
 * makes that approval meaningful — activation ships PENDING.
 *
 * Honesty rules encoded here:
 *  - sale === true records only (lease-only listings are not "for sale");
 *  - VEDP publishes no per-listing public URL in the feed → listingUrl points
 *    at VEDP's official Site Selection portal (verified live), never a
 *    fabricated deep link;
 *  - no price in the feed → price null ("Price on request" downstream);
 *  - coordinates captured for provenance, never projected (platform rule).
 */

import { COUNTY_NAMES } from "./countyNamesGenerated";
import type { CanonicalProperty, PropertySourceRecord, PropertyType } from "./propertyTypes";
import { VEDP_INGEST_PROVENANCE, VEDP_PROPERTIES, type VedpRecord } from "./vedpPropertiesGenerated";

const VEDP_PORTAL_URL = "https://www.vedp.org/site-selection";
const VEDP_SOURCE_NAME = "VEDP — Virginia Economic Development Partnership (available properties & sites)";

function vedpPropertyType(r: VedpRecord): PropertyType {
  if ((r.kind ?? "").toLowerCase() === "site") return "land";
  const style = (r.propertyType ?? "").toLowerCase();
  if (/site|land|acre/.test(style)) return "land";
  return "commercial";
}

function toSourceRecord(r: VedpRecord): PropertySourceRecord {
  const county = r.fips ? COUNTY_NAMES[r.fips]?.name ?? "" : "";
  const listingDate = r.dateModified ? new Date(r.dateModified.replace(" ", "T") + "Z").toISOString() : null;
  return {
    sourceId: "vedp",
    listingId: r.id,
    listingDate,
    state: "VA",
    county,
    town: r.city ?? "",
    propertyType: vedpPropertyType(r),
    rawPropertyStyle: r.propertyType ?? r.kind ?? "property",
    exactAddress: r.address ? `${r.address}${r.city ? `, ${r.city}` : ""}, VA${r.zip ? ` ${r.zip}` : ""}` : null,
    zip: r.zip ?? null,
    price: null, // VEDP publishes no price — "Price on request", never invented
    bedrooms: null,
    yearBuilt: null,
    squareFeet: null,
    acreageText: typeof r.acreage === "number" && r.acreage > 0 ? `${r.acreage} acres` : null,
    program: r.zoning ? `Zoning: ${r.zoning}` : null,
    description: r.name && r.name !== r.address ? r.name : null,
    photoFile: null,
    listingUrl: VEDP_PORTAL_URL,
    isCurrent: true, // dataset is a live inventory pull; recordIsCurrent re-evaluates
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
  };
}

function toCanonical(r: VedpRecord): CanonicalProperty {
  const sr = toSourceRecord(r);
  return {
    canonical_property_id: r.id,
    source_records: [sr],
    parcel_refs: [],
    geospatial_refs: [],
    provenance_chain: [
      {
        source_id: "vedp",
        source_url: VEDP_INGEST_PROVENANCE.source,
        fetched_at: VEDP_INGEST_PROVENANCE.fetchedAt,
        content_hash: `vedp:${r.id}:${r.dateModified ?? "unknown"}`,
      },
    ],
    listing_status: "for-sale",
    listing_history: [],
    confidence_score: 0.9,
    source_id: "vedp",
    source_name: VEDP_SOURCE_NAME,
    source_url: VEDP_PORTAL_URL,
    fetched_at: VEDP_INGEST_PROVENANCE.fetchedAt,
    content_hash: `vedp:${r.id}:${r.dateModified ?? "unknown"}`,
    classification_level: "PUBLIC",
    replay_ref: "src/lib/property/vedpPropertiesGenerated.ts",
    connector_id: "vedp-arcgis-v1",
    jurisdiction_scope: "VA",
    scraper_version: "vedp-ingest-v1",
  };
}

/** For-sale VEDP records in canonical form (lease-only entries excluded). */
export const VEDP_CANONICAL: CanonicalProperty[] = VEDP_PROPERTIES.filter((r) => r.sale === true).map(toCanonical);
