/**
 * USDA Rural Development / FSA resale adapter (Build 57 — first live source).
 *
 * No longer a stub. Ingests the OFFICIAL data.gov open dataset (CC0 public
 * domain) via src/scripts/ingestUsdaResale.ts — the live HTML portal is NOT
 * scraped — into the canonical property shape. Data is gated behind Module 22 +
 * Module 23 (src/lib/property/sourceActivation.ts): liveFetchAllowed flips true
 * only after a qualified human approves both reviews.
 */

import { getSourceActivation, isSourceLive } from "@/lib/property/sourceActivation";
import {
  USDA_INGEST_PROVENANCE,
  USDA_RESALE_PROPERTIES,
} from "@/lib/property/usdaResaleGenerated";

export const usdaAdapter = {
  adapterId: "usda-resale-adapter",
  sourceId: "usda",
  sourceName: "USDA Rural Development / FSA",
  // Open-data ingest, not a portal scrape.
  ingestMethod: "data.gov open-dataset download (CC0 1.0)",
  ingestScript: "src/scripts/ingestUsdaResale.ts",
  datasetFeeds: USDA_INGEST_PROVENANCE.feeds,
  recordCount: USDA_RESALE_PROPERTIES.length,
  fetchedAt: USDA_INGEST_PROVENANCE.fetchedAt,
  license: "CC0 1.0 (public domain)",
  attribution: "Source: USDA Rural Development / FSA",
  /** Live display is gated on Module 22 + 23 human approval. */
  get liveFetchAllowed(): boolean {
    return isSourceLive("usda");
  },
  get activation() {
    return getSourceActivation("usda");
  },
  posture: "open-data-ingested-pending-activation",
} as const;
