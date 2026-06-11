/**
 * GSA Auctions adapter (equipment domain — federal personal property).
 *
 * Ingests the OFFICIAL GSA Auctions API (api.gsa.gov, public domain) via
 * src/scripts/ingestGsaAuctions.ts. PERSONAL property (vehicles/machinery/
 * vessels/equipment) for a future Farms/Equipment lane — NOT the property lane.
 * Gated behind Module 22 + 23 (sourceActivation.ts); live only after a qualified
 * human approves both reviews.
 */

import { getSourceActivation, isSourceLive } from "@/lib/property/sourceActivation";
import { GSA_AUCTIONS_ITEMS, GSA_AUCTIONS_PROVENANCE } from "@/lib/equipment/gsaAuctionsGenerated";

export const gsaAuctionsAdapter = {
  adapterId: "gsa-auctions-adapter",
  sourceId: "gsa-auctions",
  sourceName: "GSA Auctions (federal personal property)",
  ingestMethod: "GSA Auctions API (api.gsa.gov, JSON) — no portal scrape",
  ingestScript: "src/scripts/ingestGsaAuctions.ts",
  endpoint: GSA_AUCTIONS_PROVENANCE.endpoint,
  recordCount: GSA_AUCTIONS_ITEMS.length,
  fetchedAt: GSA_AUCTIONS_PROVENANCE.fetchedAt,
  license: "Public domain (U.S. Government work)",
  attribution: "Source: GSA Auctions",
  domain: "equipment",
  get liveFetchAllowed(): boolean { return isSourceLive("gsa-auctions"); },
  get activation() { return getSourceActivation("gsa-auctions"); },
  posture: "open-api-ingested-pending-activation",
} as const;
