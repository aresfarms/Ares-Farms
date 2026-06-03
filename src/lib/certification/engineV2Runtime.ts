import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import {
  CERTIFICATION_DISCLOSURES,
  CERTIFICATION_DOMAIN_IDS,
  CERTIFICATION_ENGINE_RUNTIME_VERSION,
  CERTIFICATION_PRODUCTION_RESTRICTIONS,
  CertificationDomainResult,
  CertificationEngineInput,
  CertificationEngineResult,
  evaluateInternalCertification,
} from "@/lib/certification/engineRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import {
  EvidenceEngineV2Result,
  GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
  composeGovernanceEvidenceEngineV2,
} from "@/lib/governance/evidenceEngineV2Runtime";
import { ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import { LENDER_WORKFLOW_V2_RUNTIME_VERSION } from "@/lib/lender/workflowV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Internal Certification Engine v2 Runtime
 *
 * The seventh downstream consumer of the Capital Graph (Build 13)
 * and Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15), Financing Pathway Engine v2
 * (Build 16), Opportunity Discovery v2 (Build 17), Lender Workflow
 * v2 (Build 18), Advanced Intelligence v2 (Build 19), and Evidence
 * Engine v2 (Build 20). It produces a unified, deterministic,
 * replay-safe, audit-safe, conflict-preserving advisory
 * internal-certification posture that joins:
 *
 * - The legacy v1 `evaluateInternalCertification` runtime (4 domains:
 *   module_readiness, source_posture, connector_posture,
 *   module_conformance) preserved as an additive compatibility
 *   bridge.
 * - Three new v2 governed certification dimensions derived from the
 *   canonical v2 stack via Evidence Engine v2:
 *     - `customer_type_certification` — Customer Type Registry
 *       posture readiness across declared customer types,
 *     - `capital_program_certification` — Capital Graph posture
 *       readiness across composed programs and federation gates,
 *     - `pathway_v2_certification` — Revenue Intelligence v2 +
 *       Financing Pathway Engine v2 + Opportunity Discovery v2 +
 *       Lender Workflow v2 composition readiness, including
 *       cross-source conflict propagation.
 * - Cross-source conflict signals when (a) v2 dimensions report a
 *   ready posture but the legacy v1 engine reports a blocked gate,
 *   (b) v2 dimensions report no coverage but v1 reports certified
 *   coverage, or (c) upstream Evidence Engine v2 surfaced
 *   cross-source conflicts that propagate into this certification
 *   posture.
 *
 * Certification Engine v2 produces internal certification posture
 * only. External certification claims remain blocked until the
 * public verification and reliance gates are approved.
 *
 * Master Volume Governance:
 * - Vol I: keeps the engine subordinate to constitutional authority;
 *   internal certification describes accountable internal posture
 *   and never replaces external review.
 * - Vol II: blocks the engine from claiming external certification,
 *   public verification, regulatory reliance, lender commitment, or
 *   legal reliance.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining
 *   certification-engine-v2-runtime-v0.1.0 →
 *   governance-evidence-engine-v2-runtime-v0.1.0 →
 *   advanced-intelligence-v2-runtime-v0.1.0 →
 *   lender-workflow-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   certification-engine-runtime-v0.1.0.
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, and replay verification posture; runtime guard
 *   required on the governed API.
 * - Vol IV: routes governed handoffs to Evidence Engine v2, Advanced
 *   Intelligence v2, Lender Workflow v2, Opportunity Discovery v2,
 *   Financing Pathway Engine v2, Revenue Intelligence v2, Customer
 *   Type Registry, Capital Graph, legacy v1 certification engine,
 *   registry framework, evidence packets, audit replay, governance,
 *   reviews, and module readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, portability, and internal-certification-only
 *   boundaries.
 * - Vol VI: keeps every composed certification dimension behind a
 *   public-safe DTO; no raw borrower / sponsor records, no live
 *   external fetch, no source-certainty claim, and no portable
 *   external conformance claim.
 *
 * Safety boundary:
 * - Internal certification posture only.
 * - No external certification, public verification, regulatory
 *   reliance, lender commitment, credit decision, environmental
 *   clearance, payment authorization, official report publication,
 *   notice send, live external action, or legal reliance.
 */

