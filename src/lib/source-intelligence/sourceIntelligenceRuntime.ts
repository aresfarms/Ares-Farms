import { createHash } from "crypto";

import {
  ADVISORY_ONLY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";

/**
 * Governed Source Intelligence Runtime
 *
 * Master Volume Governance:
 * - Vol I: Scrapers are constitutionally governed source connectors, not
 *   autonomous decision systems or truth systems.
 * - Vol II: Marketplace, property, borrower, agency, and institutional source
 *   records remain candidate evidence until review, provenance, replay, and
 *   source-authority gates pass.
 * - Vol III: Source intelligence must be deterministic, replay-safe,
 *   canonicalized, classified, and connector-governed.
 * - Vol III-B: Runtime state, classification, observability, and human review
 *   boundaries must be visible on every source action.
 * - Vol IV: Source ingestion must support review, escalation, retry control,
 *   degraded connector behavior, and evidence preservation.
 * - Vol V: Source authority, claims governance, replay, provenance,
 *   classification, disclosure, and canonical property doctrine govern every
 *   output.
 *
 * Supplemental governing inputs:
 * - Ares_Furlong_Scraper_Connector_Source_Ingestion_Governance_Doctrine.pdf
 * - Ares_Furlong_Property_Discovery_Scraper_Governance_Integration_Master.pdf
 * - Ares_Furlong_Institutional_Scraper_Source_Intelligence_Implementation_Master.pdf
 */

export const SOURCE_INTELLIGENCE_VERSION =
  "source-intelligence-runtime-v0.1.0";

export const SOURCE_INTELLIGENCE_SOURCES = [
  "Ares_Furlong_Scraper_Connector_Source_Ingestion_Governance_Doctrine.pdf",
  "Ares_Furlong_Property_Discovery_Scraper_Governance_Integration_Master.pdf",
  "Ares_Furlong_Institutional_Scraper_Source_Intelligence_Implementation_Master.pdf",
] as const;

export const SOURCE_INTELLIGENCE_REQUIRED_DISCLOSURES = [
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
  "Listings may change.",
  "Marketplace data is advisory.",
  "Institutional review may be required.",
  "Displayed properties are not approvals.",
  ADVISORY_ONLY_DISCLOSURE,
] as const;

export type SourceAuthorityTier = "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4";

export type SourceAuthorityProfile = {
  sourceId: string;
  sourceName: string;
  sourceCategory: string;
  sourceAuthorityTier: SourceAuthorityTier;
  provenanceScore: number;
  replayabilityScore: number;
  institutionalReliability: "HIGH" | "MEDIUM" | "LOW" | "ADVISORY";
  claimsAllowed: string[];
  classificationLevel: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL";
  connectorCertificationStatus:
    | "CERTIFIED"
    | "PENDING_CERTIFICATION"
    | "REQUIRES_REVIEW";
  jurisdictionScope: string[];
  sourceVersion: string;
};

export type ScraperDefinition = SourceAuthorityProfile & {
  scraperId: string;
  scraperName: string;
  phase: "PHASE_1" | "PHASE_2" | "PHASE_3" | "PHASE_4";
  requiredMetadata: string[];
  allowedOperationalUse: string[];
  blockedOperationalUse: string[];
  liveFetchAllowed: boolean;
  replaySupported: boolean;
  rateLimitProfile: string;
  retryGovernanceProfile: string;
  sovereignRestrictionProfile: string;
  adapterPath: string;
};

export type ScraperActionInput = {
  actorId?: string | null;
  scraperId?: string | null;
  sourceId?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  jurisdictionScope?: string | null;
  connectorId?: string | null;
  canonicalPropertyId?: string | null;
  ingestionRecordId?: string | null;
  liveFetchRequested?: boolean;
  productionUseRequested?: boolean;
  officialUseRequested?: boolean;
  metadata?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  reason?: string | null;
};

type DispatchResult = {
  ok: boolean;
  action: string;
  result: Record<string, unknown>;
  blockedReasons: string[];
  disclosures: string[];
  productionBlocked: true;
  replayRequired: true;
  humanReviewRequired: true;
};

const REQUIRED_RECORD_METADATA = [
  "source_id",
  "source_name",
  "source_url",
  "fetched_at",
  "content_hash",
  "classification_level",
  "confidence_score",
  "replay_ref",
  "connector_id",
  "jurisdiction_scope",
  "scraper_version",
] as const;

export const SCRAPER_AUDIT_EVENTS = [
  "scraper.run.started",
  "scraper.record.fetched",
  "scraper.record.rejected",
  "scraper.record.classified",
  "scraper.record.escalated",
  "scraper.run.completed",
  "scraper.run.failed",
  "scraper.replay.executed",
  "scraper.connector.degraded",
] as const;

export const SOURCE_AUTHORITY_REGISTRY: SourceAuthorityProfile[] = [
  {
    sourceId: "county-gis",
    sourceName: "County GIS",
    sourceCategory: "government-public",
    sourceAuthorityTier: "TIER_1",
    provenanceScore: 95,
    replayabilityScore: 90,
    institutionalReliability: "HIGH",
    claimsAllowed: ["source-visible", "review-required"],
    classificationLevel: "CONFIDENTIAL",
    connectorCertificationStatus: "PENDING_CERTIFICATION",
    jurisdictionScope: ["county", "state"],
    sourceVersion: "county-gis-source-authority-v0.1.0",
  },
  {
    sourceId: "tax-assessor",
    sourceName: "Tax Assessor",
    sourceCategory: "government-public",
    sourceAuthorityTier: "TIER_1",
    provenanceScore: 95,
    replayabilityScore: 90,
    institutionalReliability: "HIGH",
    claimsAllowed: ["source-visible", "review-required"],
    classificationLevel: "CONFIDENTIAL",
    connectorCertificationStatus: "PENDING_CERTIFICATION",
    jurisdictionScope: ["county", "state"],
    sourceVersion: "tax-assessor-source-authority-v0.1.0",
  },
  {
    sourceId: "usda-eligibility",
    sourceName: "USDA Eligibility",
    sourceCategory: "government-public",
    sourceAuthorityTier: "TIER_1",
    provenanceScore: 95,
    replayabilityScore: 90,
    institutionalReliability: "HIGH",
    claimsAllowed: ["official-reference-required", "review-required"],
    classificationLevel: "CONFIDENTIAL",
    connectorCertificationStatus: "PENDING_CERTIFICATION",
    jurisdictionScope: ["federal", "state", "county"],
    sourceVersion: "usda-eligibility-source-authority-v0.1.0",
  },
  {
    sourceId: "fema-flood",
    sourceName: "FEMA Flood",
    sourceCategory: "government-public",
    sourceAuthorityTier: "TIER_1",
    provenanceScore: 90,
    replayabilityScore: 90,
    institutionalReliability: "HIGH",
    claimsAllowed: ["source-visible", "review-required"],
    classificationLevel: "CONFIDENTIAL",
    connectorCertificationStatus: "PENDING_CERTIFICATION",
    jurisdictionScope: ["federal", "state", "county"],
    sourceVersion: "fema-flood-source-authority-v0.1.0",
  },
  {
    sourceId: "crexi",
    sourceName: "CREXI",
    sourceCategory: "commercial-marketplace",
    sourceAuthorityTier: "TIER_3",
    provenanceScore: 70,
    replayabilityScore: 70,
    institutionalReliability: "MEDIUM",
    claimsAllowed: ["advisory-discovery", "listing-may-change"],
    classificationLevel: "INTERNAL",
    connectorCertificationStatus: "REQUIRES_REVIEW",
    jurisdictionScope: ["marketplace"],
    sourceVersion: "crexi-source-authority-v0.1.0",
  },
  {
    sourceId: "landwatch",
    sourceName: "LandWatch",
    sourceCategory: "commercial-marketplace",
    sourceAuthorityTier: "TIER_3",
    provenanceScore: 70,
    replayabilityScore: 70,
    institutionalReliability: "MEDIUM",
    claimsAllowed: ["advisory-discovery", "listing-may-change"],
    classificationLevel: "INTERNAL",
    connectorCertificationStatus: "REQUIRES_REVIEW",
    jurisdictionScope: ["marketplace"],
    sourceVersion: "landwatch-source-authority-v0.1.0",
  },
  {
    sourceId: "landsearch",
    sourceName: "LandSearch",
    sourceCategory: "commercial-marketplace",
    sourceAuthorityTier: "TIER_3",
    provenanceScore: 70,
    replayabilityScore: 70,
    institutionalReliability: "MEDIUM",
    claimsAllowed: ["advisory-discovery", "listing-may-change"],
    classificationLevel: "INTERNAL",
    connectorCertificationStatus: "REQUIRES_REVIEW",
    jurisdictionScope: ["marketplace"],
    sourceVersion: "landsearch-source-authority-v0.1.0",
  },
  {
    sourceId: "loopnet",
    sourceName: "LoopNet",
    sourceCategory: "commercial-marketplace",
    sourceAuthorityTier: "TIER_3",
    provenanceScore: 65,
    replayabilityScore: 65,
    institutionalReliability: "MEDIUM",
    claimsAllowed: ["advisory-discovery", "listing-may-change"],
    classificationLevel: "INTERNAL",
    connectorCertificationStatus: "REQUIRES_REVIEW",
    jurisdictionScope: ["marketplace"],
    sourceVersion: "loopnet-source-authority-v0.1.0",
  },
  {
    sourceId: "ofac",
    sourceName: "OFAC",
    sourceCategory: "government-public",
    sourceAuthorityTier: "TIER_1",
    provenanceScore: 95,
    replayabilityScore: 90,
    institutionalReliability: "HIGH",
    claimsAllowed: ["source-visible", "review-required"],
    classificationLevel: "CONFIDENTIAL",
    connectorCertificationStatus: "PENDING_CERTIFICATION",
    jurisdictionScope: ["federal", "international"],
    sourceVersion: "ofac-source-authority-v0.1.0",
  },
  {
    sourceId: "epa-environmental",
    sourceName: "EPA / Environmental",
    sourceCategory: "government-public",
    sourceAuthorityTier: "TIER_1",
    provenanceScore: 90,
    replayabilityScore: 90,
    institutionalReliability: "HIGH",
    claimsAllowed: ["source-visible", "review-required"],
    classificationLevel: "CONFIDENTIAL",
    connectorCertificationStatus: "PENDING_CERTIFICATION",
    jurisdictionScope: ["federal", "state", "county"],
    sourceVersion: "epa-environmental-source-authority-v0.1.0",
  },
  {
    sourceId: "hud-opportunity-zones",
    sourceName: "HUD / Treasury Opportunity Zones",
    sourceCategory: "government-public",
    sourceAuthorityTier: "TIER_1",
    provenanceScore: 98,
    replayabilityScore: 95,
    institutionalReliability: "HIGH",
    claimsAllowed: ["official-place-fact", "source-visible", "review-required"],
    classificationLevel: "PUBLIC",
    connectorCertificationStatus: "PENDING_CERTIFICATION",
    jurisdictionScope: ["federal", "state", "county"],
    sourceVersion: "hud-opportunity-zones-source-authority-v0.1.0",
  },
  {
    // State real-estate license lookup — registered like every live source;
    // NO adapter wired yet (50 heterogeneous state systems). Until a state's
    // machine lookup is wired AND Module 22/23-approved, license verification
    // is operator-performed with recorded evidence (licenseVerification.ts).
    sourceId: "state-re-license",
    sourceName: "State real-estate license lookup",
    sourceCategory: "government-public",
    sourceAuthorityTier: "TIER_1",
    provenanceScore: 95,
    replayabilityScore: 85,
    institutionalReliability: "HIGH",
    claimsAllowed: ["official-reference-required", "review-required"],
    classificationLevel: "INTERNAL",
    connectorCertificationStatus: "PENDING_CERTIFICATION",
    jurisdictionScope: ["state"],
    sourceVersion: "state-re-license-source-authority-v0.1.0",
  },
  {
    sourceId: "sba-hubzone",
    sourceName: "SBA HUBZone (Historically Underutilized Business Zone)",
    sourceCategory: "government-public",
    sourceAuthorityTier: "TIER_1",
    provenanceScore: 96,
    replayabilityScore: 92,
    institutionalReliability: "HIGH",
    claimsAllowed: ["official-place-fact", "source-visible", "review-required"],
    classificationLevel: "PUBLIC",
    connectorCertificationStatus: "PENDING_CERTIFICATION",
    jurisdictionScope: ["federal", "state", "county"],
    sourceVersion: "sba-hubzone-source-authority-v0.1.0",
  },
];

export const SCRAPER_REGISTRY: ScraperDefinition[] =
  SOURCE_AUTHORITY_REGISTRY.map((source) => ({
    ...source,
    scraperId: `${source.sourceId}-scraper`,
    scraperName: `${source.sourceName} Governed Scraper`,
    phase:
      source.sourceId === "ofac" || source.sourceId === "epa-environmental"
        ? "PHASE_3"
        : source.sourceAuthorityTier === "TIER_1"
          ? "PHASE_1"
          : source.sourceId === "loopnet"
            ? "PHASE_2"
            : "PHASE_1",
    requiredMetadata: [...REQUIRED_RECORD_METADATA],
    allowedOperationalUse: [
      "candidate-source-evidence",
      "human-review-queueing",
      "replay-reconstruction",
      "governed-advisory-reporting-after-review",
    ],
    blockedOperationalUse: [
      "direct-scoring-input",
      "borrower-recommendation-automation",
      "lender-recommendation-automation",
      "official-report-publication",
      "external-notice-generation",
      "official-collateral-certification",
      "public-verification-authority",
      "sovereign-scoring-activation",
      "AI-derived approval claims",
    ],
    liveFetchAllowed: false,
    replaySupported: true,
    rateLimitProfile: "governed-rate-limit-required",
    retryGovernanceProfile: "replay-safe-retry-required",
    sovereignRestrictionProfile: "sovereign-gateway-required-for-controlled-data",
    adapterPath: `src/lib/scrapers/adapters/${source.sourceId}.ts`,
  }));

export const PROPERTY_DISCOVERY_DISCLOSURES = [
  "Listings may change.",
  "Marketplace data is advisory.",
  "Institutional review may be required.",
  "Displayed properties are not approvals.",
] as const;

export const INSTITUTIONAL_VALIDATION_SOURCES = [
  "County GIS",
  "Parcel records",
  "Tax assessor",
  "USDA eligibility",
  "FEMA/flood",
  "Census/rural overlays",
  "Opportunity Zones (HUD/Treasury)",
  "HUBZone (SBA)",
  "Zoning",
  "Environmental overlays",
  "Infrastructure overlays",
] as const;

export function findScraper(scraperId?: string | null): ScraperDefinition {
  const normalized = (scraperId ?? "county-gis-scraper").trim().toLowerCase();
  const scraper = SCRAPER_REGISTRY.find(
    (entry) =>
      entry.scraperId === normalized ||
      entry.sourceId === normalized ||
      entry.sourceName.toLowerCase() === normalized
  );

  if (!scraper) {
    throw new Error(`Unsupported governed scraper source: ${scraperId}.`);
  }

  return scraper;
}

export function hashSourceRecord(input: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify(input, Object.keys(input).sort()))
    .digest("hex");
}

