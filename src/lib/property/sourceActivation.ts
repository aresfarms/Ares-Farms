/**
 * Source activation registry — the legal/operational gate for live property data.
 *
 * Hard guardrail #3 (non-negotiable): scraped/ingested listing data must NOT be
 * shown on any public surface until the source clears BOTH:
 *   - Module 23 — Source Legal & Licensing Review (qualified human approval), and
 *   - Module 22 — Live Scraper Activation.
 *
 * This file holds those records. They ship PENDING_HUMAN_APPROVAL and
 * sourceLive: false. The build must NOT self-approve. A qualified reviewer
 * (Caitlin) flips a source live by editing its record: set both statuses to
 * "APPROVED", fill reviewedBy/reviewedAt, and set sourceLive: true. Until then
 * the Property hub / map "Possible" card show a "source pending activation" state
 * — never live listings.
 *
 * verify:property (source-gate) FAILS if any source renders live while not
 * APPROVED+sourceLive. Edge-safe: pure data + helpers.
 */

export type ReviewStatus = "PENDING_HUMAN_APPROVAL" | "APPROVED" | "BLOCKED";

export interface SourceLegalReviewRecord {
  module: "Module 23 — Source Legal & Licensing Review";
  status: ReviewStatus;
  facts: string[];
  license: string;
  attributionRequired: string;
  reviewedBy: string | null;
  reviewedAt: string | null; // ISO; null until approved
}

