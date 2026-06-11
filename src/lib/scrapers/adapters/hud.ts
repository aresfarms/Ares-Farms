/**
 * HUD FHA Single Family REO adapter (Build 57 — second live source).
 *
 * Ingests the OFFICIAL HUD open dataset ("FHA Single Family REO Properties For
 * Sale", ArcGIS open data / data.gov — U.S. Government work, public domain) via
 * src/scripts/ingestHudReo.ts — the HUD Home Store portal is NOT scraped — into
 * the canonical property shape. CURRENT for-sale inventory. Gated behind Module
 * 22 + Module 23 (src/lib/property/sourceActivation.ts): live only after a
 * qualified human approves both reviews.
 */

import { getSourceActivation, isSourceLive } from "@/lib/property/sourceActivation";
import { HUD_INGEST_PROVENANCE, HUD_REO_PROPERTIES } from "@/lib/property/hudReoGenerated";

export const hudAdapter = {
  adapterId: "hud-reo-adapter",
  sourceId: "hud",
  sourceName: "U.S. HUD — FHA (HUD Home Store)",
  ingestMethod: "HUD ArcGIS open-data CSV download (no portal scrape)",
  ingestScript: "src/scripts/ingestHudReo.ts",
  feedUrl: HUD_INGEST_PROVENANCE.feedUrl,
  recordCount: HUD_REO_PROPERTIES.length,
  fetchedAt: HUD_INGEST_PROVENANCE.fetchedAt,
  license: "Public domain (U.S. Government work)",
  attribution: "Source: U.S. HUD — FHA (HUD Home Store)",
  get liveFetchAllowed(): boolean { return isSourceLive("hud"); },
  get activation() { return getSourceActivation("hud"); },
  posture: "open-data-ingested-pending-activation",
} as const;
