import fs from "fs";
import path from "path";

import { canonicalPropertyAuthority } from "@/lib/platform/authorities/property";

import {
  INSTITUTIONAL_VALIDATION_SOURCES,
  PROPERTY_DISCOVERY_DISCLOSURES,
  SCRAPER_AUDIT_EVENTS,
  SCRAPER_REGISTRY,
  SOURCE_AUTHORITY_REGISTRY,
  SOURCE_INTELLIGENCE_REQUIRED_DISCLOSURES,
  dispatchSourceIntelligenceAction,
  productionGates,
  productionRestrictions,
  propertyDiscovery,
  propertyReplay,
  scraperProvenance,
} from "@/lib/source-intelligence/sourceIntelligenceRuntime";

/**
 * Scraper, Source Ingestion, and Property Discovery Conformance Suite
 *
 * Verifies the supplemental scraper/source-intelligence doctrines as active
 * Master Volume inputs. These checks are intentionally conservative: live
 * scraping, official collateral certification, underwriting reliance, public
 * verification authority, and autonomous recommendations remain blocked.
 */

const repoRoot = process.cwd();
const mode = process.argv[2] ?? "all";

const requiredSchemaTables = [
  "scraper_registry",
  "scraper_run_events",
  "scraper_fetch_records",
  "scraper_replay_refs",
  "scraper_integrity_reports",
  "scraper_classification_events",
  "scraper_escalation_events",
  "source_authority_registry",
  "source_ingestion_records",
  "source_review_records",
  "connector_certification_records",
  "property_discovery_registry",
  "property_listing_records",
  "canonical_property_records",
  "property_source_authority_records",
  "property_replay_refs",
  "property_provenance_records",
  "property_conflict_resolution_events",
  "property_classification_events",
  "property_review_events",
  "classification_events",
];

const requiredRoutes = [
  "src/app/api/scrapers/route.ts",
  "src/app/api/scrapers/status/route.ts",
  "src/app/api/scrapers/run/route.ts",
  "src/app/api/scrapers/replay/route.ts",
  "src/app/api/scrapers/provenance/route.ts",
  "src/app/api/scrapers/classification/route.ts",
  "src/app/api/scrapers/escalate/route.ts",
  "src/app/api/source-ingestion/submit/route.ts",
  "src/app/api/source-ingestion/review/route.ts",
  "src/app/api/source-ingestion/classify/route.ts",
  "src/app/api/source-ingestion/reject/route.ts",
  "src/app/api/properties/discovery/route.ts",
  "src/app/api/properties/canonical/route.ts",
  "src/app/api/properties/replay/route.ts",
];

const requiredRuntimeFiles = [
  "src/lib/source-intelligence/sourceIntelligenceRuntime.ts",
  "src/lib/source-intelligence/sourceIntelligenceApi.ts",
  "src/lib/source-ingestion/index.ts",
  "src/lib/property-discovery/index.ts",
  "src/lib/canonical-properties/index.ts",
  "src/lib/provenance/index.ts",
  "src/lib/gis/index.ts",
  "src/lib/scrapers/registry.ts",
  "src/lib/scrapers/runner.ts",
  "src/lib/scrapers/scheduler.ts",
  "src/lib/scrapers/replay.ts",
  "src/lib/scrapers/provenance.ts",
  "src/lib/scrapers/classification.ts",
  "src/lib/scrapers/canonicalization.ts",
  "src/lib/scrapers/authority.ts",
  "src/lib/scrapers/adapters/crexi.ts",
  "src/lib/scrapers/adapters/landwatch.ts",
  "src/lib/scrapers/adapters/landsearch.ts",
  "src/lib/scrapers/adapters/county-gis.ts",
  "src/lib/scrapers/adapters/tax-assessor.ts",
  "src/lib/scrapers/adapters/usda.ts",
  "src/lib/scrapers/adapters/flood.ts",
  "src/lib/scrapers/adapters/loopnet.ts",
  "src/lib/scrapers/adapters/ofac.ts",
  "src/lib/scrapers/adapters/epa.ts",
  "src/lib/db/migrations/0030_scraper_source_governance.sql",
];

const requiredPublicSurfaceRoutes = [
  "src/app/portal/property-discovery/page.tsx",
  "src/app/lender/property-opportunities/page.tsx",
  "src/app/sponsor/project-discovery/page.tsx",
];

function file(pathname: string): string {
  return path.join(repoRoot, pathname);
}

function exists(pathname: string): boolean {
  return fs.existsSync(file(pathname));
}

