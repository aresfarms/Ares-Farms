import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { CERTIFICATION_ENGINE_V2_RUNTIME_VERSION } from "@/lib/certification/engineV2Runtime";
import {
  CONNECTOR_CERTIFICATION_DISCLOSURES,
  CONNECTOR_CERTIFICATION_PRODUCTION_RESTRICTIONS,
  CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
  CONNECTOR_DIMENSION_IDS,
  ConnectorCertificationEngineInput,
  ConnectorCertificationResult,
  ConnectorPostureResult,
  evaluateConnectorCertification,
} from "@/lib/connectors/certificationRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION } from "@/lib/governance/evidenceEngineV2Runtime";
import { ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import { LENDER_WORKFLOW_V2_RUNTIME_VERSION } from "@/lib/lender/workflowV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/platform/authorities/opportunity";
import {
  REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
  RegistryFrameworkV2Result,
  composeRegistryFrameworkV2,
} from "@/lib/registry/frameworkV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Connector Certification v2 Runtime
 *
 * The ninth downstream consumer of the Capital Graph (Build 13) and
 * Customer Type Registry (Build 14), composed on top of Builds
 * 15-22. It produces a unified, deterministic, replay-safe,
 * audit-safe, conflict-preserving advisory connector-certification
 * posture that joins:
 *
 * - The legacy v1 `evaluateConnectorCertification` runtime (5
 *   dimensions: review, certification_evidence, rollback,
 *   monitoring, activation_checks) preserved as an additive
 *   compatibility bridge.
 * - Three new v2 governed certification dimensions derived from
 *   Registry Framework v2 + the upstream canonical v2 stack:
 *     - `capital_graph_connector_alignment` — alignment of the
 *       connector(s) under review with the canonical Capital Graph
 *       sponsor authority and federation scope (cross-checked
 *       against the Registry Framework v2 capital program catalog),
 *     - `customer_type_connector_alignment` — alignment with
 *       Customer Type Registry review boundaries and federation
 *       scope,
 *     - `certification_posture_alignment` — alignment of connector
 *       posture with Certification Engine v2 dimensional readiness
 *       (customer type, capital program, pathway v2).
 * - Cross-source conflicts when the v2 alignment dimensions report
 *   blocked while v1 reports certified, when v1 dimensions are
 *   certified but v2 cannot see registry coverage, or when upstream
 *   RF v2 surfaced cross-source conflicts that propagate.
 *
 * Live external connector execution remains blocked until qualified
 * approval through the Source Promotion Authority, Controlled
 * Promotion Board, Live Scraper Activation Gate, and other gates
 * named in the participant role registry.
 *
 * Master Volume Governance:
 * - Vol I: keeps connector certification subordinate to
 *   constitutional authority.
 * - Vol II: blocks live external action, public verification,
 *   regulatory reliance, lender commitment, legal reliance.
 * - Vol III: deterministic, replay-safe composition with version
 *   lineage chaining
 *   connector-certification-v2-runtime-v0.1.0 →
 *   registry-framework-v2-runtime-v0.1.0 →
 *   certification-engine-v2-runtime-v0.1.0 →
 *   governance-evidence-engine-v2-runtime-v0.1.0 →
 *   advanced-intelligence-v2-runtime-v0.1.0 →
 *   lender-workflow-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   connector-certification-runtime-v0.1.0.
 * - Vol III-B: runtime guard, classification, observability,
 *   explainability, replay verification posture.
 * - Vol IV: routes governed handoffs to Registry Framework v2,
 *   Certification Engine v2, Evidence Engine v2, Advanced
 *   Intelligence v2, Lender Workflow v2, Opportunity Discovery v2,
 *   Financing Pathway Engine v2, Revenue Intelligence v2, Customer
 *   Type Registry, Capital Graph, legacy v1 connector certification
 *   (governance-connector-certification), connectors, source
 *   ingestion, live-scraper-activation, evidence packets, audit
 *   replay, governance, reviews, and module readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, portability, and internal-certification-only
 *   boundaries.
 * - Vol VI: public-safe DTO posture; no raw borrower/sponsor
 *   records; no live external fetch; no source-certainty claim.
 *
 * Safety boundary:
 * - Internal connector certification posture only.
 * - Live external connector execution blocked.
 * - No external promotion / public verification / regulatory
 *   reliance / autonomous certification / autonomous registry /
 *   autonomous evidence / autonomous intelligence / autonomous
 *   opportunity / autonomous pathway / autonomous customer
 *   eligibility / autonomous connector activation determination,
 *   credit decision, lender commitment, environmental clearance,
 *   payment authorization, notice send, or legal reliance.
 */

export const CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION =
  "connector-certification-v2-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type ConnectorCertificationV2DimensionId =
  | "capital_graph_connector_alignment"
  | "customer_type_connector_alignment"
  | "certification_posture_alignment";

export type ConnectorCertificationV2DimensionStatus =
  | "CERTIFIED_INTERNAL_REVIEW_BOUND"
  | "REVIEW_PENDING"
  | "BLOCKED_BY_GATE"
  | "NOT_STARTED";

export type ConnectorCertificationV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  borrowerContext?: {
    declaredCustomerTypes?: string[];
    intendedUses?: string[];
    jurisdiction?: {
      federal?: boolean;
      state?: string | null;
      county?: string | null;
      utilityTerritory?: string | null;
    } | null;
  } | null;
  scope?: {
    v2Dimensions?: ConnectorCertificationV2DimensionId[];
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  legacy?: ConnectorCertificationEngineInput["connectors"];
  metadata?: Record<string, unknown> | null;
};

export type ConnectorCertificationV2Dimension = {
  id: ConnectorCertificationV2DimensionId;
  label: string;
  status: ConnectorCertificationV2DimensionStatus;
  readinessPercent: number;
  coverageCount: number;
  blockingGates: string[];
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type ConnectorCertificationV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type ConnectorCertificationV2LegacyBridge = {
  connectorCertificationVersion: string;
  legacyConnectorCount: number;
  legacyCertifiedCount: number;
  legacyBlockedCount: number;
  legacyLiveExecutionBlockedCount: number;
  legacyOverallReadinessPercent: number;
  registryFrameworkV2Version: string;
  certificationEngineV2Version: string;
  evidenceEngineV2Version: string;
  advancedIntelligenceV2Version: string;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type ConnectorCertificationV2Summary = {
  v2DimensionCount: number;
  v2CertifiedCount: number;
  v2PendingCount: number;
  v2BlockedCount: number;
  v2NotStartedCount: number;
  v2OverallReadinessPercent: number;
  v1ConnectorCount: number;
  v1CertifiedConnectorCount: number;
  v1BlockedConnectorCount: number;
  v1LiveExecutionBlockedCount: number;
  v1OverallReadinessPercent: number;
  crossSourceConflictCount: number;
  capitalProgramCoverageCount: number;
  customerTypeCoverageCount: number;
  capitalCategoryCoverageCount: number;
};

export type ConnectorCertificationV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: ConnectorCertificationV2Summary;
  v2Dimensions: ConnectorCertificationV2Dimension[];
  legacyConnectors: ConnectorPostureResult[];
  crossSourceConflicts: ConnectorCertificationV2CrossSourceConflict[];
  legacyBridge: ConnectorCertificationV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  internalCertificationOnly: true;
  connectorCertificationV2InternalOnly: true;
  liveExecutionBlocked: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noAutonomousCertification: true;
  noAutonomousRegistry: true;
  noAutonomousConnectorActivation: true;
  noExternalPromotion: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
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
  "live external action",
  "live fetch",
  "external promotion",
  "external certification",
  "approval",
  "preapproval",
  "autonomous customer eligibility determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "autonomous intelligence determination",
  "autonomous evidence determination",
  "autonomous certification determination",
  "autonomous registry determination",
  "autonomous connector activation determination",
  "public verification",
  "regulatory reliance",
  "lender commitment",
  "credit decision",
  "underwriting decision",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "payment authorization",
  "official report publication",
  "source certainty",
  "legal reliance",
] as const;

export const CONNECTOR_CERTIFICATION_V2_DISCLOSURES = [
  "Connector Certification v2 output is advisory internal-certification posture, replay-safe, audit-safe, and conflict-preserving.",
  "Connector Certification v2 does not authorize live external connector execution, live source fetch, external promotion, external certification, public verification, regulatory reliance, lender commitment, credit decision, environmental clearance, carbon-credit issuance, official report publication, or legal reliance.",
  "Live external connector execution remains blocked until qualified approval through the Source Promotion Authority, the Controlled Promotion Board, the Live Scraper Activation Gate, and any other gates named in the participant role registry.",
  "When the legacy v1 connector certification and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Three v2 governed dimensions (capital-graph alignment, customer-type alignment, certification posture alignment) inherit upstream RF v2 + CE v2 + Capital Graph + Customer Type doctrine refs and remain review-bound.",
  "Sovereign customer types and sovereign sponsor programs are visible only when named federation participation is authorized.",
  "Human review is required before any composed connector posture signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const CONNECTOR_CERTIFICATION_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous intelligence determination",
  "no autonomous evidence determination",
  "no autonomous certification determination",
  "no autonomous registry determination",
  "no autonomous connector activation determination",
  "no live external action",
  "no live fetch",
  "no external promotion",
  "no external certification",
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
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no source certainty",
  "no notice send",
  "no payment authorization",
  "no official report publication",
] as const;

const V2_DIMENSION_IDS: readonly ConnectorCertificationV2DimensionId[] = [
  "capital_graph_connector_alignment",
  "customer_type_connector_alignment",
  "certification_posture_alignment",
];

const V2_DIMENSION_LABELS: Record<
  ConnectorCertificationV2DimensionId,
  string
> = {
  capital_graph_connector_alignment: "Capital Graph Connector Alignment",
  customer_type_connector_alignment: "Customer Type Connector Alignment",
  certification_posture_alignment: "Certification Posture Alignment",
};

const V2_DIMENSION_REVIEW_ROUTES: Record<
  ConnectorCertificationV2DimensionId,
  string
> = {
  capital_graph_connector_alignment: "/governance/capital-graph",
  customer_type_connector_alignment: "/governance/customer-types",
  certification_posture_alignment: "/governance/certification-engine-v2",
};

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

function buildCapitalGraphConnectorDimension(
  registryPack: RegistryFrameworkV2Result
): ConnectorCertificationV2Dimension {
  const coverageCount = registryPack.summary.v2CapitalProgramEntryCount;
  const blockingGates: string[] = [];
  const reviewSignals: string[] = [];

  if (coverageCount === 0) {
    blockingGates.push("no Capital Graph program coverage");
  }
  if (registryPack.summary.crossSourceConflictCount > 0) {
    reviewSignals.push(
      `${registryPack.summary.crossSourceConflictCount} upstream RF v2 cross-source conflict(s) propagated`
    );
  }

  const status: ConnectorCertificationV2DimensionStatus =
    blockingGates.length > 0
      ? "BLOCKED_BY_GATE"
      : reviewSignals.length > 0
        ? "REVIEW_PENDING"
        : "CERTIFIED_INTERNAL_REVIEW_BOUND";

  const readinessPercent = coverageCount === 0 ? 0 : 100;

  return {
    id: "capital_graph_connector_alignment",
    label: V2_DIMENSION_LABELS.capital_graph_connector_alignment,
    status,
    readinessPercent,
    coverageCount,
    blockingGates,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute:
      V2_DIMENSION_REVIEW_ROUTES.capital_graph_connector_alignment,
    doctrineRefs: [
      "Vol I §Capital Graph Sponsor Authority",
      "Vol III §Capital Graph Composition Determinism",
      "Vol V §Capital Graph Claims Governance",
    ],
  };
}

function buildCustomerTypeConnectorDimension(
  registryPack: RegistryFrameworkV2Result
): ConnectorCertificationV2Dimension {
  const coverageCount = registryPack.summary.v2CustomerTypeEntryCount;
  const blockingGates: string[] = [];
  const reviewSignals: string[] = [];

  if (coverageCount === 0) {
    blockingGates.push("no Customer Type Registry coverage");
  }

  const status: ConnectorCertificationV2DimensionStatus =
    blockingGates.length > 0
      ? "BLOCKED_BY_GATE"
      : "CERTIFIED_INTERNAL_REVIEW_BOUND";

  const readinessPercent = coverageCount === 0 ? 0 : 100;

  return {
    id: "customer_type_connector_alignment",
    label: V2_DIMENSION_LABELS.customer_type_connector_alignment,
    status,
    readinessPercent,
    coverageCount,
    blockingGates,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute:
      V2_DIMENSION_REVIEW_ROUTES.customer_type_connector_alignment,
    doctrineRefs: [
      "Vol I §Customer Type Review Boundary",
      "Vol III §Customer Type Composition Determinism",
      "Vol V §Customer Type Claims Governance",
    ],
  };
}

function buildCertificationPostureAlignmentDimension(
  registryPack: RegistryFrameworkV2Result
): ConnectorCertificationV2Dimension {
  const coverageCount =
    registryPack.summary.v2CertificationPostureEntryCount;
  const certificationV2Readiness =
    registryPack.summary.certificationV2OverallReadinessPercent;
  const blockingGates: string[] = [];
  const reviewSignals: string[] = [];

  if (coverageCount === 0) {
    blockingGates.push("no certification posture coverage");
  }
  if (certificationV2Readiness < 50) {
    reviewSignals.push(
      `certification v2 overall readiness ${certificationV2Readiness}% below 50% threshold`
    );
  }

  const status: ConnectorCertificationV2DimensionStatus =
    blockingGates.length > 0
      ? "BLOCKED_BY_GATE"
      : reviewSignals.length > 0
        ? "REVIEW_PENDING"
        : "CERTIFIED_INTERNAL_REVIEW_BOUND";

  return {
    id: "certification_posture_alignment",
    label: V2_DIMENSION_LABELS.certification_posture_alignment,
    status,
    readinessPercent: certificationV2Readiness,
    coverageCount,
    blockingGates,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute:
      V2_DIMENSION_REVIEW_ROUTES.certification_posture_alignment,
    doctrineRefs: [
      "Vol III §Certification Engine v2 Composition Determinism",
      "Vol IV §Certification Engine v2 Review Route",
      "Vol V §Certification Claims Governance",
    ],
  };
}

const V2_DIMENSION_BUILDERS: Record<
  ConnectorCertificationV2DimensionId,
  (registryPack: RegistryFrameworkV2Result) => ConnectorCertificationV2Dimension
> = {
  capital_graph_connector_alignment: buildCapitalGraphConnectorDimension,
  customer_type_connector_alignment: buildCustomerTypeConnectorDimension,
  certification_posture_alignment:
    buildCertificationPostureAlignmentDimension,
};

function buildLegacyInput(
  input: ConnectorCertificationV2Input
): ConnectorCertificationEngineInput {
  return {
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    scope: null,
    connectors: input.legacy ?? [],
    metadata: input.metadata ?? null,
  };
}

function buildCrossSourceConflicts(
  v2Dimensions: ConnectorCertificationV2Dimension[],
  legacyResult: ConnectorCertificationResult,
  registryPack: RegistryFrameworkV2Result
): ConnectorCertificationV2CrossSourceConflict[] {
  const conflicts: ConnectorCertificationV2CrossSourceConflict[] = [];

  const v2Blocked = v2Dimensions.filter(
    (dimension) => dimension.status === "BLOCKED_BY_GATE"
  ).length;
  const v1Certified = legacyResult.summary.certifiedConnectorCount;

  if (v2Blocked > 0 && v1Certified > 0) {
    conflicts.push({
      conflictId: "cc-v2-v1-certified-vs-v2-blocked",
      topic:
        "Legacy v1 connector certifications while v2 alignment dimensions report blocked",
      description: `Canonical v2 stack reports ${v2Blocked} blocked-gate alignment dimension(s) but the legacy v1 connector certification engine reports ${v1Certified} certified connector(s); review whether v1 certification can proceed before any v2 alignment review.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/connector-certification-v2",
    });
  }

  if (registryPack.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "cc-v2-upstream-registry-conflicts",
      topic:
        "Upstream Registry Framework v2 surfaced cross-source conflicts",
      description: `Registry Framework v2 composition surfaced ${registryPack.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Connector Certification v2 evidence; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/connector-certification-v2",
    });
  }

  if (legacyResult.summary.liveExecutionBlockedCount > 0) {
    conflicts.push({
      conflictId: "cc-v2-v1-live-execution-blocked",
      topic:
        "Legacy v1 reports live-execution blocked across connectors",
      description: `Legacy v1 connector certification reports ${legacyResult.summary.liveExecutionBlockedCount} connector(s) with live execution blocked; live external connector execution remains blocked until qualified approval through the Source Promotion Authority, Controlled Promotion Board, and Live Scraper Activation Gate.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/connector-certification-v2",
    });
  }

  return conflicts;
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeConnectorCertificationV2(
  input: ConnectorCertificationV2Input = {}
): ConnectorCertificationV2Result {
  // 1. Compose Registry Framework v2 (which composes the full
  //    canonical v2 stack via CE v2 + EE v2 + AI v2 + ... at the
  //    borrower-context scope plus legacy v1 registry framework).
  const registryPack: RegistryFrameworkV2Result =
    composeRegistryFrameworkV2({
      reviewerRole: input.reviewerRole ?? null,
      userId: input.userId ?? null,
      applicationId: input.applicationId ?? null,
      borrowerContext: input.borrowerContext ?? null,
      scope: input.scope
        ? {
            capitalCategoryIds: input.scope.capitalCategoryIds,
            sovereignFederationAllowed:
              input.scope.sovereignFederationAllowed === true,
          }
        : null,
      metadata: input.metadata ?? null,
    });

  // 2. Compose legacy v1 connector certification.
  const legacyResult = evaluateConnectorCertification(buildLegacyInput(input));

  // 3. Build v2 governed alignment dimensions.
  const requestedV2Dimensions: readonly ConnectorCertificationV2DimensionId[] =
    input.scope?.v2Dimensions && input.scope.v2Dimensions.length > 0
      ? input.scope.v2Dimensions
      : V2_DIMENSION_IDS;

  const v2Dimensions: ConnectorCertificationV2Dimension[] =
    requestedV2Dimensions
      .filter((id) => V2_DIMENSION_IDS.includes(id))
      .map((id) => V2_DIMENSION_BUILDERS[id](registryPack));

  // 4. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    v2Dimensions,
    legacyResult,
    registryPack
  );

  // 5. Summarize.
  const v2CertifiedCount = v2Dimensions.filter(
    (dimension) => dimension.status === "CERTIFIED_INTERNAL_REVIEW_BOUND"
  ).length;
  const v2PendingCount = v2Dimensions.filter(
    (dimension) => dimension.status === "REVIEW_PENDING"
  ).length;
  const v2BlockedCount = v2Dimensions.filter(
    (dimension) => dimension.status === "BLOCKED_BY_GATE"
  ).length;
  const v2NotStartedCount = v2Dimensions.filter(
    (dimension) => dimension.status === "NOT_STARTED"
  ).length;
  const v2OverallReadinessPercent =
    v2Dimensions.length === 0
      ? 0
      : Math.round(
          v2Dimensions.reduce(
            (sum, dimension) => sum + dimension.readinessPercent,
            0
          ) / v2Dimensions.length
        );

  const summary: ConnectorCertificationV2Summary = {
    v2DimensionCount: v2Dimensions.length,
    v2CertifiedCount,
    v2PendingCount,
    v2BlockedCount,
    v2NotStartedCount,
    v2OverallReadinessPercent,
    v1ConnectorCount: legacyResult.summary.connectorCount,
    v1CertifiedConnectorCount: legacyResult.summary.certifiedConnectorCount,
    v1BlockedConnectorCount: legacyResult.summary.blockedConnectorCount,
    v1LiveExecutionBlockedCount:
      legacyResult.summary.liveExecutionBlockedCount,
    v1OverallReadinessPercent: legacyResult.summary.overallReadinessPercent,
    crossSourceConflictCount: crossSourceConflicts.length,
    capitalProgramCoverageCount:
      registryPack.summary.v2CapitalProgramEntryCount,
    customerTypeCoverageCount: registryPack.summary.v2CustomerTypeEntryCount,
    capitalCategoryCoverageCount:
      registryPack.summary.v2CapitalCategoryEntryCount,
  };

  const recommendedReviewRoutes = unique([
    "/governance/connector-certification-v2",
    "/governance/registry-framework-v2",
    "/governance/certification-engine-v2",
    "/governance/evidence-engine-v2",
    "/governance/advanced-intelligence-v2",
    "/governance/lender-workflow-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/governance/connector-certification",
    "/connectors",
    "/source-ingestion",
    "/live-scraper-activation",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v2Dimensions,
    legacyConnectors: legacyResult.connectors,
    crossSourceConflicts,
    legacyBridge: {
      connectorCertificationVersion: CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
      legacyConnectorCount: legacyResult.summary.connectorCount,
      legacyCertifiedCount: legacyResult.summary.certifiedConnectorCount,
      legacyBlockedCount: legacyResult.summary.blockedConnectorCount,
      legacyLiveExecutionBlockedCount:
        legacyResult.summary.liveExecutionBlockedCount,
      legacyOverallReadinessPercent:
        legacyResult.summary.overallReadinessPercent,
      registryFrameworkV2Version: REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
      certificationEngineV2Version: CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
      evidenceEngineV2Version: GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
      advancedIntelligenceV2Version: ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
      lenderWorkflowV2Version: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version:
        OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...CONNECTOR_CERTIFICATION_V2_DISCLOSURES,
      ...CONNECTOR_CERTIFICATION_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...CONNECTOR_CERTIFICATION_V2_PRODUCTION_RESTRICTIONS,
      ...CONNECTOR_CERTIFICATION_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    internalCertificationOnly: true,
    connectorCertificationV2InternalOnly: true,
    liveExecutionBlocked: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noAutonomousCertification: true,
    noAutonomousRegistry: true,
    noAutonomousConnectorActivation: true,
    noExternalPromotion: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function connectorCertificationV2Lineage(): {
  runtimeVersion: string;
  registryFrameworkV2Version: string;
  certificationEngineV2Version: string;
  evidenceEngineV2Version: string;
  advancedIntelligenceV2Version: string;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyConnectorCertificationVersion: string;
  legacyV1DimensionCount: number;
} {
  return {
    runtimeVersion: CONNECTOR_CERTIFICATION_V2_RUNTIME_VERSION,
    registryFrameworkV2Version: REGISTRY_FRAMEWORK_V2_RUNTIME_VERSION,
    certificationEngineV2Version: CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
    evidenceEngineV2Version: GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    advancedIntelligenceV2Version: ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    lenderWorkflowV2Version: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyConnectorCertificationVersion: CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
    legacyV1DimensionCount: CONNECTOR_DIMENSION_IDS.length,
  };
}

export const CONNECTOR_CERTIFICATION_V2_DIMENSION_IDS = V2_DIMENSION_IDS;