export function listScrapers(): Record<string, unknown> {
  return {
    scrapers: SCRAPER_REGISTRY,
    authorityTiers: {
      TIER_1: "Authoritative government/public systems",
      TIER_2: "Certified institutional/commercial systems",
      TIER_3: "Commercial marketplace systems",
      TIER_4: "Advisory discovery systems",
    },
    productionRestrictions: productionRestrictions(),
  };
}

export function scraperStatus(input: ScraperActionInput): Record<string, unknown> {
  const scraper = findScraper(input.scraperId ?? input.sourceId);

  return {
    scraper,
    status: "REGISTERED_GOVERNED_NOT_LIVE",
    liveFetchAllowed: false,
    connectorCertificationStatus: scraper.connectorCertificationStatus,
    replaySupported: scraper.replaySupported,
    sourceAuthorityTier: scraper.sourceAuthorityTier,
    requiredBeforeLive: productionGates(),
  };
}

export function runScraper(input: ScraperActionInput): Record<string, unknown> {
  const scraper = findScraper(input.scraperId ?? input.sourceId);
  const liveFetchRequested = input.liveFetchRequested === true;
  const runId = `scraper-run-${Date.now()}`;
  const blockedReasons = [
    ...blockedUseReasons(input),
    ...(liveFetchRequested
      ? ["Live external fetch blocked until connector certification and promotion."]
      : []),
  ];
  const payload = input.payload ?? {};
  const contentHash = hashSourceRecord({
    scraperId: scraper.scraperId,
    sourceId: scraper.sourceId,
    sourceUrl: input.sourceUrl ?? "governed-source-url-not-fetched",
    payload,
  });

  return {
    runId,
    scraperId: scraper.scraperId,
    sourceId: scraper.sourceId,
    sourceName: scraper.sourceName,
    runStatus: blockedReasons.length > 0
      ? "GOVERNED_BLOCKED_OR_REVIEW_REQUIRED"
      : "CANDIDATE_EVIDENCE_CREATED",
    liveFetchAttempted: false,
    liveFetchPerformed: false,
    candidateEvidenceOnly: true,
    humanReviewRequired: true,
    auditEvents: [
      "scraper.run.started",
      "scraper.record.fetched",
      "scraper.run.completed",
    ],
    fetchRecord: {
      source_id: scraper.sourceId,
      source_name: scraper.sourceName,
      source_url: input.sourceUrl ?? "governed-source-url-not-fetched",
      fetched_at: new Date().toISOString(),
      content_hash: contentHash,
      classification_level: scraper.classificationLevel,
      confidence_score: scraper.provenanceScore,
      replay_ref: runId,
      connector_id: input.connectorId ?? `${scraper.sourceId}-connector`,
      jurisdiction_scope:
        input.jurisdictionScope ?? scraper.jurisdictionScope.join(","),
      scraper_version: SOURCE_INTELLIGENCE_VERSION,
    },
    blockedReasons,
  };
}

