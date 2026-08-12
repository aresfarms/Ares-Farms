import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
  CapitalProgram,
} from "@/lib/capital-graph/capitalGraphRuntime";
import {
  CUSTOMER_TYPE_REGISTRY,
  CustomerType,
} from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import {
  LENDER_WORKFLOW_DISCLOSURES,
  LENDER_WORKFLOW_PRODUCTION_RESTRICTIONS,
  LENDER_WORKFLOW_RUNTIME_VERSION,
  LenderApplicationInput,
  LenderQueueItem,
  LenderWorkflowInput,
  LenderWorkflowResult,
  LenderWorkflowSection,
  evaluateLenderWorkflow,
} from "@/lib/lender/workflowRuntime";
import {
  OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
  OpportunityDiscoveryV2CustomerProfile,
  OpportunityDiscoveryV2GrantCard,
  OpportunityDiscoveryV2Result,
  composeOpportunityDiscoveryV2,
} from "@/lib/platform/authorities/opportunity";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Lender Workflow v2 Runtime
 *
 * The fourth downstream consumer of the Capital Graph (Build 13) and
 * Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15), Financing Pathway Engine v2 (Build 16),
 * and Opportunity Discovery v2 (Build 17). Produces a unified,
 * deterministic, replay-safe, audit-safe, conflict-preserving advisory
 * lender-coordination pack that joins:
 *
 * - The legacy v1 `evaluateLenderWorkflow` runtime (application
 *   queue, sections, totals) preserved as an additive compatibility
 *   bridge so existing lender-facing surfaces continue to render
 *   first-class evidence.
 * - Opportunity Discovery v2 customer profiles + Capital Graph-backed
 *   grant cards (and therefore Financing Pathway Engine v2 + Revenue
 *   Intelligence v2 + Customer Type + Capital Graph + legacy revenue
 *   + legacy v1 pathway engine + legacy v1 discovery).
 * - Customer Type review boundary and federation scope.
 * - Capital Graph sponsor authority and category posture.
 * - Per-application lender briefings: lender queue item + composed
 *   pathway candidates inherited from the application's declared
 *   customer types + federation-scope guardrails + cross-source
 *   conflict signals.
 *
 * Lender Workflow v2 is operational coordination only. It does not
 * approve, preapprove, deny, score, underwrite, determine eligibility,
 * commit credit, send borrower notices, capture payment, publish
 * official reports, or authorize any regulatory or legal reliance.
 *
 * Cross-source conflict signals are emitted when (a) federation scope
 * mismatches between declared customer type and composed pathway,
 * (b) the legacy v1 lender queue surfaces an application whose
 * customer type produces no Capital Graph-backed grant cards in v2,
 * or (c) v2 produces grant cards but the application is missing
 * critical intake readiness fields.
 *
 * Master Volume Governance:
 * - Vol I: keeps lender coordination subordinate to constitutional
 *   authority; the runtime never grants pathway, opportunity, or
 *   credit authority.
 * - Vol II: lender briefings inherit upstream doctrine refs; lender
 *   workflow is review-bound and not a regulatory determination.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining lender-workflow-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   lender-workflow-runtime-v0.1.0.
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, and replay verification posture.
 * - Vol IV: routes governed handoffs to Opportunity Discovery v2,
 *   Financing Pathway Engine v2, Revenue Intelligence v2, Customer
 *   Type Registry, Capital Graph, lender workflow (v1), advanced
 *   intelligence, evidence engine, certification engine, registry
 *   framework, evidence packets, audit replay, governance, reviews,
 *   and module readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, portability, and coordination-only boundaries.
 * - Vol VI: keeps every composed lender briefing behind a public-
 *   safe DTO; no raw borrower, sponsor, or property records; no live
 *   external fetch; no source-certainty claim.
 *
 * Safety boundary:
 * - Internal coordination evidence only.
 * - No autonomous customer eligibility determination, autonomous
 *   pathway determination, autonomous opportunity determination,
 *   credit decision, lender commitment, program approval, tax-credit
 *   allocation, environmental clearance, carbon-credit issuance,
 *   live external customer / sponsor / source / property fetch,
 *   source-certainty claim, borrower notice send, or payment
 *   authorization.
 */

