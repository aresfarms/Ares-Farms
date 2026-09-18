import fs from "fs";
import path from "path";

import {
  CANONICAL_ENTITY_PROFILES,
  CANONICAL_SOURCE_CATEGORIES,
  SOURCE_STACK_EVENT_CONTRACTS,
  SOURCE_STACK_REGISTRY,
  SOURCE_STACK_REQUIRED_CHECKS,
  SOURCE_STACK_REQUIRED_DISCLOSURES,
  SOURCE_STACK_REQUIRED_SCHEMA_TABLES,
  SOURCE_STACK_RUNTIME_COMPONENTS,
  sourceConflictResolution,
  sourceFailover,
  sourceStackOverview,
  marketplaceIngestion,
} from "@/lib/platform/authorities/source";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";

/**
 * Source Stack Conformance Suite
 *
 * Verifies the canonical external source discovery architecture and revenue
 * runtime workpackages as governed Master Volume inputs. The checks preserve
 * advisory-only, replay-safe, production-blocked, public-DTO-safe, and
 * human-review-required posture.
 */

const repoRoot = process.cwd();
const mode = process.argv[2] ?? "all";

const requiredRuntimeFiles = [
  "src/lib/source-stack/sourceStackRuntime.ts",
  "src/lib/source-stack/sourceStackApi.ts",
  "src/lib/source-stack/publicSourceIntelligenceApi.ts",
  "src/lib/dto/publicSourceIntelligence.ts",
  "src/lib/source-intelligence/sourceIntelligenceRuntime.ts",
  "src/lib/source-ingestion/index.ts",
  "src/lib/provenance/index.ts",
  "src/lib/replay/loadReplay.ts",
  "src/lib/classification/index.ts",
  "src/lib/canonicalization/index.ts",
  "src/lib/customer-revenue/index.ts",
  "src/lib/program-graph/index.ts",
  "src/lib/scrapers/registry.ts",
  "src/lib/scrapers/runner.ts",
  "src/lib/scrapers/scheduler.ts",
  "src/lib/scrapers/replay.ts",
  "src/lib/scrapers/provenance.ts",
  "src/lib/scrapers/classification.ts",
  "src/lib/scrapers/authority.ts",
  "src/lib/scrapers/canonicalization.ts",
  "src/lib/scrapers/conflict-resolution.ts",
  "src/lib/scrapers/market-signals.ts",
  "src/lib/scrapers/geo-intelligence.ts",
  "src/db/schema/externalSourceStackGovernance.ts",
  "src/lib/db/migrations/0032_external_source_stack_governance.sql",
];

const requiredRoutes = [
  "src/app/api/properties/discovery/route.ts",
  "src/app/api/programs/search/route.ts",
  "src/app/api/revenue/opportunities/route.ts",
  "src/app/api/market-signals/route.ts",
  "src/app/api/geo/suitability/route.ts",
  "src/app/api/public/grants/route.ts",
  "src/app/api/public/property-discovery/route.ts",
  "src/app/api/public/equipment/route.ts",
  "src/app/api/public/market-context/route.ts",
  "src/app/api/public/weather-risk/route.ts",
  "src/app/api/source-ingestion/review/route.ts",
  "src/app/api/scrapers/run/route.ts",
  "src/app/api/scrapers/replay/route.ts",
  "src/app/api/source-stack/route.ts",
  "src/app/api/source-stack/canonicalization/route.ts",
  "src/app/api/source-stack/failover/route.ts",
  "src/app/api/source-stack/conflicts/route.ts",
  "src/app/api/source-stack/freshness/route.ts",
  "src/app/api/source-stack/observability/route.ts",
];

