import { createHash } from "crypto";

import {
  ADVISORY_ONLY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";
import {
  GEO_SUITABILITY_PROFILES,
  MARKET_SIGNALS,
  PROGRAM_GRAPH,
  REVENUE_OPPORTUNITY_REGISTRY,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

/**
 * Canonical External Source Stack Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps external sources subordinate to constitutional governance.
 * - Vol II: blocks source discovery from becoming regulated truth, credit
 *   evidence, official eligibility, legal advice, or lender commitments.
 * - Vol III: makes source tiering, canonicalization, provenance, replay,
 *   conflict preservation, and source failover deterministic.
 * - Vol III-B: exposes queue, freshness, classification, version, runtime,
 *   and observability posture for all source-stack operations.
 * - Vol IV: routes stale data, source failures, conflicts, and degraded
 *   connectors to human review and runbook-controlled remediation.
 * - Vol V: enforces source authority, DTO safety, claims governance,
 *   canonical lineage, replayability, and controlled disclosure.
 *
 * Supplemental governing inputs:
 * - Furlong_Volume_VI_Source_Intelligence_Integration_Master.pdf
 * - SOURCE_STACK_001_Canonical_External_Source_Discovery_Architecture.docx
 * - IMPLEMENTATION_WORKPACKAGES_Revenue_Intelligence_Runtime_Build.docx
 */

export const SOURCE_STACK_VERSION = "source-stack-runtime-v0.1.0";

export const SOURCE_STACK_SOURCES = [
  "Furlong_Volume_VI_Source_Intelligence_Integration_Master.pdf",
  "SOURCE_STACK_001_Canonical_External_Source_Discovery_Architecture.docx",
  "IMPLEMENTATION_WORKPACKAGES_Revenue_Intelligence_Runtime_Build.docx",
] as const;

export const SOURCE_STACK_REQUIRED_DISCLOSURES = [
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
  "External source data is advisory discovery intelligence only.",
  "Marketplace listings may change without notice.",
  "Program, property, equipment, geospatial, and market signals require review.",
  ADVISORY_ONLY_DISCLOSURE,
] as const;

export const SOURCE_STACK_PRODUCTION_RESTRICTIONS = [
  "no live external fetch before connector promotion",
  "no underwriting reliance",
  "no official collateral certification",
  "no lender commitment claims",
  "no program approval claims",
  "no legal advice",
  "no sovereign data use beyond explicit consent gates",
  "no production publication before promotion gate approval",
] as const;

export const CANONICAL_SOURCE_CATEGORIES = [
  "CREXI",
  "Land.com ecosystem",
  "LandWatch",
  "LandSearch",
  "LoopNet",
  "County GIS",
  "Tax assessor",
  "USDA",
  "FSA",
  "SBA",
  "NOAA",
  "NRCS",
  "FEMA",
  "Census",
  "FRED",
  "State grant portals",
  "Philanthropic grants",
  "TractorHouse",
  "Machinery Pete",
  "Fastline",
  "Equipment auction systems",
  "Commodity exchanges",
  "Weather/climate",
  "Soil/water",
  "State licensing",
  "Utility/infrastructure",
] as const;

export const SOURCE_STACK_LAYERS = [
  "External Sources",
  "Connector Certification",
  "Scraper Runtime",
  "Source Ingestion Gate",
  "Provenance Layer",
  "Classification Layer",
  "Canonicalization Layer",
  "Replay & Audit Layer",
  "Module Consumers",
  "Public Translation Surfaces",
] as const;

export const SOURCE_STACK_DEPLOYMENT_STAGES = [
  "development",
  "sandbox",
  "staging",
  "internal-governed",
  "production-shadow",
  "production-live",
] as const;

export const SOURCE_STACK_REQUIRED_CHECKS = [
  "replay validation",
  "claims validation",
  "source freshness",
  "canonical integrity",
  "DTO safety",
  "governance conformance",
] as const;

export const SOURCE_STACK_RUNTIME_COMPONENTS = [
  "registry.ts",
  "runner.ts",
  "scheduler.ts",
  "replay.ts",
  "provenance.ts",
  "classification.ts",
  "authority.ts",
  "canonicalization.ts",
  "conflict-resolution.ts",
  "market-signals.ts",
  "geo-intelligence.ts",
] as const;

export const SOURCE_STACK_REQUIRED_SCHEMA_TABLES = [
  "source_registry",
  "source_authority_registry",
  "connector_registry",
  "scraper_run_events",
  "scraper_fetch_records",
  "canonical_entities",
  "source_conflict_events",
  "market_signal_registry",
  "geo_intelligence_registry",
  "program_graph_nodes",
  "equipment_registry",
  "source_freshness_records",
  "source_failover_events",
  "source_queue_health_events",
  "source_canonicalization_events",
] as const;

export const SOURCE_STACK_EVENT_CONTRACTS = [
  "property.discovery.ingested",
  "program.graph.updated",
  "market.signal.refreshed",
  "geo.overlay.updated",
  "revenue.opportunity.generated",
  "scraper.run.completed",
  "source.conflict.detected",
  "human.review.required",
] as const;

export type SourceStackActionInput = {
  actorId?: string | null;
  sourceId?: string | null;
  connectorId?: string | null;
  canonicalEntityId?: string | null;
  geographyScope?: string | null;
  liveFetchRequested?: boolean;
  productionUseRequested?: boolean;
  officialUseRequested?: boolean;
  underwritingUseRequested?: boolean;
  lenderCommitmentRequested?: boolean;
  legalAdviceRequested?: boolean;
  payload?: Record<string, unknown>;
};

export type SourceAuthorityTier =
  | "Tier 1 authoritative government/public"
  | "Tier 2 certified institutional/commercial"
  | "Tier 3 commercial marketplace"
  | "Tier 4 advisory/discovery";

export type SourceStackSourceProfile = {
  sourceId: string;
  sourceName: string;
  sourceCategory: string;
  sourceAuthorityTier: SourceAuthorityTier;
  jurisdictionScope: string[];
  licensingRestrictions: string[];
  provenanceScore: number;
  replayabilityScore: number;
  claimsRestrictions: string[];
  freshnessCadence: string;
  liveFetchAllowed: false;
};

export type ConnectorProfile = {
  connectorId: string;
  sourceId: string;
  connectorType: string;
  certificationStatus: "PENDING_CERTIFICATION" | "REQUIRES_REVIEW";
  queueProfile: string;
  retryGovernanceProfile: string;
  proxyHandlingProfile: string;
  failoverSourceRefs: string[];
  liveCallsAllowed: false;
};

export type CanonicalEntityProfile = {
  canonicalEntityId: string;
  entityType:
    | "canonical_property_record"
    | "canonical_equipment_record"
    | "canonical_program_record"
    | "canonical_market_signal"
    | "canonical_customer_revenue_profile";
  canonicalRef: string;
  sourceRecordRefs: string[];
  sourceWeighting: Record<string, number>;
  lineage: string[];
  historicalSnapshots: string[];
  conflictRefs: string[];
  canonicalizationStatus: "REVIEW_REQUIRED" | "CONFLICT_PRESERVED";
};

export type SourceStackDispatchResult = {
  ok: boolean;
  action: string;
  result: Record<string, unknown>;
  blockedReasons: string[];
  disclosures: string[];
  productionBlocked: true;
  replayRequired: true;
  humanReviewRequired: true;
};

export const SOURCE_STACK_REGISTRY: SourceStackSourceProfile[] = [
  {
    sourceId: "crexi",
    sourceName: "CREXI",
    sourceCategory: "CREXI",
    sourceAuthorityTier: "Tier 3 commercial marketplace",
    jurisdictionScope: ["marketplace"],
    licensingRestrictions: ["terms review required", "no republication without review"],
    provenanceScore: 70,
    replayabilityScore: 70,
    claimsRestrictions: ["discovery only", "listing may change", "not underwriting truth"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
  {
    sourceId: "land-com",
    sourceName: "Land.com Ecosystem",
    sourceCategory: "Land.com ecosystem",
    sourceAuthorityTier: "Tier 3 commercial marketplace",
    jurisdictionScope: ["marketplace"],
    licensingRestrictions: ["terms review required"],
    provenanceScore: 68,
    replayabilityScore: 68,
    claimsRestrictions: ["discovery only", "not collateral certification"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
  {
    sourceId: "landwatch",
    sourceName: "LandWatch",
    sourceCategory: "LandWatch",
    sourceAuthorityTier: "Tier 3 commercial marketplace",
    jurisdictionScope: ["marketplace"],
    licensingRestrictions: ["terms review required"],
    provenanceScore: 70,
    replayabilityScore: 70,
    claimsRestrictions: ["discovery only", "listing may change"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
  {
    sourceId: "landsearch",
    sourceName: "LandSearch",
    sourceCategory: "LandSearch",
    sourceAuthorityTier: "Tier 3 commercial marketplace",
    jurisdictionScope: ["marketplace"],
    licensingRestrictions: ["terms review required"],
    provenanceScore: 70,
    replayabilityScore: 70,
    claimsRestrictions: ["discovery only", "listing may change"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
  {
    sourceId: "loopnet",
    sourceName: "LoopNet",
    sourceCategory: "LoopNet",
    sourceAuthorityTier: "Tier 3 commercial marketplace",
    jurisdictionScope: ["marketplace"],
    licensingRestrictions: ["terms review required"],
    provenanceScore: 68,
    replayabilityScore: 68,
    claimsRestrictions: ["discovery only", "not financing evidence"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
  {
    sourceId: "county-gis",
    sourceName: "County GIS",
    sourceCategory: "County GIS",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["county", "state"],
    licensingRestrictions: ["public-record use review required"],
    provenanceScore: 95,
    replayabilityScore: 90,
    claimsRestrictions: ["source-visible", "human review required"],
    freshnessCadence: "jurisdiction-dependent",
    liveFetchAllowed: false,
  },
  {
    sourceId: "tax-assessor",
    sourceName: "Tax Assessor",
    sourceCategory: "Tax assessor",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["county", "state"],
    licensingRestrictions: ["public-record use review required"],
    provenanceScore: 95,
    replayabilityScore: 90,
    claimsRestrictions: ["source-visible", "human review required"],
    freshnessCadence: "jurisdiction-dependent",
    liveFetchAllowed: false,
  },
  {
    sourceId: "usda",
    sourceName: "USDA",
    sourceCategory: "USDA",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["federal", "state", "county"],
    licensingRestrictions: ["official source citation required"],
    provenanceScore: 95,
    replayabilityScore: 90,
    claimsRestrictions: ["program fit is preliminary", "official review required"],
    freshnessCadence: "agency-update",
    liveFetchAllowed: false,
  },
  {
    sourceId: "fsa",
    sourceName: "Farm Service Agency",
    sourceCategory: "FSA",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["federal", "state", "county"],
    licensingRestrictions: ["official source citation required"],
    provenanceScore: 95,
    replayabilityScore: 90,
    claimsRestrictions: ["program fit is preliminary", "official review required"],
    freshnessCadence: "agency-update",
    liveFetchAllowed: false,
  },
  {
    sourceId: "sba",
    sourceName: "Small Business Administration",
    sourceCategory: "SBA",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["federal", "state"],
    licensingRestrictions: ["official source citation required"],
    provenanceScore: 94,
    replayabilityScore: 90,
    claimsRestrictions: ["program fit is preliminary", "official review required"],
    freshnessCadence: "agency-update",
    liveFetchAllowed: false,
  },
  {
    sourceId: "noaa",
    sourceName: "NOAA",
    sourceCategory: "NOAA",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["federal", "regional"],
    licensingRestrictions: ["source citation required"],
    provenanceScore: 94,
    replayabilityScore: 92,
    claimsRestrictions: ["weather and climate signals may change"],
    freshnessCadence: "agency-update",
    liveFetchAllowed: false,
  },
  {
    sourceId: "nrcs",
    sourceName: "NRCS",
    sourceCategory: "NRCS",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["federal", "state", "county"],
    licensingRestrictions: ["source citation required"],
    provenanceScore: 94,
    replayabilityScore: 92,
    claimsRestrictions: ["soil interpretation requires review"],
    freshnessCadence: "agency-update",
    liveFetchAllowed: false,
  },
  {
    sourceId: "fema",
    sourceName: "FEMA",
    sourceCategory: "FEMA",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["federal", "state", "county"],
    licensingRestrictions: ["source citation required"],
    provenanceScore: 94,
    replayabilityScore: 90,
    claimsRestrictions: ["flood interpretation requires review"],
    freshnessCadence: "agency-update",
    liveFetchAllowed: false,
  },
  {
    sourceId: "census",
    sourceName: "Census",
    sourceCategory: "Census",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["federal", "state", "county"],
    licensingRestrictions: ["source citation required"],
    provenanceScore: 92,
    replayabilityScore: 90,
    claimsRestrictions: ["demographic context only"],
    freshnessCadence: "agency-update",
    liveFetchAllowed: false,
  },
  {
    sourceId: "fred",
    sourceName: "FRED",
    sourceCategory: "FRED",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["federal", "regional"],
    licensingRestrictions: ["source citation required"],
    provenanceScore: 92,
    replayabilityScore: 90,
    claimsRestrictions: ["economic signal only", "not a forecast guarantee"],
    freshnessCadence: "scheduled-refresh",
    liveFetchAllowed: false,
  },
  {
    sourceId: "state-grants",
    sourceName: "State Grant Portals",
    sourceCategory: "State grant portals",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["state"],
    licensingRestrictions: ["jurisdiction review required"],
    provenanceScore: 90,
    replayabilityScore: 85,
    claimsRestrictions: ["program fit is preliminary", "deadline review required"],
    freshnessCadence: "scheduled-refresh",
    liveFetchAllowed: false,
  },
  {
    sourceId: "philanthropic-grants",
    sourceName: "Philanthropic Grants",
    sourceCategory: "Philanthropic grants",
    sourceAuthorityTier: "Tier 4 advisory/discovery",
    jurisdictionScope: ["national", "regional", "local"],
    licensingRestrictions: ["terms and sponsor review required"],
    provenanceScore: 75,
    replayabilityScore: 72,
    claimsRestrictions: ["opportunity discovery only", "not award likelihood"],
    freshnessCadence: "scheduled-refresh",
    liveFetchAllowed: false,
  },
  {
    sourceId: "tractorhouse",
    sourceName: "TractorHouse",
    sourceCategory: "TractorHouse",
    sourceAuthorityTier: "Tier 3 commercial marketplace",
    jurisdictionScope: ["marketplace"],
    licensingRestrictions: ["terms review required"],
    provenanceScore: 70,
    replayabilityScore: 70,
    claimsRestrictions: ["price discovery only", "not financeability claim"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
  {
    sourceId: "machinery-pete",
    sourceName: "Machinery Pete",
    sourceCategory: "Machinery Pete",
    sourceAuthorityTier: "Tier 3 commercial marketplace",
    jurisdictionScope: ["marketplace"],
    licensingRestrictions: ["terms review required"],
    provenanceScore: 70,
    replayabilityScore: 70,
    claimsRestrictions: ["price discovery only", "not financeability claim"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
  {
    sourceId: "fastline",
    sourceName: "Fastline",
    sourceCategory: "Fastline",
    sourceAuthorityTier: "Tier 3 commercial marketplace",
    jurisdictionScope: ["marketplace"],
    licensingRestrictions: ["terms review required"],
    provenanceScore: 68,
    replayabilityScore: 68,
    claimsRestrictions: ["price discovery only", "not financeability claim"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
  {
    sourceId: "equipment-auctions",
    sourceName: "Equipment Auction Systems",
    sourceCategory: "Equipment auction systems",
    sourceAuthorityTier: "Tier 3 commercial marketplace",
    jurisdictionScope: ["marketplace"],
    licensingRestrictions: ["auction terms review required"],
    provenanceScore: 68,
    replayabilityScore: 68,
    claimsRestrictions: ["price discovery only", "not availability guarantee"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
  {
    sourceId: "commodity-exchanges",
    sourceName: "Commodity Exchanges",
    sourceCategory: "Commodity exchanges",
    sourceAuthorityTier: "Tier 2 certified institutional/commercial",
    jurisdictionScope: ["market"],
    licensingRestrictions: ["data license review required"],
    provenanceScore: 86,
    replayabilityScore: 84,
    claimsRestrictions: ["market signal only", "not forecast guarantee"],
    freshnessCadence: "scheduled-refresh",
    liveFetchAllowed: false,
  },
  {
    sourceId: "weather-climate",
    sourceName: "Weather and Climate Sources",
    sourceCategory: "Weather/climate",
    sourceAuthorityTier: "Tier 2 certified institutional/commercial",
    jurisdictionScope: ["regional"],
    licensingRestrictions: ["source license review required"],
    provenanceScore: 84,
    replayabilityScore: 84,
    claimsRestrictions: ["weather signal only", "not production guarantee"],
    freshnessCadence: "scheduled-refresh",
    liveFetchAllowed: false,
  },
  {
    sourceId: "soil-water",
    sourceName: "Soil and Water Sources",
    sourceCategory: "Soil/water",
    sourceAuthorityTier: "Tier 2 certified institutional/commercial",
    jurisdictionScope: ["regional", "parcel"],
    licensingRestrictions: ["source license review required"],
    provenanceScore: 84,
    replayabilityScore: 84,
    claimsRestrictions: ["planning signal only", "requires field review"],
    freshnessCadence: "scheduled-refresh",
    liveFetchAllowed: false,
  },
  {
    sourceId: "state-licensing",
    sourceName: "State Licensing",
    sourceCategory: "State licensing",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    jurisdictionScope: ["state"],
    licensingRestrictions: ["official source citation required"],
    provenanceScore: 92,
    replayabilityScore: 86,
    claimsRestrictions: ["legal interpretation blocked", "qualified review required"],
    freshnessCadence: "scheduled-refresh",
    liveFetchAllowed: false,
  },
  {
    sourceId: "utility-infrastructure",
    sourceName: "Utility and Infrastructure Sources",
    sourceCategory: "Utility/infrastructure",
    sourceAuthorityTier: "Tier 2 certified institutional/commercial",
    jurisdictionScope: ["regional", "parcel"],
    licensingRestrictions: ["provider terms review required"],
    provenanceScore: 82,
    replayabilityScore: 80,
    claimsRestrictions: ["availability requires provider confirmation"],
    freshnessCadence: "manual-review",
    liveFetchAllowed: false,
  },
];

export const SOURCE_STACK_CONNECTORS: ConnectorProfile[] =
  SOURCE_STACK_REGISTRY.slice(0, 8).map((source) => ({
    connectorId: `${source.sourceId}-connector-v0.1.0`,
    sourceId: source.sourceId,
    connectorType: source.sourceAuthorityTier.includes("marketplace")
      ? "marketplace-discovery"
      : "institutional-source",
    certificationStatus: source.sourceAuthorityTier.includes("Tier 1")
      ? "PENDING_CERTIFICATION"
      : "REQUIRES_REVIEW",
    queueProfile: "governed-source-queue",
    retryGovernanceProfile: "bounded-retry-human-escalation",
    proxyHandlingProfile: "disabled-until-legal-review",
    failoverSourceRefs: SOURCE_STACK_REGISTRY.filter(
      (candidate) =>
        candidate.sourceCategory === source.sourceCategory &&
        candidate.sourceId !== source.sourceId
    ).map((candidate) => candidate.sourceId),
    liveCallsAllowed: false,
  }));

export const CANONICAL_ENTITY_PROFILES: CanonicalEntityProfile[] = [
  {
    canonicalEntityId: "canonical-property-record-sample-v0.1.0",
    entityType: "canonical_property_record",
    canonicalRef: "property-discovery-canonical-sample",
    sourceRecordRefs: ["county-gis-record-sample", "landwatch-listing-sample"],
    sourceWeighting: {
      "county-gis": 0.75,
      landwatch: 0.25,
    },
    lineage: ["source-ingestion", "provenance", "classification", "canonicalization"],
    historicalSnapshots: ["property-snapshot-2026-05-25"],
    conflictRefs: ["source-conflict-property-acreage-v0.1.0"],
    canonicalizationStatus: "CONFLICT_PRESERVED",
  },
  {
    canonicalEntityId: "canonical-equipment-record-sample-v0.1.0",
    entityType: "canonical_equipment_record",
    canonicalRef: "equipment-discovery-canonical-sample",
    sourceRecordRefs: ["tractorhouse-item-sample", "machinery-pete-item-sample"],
    sourceWeighting: {
      tractorhouse: 0.5,
      "machinery-pete": 0.5,
    },
    lineage: ["source-ingestion", "marketplace-intel", "canonicalization"],
    historicalSnapshots: ["equipment-snapshot-2026-05-25"],
    conflictRefs: ["source-conflict-equipment-price-v0.1.0"],
    canonicalizationStatus: "CONFLICT_PRESERVED",
  },
  {
    canonicalEntityId: "canonical-program-record-sample-v0.1.0",
    entityType: "canonical_program_record",
    canonicalRef: "program-graph-canonical-sample",
    sourceRecordRefs: ["usda-program-sample", "state-grants-program-sample"],
    sourceWeighting: {
      usda: 0.7,
      "state-grants": 0.3,
    },
    lineage: ["source-ingestion", "program-graph", "canonicalization"],
    historicalSnapshots: ["program-snapshot-2026-05-25"],
    conflictRefs: ["source-conflict-deadline-v0.1.0"],
    canonicalizationStatus: "REVIEW_REQUIRED",
  },
  {
    canonicalEntityId: "canonical-market-signal-sample-v0.1.0",
    entityType: "canonical_market_signal",
    canonicalRef: "market-signal-canonical-sample",
    sourceRecordRefs: ["fred-signal-sample", "commodity-exchange-signal-sample"],
    sourceWeighting: {
      fred: 0.45,
      "commodity-exchanges": 0.55,
    },
    lineage: ["source-ingestion", "market-signals", "canonicalization"],
    historicalSnapshots: ["market-signal-snapshot-2026-05-25"],
    conflictRefs: [],
    canonicalizationStatus: "REVIEW_REQUIRED",
  },
  {
    canonicalEntityId: "canonical-customer-revenue-profile-sample-v0.1.0",
    entityType: "canonical_customer_revenue_profile",
    canonicalRef: "customer-revenue-canonical-sample",
    sourceRecordRefs: ["program-graph-canonical-sample", "geo-profile-sample"],
    sourceWeighting: {
      "program-graph": 0.5,
      "geo-intelligence": 0.5,
    },
    lineage: ["customer-revenue", "data-fusion", "claims-validation"],
    historicalSnapshots: ["customer-revenue-snapshot-2026-05-25"],
    conflictRefs: ["source-conflict-revenue-assumption-v0.1.0"],
    canonicalizationStatus: "REVIEW_REQUIRED",
  },
];

export const SOURCE_CONFLICT_EVENTS = [
  {
    conflictEventId: "source-conflict-property-acreage-v0.1.0",
    entityType: "canonical_property_record",
    entityRef: "property-discovery-canonical-sample",
    conflictType: "acreage mismatch",
    conflictingSourceRefs: ["county-gis-record-sample", "landwatch-listing-sample"],
    conflictSummary:
      "County GIS acreage and marketplace listing acreage differ and require human review.",
    arbitrationStatus: "HUMAN_REVIEW_REQUIRED",
    escalationQueue: "source-ingestion-review",
  },
  {
    conflictEventId: "source-conflict-equipment-price-v0.1.0",
    entityType: "canonical_equipment_record",
    entityRef: "equipment-discovery-canonical-sample",
    conflictType: "price range mismatch",
    conflictingSourceRefs: ["tractorhouse-item-sample", "machinery-pete-item-sample"],
    conflictSummary:
      "Equipment marketplace prices differ and remain advisory until reviewed.",
    arbitrationStatus: "HUMAN_REVIEW_REQUIRED",
    escalationQueue: "marketplace-review",
  },
  {
    conflictEventId: "source-conflict-deadline-v0.1.0",
    entityType: "canonical_program_record",
    entityRef: "program-graph-canonical-sample",
    conflictType: "deadline mismatch",
    conflictingSourceRefs: ["usda-program-sample", "state-grants-program-sample"],
    conflictSummary:
      "Program deadline sources must be reviewed before public or operational use.",
    arbitrationStatus: "HUMAN_REVIEW_REQUIRED",
    escalationQueue: "program-review",
  },
];

export const SOURCE_FRESHNESS_RECORDS = SOURCE_STACK_REGISTRY.slice(0, 10).map(
  (source, index) => ({
    freshnessRecordId: `${source.sourceId}-freshness-v0.1.0`,
    sourceId: source.sourceId,
    freshnessStatus: index % 3 === 0 ? "REVIEW_DUE" : "CURRENT_METADATA_ONLY",
    lastCheckedAt: "2026-05-25T00:00:00.000Z",
    nextCheckDueAt: "2026-06-01T00:00:00.000Z",
    staleSourceDetected: index % 3 === 0,
    remediationRequired: true,
  })
);

export const SOURCE_FAILOVER_EVENTS = [
  {
    failoverEventId: "source-failover-landwatch-to-landsearch-v0.1.0",
    primarySourceId: "landwatch",
    fallbackSourceId: "landsearch",
    failoverReason: "marketplace source stale or unavailable",
    failoverStatus: "HUMAN_REVIEW_REQUIRED",
    liveFetchPerformed: false,
  },
];

export const SOURCE_QUEUE_HEALTH_EVENTS = [
  {
    queueHealthEventId: "source-queue-health-v0.1.0",
    queueName: "governed-source-queue",
    queueStatus: "REVIEW_READY",
    pendingCount: 3,
    failedCount: 0,
    retryCount: 0,
    anomalyDetected: false,
  },
];

export const GEO_INTELLIGENCE_REGISTRY = [
  {
    geoIntelligenceId: "geo-intelligence-soil-water-climate-v0.1.0",
    geographyScope: "county/state/federal",
    layerType: "soil-water-climate-infrastructure",
    sourceId: "nrcs",
    sourceAuthorityTier: "Tier 1 authoritative government/public",
    freshnessStatus: "REVIEW_READY",
    postgisReady: false,
    vectorTileReady: false,
  },
];

export const EQUIPMENT_REGISTRY = [
  {
    equipmentId: "equipment-registry-tractor-sample-v0.1.0",
    category: "tractor",
    marketplaceSourceRefs: ["tractorhouse", "machinery-pete", "fastline"],
    priceSnapshotRefs: ["equipment-price-snapshot-2026-05-25"],
    programUseRefs: ["program-graph-canonical-sample"],
    canonicalEquipmentRef: "canonical-equipment-record-sample-v0.1.0",
    availabilityRegion: ["regional"],
    financeabilityClaimBlocked: true,
  },
];

function blockedControls(input: SourceStackActionInput): string[] {
  const blockedReasons: string[] = [];

  if (input.liveFetchRequested) {
    blockedReasons.push("live external source fetch is blocked until connector promotion");
  }

  if (input.productionUseRequested) {
    blockedReasons.push("production use is blocked until controlled promotion");
  }

  if (input.officialUseRequested) {
    blockedReasons.push("official use is blocked until human review and promotion");
  }

  if (input.underwritingUseRequested) {
    blockedReasons.push("underwriting reliance is blocked for source discovery outputs");
  }

  if (input.lenderCommitmentRequested) {
    blockedReasons.push("lender commitment claims are blocked");
  }

  if (input.legalAdviceRequested) {
    blockedReasons.push("legal advice is blocked and must route to qualified review");
  }

  return blockedReasons;
}

function envelope(
  action: string,
  input: SourceStackActionInput,
  result: Record<string, unknown>
): SourceStackDispatchResult {
  const blockedReasons = blockedControls(input);
  const claimEvaluation = evaluateContentClaims({
    text: [
      "External source data is advisory discovery intelligence only.",
      "Human review is pending.",
      "More information may be needed.",
      ADVISORY_ONLY_DISCLOSURE,
    ],
  });

  return {
    ok: blockedReasons.length === 0 && claimEvaluation.ok,
    action,
    result: {
      ...result,
      runtimeVersion: SOURCE_STACK_VERSION,
      sourceDocuments: [...SOURCE_STACK_SOURCES],
      sourceStackLayers: [...SOURCE_STACK_LAYERS],
      deploymentStages: [...SOURCE_STACK_DEPLOYMENT_STAGES],
      requiredChecks: [...SOURCE_STACK_REQUIRED_CHECKS],
      productionRestrictions: [...SOURCE_STACK_PRODUCTION_RESTRICTIONS],
      claimEvaluation,
      advisoryOnly: true,
      candidateEvidenceOnly: true,
      reviewRequired: true,
      liveFetchAllowed: false,
      publicDtoRequired: true,
    },
    blockedReasons: [
      ...blockedReasons,
      ...claimEvaluation.findings
        .filter((finding) => finding.severity === "BLOCK")
        .map((finding) => finding.code),
    ],
    disclosures: [...SOURCE_STACK_REQUIRED_DISCLOSURES],
    productionBlocked: true,
    replayRequired: true,
    humanReviewRequired: true,
  };
}

export function hashSourceStackRecord(record: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(record)).digest("hex");
}

export function sourceStackOverview(input: SourceStackActionInput) {
  return envelope("source-stack.overview", input, {
    sources: SOURCE_STACK_REGISTRY,
    connectors: SOURCE_STACK_CONNECTORS,
    canonicalEntities: CANONICAL_ENTITY_PROFILES,
    requiredRuntimeComponents: [...SOURCE_STACK_RUNTIME_COMPONENTS],
    requiredSchemaTables: [...SOURCE_STACK_REQUIRED_SCHEMA_TABLES],
    requiredEventContracts: [...SOURCE_STACK_EVENT_CONTRACTS],
  });
}

export function canonicalizationPipeline(input: SourceStackActionInput) {
  return envelope("source-stack.canonicalization", input, {
    canonicalEntities: CANONICAL_ENTITY_PROFILES,
    canonicalizationControls: [
      "deduplication",
      "fuzzy matching",
      "conflict preservation",
      "source weighting",
      "entity lineage",
      "historical snapshots",
      "replay refs",
    ],
  });
}

export function sourceFailover(input: SourceStackActionInput) {
  return envelope("source-stack.failover", input, {
    failoverEvents: SOURCE_FAILOVER_EVENTS,
    failoverControls: [
      "source freshness checked",
      "fallback source is advisory only",
      "live fetch remains blocked",
      "operator review required",
    ],
    liveFetchPerformed: false,
  });
}

export function marketplaceIngestion(input: SourceStackActionInput) {
  return envelope("source-stack.marketplace-ingestion", input, {
    marketplaceSources: SOURCE_STACK_REGISTRY.filter((source) =>
      source.sourceAuthorityTier.includes("marketplace")
    ),
    blockedUses: [
      "underwriting truth",
      "official collateral certification",
      "sovereign scoring evidence",
      "lender commitment",
    ],
    requiredPasses: [
      "canonicalization",
      "provenance validation",
      "replay preservation",
      "claims governance",
    ],
  });
}

export function sourceConflictResolution(input: SourceStackActionInput) {
  return envelope("source-stack.conflict-resolution", input, {
    conflicts: SOURCE_CONFLICT_EVENTS,
    arbitration: {
      automatedFinalArbitrationAllowed: false,
      conflictPreservationRequired: true,
      escalationRequired: true,
    },
  });
}

export function sourceFreshness(input: SourceStackActionInput) {
  return envelope("source-stack.freshness", input, {
    freshnessRecords: SOURCE_FRESHNESS_RECORDS,
    staleSourceHandling: [
      "mark stale",
      "block certainty claims",
      "open review posture",
      "preserve replay refs",
    ],
  });
}

export function sourceStackObservability(input: SourceStackActionInput) {
  return envelope("source-stack.observability", input, {
    queueHealthEvents: SOURCE_QUEUE_HEALTH_EVENTS,
    monitoring: [
      "scraper failure",
      "stale-source detection",
      "replay integrity",
      "API latency",
      "queue health",
      "conflict escalation",
      "anomaly detection",
    ],
  });
}

export function programsSearch(input: SourceStackActionInput) {
  return envelope("source-stack.programs-search", input, {
    programs: PROGRAM_GRAPH,
    aliasFor: "/api/revenue-intelligence/programs",
    preliminaryReviewRequired: true,
  });
}

export function revenueOpportunitiesAlias(input: SourceStackActionInput) {
  return envelope("source-stack.revenue-opportunities", input, {
    opportunities: REVENUE_OPPORTUNITY_REGISTRY,
    aliasFor: "/api/revenue-intelligence/opportunities",
    guaranteedRevenueClaimsBlocked: true,
  });
}

export function marketSignalsAlias(input: SourceStackActionInput) {
  return envelope("source-stack.market-signals", input, {
    signals: MARKET_SIGNALS,
    aliasFor: "/api/revenue-intelligence/market-signals",
    forecastGuaranteesBlocked: true,
  });
}

export function geoSuitabilityAlias(input: SourceStackActionInput) {
  return envelope("source-stack.geo-suitability", input, {
    profiles: GEO_SUITABILITY_PROFILES,
    geoIntelligenceRegistry: GEO_INTELLIGENCE_REGISTRY,
    aliasFor: "/api/revenue-intelligence/geospatial",
    fieldVerificationRequired: true,
  });
}

export function dispatchSourceStackAction(
  action: string,
  input: SourceStackActionInput
): SourceStackDispatchResult {
  switch (action) {
    case "source-stack.overview":
      return sourceStackOverview(input);
    case "source-stack.canonicalization":
      return canonicalizationPipeline(input);
    case "source-stack.failover":
      return sourceFailover(input);
    case "source-stack.marketplace-ingestion":
      return marketplaceIngestion(input);
    case "source-stack.conflict-resolution":
      return sourceConflictResolution(input);
    case "source-stack.freshness":
      return sourceFreshness(input);
    case "source-stack.observability":
      return sourceStackObservability(input);
    case "source-stack.programs-search":
      return programsSearch(input);
    case "source-stack.revenue-opportunities":
      return revenueOpportunitiesAlias(input);
    case "source-stack.market-signals":
      return marketSignalsAlias(input);
    case "source-stack.geo-suitability":
      return geoSuitabilityAlias(input);
    default:
      return envelope(action, input, {
        error: `Unknown source stack action: ${action}`,
      });
  }
}