export function replayScraper(input: ScraperActionInput): Record<string, unknown> {
  const scraper = findScraper(input.scraperId ?? input.sourceId);
  const replayRef = `scraper-replay-${Date.now()}`;

  return {
    replayRef,
    scraperId: scraper.scraperId,
    sourceId: scraper.sourceId,
    replayStatus: "REPLAY_READY_NO_LIVE_FETCH",
    deterministicReplay: true,
    historicalReconstruction: true,
    sourceLineageReplay: true,
    replayIntegrityVerification: true,
    liveFetchPerformed: false,
  };
}

export function scraperProvenance(
  input: ScraperActionInput
): Record<string, unknown> {
  const scraper = findScraper(input.scraperId ?? input.sourceId);

  return {
    scraperId: scraper.scraperId,
    sourceId: scraper.sourceId,
    sourceName: scraper.sourceName,
    sourceAuthorityTier: scraper.sourceAuthorityTier,
    provenanceScore: scraper.provenanceScore,
    replayabilityScore: scraper.replayabilityScore,
    institutionalReliability: scraper.institutionalReliability,
    requiredMetadata: scraper.requiredMetadata,
    provenanceChainRequired: true,
    replayRefsRequired: true,
  };
}

export function scraperClassification(
  input: ScraperActionInput
): Record<string, unknown> {
  const scraper = findScraper(input.scraperId ?? input.sourceId);

  return {
    scraperId: scraper.scraperId,
    sourceId: scraper.sourceId,
    classificationLevel: scraper.classificationLevel,
    classificationProfile: "source-intelligence-governance",
    aiUsageTier: "TIER_1_ADVISORY_ONLY",
    redactionRequirements: [
      "remove raw credentials",
      "remove secret source tokens",
      "redact borrower-sensitive data for unauthorized audiences",
    ],
    exportRestrictions: [
      "candidate evidence only before review",
      "no public verification authority",
      "no official collateral certification",
    ],
  };
}