export const LENDER_WORKFLOW_V2_RUNTIME_VERSION =
  "lender-workflow-v2-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type LenderWorkflowV2ApplicationContext = LenderApplicationInput & {
  declaredCustomerTypes?: string[];
  intendedUses?: string[];
  jurisdiction?: {
    federal?: boolean;
    state?: string | null;
    county?: string | null;
    utilityTerritory?: string | null;
  } | null;
  location?: {
    country?: string | null;
    state?: string | null;
    county?: string | null;
  } | null;
  farmTypes?: string[];
  goals?: string[];
  acreage?: number | null;
  requestedAmount?: number | null;
  stage?: string | null;
};

export type LenderWorkflowV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  lenderId?: string | null;
  partnerWorkflowId?: string | null;
  applications?: LenderWorkflowV2ApplicationContext[];
  filter?: LenderWorkflowInput["filter"];
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type LenderWorkflowV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  applicationId: string | null;
  customerTypeId: string | null;
  capitalProgramIds: string[];
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type LenderWorkflowV2ApplicationBriefing = {
  applicationId: string;
  queueItem: LenderQueueItem;
  customerProfiles: Array<{
    customerType: CustomerType;
    grantCardCount: number;
    sovereignCardCount: number;
    federationGatedCount: number;
    reviewRequiredCount: number;
    missingInformationCount: number;
    topGrantCards: Array<{
      programId: string;
      programName: string;
      categoryId: CapitalCategoryId;
      sponsorAuthority: string;
      federationScope: CapitalProgram["federationScope"];
      capitalFitScore: number;
      pathwayStatus:
        | "REVIEW_REQUIRED"
        | "MISSING_INFORMATION"
        | "FEDERATION_GATED";
    }>;
  }>;
  crossSourceConflicts: LenderWorkflowV2CrossSourceConflict[];
  blockedClaims: string[];
};

export type LenderWorkflowV2LegacyBridge = {
  lenderWorkflowVersion: string;
  legacyQueueItemCount: number;
  legacySectionCount: number;
  legacyHandoffCount: number;
  legacyDisclosureCount: number;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type LenderWorkflowV2Summary = {
  applicationCount: number;
  applicationsWithCustomerProfilesCount: number;
  totalGrantCardCount: number;
  conflictSignalCount: number;
  crossSourceConflictCount: number;
  sovereignCardCount: number;
  participantCardCount: number;
  publicCardCount: number;
  reviewRequiredCount: number;
  missingInformationCount: number;
  federationGatedCount: number;
  readyForReviewCount: number;
  evidencePendingCount: number;
  overlayReviewPendingCount: number;
  intakeInProgressCount: number;
  onHoldCount: number;
};

export type LenderWorkflowV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  lenderId: string | null;
  partnerWorkflowId: string | null;
  summary: LenderWorkflowV2Summary;
  applicationBriefings: LenderWorkflowV2ApplicationBriefing[];
  legacySections: LenderWorkflowSection[];
  legacyBridge: LenderWorkflowV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  coordinationOnly: true;
  lenderWorkflowV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noUnderwritingReliance: true;
  noLenderCommitment: true;
  noOfficialCreditDecision: true;
  noBorrowerNoticeSend: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLegalReliance: true;
  noLiveExternalAction: true;
  noSourceCertainty: true;
  replaySafe: true;
  auditSafe: true;
  federationScoped: true;
  conflictPreserving: true;
};

// =============================================================================
// Canonical disclosure / production-restriction posture
// =============================================================================

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "preapproval",
  "autonomous customer eligibility determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "credit decision",
  "underwriting decision",
  "lender commitment",
  "funding guarantee",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "guaranteed revenue",
  "official credit communication",
  "borrower notice send",
  "regulatory reliance",
  "legal reliance",
  "live external action",
  "source certainty",
  "payment authorization",
] as const;

