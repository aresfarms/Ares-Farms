import {
  GEO_SUITABILITY_PROFILES,
  MARKETPLACE_ITEMS,
  MARKET_SIGNALS,
  OPERATING_COST_SIGNALS,
  PROGRAM_GRAPH,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";
import {
  CANONICAL_ENTITY_PROFILES,
  EQUIPMENT_REGISTRY,
  SOURCE_STACK_REGISTRY,
  SOURCE_STACK_REQUIRED_DISCLOSURES,
  SOURCE_STACK_SOURCES,
  SOURCE_STACK_VERSION,
} from "@/lib/source-stack/sourceStackRuntime";
import { REQUIRED_SURFACE_STATUS_MESSAGES } from "@/lib/dto/shared";

/**
 * Public Source Intelligence DTOs
 *
 * Volume VI requires public-safe source intelligence routes for grants,
 * property discovery, equipment, market context, and weather risk. These DTOs
 * expose translation-layer summaries only. They never expose raw records,
 * credentials, official determinations, underwriting reliance, lender
 * commitments, payment capture, notice sends, or live-fetch status as complete.
 */

export type PublicSourceIntelligenceKind =
  | "grants"
  | "property-discovery"
  | "equipment"
  | "market-context"
  | "weather-risk";

export type PublicSourceIntelligenceItem = {
  id: string;
  title: string;
  category: string;
  sourceRefs: string[];
  replayRefs: string[];
  reviewStatus: string;
  authorityPosture: string;
  advisoryOnly: true;
  liveFetchPerformed: false;
};

export type PublicSourceIntelligencePayload = {
  kind: PublicSourceIntelligenceKind;
  runtimeVersion: typeof SOURCE_STACK_VERSION;
  sourceDocuments: string[];
  items: PublicSourceIntelligenceItem[];
  statusMessages: string[];
  disclosures: string[];
  controls: {
    publicDtoOnly: true;
    classificationFiltering: true;
    claimsGovernance: true;
    redactionRules: true;
    auditLogging: true;
    rateLimitingRequired: true;
    humanReviewRequired: true;
    productionBlocked: true;
    liveFetchAllowed: false;
  };
  blockedClaims: string[];
};

export const PUBLIC_SOURCE_INTELLIGENCE_DISCLOSURES = [
  "Source information may change.",
  "Marketplace prices and availability are advisory.",
  "Program and grant opportunities require verification.",
  "Displayed property, equipment, grant, or commodity data is not an approval, guarantee, or commitment.",
  "Human review may be required before operational reliance.",
] as const;

const BLOCKED_PUBLIC_SOURCE_CLAIMS = [
  "no guaranteed grant eligibility",
  "no guaranteed pricing or availability",
  "no guaranteed revenue projection",
  "no lender commitment",
  "no agency approval",
  "no official collateral certification",
  "no live external fetch",
  "no public verification claim",
] as const;

function sourceAuthorityPosture(sourceRefs: string[]): string {
  const matchingSources = SOURCE_STACK_REGISTRY.filter((source) =>
    sourceRefs.includes(source.sourceId)
  );

  if (matchingSources.some((source) => source.sourceAuthorityTier.includes("Tier 1"))) {
    return "authoritative-source-review-required";
  }

  if (matchingSources.some((source) => source.sourceAuthorityTier.includes("Tier 2"))) {
    return "certified-or-commercial-source-review-required";
  }

  if (matchingSources.some((source) => source.sourceAuthorityTier.includes("Tier 3"))) {
    return "marketplace-discovery-review-required";
  }

  return "advisory-source-review-required";
}

function publicItem(input: {
  id: string;
  title: string;
  category: string;
  sourceRefs?: string[];
  replayRefs?: string[];
  reviewStatus: string;
}): PublicSourceIntelligenceItem {
  const sourceRefs = input.sourceRefs ?? [];

  return {
    id: input.id,
    title: input.title,
    category: input.category,
    sourceRefs,
    replayRefs: input.replayRefs ?? [],
    reviewStatus: input.reviewStatus,
    authorityPosture: sourceAuthorityPosture(sourceRefs),
    advisoryOnly: true,
    liveFetchPerformed: false,
  };
}

function grantItems(): PublicSourceIntelligenceItem[] {
  return PROGRAM_GRAPH.map((program) =>
    publicItem({
      id: program.program_id,
      title: program.program_name,
      category: `${program.sponsor_type} program source`,
      sourceRefs: program.source_refs,
      replayRefs: program.replay_refs,
      reviewStatus: "program-or-grant-opportunity-review-required",
    })
  );
}

function propertyDiscoveryItems(): PublicSourceIntelligenceItem[] {
  return CANONICAL_ENTITY_PROFILES.filter(
    (entity) => entity.entityType === "canonical_property_record"
  ).map((entity) =>
    publicItem({
      id: entity.canonicalEntityId,
      title: entity.canonicalRef,
      category: "property discovery",
      sourceRefs: entity.sourceRecordRefs,
      replayRefs: entity.historicalSnapshots,
      reviewStatus: entity.canonicalizationStatus.toLowerCase(),
    })
  );
}

function equipmentItems(): PublicSourceIntelligenceItem[] {
  const equipmentRegistryItems = EQUIPMENT_REGISTRY.map((equipment) =>
    publicItem({
      id: equipment.equipmentId,
      title: equipment.category,
      category: "equipment discovery",
      sourceRefs: equipment.marketplaceSourceRefs,
      replayRefs: equipment.priceSnapshotRefs,
      reviewStatus: "equipment-marketplace-review-required",
    })
  );

  const marketplaceItems = MARKETPLACE_ITEMS.map((item) =>
    publicItem({
      id: item.marketplace_item_id,
      title: item.category,
      category: "supplier or marketplace item",
      sourceRefs: item.source_refs,
      replayRefs: item.replay_refs,
      reviewStatus: "price-and-availability-review-required",
    })
  );

  return [...equipmentRegistryItems, ...marketplaceItems];
}

function marketContextItems(): PublicSourceIntelligenceItem[] {
  const marketSignalItems = MARKET_SIGNALS.map((signal) =>
    publicItem({
      id: signal.market_signal_id,
      title: signal.commodity_or_category,
      category: signal.market_type,
      sourceRefs: signal.source_refs,
      replayRefs: signal.replay_refs,
      reviewStatus: "market-signal-review-required",
    })
  );

  const costSignalItems = OPERATING_COST_SIGNALS.map((signal) =>
    publicItem({
      id: signal.cost_signal_id,
      title: signal.category,
      category: `${signal.customer_type} operating cost signal`,
      sourceRefs: signal.source_refs,
      replayRefs: signal.replay_refs,
      reviewStatus: "operating-cost-review-required",
    })
  );

  return [...marketSignalItems, ...costSignalItems];
}

function weatherRiskItems(): PublicSourceIntelligenceItem[] {
  return GEO_SUITABILITY_PROFILES.map((profile) =>
    publicItem({
      id: profile.geo_profile_id,
      title: profile.geography_scope,
      category: "soil weather climate infrastructure suitability",
      sourceRefs: [
        ...profile.soil_refs,
        ...profile.weather_refs,
        ...profile.climate_refs,
        ...profile.water_refs,
        ...profile.infrastructure_refs,
      ],
      replayRefs: profile.replay_refs,
      reviewStatus: "weather-risk-and-suitability-review-required",
    })
  );
}

export function buildPublicSourceIntelligencePayload(
  kind: PublicSourceIntelligenceKind
): PublicSourceIntelligencePayload {
  const itemsByKind: Record<
    PublicSourceIntelligenceKind,
    PublicSourceIntelligenceItem[]
  > = {
    grants: grantItems(),
    "property-discovery": propertyDiscoveryItems(),
    equipment: equipmentItems(),
    "market-context": marketContextItems(),
    "weather-risk": weatherRiskItems(),
  };

  return {
    kind,
    runtimeVersion: SOURCE_STACK_VERSION,
    sourceDocuments: [...SOURCE_STACK_SOURCES],
    items: itemsByKind[kind],
    statusMessages: [...REQUIRED_SURFACE_STATUS_MESSAGES],
    disclosures: [
      ...PUBLIC_SOURCE_INTELLIGENCE_DISCLOSURES,
      ...SOURCE_STACK_REQUIRED_DISCLOSURES,
    ],
    controls: {
      publicDtoOnly: true,
      classificationFiltering: true,
      claimsGovernance: true,
      redactionRules: true,
      auditLogging: true,
      rateLimitingRequired: true,
      humanReviewRequired: true,
      productionBlocked: true,
      liveFetchAllowed: false,
    },
    blockedClaims: [...BLOCKED_PUBLIC_SOURCE_CLAIMS],
  };
}

export function publicSourceIntelligencePayloadIsRedacted(
  payload: PublicSourceIntelligencePayload
): boolean {
  const serialized = JSON.stringify(payload).toLowerCase();

  return ![
    "borrower_id",
    "tenant_id",
    "application_id",
    "credential",
    "secret",
    "raw",
    "underwriting_",
  ].some((prohibited) => serialized.includes(prohibited));
}