function read(pathname: string): string {
  return fs.readFileSync(file(pathname), "utf8");
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function packageScripts(): Record<string, string> {
  return JSON.parse(read("package.json")).scripts ?? {};
}

function assertAllFiles(pathnames: string[]): void {
  const missing = pathnames.filter((pathname) => !exists(pathname));

  assert(missing.length === 0, `Missing files: ${missing.join(", ")}`);
}

function assertSchema(): void {
  const schema = read("src/db/schema/scraperSourceGovernance.ts");
  const barrel = read("src/db/schema/index.ts");

  for (const table of requiredSchemaTables) {
    assert(schema.includes(`"${table}"`), `Missing schema table ${table}.`);
  }

  assert(
    barrel.includes("./scraperSourceGovernance"),
    "Canonical schema barrel must export scraperSourceGovernance."
  );
}

function verifyScrapers(): void {
  assertAllFiles(requiredRuntimeFiles);
  assertAllFiles(requiredRoutes);
  assertSchema();
  assert(SCRAPER_REGISTRY.length >= 8, "Scraper registry is too small.");
  assert(
    SCRAPER_REGISTRY.every((scraper) => scraper.replaySupported),
    "Every scraper must support replay."
  );
  assert(
    SCRAPER_REGISTRY.every((scraper) => scraper.liveFetchAllowed === false),
    "Live scraper fetches must remain blocked before promotion."
  );
  assert(
    SCRAPER_REGISTRY.every((scraper) =>
      scraper.requiredMetadata.includes("content_hash")
    ),
    "Every scraper must require content_hash metadata."
  );
  assert(
    SCRAPER_AUDIT_EVENTS.includes("scraper.record.fetched"),
    "Required scraper audit events are incomplete."
  );
}

function verifySourceAuthority(): void {
  assert(SOURCE_AUTHORITY_REGISTRY.length >= 8, "Source authority registry missing.");
  assert(
    SOURCE_AUTHORITY_REGISTRY.some(
      (source) => source.sourceAuthorityTier === "TIER_1"
    ),
    "Tier 1 source authority must exist."
  );
  assert(
    SOURCE_AUTHORITY_REGISTRY.some(
      (source) => source.sourceAuthorityTier === "TIER_3"
    ),
    "Tier 3 marketplace source authority must exist."
  );
  assert(
    SOURCE_AUTHORITY_REGISTRY.every(
      (source) =>
        source.provenanceScore > 0 &&
        source.replayabilityScore > 0 &&
        source.claimsAllowed.length > 0
    ),
    "Every source must define authority, provenance, replayability, and claims."
  );
}

function verifyPropertyDiscovery(): void {
  assertAllFiles(requiredPublicSurfaceRoutes);
  const discovery = propertyDiscovery({});
  const sources = discovery.sources as unknown[];

  assert(Array.isArray(sources) && sources.length > 0, "No property discovery sources.");
  assert(
    PROPERTY_DISCOVERY_DISCLOSURES.includes("Displayed properties are not approvals."),
    "Required property disclosure missing."
  );
  assert(
    sources.every((source) => JSON.stringify(source).includes("advisory")),
    "Discovery sources must remain advisory."
  );
}

function verifyCanonicalProperties(): void {
  const canonical = canonicalPropertyAuthority.resolve({});

  assert(
    Array.isArray(canonical.provenance_chain),
    "Canonical property object must include provenance_chain."
  );
  assert(
    Array.isArray(canonical.replay_refs),
    "Canonical property object must include replay_refs."
  );
  assert(
    canonical.officialCollateralCertificationBlocked === true,
    "Official collateral certification must remain blocked."
  );
}

function verifyProvenance(): void {
  const provenance = scraperProvenance({ scraperId: "county-gis-scraper" });

  assert(
    provenance.provenanceChainRequired === true,
    "Provenance chain must be required."
  );
  assert(
    provenance.replayRefsRequired === true,
    "Replay references must be required."
  );
}

function verifySourceIngestion(): void {
  const submitted = dispatchSourceIntelligenceAction("source-ingestion.submit", {
    scraperId: "crexi-scraper",
    sourceUrl: "https://example.invalid/listing",
  });
  const reviewed = dispatchSourceIntelligenceAction("source-ingestion.review", {
    ingestionRecordId: "source-ingestion-test",
  });

  assert(submitted.ok, "Source ingestion submit should create candidate evidence.");
  assert(reviewed.ok, "Source review should return governed pending posture.");
  assert(
    JSON.stringify(submitted).includes("candidateEvidenceOnly"),
    "Source ingestion output must remain candidate evidence."
  );
}

function verifyConnectorGovernance(): void {
  const blocked = dispatchSourceIntelligenceAction("scrapers.run", {
    scraperId: "crexi-scraper",
    liveFetchRequested: true,
  });

  assert(
    blocked.ok === false,
    "Live scraper runs must be blocked until connector certification."
  );
  assert(
    productionRestrictions().length > 0 && productionGates().length >= 6,
    "Production restrictions and gates must be declared."
  );
}

function smokeScraperRegistry(): void {
  const result = dispatchSourceIntelligenceAction("scrapers.list", {});

  assert(result.ok, "Scraper registry route payload should be allowed.");
  assert(
    JSON.stringify(result).includes("sourceAuthorityTier"),
    "Scraper registry must expose source authority tier."
  );
}

function smokeListingCanonicalization(): void {
  const result = canonicalPropertyAuthority.resolve({ canonicalPropertyId: "canonical-test" });

  assert(
    JSON.stringify(result).includes("source conflict resolution"),
    "Canonicalization must include source conflict resolution."
  );
}

function smokeGisReconciliation(): void {
  assert(
    INSTITUTIONAL_VALIDATION_SOURCES.includes("County GIS"),
    "GIS reconciliation source missing."
  );
  assert(
    INSTITUTIONAL_VALIDATION_SOURCES.includes("Parcel records"),
    "Parcel reconciliation source missing."
  );
}

function smokePropertyReplay(): void {
  const result = propertyReplay({ canonicalPropertyId: "canonical-test" });

  assert(
    result.lineageVerification === true,
    "Property replay must support lineage verification."
  );
}

function smokeScraperReplay(): void {
  const result = dispatchSourceIntelligenceAction("scrapers.replay", {
    scraperId: "county-gis-scraper",
  });

  assert(result.ok, "Scraper replay should be allowed.");
  assert(
    JSON.stringify(result).includes("deterministicReplay"),
    "Scraper replay must be deterministic."
  );
}

function smokeSourceReview(): void {
  const result = dispatchSourceIntelligenceAction("source-ingestion.review", {
    ingestionRecordId: "source-ingestion-test",
  });

  assert(result.ok, "Source review smoke should be allowed.");
  assert(
    JSON.stringify(result).includes("HUMAN_REVIEW_PENDING"),
    "Source review must remain human-review pending."
  );
}

function smokeConnectorCertification(): void {
  verifyConnectorGovernance();
}

function verifyCommands(): void {
  const scripts = packageScripts();
  const requiredScripts = [
    "verify:scrapers",
    "verify:source-ingestion",
    "verify:connector-governance",
    "verify:property-discovery",
    "verify:source-authority",
    "verify:canonical-properties",
    "verify:provenance",
    "verify:scraper-source-intelligence",
    "smoke:scraper-registry",
    "smoke:scraper-replay",
    "smoke:source-review",
    "smoke:connector-certification",
    "smoke:property-listings",
    "smoke:listing-canonicalization",
    "smoke:gist-reconciliation",
    "smoke:gis-reconciliation",
    "smoke:property-replay",
    "smoke:scraper-source-apis",
  ];

  for (const script of requiredScripts) {
    assert(Boolean(scripts[script]), `Missing package script ${script}.`);
  }
}

const modeHandlers: Record<string, () => void> = {
  scrapers: verifyScrapers,
  "source-ingestion": verifySourceIngestion,
  "connector-governance": verifyConnectorGovernance,
  "property-discovery": verifyPropertyDiscovery,
  "source-authority": verifySourceAuthority,
  "canonical-properties": verifyCanonicalProperties,
  provenance: verifyProvenance,
  "scraper-registry": smokeScraperRegistry,
  "scraper-replay": smokeScraperReplay,
  "source-review": smokeSourceReview,
  "connector-certification": smokeConnectorCertification,
  "property-listings": verifyPropertyDiscovery,
  "listing-canonicalization": smokeListingCanonicalization,
  "gist-reconciliation": smokeGisReconciliation,
  "gis-reconciliation": smokeGisReconciliation,
  "property-replay": smokePropertyReplay,
  commands: verifyCommands,
};

function runAll(): void {
  verifyScrapers();
  verifySourceAuthority();
  verifyPropertyDiscovery();
  verifyCanonicalProperties();
  verifyProvenance();
  verifySourceIngestion();
  verifyConnectorGovernance();
  smokeScraperRegistry();
  smokeScraperReplay();
  smokeSourceReview();
  smokeConnectorCertification();
  smokeListingCanonicalization();
  smokeGisReconciliation();
  smokePropertyReplay();
  verifyCommands();
}

if (mode === "all") {
  runAll();
} else {
  const handler = modeHandlers[mode];

  assert(Boolean(handler), `Unknown scraper/source conformance mode: ${mode}.`);
  handler();
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedAt: new Date().toISOString(),
      mode,
      scrapers: SCRAPER_REGISTRY.length,
      sourceAuthorities: SOURCE_AUTHORITY_REGISTRY.length,
      schemaTables: requiredSchemaTables.length,
      apiRoutes: requiredRoutes.length,
      publicSurfaces: requiredPublicSurfaceRoutes.length,
      message: "Scraper/source intelligence conformance passed.",
    },
    null,
    2
  )
);