export function escalateScraper(
  input: ScraperActionInput
): Record<string, unknown> {
  const scraper = findScraper(input.scraperId ?? input.sourceId);

  return {
    escalationId: `scraper-escalation-${Date.now()}`,
    scraperId: scraper.scraperId,
    sourceId: scraper.sourceId,
    escalationReason: input.reason ?? "source-governance-review-required",
    escalationSeverity: "SEV-3_GOVERNANCE_REVIEW",
    governanceQueue: "source-ingestion-review",
    humanReviewRequired: true,
    containmentActions: [
      "block operational use",
      "preserve provenance envelope",
      "preserve replay reference",
      "route to human review",
    ],
  };
}

export function submitSourceIngestion(
  input: ScraperActionInput
): Record<string, unknown> {
  const scraper = findScraper(input.scraperId ?? input.sourceId);
  const ingestionRecordId = `source-ingestion-${Date.now()}`;
  const contentHash = hashSourceRecord({
    sourceId: scraper.sourceId,
    sourceUrl: input.sourceUrl ?? null,
    payload: input.payload ?? {},
  });

  return {
    ingestionRecordId,
    sourceId: scraper.sourceId,
    sourceName: scraper.sourceName,
    ingestionStatus: "RECEIVED_REVIEW_REQUIRED",
    candidateEvidenceOnly: true,
    reviewRequired: true,
    scoringUseBlocked: true,
    officialUseBlocked: true,
    contentHash,
    provenanceEnvelope: scraperProvenance(input),
    publicStatusMessages: [
      "Your document was received.",
      "Human review is pending.",
      "More information may be needed.",
    ],
  };
}