export const LENDER_WORKFLOW_V2_DISCLOSURES = [
  "Lender Workflow v2 output is advisory coordination evidence, replay-safe, audit-safe, and conflict-preserving.",
  "Lender Workflow v2 does not authorize approval, preapproval, autonomous customer eligibility determination, autonomous pathway determination, autonomous opportunity determination, credit decision, underwriting, lender commitment, funding guarantee, program approval, tax-credit allocation, environmental clearance, carbon-credit issuance, regulatory reliance, or legal reliance.",
  "Lender Workflow v2 does not perform a live external customer, sponsor, source, or property fetch and does not claim source certainty.",
  "Lender Workflow v2 does not send borrower notices and does not capture payment.",
  "Sponsor authority, customer-type review boundaries, and qualified-reviewer approval remain with the named human authorities.",
  "When Opportunity Discovery v2 composition and the legacy v1 lender workflow disagree, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Lender-ready means organized and complete against intake requirements only.",
  "Lender-ready does not mean approval, pre-approval, creditworthiness, eligibility for funding, underwriting approval, or guaranteed acceptance.",
  "Sovereign customer types and sovereign sponsor programs are visible only when named federation participation is authorized.",
  "Human review is required before any composed signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const LENDER_WORKFLOW_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no approval",
  "no preapproval",
  "no credit decision",
  "no underwriting decision",
  "no lender commitment",
  "no funding guarantee",
  "no program approval",
  "no tax-credit allocation",
  "no environmental clearance",
  "no carbon-credit issuance",
  "no guaranteed revenue",
  "no official credit communication",
  "no borrower notice send",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no live external action",
  "no source certainty",
  "no payment authorization",
] as const;

const TOP_GRANT_CARD_LIMIT = 5;

// =============================================================================
// Composition helpers
// =============================================================================

function unique<T>(values: T[]): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];

  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const key =
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
        ? value
        : JSON.stringify(value);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    out.push(value);
  }

  return out;
}

function summarizeCustomerProfiles(
  profiles: OpportunityDiscoveryV2CustomerProfile[]
): LenderWorkflowV2ApplicationBriefing["customerProfiles"] {
  return profiles.map((profile) => {
    const grantCards = profile.grantCards;
    const top = [...grantCards]
      .sort((a, b) => b.capitalFitScore - a.capitalFitScore)
      .slice(0, TOP_GRANT_CARD_LIMIT)
      .map((card) => ({
        programId: card.programId,
        programName: card.programName,
        categoryId: card.categoryId,
        sponsorAuthority: card.sponsorAuthority,
        federationScope: card.federationScope,
        capitalFitScore: card.capitalFitScore,
        pathwayStatus: card.pathwayStatus,
      }));

    return {
      customerType: profile.customerType,
      grantCardCount: grantCards.length,
      sovereignCardCount: grantCards.filter(
        (card) => card.federationScope === "SOVEREIGN"
      ).length,
      federationGatedCount: grantCards.filter(
        (card) => card.pathwayStatus === "FEDERATION_GATED"
      ).length,
      reviewRequiredCount: grantCards.filter(
        (card) => card.pathwayStatus === "REVIEW_REQUIRED"
      ).length,
      missingInformationCount: grantCards.filter(
        (card) => card.pathwayStatus === "MISSING_INFORMATION"
      ).length,
      topGrantCards: top,
    };
  });
}

function buildCrossSourceConflictsForApplication(
  applicationId: string,
  queueItem: LenderQueueItem,
  profiles: OpportunityDiscoveryV2CustomerProfile[]
): LenderWorkflowV2CrossSourceConflict[] {
  const conflicts: LenderWorkflowV2CrossSourceConflict[] = [];

  // Federation scope mismatch within profiles.
  for (const profile of profiles) {
    const mismatched = profile.grantCards.filter(
      (card) => card.federationScope !== profile.customerType.federationScope
    );
    if (mismatched.length > 0) {
      conflicts.push({
        conflictId: `lwf-v2-federation-mismatch-${applicationId}-${profile.customerType.typeId}`,
        topic: `Application ${applicationId} federation scope mismatch for ${profile.customerType.label}`,
        description: `Customer type federation scope (${profile.customerType.federationScope}) differs from ${mismatched.length} composed grant card(s); review required before any lender-facing coordination signal applies.`,
        applicationId,
        customerTypeId: profile.customerType.typeId,
        capitalProgramIds: mismatched.map((card) => card.programId),
        resolution: "REQUIRES_HUMAN_REVIEW",
        reviewRoute: "/governance/lender-workflow-v2",
      });
    }
  }

  // Customer profile produces no grant cards under current context.
  const profilesWithZero = profiles.filter(
    (profile) => profile.grantCards.length === 0
  );
  if (profilesWithZero.length > 0) {
    conflicts.push({
      conflictId: `lwf-v2-empty-grant-cards-${applicationId}`,
      topic: `Application ${applicationId} has matched customer types with no composed grant cards`,
      description: `${profilesWithZero.length} matched customer type(s) returned zero Capital Graph-backed grant cards in Opportunity Discovery v2 composition; review whether intake context is incomplete or Customer Type / Capital Graph registries require expansion.`,
      applicationId,
      customerTypeId: null,
      capitalProgramIds: [],
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/lender-workflow-v2",
    });
  }

  // Application is queue-ready for review but readiness is low.
  if (
    queueItem.status === "READY_FOR_REVIEW" &&
    queueItem.intakeReadinessPercent < 80
  ) {
    conflicts.push({
      conflictId: `lwf-v2-readiness-mismatch-${applicationId}`,
      topic: `Application ${applicationId} flagged READY_FOR_REVIEW with low intake readiness`,
      description: `Lender queue marks the application READY_FOR_REVIEW but intake readiness is ${queueItem.intakeReadinessPercent}%; review whether v1 queue heuristic differs from v2 governed composition.`,
      applicationId,
      customerTypeId: null,
      capitalProgramIds: [],
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/lender-workflow-v2",
    });
  }

  return conflicts;
}