const requiredPackageScripts = [
  "verify:source-stack",
  "verify:sources",
  "verify:source-authority",
  "verify:canonicalization",
  "verify:replay",
  "verify:source-stack-architecture",
  "smoke:source-failover",
  "smoke:marketplace-ingestion",
  "smoke:source-conflict-resolution",
  "smoke:source-stack-apis",
  "smoke:source-ingestion",
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

function assertAllFiles(pathnames: string[]): void {
  const missing = pathnames.filter((pathname) => !exists(pathname));

  assert(missing.length === 0, `Missing files: ${missing.join(", ")}`);
}

function packageScripts(): Record<string, string> {
  return JSON.parse(read("package.json")).scripts ?? {};
}

function migrationCorpus(): string {
  const migrationDir = file("src/lib/db/migrations");
  return fs
    .readdirSync(migrationDir)
    .filter((pathname) => pathname.endsWith(".sql"))
    .sort()
    .map((pathname) =>
      fs.readFileSync(path.join(migrationDir, pathname), "utf8")
    )
    .join("\n");
}

function verifySourceStack(): void {
  assertAllFiles(requiredRuntimeFiles);
  assertAllFiles(requiredRoutes);

  const schema = read("src/db/schema/externalSourceStackGovernance.ts");
  const schemaBarrel = read("src/db/schema/index.ts");
  const migrations = migrationCorpus();

  for (const table of SOURCE_STACK_REQUIRED_SCHEMA_TABLES) {
    assert(migrations.includes(table), `Missing migration coverage for ${table}.`);
  }

  for (const table of [
    "source_registry",
    "connector_registry",
    "canonical_entities",
    "source_conflict_events",
    "geo_intelligence_registry",
    "equipment_registry",
    "source_freshness_records",
    "source_failover_events",
    "source_queue_health_events",
    "source_canonicalization_events",
  ]) {
    assert(schema.includes(`"${table}"`), `Missing source stack schema ${table}.`);
  }

  assert(
    schemaBarrel.includes("./externalSourceStackGovernance"),
    "Canonical schema barrel must export externalSourceStackGovernance."
  );
  assert(
    SOURCE_STACK_REGISTRY.length >= CANONICAL_SOURCE_CATEGORIES.length,
    "Source registry must cover every canonical source category."
  );
  assert(
    SOURCE_STACK_REQUIRED_DISCLOSURES.includes("Human review is pending."),
    "Human review disclosure must be present."
  );
  assert(
    SOURCE_STACK_REQUIRED_CHECKS.includes("DTO safety"),
    "Source stack required checks must include DTO safety."
  );
}

function verifySourceAuthority(): void {
  const categories = new Set(
    SOURCE_STACK_REGISTRY.map((source) => source.sourceCategory)
  );

  for (const category of CANONICAL_SOURCE_CATEGORIES) {
    assert(
      categories.has(category),
      `Missing canonical source category ${category}.`
    );
  }

  assert(
    SOURCE_STACK_REGISTRY.every(
      (source) =>
        source.sourceAuthorityTier.length > 0 &&
        source.jurisdictionScope.length > 0 &&
        source.licensingRestrictions.length > 0 &&
        source.provenanceScore > 0 &&
        source.replayabilityScore > 0 &&
        source.claimsRestrictions.length > 0 &&
        source.liveFetchAllowed === false
    ),
    "Every source requires tier, jurisdiction, licensing, scores, claim restrictions, and blocked live fetch posture."
  );
}

function verifyCanonicalization(): void {
  assert(
    CANONICAL_ENTITY_PROFILES.length >= 5,
    "Canonicalization must include representative property, equipment, program, market, and customer revenue entities."
  );
  assert(
    CANONICAL_ENTITY_PROFILES.every(
      (entity) =>
        entity.sourceRecordRefs.length > 0 &&
        Object.keys(entity.sourceWeighting).length > 0 &&
        entity.lineage.length > 0 &&
        entity.historicalSnapshots.length > 0 &&
        entity.canonicalizationStatus.length > 0
    ),
    "Canonical entities must preserve source refs, source weighting, lineage, snapshots, and review status."
  );
}

function verifyRuntimeComponents(): void {
  for (const component of SOURCE_STACK_RUNTIME_COMPONENTS) {
    assert(
      exists(`src/lib/scrapers/${component}`),
      `Missing scraper runtime component ${component}.`
    );
  }
}

function verifyEventContracts(): void {
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  for (const eventType of SOURCE_STACK_EVENT_CONTRACTS) {
    assert(eventTypes.has(eventType), `Missing event contract ${eventType}.`);
  }
}

function smokeSourceFailover(): void {
  const result = sourceFailover({
    sourceId: "landwatch",
    liveFetchRequested: false,
  });

  assert(result.ok, "Controlled source failover smoke should pass.");
  assert(
    result.humanReviewRequired && result.productionBlocked,
    "Source failover must remain human-review-required and production-blocked."
  );
  assert(
    result.result.liveFetchPerformed === false,
    "Source failover smoke must not perform a live fetch."
  );

  const blocked = sourceFailover({
    sourceId: "landwatch",
    liveFetchRequested: true,
  });

  assert(!blocked.ok, "Live fetch request must be blocked.");
}

function smokeMarketplaceIngestion(): void {
  const result = marketplaceIngestion({});
  const blockedUses = result.result.blockedUses as string[];

  assert(result.ok, "Marketplace ingestion smoke should pass.");
  assert(
    blockedUses.includes("underwriting truth") &&
      blockedUses.includes("official collateral certification") &&
      blockedUses.includes("lender commitment"),
    "Marketplace ingestion must block underwriting, collateral, and commitment uses."
  );
}

function smokeSourceConflictResolution(): void {
  const result = sourceConflictResolution({});

  assert(result.ok, "Source conflict resolution smoke should pass.");
  assert(
    result.humanReviewRequired && result.replayRequired,
    "Source conflict resolution must require human review and replay."
  );
  assert(
    ((result.result.conflicts as unknown[]) ?? []).length >= 3,
    "Source conflict resolution must expose representative preserved conflicts."
  );
}

function verifyPackageCommands(): void {
  const scripts = packageScripts();

  for (const script of requiredPackageScripts) {
    assert(Boolean(scripts[script]), `Missing package script ${script}.`);
  }

  assert(
    (scripts["verify:backend"] ?? "").includes(
      "verify:source-stack-architecture"
    ),
    "verify:backend must include verify:source-stack-architecture."
  );
  assert(
    (scripts["smoke:backend"] ?? "").includes("smoke:source-stack-apis"),
    "smoke:backend must include smoke:source-stack-apis."
  );
}

function runSelected(): void {
  switch (mode) {
    case "source-stack":
      verifySourceStack();
      verifySourceAuthority();
      verifyRuntimeComponents();
      verifyEventContracts();
      break;
    case "canonicalization":
      verifyCanonicalization();
      break;
    case "source-failover":
      smokeSourceFailover();
      break;
    case "marketplace-ingestion":
      smokeMarketplaceIngestion();
      break;
    case "source-conflict-resolution":
      smokeSourceConflictResolution();
      break;
    case "commands":
      verifyPackageCommands();
      break;
    case "all":
      verifySourceStack();
      verifySourceAuthority();
      verifyCanonicalization();
      verifyRuntimeComponents();
      verifyEventContracts();
      smokeSourceFailover();
      smokeMarketplaceIngestion();
      smokeSourceConflictResolution();
      verifyPackageCommands();
      sourceStackOverview({});
      break;
    default:
      throw new Error(`Unknown source stack conformance mode: ${mode}`);
  }
}

runSelected();

console.log(`Source stack conformance passed (${mode}).`);