export function reviewSourceIngestion(
  input: ScraperActionInput
): Record<string, unknown> {
  return {
    reviewRecordId: `source-review-${Date.now()}`,
    ingestionRecordId: input.ingestionRecordId ?? "pending-ingestion-record",
    reviewStatus: "HUMAN_REVIEW_PENDING",
    candidateEvidenceOnly: true,
    nextRequiredAction: "operator-review",
    operationalUseBlockedUntilReviewComplete: true,
  };
}

export function classifySourceIngestion(
  input: ScraperActionInput
): Record<string, unknown> {
  const scraper = findScraper(input.scraperId ?? input.sourceId);

  return {
    classificationEventId: `source-classification-${Date.now()}`,
    ingestionRecordId: input.ingestionRecordId ?? "pending-ingestion-record",
    sourceId: scraper.sourceId,
    classificationLevel: scraper.classificationLevel,
    classificationProfile: "source-ingestion-review",
    candidateEvidenceOnly: true,
    aiUsageTier: "TIER_1_ADVISORY_ONLY",
  };
}

export function rejectSourceIngestion(
  input: ScraperActionInput
): Record<string, unknown> {
  return {
    rejectionEventId: `source-rejection-${Date.now()}`,
    ingestionRecordId: input.ingestionRecordId ?? "pending-ingestion-record",
    rejectionStatus: "REJECTED_FROM_OPERATIONAL_USE",
    rejectionReason:
      input.reason ?? "provenance-classification-or-source-authority-incomplete",
    scoringUseBlocked: true,
    officialUseBlocked: true,
    replayPreserved: true,
  };
}