export const CERTIFICATION_ENGINE_V2_RUNTIME_VERSION =
  "certification-engine-v2-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type CertificationEngineV2DimensionId =
  | "customer_type_certification"
  | "capital_program_certification"
  | "pathway_v2_certification";

export type CertificationEngineV2DimensionStatus =
  | "CERTIFIED_INTERNAL_REVIEW_BOUND"
  | "REVIEW_PENDING"
  | "BLOCKED_BY_GATE"
  | "NOT_STARTED";

export type CertificationEngineV2Input = {
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
    v2Dimensions?: CertificationEngineV2DimensionId[];
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
    moduleIds?: string[];
  } | null;
  legacy?: CertificationEngineInput["domains"];
  metadata?: Record<string, unknown> | null;
};

export type CertificationEngineV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type CertificationEngineV2Dimension = {
  id: CertificationEngineV2DimensionId;
  label: string;
  status: CertificationEngineV2DimensionStatus;
  readinessPercent: number;
  coverageCount: number;
  evidenceEntryCount: number;
  blockingGates: string[];
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type CertificationEngineV2LegacyBridge = {
  certificationEngineVersion: string;
  legacyDomainCount: number;
  legacyCertifiedDomainCount: number;
  legacyBlockedDomainCount: number;
  legacyOverallReadinessPercent: number;
  evidenceEngineV2Version: string;
  advancedIntelligenceV2Version: string;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type CertificationEngineV2Summary = {
  v2DimensionCount: number;
  v2CertifiedCount: number;
  v2PendingCount: number;
  v2BlockedCount: number;
  v2NotStartedCount: number;
  v2OverallReadinessPercent: number;
  v1DomainCount: number;
  v1CertifiedCount: number;
  v1PendingCount: number;
  v1BlockedCount: number;
  v1OverallReadinessPercent: number;
  crossSourceConflictCount: number;
  customerTypeCoverageCount: number;
  capitalProgramCoverageCount: number;
};

export type CertificationEngineV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: CertificationEngineV2Summary;
  v2Dimensions: CertificationEngineV2Dimension[];
  legacyDomains: CertificationDomainResult[];
  crossSourceConflicts: CertificationEngineV2CrossSourceConflict[];
  legacyBridge: CertificationEngineV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  internalCertificationOnly: true;
  certificationEngineV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noAutonomousCertification: true;
  noExternalCertification: true;
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
  "external certification",
  "approval",
  "preapproval",
  "autonomous customer eligibility determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "autonomous intelligence determination",
  "autonomous evidence determination",
  "autonomous certification determination",
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
  "live external action",
  "source certainty",
  "legal reliance",
] as const;

export const CERTIFICATION_ENGINE_V2_DISCLOSURES = [
  "Certification Engine v2 output is advisory internal-certification posture, replay-safe, audit-safe, and conflict-preserving.",
  "Certification Engine v2 does not authorize external certification, public verification, regulatory reliance, lender commitment, credit decision, underwriting, official report publication, environmental clearance, carbon-credit issuance, or legal reliance.",
  "Certification Engine v2 does not perform a live external customer, sponsor, source, or property fetch and does not claim source certainty.",
  "External certification claims remain blocked until the public verification and reliance gates are approved.",
  "When the legacy v1 certification engine and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Three v2 governed dimensions (customer-type, capital-program, pathway-v2) inherit upstream EE v2 + AI v2 + RI v2 doctrine refs and remain review-bound.",
  "Sovereign customer types and sovereign sponsor programs are visible only when named federation participation is authorized.",
  "Human review is required before any composed certification signal is treated as a decision.",
  "Human authority mapping describes named, qualified review authorities. The engine does not grant authority.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const CERTIFICATION_ENGINE_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous intelligence determination",
  "no autonomous evidence determination",
  "no autonomous certification determination",
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
  "no live external action",
  "no source certainty",
  "no notice send",
  "no payment authorization",
] as const;

const V2_DIMENSION_IDS: readonly CertificationEngineV2DimensionId[] = [
  "customer_type_certification",
  "capital_program_certification",
  "pathway_v2_certification",
];

const V2_DIMENSION_LABELS: Record<CertificationEngineV2DimensionId, string> = {
  customer_type_certification: "Customer Type Certification",
  capital_program_certification: "Capital Program Certification",
  pathway_v2_certification: "Pathway v2 Certification",
};

const V2_DIMENSION_REVIEW_ROUTES: Record<
  CertificationEngineV2DimensionId,
  string
> = {
  customer_type_certification: "/governance/customer-types",
  capital_program_certification: "/governance/capital-graph",
  pathway_v2_certification: "/governance/revenue-intelligence-v2",
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

function evidenceEntryCountForDimension(
  evidencePack: EvidenceEngineV2Result,
  dimensionId: CertificationEngineV2DimensionId
): number {
  const dimensionMap: Record<CertificationEngineV2DimensionId, string> = {
    customer_type_certification: "customer_type_evidence",
    capital_program_certification: "capital_program_evidence",
    pathway_v2_certification: "pathway_v2_evidence",
  };
  const target = dimensionMap[dimensionId];
  const evidenceDimension = evidencePack.v2Dimensions.find(
    (dimension) => dimension.id === target
  );
  return evidenceDimension?.entries.length ?? 0;
}

function buildCustomerTypeDimension(
  evidencePack: EvidenceEngineV2Result
): CertificationEngineV2Dimension {
  const coverageCount = evidencePack.summary.customerTypeCoverageCount;
  const entryCount = evidenceEntryCountForDimension(
    evidencePack,
    "customer_type_certification"
  );
  const blockingGates: string[] = [];
  const reviewSignals: string[] = [];

  if (coverageCount === 0) {
    blockingGates.push("no matched customer types");
  }
  if (entryCount === 0 && coverageCount > 0) {
    reviewSignals.push(
      "matched customer types produced no Capital Graph-backed evidence"
    );
  }

  const status: CertificationEngineV2DimensionStatus =
    blockingGates.length > 0
      ? "BLOCKED_BY_GATE"
      : entryCount === 0
        ? "NOT_STARTED"
        : "CERTIFIED_INTERNAL_REVIEW_BOUND";

  const readinessPercent =
    coverageCount === 0
      ? 0
      : Math.min(100, Math.round((entryCount / Math.max(coverageCount, 1)) * 100));

  return {
    id: "customer_type_certification",
    label: V2_DIMENSION_LABELS.customer_type_certification,
    status,
    readinessPercent,
    coverageCount,
    evidenceEntryCount: entryCount,
    blockingGates,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_DIMENSION_REVIEW_ROUTES.customer_type_certification,
    doctrineRefs: [
      "Vol I §Customer Type Review Boundary",
      "Vol III §Customer Type Composition Determinism",
      "Vol V §Customer Type Claims Governance",
    ],
  };
}

function buildCapitalProgramDimension(
  evidencePack: EvidenceEngineV2Result
): CertificationEngineV2Dimension {
  const coverageCount = evidencePack.summary.capitalProgramCoverageCount;
  const entryCount = evidenceEntryCountForDimension(
    evidencePack,
    "capital_program_certification"
  );
  const blockingGates: string[] = [];
  const reviewSignals: string[] = [];

  if (coverageCount === 0) {
    blockingGates.push("no Capital Graph program coverage");
  }
  if (entryCount === 0 && coverageCount > 0) {
    reviewSignals.push("coverage present without evidence entries");
  }

  const status: CertificationEngineV2DimensionStatus =
    blockingGates.length > 0
      ? "BLOCKED_BY_GATE"
      : entryCount === 0
        ? "NOT_STARTED"
        : "CERTIFIED_INTERNAL_REVIEW_BOUND";

  const readinessPercent =
    coverageCount === 0
      ? 0
      : Math.min(100, Math.round((entryCount / Math.max(coverageCount, 1)) * 100));

  return {
    id: "capital_program_certification",
    label: V2_DIMENSION_LABELS.capital_program_certification,
    status,
    readinessPercent,
    coverageCount,
    evidenceEntryCount: entryCount,
    blockingGates,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_DIMENSION_REVIEW_ROUTES.capital_program_certification,
    doctrineRefs: [
      "Vol I §Capital Graph Sponsor Authority",
      "Vol III §Capital Graph Composition Determinism",
      "Vol V §Capital Graph Claims Governance",
    ],
  };
}

function buildPathwayV2Dimension(
  evidencePack: EvidenceEngineV2Result
): CertificationEngineV2Dimension {
  const entryCount = evidenceEntryCountForDimension(
    evidencePack,
    "pathway_v2_certification"
  );
  const blockingGates: string[] = [];
  const reviewSignals: string[] = [];

  if (evidencePack.crossSourceConflicts.length > 0) {
    reviewSignals.push(
      `${evidencePack.crossSourceConflicts.length} upstream cross-source conflict(s) propagated from Evidence Engine v2`
    );
  }

  if (entryCount === 0) {
    blockingGates.push("no pathway v2 evidence entries");
  }

  const status: CertificationEngineV2DimensionStatus =
    blockingGates.length > 0
      ? "BLOCKED_BY_GATE"
      : reviewSignals.length > 0
        ? "REVIEW_PENDING"
        : "CERTIFIED_INTERNAL_REVIEW_BOUND";

  const readinessPercent = entryCount === 0 ? 0 : 100;

  return {
    id: "pathway_v2_certification",
    label: V2_DIMENSION_LABELS.pathway_v2_certification,
    status,
    readinessPercent,
    coverageCount: entryCount,
    evidenceEntryCount: entryCount,
    blockingGates,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_DIMENSION_REVIEW_ROUTES.pathway_v2_certification,
    doctrineRefs: [
      "Vol III §Pathway v2 Composition Determinism",
      "Vol IV §Pathway v2 Review Route",
      "Vol V §Pathway v2 Claims Governance",
    ],
  };
}

const V2_DIMENSION_BUILDERS: Record<
  CertificationEngineV2DimensionId,
  (evidencePack: EvidenceEngineV2Result) => CertificationEngineV2Dimension
> = {
  customer_type_certification: buildCustomerTypeDimension,
  capital_program_certification: buildCapitalProgramDimension,
  pathway_v2_certification: buildPathwayV2Dimension,
};

function buildLegacyInput(
  input: CertificationEngineV2Input
): CertificationEngineInput {
  return {
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    scope: input.scope
      ? {
          moduleIds: input.scope.moduleIds,
        }
      : null,
    domains: input.legacy,
    metadata: input.metadata ?? null,
  };
}

function buildCrossSourceConflicts(
  v2Dimensions: CertificationEngineV2Dimension[],
  legacyResult: CertificationEngineResult,
  evidencePack: EvidenceEngineV2Result
): CertificationEngineV2CrossSourceConflict[] {
  const conflicts: CertificationEngineV2CrossSourceConflict[] = [];

  const v2Certified = v2Dimensions.filter(
    (dimension) => dimension.status === "CERTIFIED_INTERNAL_REVIEW_BOUND"
  ).length;
  const v1Blocked = legacyResult.summary.blockedDomainCount;

  if (v2Certified > 0 && v1Blocked > 0) {
    conflicts.push({
      conflictId: "ce-v2-v1-block-vs-v2-certified",
      topic: "Legacy v1 blocked gates while v2 dimensions report certified",
      description: `Canonical v2 stack reports ${v2Certified} certified dimension(s) but the legacy v1 certification engine reports ${v1Blocked} blocked-gate domain(s); review the v1 gate state before treating any v2 certification as resolution.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/certification-engine-v2",
    });
  }

  const v2NotStarted = v2Dimensions.filter(
    (dimension) => dimension.status === "NOT_STARTED"
  ).length;
  if (
    v2NotStarted > 0 &&
    legacyResult.summary.certifiedDomainCount > 0
  ) {
    conflicts.push({
      conflictId: "ce-v2-v1-certified-vs-v2-not-started",
      topic:
        "Legacy v1 certified domains while v2 dimensions report not-started",
      description: `Legacy v1 reports ${legacyResult.summary.certifiedDomainCount} certified domain(s) but the v2 stack reports ${v2NotStarted} not-started dimension(s); review whether the borrower context is incomplete or the v2 scope is restricted.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/certification-engine-v2",
    });
  }

  if (evidencePack.crossSourceConflicts.length > 0) {
    conflicts.push({
      conflictId: "ce-v2-upstream-cross-source-conflicts",
      topic:
        "Upstream Evidence Engine v2 surfaced cross-source conflicts",
      description: `Evidence Engine v2 composition surfaced ${evidencePack.crossSourceConflicts.length} cross-source conflict(s) that propagate into Certification Engine v2 posture; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/certification-engine-v2",
    });
  }

  return conflicts;
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeCertificationEngineV2(
  input: CertificationEngineV2Input = {}
): CertificationEngineV2Result {
  // 1. Compose Evidence Engine v2 (which composes the full canonical
  //    v2 stack at the borrower-context scope plus legacy v1 evidence
  //    engine).
  const evidencePack: EvidenceEngineV2Result =
    composeGovernanceEvidenceEngineV2({
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

  // 2. Compose legacy v1 internal certification engine.
  const legacyResult = evaluateInternalCertification(buildLegacyInput(input));

  // 3. Build v2 governed certification dimensions.
  const requestedV2Dimensions: readonly CertificationEngineV2DimensionId[] =
    input.scope?.v2Dimensions && input.scope.v2Dimensions.length > 0
      ? input.scope.v2Dimensions
      : V2_DIMENSION_IDS;

  const v2Dimensions: CertificationEngineV2Dimension[] = requestedV2Dimensions
    .filter((id) => V2_DIMENSION_IDS.includes(id))
    .map((id) => V2_DIMENSION_BUILDERS[id](evidencePack));

  // 4. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    v2Dimensions,
    legacyResult,
    evidencePack
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

  const summary: CertificationEngineV2Summary = {
    v2DimensionCount: v2Dimensions.length,
    v2CertifiedCount,
    v2PendingCount,
    v2BlockedCount,
    v2NotStartedCount,
    v2OverallReadinessPercent,
    v1DomainCount: legacyResult.domains.length,
    v1CertifiedCount: legacyResult.summary.certifiedDomainCount,
    v1PendingCount: legacyResult.summary.pendingDomainCount,
    v1BlockedCount: legacyResult.summary.blockedDomainCount,
    v1OverallReadinessPercent: legacyResult.summary.overallReadinessPercent,
    crossSourceConflictCount: crossSourceConflicts.length,
    customerTypeCoverageCount: evidencePack.summary.customerTypeCoverageCount,
    capitalProgramCoverageCount:
      evidencePack.summary.capitalProgramCoverageCount,
  };

  const recommendedReviewRoutes = unique([
    "/governance/certification-engine-v2",
    "/governance/evidence-engine-v2",
    "/governance/advanced-intelligence-v2",
    "/governance/lender-workflow-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/governance/certification-engine",
    "/governance/registry-framework",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v2Dimensions,
    legacyDomains: legacyResult.domains,
    crossSourceConflicts,
    legacyBridge: {
      certificationEngineVersion: CERTIFICATION_ENGINE_RUNTIME_VERSION,
      legacyDomainCount: legacyResult.domains.length,
      legacyCertifiedDomainCount: legacyResult.summary.certifiedDomainCount,
      legacyBlockedDomainCount: legacyResult.summary.blockedDomainCount,
      legacyOverallReadinessPercent:
        legacyResult.summary.overallReadinessPercent,
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
      ...CERTIFICATION_ENGINE_V2_DISCLOSURES,
      ...CERTIFICATION_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...CERTIFICATION_ENGINE_V2_PRODUCTION_RESTRICTIONS,
      ...CERTIFICATION_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    internalCertificationOnly: true,
    certificationEngineV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noAutonomousCertification: true,
    noExternalCertification: true,
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

export function certificationEngineV2Lineage(): {
  runtimeVersion: string;
  evidenceEngineV2Version: string;
  advancedIntelligenceV2Version: string;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyCertificationEngineVersion: string;
  legacyV1DomainCount: number;
} {
  return {
    runtimeVersion: CERTIFICATION_ENGINE_V2_RUNTIME_VERSION,
    evidenceEngineV2Version: GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    advancedIntelligenceV2Version: ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    lenderWorkflowV2Version: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyCertificationEngineVersion: CERTIFICATION_ENGINE_RUNTIME_VERSION,
    legacyV1DomainCount: CERTIFICATION_DOMAIN_IDS.length,
  };
}

export const CERTIFICATION_ENGINE_V2_DIMENSION_IDS = V2_DIMENSION_IDS;