function buildLegacyInput(
  input: LenderWorkflowV2Input
): LenderWorkflowInput {
  return {
    lenderId: input.lenderId ?? null,
    userId: input.userId ?? null,
    partnerWorkflowId: input.partnerWorkflowId ?? null,
    applications: input.applications?.map((app) => ({
      applicationId: app.applicationId,
      borrowerId: app.borrowerId ?? null,
      status: app.status ?? null,
      intakeReadinessPercent: app.intakeReadinessPercent ?? null,
      documentsRequested: app.documentsRequested ?? null,
      documentsReceived: app.documentsReceived ?? null,
      documentsPendingReview: app.documentsPendingReview ?? null,
      overlayCount: app.overlayCount ?? null,
      overlayReviewedCount: app.overlayReviewedCount ?? null,
      evidencePacketReady: app.evidencePacketReady ?? null,
      borrowerPacketReady: app.borrowerPacketReady ?? null,
      partnerWorkflowState: app.partnerWorkflowState,
      notes: app.notes ?? null,
    })),
    filter: input.filter ?? null,
    metadata: input.metadata ?? {},
  };
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeLenderWorkflowV2(
  input: LenderWorkflowV2Input = {}
): LenderWorkflowV2Result {
  const sovereignFederationAllowed =
    input.scope?.sovereignFederationAllowed === true;

  // 1. Compose legacy v1 lender workflow.
  const legacyResult: LenderWorkflowResult = evaluateLenderWorkflow(
    buildLegacyInput(input)
  );

  const queueByApplicationId = new Map<string, LenderQueueItem>(
    legacyResult.queueItems.map((item) => [item.applicationId, item])
  );

  // 2. For each application, compose Opportunity Discovery v2 using
  //    the application's per-borrower context.
  const applications = input.applications ?? [];
  const applicationBriefings: LenderWorkflowV2ApplicationBriefing[] = [];

  let totalGrantCardCount = 0;
  let crossSourceConflictCount = 0;
  let conflictSignalCount = 0;
  let sovereignCardCount = 0;
  let participantCardCount = 0;
  let publicCardCount = 0;
  let reviewRequiredCount = 0;
  let missingInformationCount = 0;
  let federationGatedCount = 0;
  let applicationsWithProfilesCount = 0;

  for (const application of applications) {
    const queueItem = queueByApplicationId.get(application.applicationId);

    if (!queueItem) {
      continue;
    }

    const odV2: OpportunityDiscoveryV2Result = composeOpportunityDiscoveryV2({
      reviewerRole: input.reviewerRole ?? null,
      userId: input.userId ?? null,
      applicationId: application.applicationId,
      borrowerContext: {
        borrowerId: application.borrowerId ?? null,
        declaredCustomerTypes: application.declaredCustomerTypes ?? [],
        intendedUses: application.intendedUses ?? [],
        jurisdiction: application.jurisdiction ?? null,
        location: application.location ?? null,
        farmTypes: application.farmTypes ?? [],
        goals: application.goals ?? [],
        acreage: application.acreage ?? null,
        requestedAmount: application.requestedAmount ?? null,
        stage: application.stage ?? null,
      },
      scope: {
        capitalCategoryIds: input.scope?.capitalCategoryIds,
        sovereignFederationAllowed,
      },
    });

    const customerProfileSummaries = summarizeCustomerProfiles(
      odV2.customerProfiles
    );
    const crossSourceConflicts = buildCrossSourceConflictsForApplication(
      application.applicationId,
      queueItem,
      odV2.customerProfiles
    );

    if (odV2.customerProfiles.length > 0) {
      applicationsWithProfilesCount += 1;
    }

    totalGrantCardCount += odV2.summary.totalGrantCardCount;
    sovereignCardCount += odV2.summary.sovereignCardCount;
    participantCardCount += odV2.summary.participantCardCount;
    publicCardCount += odV2.summary.publicCardCount;
    reviewRequiredCount += odV2.summary.reviewRequiredCount;
    missingInformationCount += odV2.summary.missingInformationCount;
    federationGatedCount += odV2.summary.federationGatedCount;
    conflictSignalCount += odV2.summary.conflictSignalCount;
    crossSourceConflictCount += crossSourceConflicts.length;

    applicationBriefings.push({
      applicationId: application.applicationId,
      queueItem,
      customerProfiles: customerProfileSummaries,
      crossSourceConflicts,
      blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    });
  }

  // 3. Summarize.
  const summary: LenderWorkflowV2Summary = {
    applicationCount: legacyResult.totals.applicationCount,
    applicationsWithCustomerProfilesCount: applicationsWithProfilesCount,
    totalGrantCardCount,
    conflictSignalCount,
    crossSourceConflictCount,
    sovereignCardCount,
    participantCardCount,
    publicCardCount,
    reviewRequiredCount,
    missingInformationCount,
    federationGatedCount,
    readyForReviewCount: legacyResult.totals.readyForReviewCount,
    evidencePendingCount: legacyResult.totals.evidencePendingCount,
    overlayReviewPendingCount: legacyResult.totals.overlayReviewPendingCount,
    intakeInProgressCount: legacyResult.totals.intakeInProgressCount,
    onHoldCount: legacyResult.totals.onHoldCount,
  };

  const recommendedReviewRoutes = unique([
    "/governance/lender-workflow-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/lender/workflow",
    "/lender/applications",
    "/lender/overlays",
    "/lender/evidence",
    "/financing-pathways",
    "/portal/borrower/opportunities",
    "/portal/revenue-opportunities",
    "/customer-revenue",
    "/governance/advanced-intelligence",
    "/governance/certification-engine",
    "/governance/evidence-engine",
    "/governance/registry-framework",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    lenderId: input.lenderId ?? null,
    partnerWorkflowId: input.partnerWorkflowId ?? null,
    summary,
    applicationBriefings,
    legacySections: legacyResult.sections,
    legacyBridge: {
      lenderWorkflowVersion: LENDER_WORKFLOW_RUNTIME_VERSION,
      legacyQueueItemCount: legacyResult.queueItems.length,
      legacySectionCount: legacyResult.sections.length,
      legacyHandoffCount: legacyResult.handoffs.length,
      legacyDisclosureCount: legacyResult.disclosures.length,
      opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...LENDER_WORKFLOW_V2_DISCLOSURES,
      ...LENDER_WORKFLOW_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...LENDER_WORKFLOW_V2_PRODUCTION_RESTRICTIONS,
      ...LENDER_WORKFLOW_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    coordinationOnly: true,
    lenderWorkflowV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noUnderwritingReliance: true,
    noLenderCommitment: true,
    noOfficialCreditDecision: true,
    noBorrowerNoticeSend: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLegalReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

// Version-lineage helper chains v2 → Opportunity Discovery v2 →
// Financing Pathway Engine v2 → Revenue Intelligence v2 → Customer
// Type → Capital Graph → legacy v1 lender workflow.
export function lenderWorkflowV2Lineage(): {
  runtimeVersion: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyLenderWorkflowVersion: string;
} {
  return {
    runtimeVersion: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyLenderWorkflowVersion: LENDER_WORKFLOW_RUNTIME_VERSION,
  };
}

// Suppress unused-import warning for the Opportunity Discovery v2
// grant card type used in the briefing shape.
export type _LenderWorkflowV2OpportunityGrantCard =
  OpportunityDiscoveryV2GrantCard;