export function propertyDiscovery(
  input: ScraperActionInput
): Record<string, unknown> {
  const marketplaceSources = SCRAPER_REGISTRY.filter(
    (scraper) => scraper.sourceAuthorityTier === "TIER_3"
  );

  return {
    discoveryStatus: "GOVERNED_DISCOVERY_AVAILABLE_NOT_AUTHORITATIVE",
    requestedJurisdiction: input.jurisdictionScope ?? null,
    sources: marketplaceSources.map((source) => ({
      sourceId: source.sourceId,
      sourceName: source.sourceName,
      authorityTier: source.sourceAuthorityTier,
      useBoundary: "advisory discovery only",
      officialUseBlocked: true,
    })),
    disclosures: PROPERTY_DISCOVERY_DISCLOSURES,
  };
}

export function canonicalProperty(
  input: ScraperActionInput
): Record<string, unknown> {
  const canonicalPropertyId =
    input.canonicalPropertyId ?? `canonical-property-${Date.now()}`;

  return {
    canonical_property_id: canonicalPropertyId,
    source_records: [],
    source_authority_tier: "REVIEW_REQUIRED",
    parcel_refs: [],
    geospatial_refs: [],
    provenance_chain: [],
    listing_status: "REVIEW_REQUIRED",
    replay_refs: [`property-replay-${Date.now()}`],
    authority_scores: [],
    listing_history: [],
    confidence_score: 0,
    canonicalizationCapabilities: [
      "deduplication",
      "GIS reconciliation",
      "parcel reconciliation",
      "source conflict resolution",
      "listing history preservation",
      "replay-safe lineage",
      "provenance tracking",
    ],
    institutionalValidationSources: INSTITUTIONAL_VALIDATION_SOURCES,
    officialCollateralCertificationBlocked: true,
    humanReviewRequired: true,
  };
}