export interface LiveScraperActivationRecord {
  module: "Module 22 — Live Scraper Activation";
  status: ReviewStatus;
  ingestMethod: string;
  liveFetchAllowed: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface SourceActivationRecord {
  sourceId: string;
  sourceName: string;
  module23: SourceLegalReviewRecord;
  module22: LiveScraperActivationRecord;
  /** Master switch. MUST stay false until BOTH modules are APPROVED by a human. */
  sourceLive: boolean;
}

export const SOURCE_ACTIVATION: Record<string, SourceActivationRecord> = {
  usda: {
    sourceId: "usda",
    sourceName: "USDA Rural Development / FSA",
    module23: {
      module: "Module 23 — Source Legal & Licensing Review",
      status: "PENDING_HUMAN_APPROVAL",
      facts: [
        "Federal public-record source (USDA Rural Development resale properties).",
        "Published as an open dataset on data.gov (REO + Foreclosure feeds).",
        "License: Creative Commons Public Domain Dedication (CC0 1.0) — no ToS barrier to redisplay.",
        "Ingested from the official data.gov download feed; the live HTML portal is NOT scraped.",
        "Dataset is a periodic snapshot (last refreshed 2022; listings dated 2014–2018) — display must show vintage honestly.",
      ],
      license: "CC0 1.0 Universal (Public Domain Dedication)",
      attributionRequired: 'Display "Source: USDA Rural Development / FSA" on every listing.',
      reviewedBy: null,
      reviewedAt: null,
    },
    module22: {
      module: "Module 22 — Live Scraper Activation",
      status: "PENDING_HUMAN_APPROVAL",
      ingestMethod: "data.gov open-dataset download (no live scrape of the portal)",
      liveFetchAllowed: false,
      reviewedBy: null,
      reviewedAt: null,
    },
    sourceLive: false,
  },

  hud: {
    sourceId: "hud",
    sourceName: "U.S. HUD — FHA (HUD Home Store)",
    module23: {
      module: "Module 23 — Source Legal & Licensing Review",
      status: "PENDING_HUMAN_APPROVAL",
      facts: [
        "Federal public-record source (HUD FHA Single Family REO 'For Sale' dataset).",
        "Published as HUD open data (data.gov / hudgis-hud.opendata.arcgis.com) — U.S. Government work, public domain.",
        "No ToS barrier to redisplay; attribution requested.",
        "Ingested from the official ArcGIS open-data CSV/GeoJSON feed; the HUD Home Store portal is NOT scraped.",
        "Dataset carries lat/long — coordinates are stripped from ALL public projections (never shown); exact address renders only in the no-account Explore hub.",
        "These are CURRENT for-sale REO listings (dataset refreshed 2025).",
      ],
      license: "Public domain (U.S. Government work) — HUD open data",
      attributionRequired: 'Display "Source: U.S. HUD — FHA (HUD Home Store)" on every listing.',
      reviewedBy: null,
      reviewedAt: null,
    },
    module22: {
      module: "Module 22 — Live Scraper Activation",
      status: "PENDING_HUMAN_APPROVAL",
      ingestMethod: "HUD ArcGIS open-data CSV download (no portal scrape)",
      liveFetchAllowed: false,
      reviewedBy: null,
      reviewedAt: null,
    },
    sourceLive: false,
  },

  // Equipment domain (NOT the property lane) — federal personal-property auctions.
  "gsa-auctions": {
    sourceId: "gsa-auctions",
    sourceName: "GSA Auctions (federal personal property)",
    module23: {
      module: "Module 23 — Source Legal & Licensing Review",
      status: "PENDING_HUMAN_APPROVAL",
      facts: [
        "Official GSA Auctions API (api.gsa.gov) — U.S. Government work, public domain.",
        "Federal PERSONAL property (vehicles, machinery, vessels, equipment) — NOT real estate.",
        "Live, lawful API feed (no portal scrape); attribution requested.",
        "Intended for a future Farms / Equipment lane — no display surface built yet.",
        "Production use needs a real api.data.gov key (DEMO_KEY is rate-limited).",
      ],
      license: "Public domain (U.S. Government work) — GSA Auctions API",
      attributionRequired: 'Display "Source: GSA Auctions" on every item.',
      reviewedBy: null,
      reviewedAt: null,
    },
    module22: {
      module: "Module 22 — Live Scraper Activation",
      status: "PENDING_HUMAN_APPROVAL",
      ingestMethod: "GSA Auctions API (api.gsa.gov, JSON) — no portal scrape",
      liveFetchAllowed: false,
      reviewedBy: null,
      reviewedAt: null,
    },
    sourceLive: false,
  },

  // U.S. Treasury seized/forfeited Real Property auctions (TEOAF) — property lane.
  treasury: {
    sourceId: "treasury",
    sourceName: "U.S. Treasury — Seized Real Property Auctions (TEOAF)",
    module23: {
      module: "Module 23 — Source Legal & Licensing Review",
      status: "PENDING_HUMAN_APPROVAL",
      facts: [
        "Official Treasury TEOAF upcoming-auctions page (treasury.gov/auctions/treasury/rp) — U.S. Government work, public domain.",
        "Parsed from the OFFICIAL .gov page, NOT the commercial contractor (CWS) site.",
        "Seized/forfeited real property sold at public auction: commercial buildings, warehouses, operating businesses, land, residences.",
        "AUCTION listings — no fixed list price; displayed as 'Auction', never 'list price'.",
        "~300 public auctions/year nationwide and Puerto Rico.",
      ],
      license: "Public domain (U.S. Government work) — U.S. Treasury TEOAF",
      attributionRequired: 'Display "Source: U.S. Treasury — Seized Real Property Auctions (TEOAF)" on every listing.',
      reviewedBy: null,
      reviewedAt: null,
    },
    module22: {
      module: "Module 22 — Live Scraper Activation",
      status: "PENDING_HUMAN_APPROVAL",
      ingestMethod: "Official Treasury .gov auctions page (HTML parse of realprop.shtml)",
      liveFetchAllowed: false,
      reviewedBy: null,
      reviewedAt: null,
    },
    sourceLive: false,
  },

  // GSA federal surplus Real Property auctions (realestatesales.gov) — property lane.
  "gsa-realestate": {
    sourceId: "gsa-realestate",
    sourceName: "GSA — Federal surplus real property (realestatesales.gov)",
    module23: {
      module: "Module 23 — Source Legal & Licensing Review",
      status: "PENDING_HUMAN_APPROVAL",
      facts: [
        "Official GSA realestatesales.gov listings page — U.S. Government work, public domain.",
        "Federal surplus REAL property (NOT the gsaauctions.gov personal-property feed).",
        "Commercial buildings, land/lots, residential — sold at public auction to the highest bidder.",
        "AUCTION listings with a starting/current bid → displayed as 'Starting bid', never 'list price'.",
      ],
      license: "Public domain (U.S. Government work) — GSA realestatesales.gov",
      attributionRequired: 'Display "Source: GSA — Federal surplus real property (realestatesales.gov)" on every listing.',
      reviewedBy: null,
      reviewedAt: null,
    },
    module22: {
      module: "Module 22 — Live Scraper Activation",
      status: "PENDING_HUMAN_APPROVAL",
      ingestMethod: "Official GSA .gov listings page (HTML parse of realestatesales.gov/our-listing)",
      liveFetchAllowed: false,
      reviewedBy: null,
      reviewedAt: null,
    },
    sourceLive: false,
  },

  // VEDP — Virginia Economic Development Partnership available properties &
  // sites (state economic-development inventory; 1,712 for-sale records).
  // Wired 2026-07-28; ships PENDING — display requires BOTH approvals below.
  vedp: {
    sourceId: "vedp",
    sourceName: "VEDP — Virginia Economic Development Partnership (available properties & sites)",
    module23: {
      module: "Module 23 — Source Legal & Licensing Review",
      status: "PENDING_HUMAN_APPROVAL",
      facts: [
        "Official VEDP open-data ArcGIS service (maps.vedp.org PropertiesSites MapServer) — a STATE source, not federal public domain.",
        "VEDP's published copyright policy grants website visitors fair-use permission (vedp.org/privacy-policy, checked 2026-07-28); the ingested material is structured FACTS (addresses, acreage, zoning, sale status) from the official open-data API — facts are not copyrightable (Feist).",
        "Commercial buildings and development sites listed for sale/lease by owners and localities; Furlong ingests sale === true only.",
        "The feed publishes NO prices ('Price on request' — never invented) and NO per-listing public URLs (link-out goes to VEDP's official Site Selection portal, verified live).",
      ],
      license:
        "VEDP copyright policy grants fair-use permission to site visitors; ingested material is uncopyrightable structured facts from the official open-data API, displayed with attribution + link-out to VEDP's own portal. A courtesy heads-up to VEDP remains OPTIONAL goodwill (partner posture), not a prerequisite; the independent financing-compliance review (#34) is the counsel backstop.",
      attributionRequired:
        'Display "Source: VEDP — Virginia Economic Development Partnership (vedp.org)" on every listing.',
      reviewedBy: null,
      reviewedAt: null,
    },
    module22: {
      module: "Module 22 — Live Scraper Activation",
      status: "PENDING_HUMAN_APPROVAL",
      ingestMethod: "Official VEDP ArcGIS open-data REST service (JSON query; the live HTML portal is NOT scraped)",
      liveFetchAllowed: false,
      reviewedBy: null,
      reviewedAt: null,
    },
    sourceLive: false,
  },
};

/** True only when a source has BOTH modules APPROVED and sourceLive set. */
export function isSourceLive(sourceId: string): boolean {
  const r = SOURCE_ACTIVATION[sourceId];
  return (
    !!r &&
    r.sourceLive === true &&
    r.module22.status === "APPROVED" &&
    r.module23.status === "APPROVED"
  );
}

export function getSourceActivation(sourceId: string): SourceActivationRecord | null {
  return SOURCE_ACTIVATION[sourceId] ?? null;
}