export function propertyReplay(input: ScraperActionInput): Record<string, unknown> {
  return {
    propertyReplayId: `property-replay-${Date.now()}`,
    canonicalPropertyId:
      input.canonicalPropertyId ?? "pending-canonical-property-record",
    replayIntegrityStatus: "REPLAY_READY",
    deterministicFetchReplay: true,
    sourceReconstruction: true,
    historicalListingReconstruction: true,
    replaySafeIngestion: true,
    lineageVerification: true,
  };
}

export function productionRestrictions(): string[] {
  return [
    "autonomous borrower recommendations",
    "autonomous lender recommendations",
    "direct underwriting authority",
    "direct scoring input",
    "sovereign scoring activation",
    "official collateral certification",
    "public verification authority",
    "AI-derived approval claims",
    "external notice generation from scraper output",
  ];
}

export function productionGates(): string[] {
  return [
    "replay certification",
    "provenance validation",
    "connector certification",
    "sovereignty review",
    "claims governance review",
    "constitutional compliance review",
  ];
}

function blockedUseReasons(input: ScraperActionInput): string[] {
  const blocked: string[] = [];

  if (input.productionUseRequested === true) {
    blocked.push("Production use requires controlled promotion.");
  }

  if (input.officialUseRequested === true) {
    blocked.push("Official use requires human review and source certification.");
  }

  return blocked;
}

function withGovernance(
  action: string,
  result: Record<string, unknown>,
  blockedReasons: string[] = []
): DispatchResult {
  const textForClaims = [
    JSON.stringify(result),
    SOURCE_INTELLIGENCE_REQUIRED_DISCLOSURES.join(" "),
  ];
  const claims = evaluateContentClaims({
    text: textForClaims,
    context: {
      publicVerificationGatewayOperational: false,
      officialDecisionAuthority: false,
    },
  });
  const allBlockedReasons = [
    ...blockedReasons,
    ...(!claims.ok
      ? ["Claims governance requires review before public disclosure."]
      : []),
  ];

  return {
    ok: allBlockedReasons.length === 0,
    action,
    result: {
      ...result,
      claimsEvaluation: claims,
    },
    blockedReasons: allBlockedReasons,
    disclosures: [...SOURCE_INTELLIGENCE_REQUIRED_DISCLOSURES],
    productionBlocked: true,
    replayRequired: true,
    humanReviewRequired: true,
  };
}

export function dispatchSourceIntelligenceAction(
  action: string,
  input: ScraperActionInput = {}
): DispatchResult {
  switch (action) {
    case "scrapers.list":
      return withGovernance(action, listScrapers());
    case "scrapers.status":
      return withGovernance(action, scraperStatus(input));
    case "scrapers.run": {
      const result = runScraper(input);
      return withGovernance(
        action,
        result,
        (result.blockedReasons as string[]) ?? []
      );
    }
    case "scrapers.replay":
      return withGovernance(action, replayScraper(input));
    case "scrapers.provenance":
      return withGovernance(action, scraperProvenance(input));
    case "scrapers.classification":
      return withGovernance(action, scraperClassification(input));
    case "scrapers.escalate":
      return withGovernance(action, escalateScraper(input));
    case "source-ingestion.submit":
      return withGovernance(action, submitSourceIngestion(input));
    case "source-ingestion.review":
      return withGovernance(action, reviewSourceIngestion(input));
    case "source-ingestion.classify":
      return withGovernance(action, classifySourceIngestion(input));
    case "source-ingestion.reject":
      return withGovernance(action, rejectSourceIngestion(input));
    case "properties.discovery":
      return withGovernance(action, propertyDiscovery(input));
    case "properties.canonical":
      return withGovernance(action, canonicalProperty(input));
    case "properties.replay":
      return withGovernance(action, propertyReplay(input));
    default:
      throw new Error(`Unsupported source intelligence action: ${action}.`);
  }
}
