import {
  ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
  AdvancedIntelligenceV2Result,
  composeAdvancedIntelligenceV2,
} from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import {
  EvidencePackInput,
  EvidencePackResult,
  GOVERNANCE_EVIDENCE_DISCLOSURES,
  GOVERNANCE_EVIDENCE_ENGINE_VERSION,
  GOVERNANCE_EVIDENCE_PRODUCTION_RESTRICTIONS,
  composeGovernanceEvidencePack,
} from "@/lib/governance/evidenceEngine";
import { LENDER_WORKFLOW_V2_RUNTIME_VERSION } from "@/lib/lender/workflowV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/platform/authorities/opportunity";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Governance Evidence Engine v2 Runtime
 *
 * The sixth downstream consumer of the Capital Graph (Build 13) and
 * Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15), Financing Pathway Engine v2 (Build 16),
 * Opportunity Discovery v2 (Build 17), Lender Workflow v2
 * (Build 18), and Advanced Intelligence v2 (Build 19). It produces a
 * unified, deterministic, replay-safe, audit-safe, conflict-
 * preserving advisory evidence pack that joins:
 *
 * - The legacy v1 `composeGovernanceEvidencePack` runtime (module
 *   manifests, event contracts, handoff trails, human authority
 *   mapping, audit anchors) preserved as an additive compatibility
 *   bridge.
 * - Three new v2 governed evidence dimensions derived from the
 *   canonical v2 stack:
 *     - `customer_type_evidence` — per-customer-type Customer Type
 *       Registry posture, Capital Graph eligibility, federation
 *       scope, review boundary;
 *     - `capital_program_evidence` — per-program sponsor authority,
 *       category, federation scope, doctrine refs;
 *     - `pathway_v2_evidence` — Revenue Intelligence v2 composition
 *       summary (composed program count, conflict signals, cross-
 *       source conflicts) and Advanced Intelligence v2 domain
 *       coverage.
 * - Cross-source conflict signals when (a) the legacy v1 pack
 *   surfaces a module/handoff/contract that v2 evidence dimensions
 *   cannot match, or (b) v2 produced customer-type-backed evidence
 *   while legacy v1 returned zero modules, or (c) upstream Advanced
 *   Intelligence v2 surfaced cross-source conflicts that propagate
 *   into this pack.
 *
 * Evidence Engine v2 output is evidence-only and review-bound. It
 * does not approve, certify, verify, commit credit, send notices,
 * authorize payment, or grant regulatory or legal reliance.
 *
 * Master Volume Governance:
 * - Vol I: keeps the engine subordinate to constitutional authority;
 *   packs describe accountable governance posture and never replace
 *   it.
 * - Vol II: blocks pack composition from becoming official
 *   certification, public verification, regulatory reliance, lender
 *   commitment, credit decision, environmental clearance, or
 *   payment authorization.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining
 *   governance-evidence-engine-v2-runtime-v0.1.0 →
 *   advanced-intelligence-v2-runtime-v0.1.0 →
 *   lender-workflow-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   governance-evidence-engine-v0.1.0.
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, and replay verification posture; runtime guard
 *   required on the governed API.
 * - Vol IV: routes governed handoffs to Advanced Intelligence v2,
 *   Lender Workflow v2, Opportunity Discovery v2, Financing Pathway
 *   Engine v2, Revenue Intelligence v2, Customer Type Registry,
 *   Capital Graph, legacy v1 evidence engine, customer revenue,
 *   revenue opportunities, borrower opportunities, financing
 *   pathways, lender workflow, certification engine, registry
 *   framework, evidence packets, audit replay, governance, reviews,
 *   and module readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, portability, and source-authority boundaries.
 * - Vol VI: keeps every composed pack behind a public-safe DTO; no
 *   raw borrower / sponsor / property records, no live external
 *   fetch, no source-certainty claim.
 *
 * Safety boundary:
 * - Pack composition is review-bound and evidence-only.
 * - No autonomous customer eligibility / pathway / opportunity /
 *   intelligence / evidence determination, credit decision, lender
 *   commitment, official certification, public verification,
 *   regulatory reliance, tax-credit allocation, environmental
 *   clearance, carbon-credit issuance, payment authorization, or
 *   borrower notice send.
 */

export const GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION =
  "governance-evidence-engine-v2-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type EvidenceEngineV2DimensionId =
  | "customer_type_evidence"
  | "capital_program_evidence"
  | "pathway_v2_evidence";

export type EvidenceEngineV2Input = {
  packIntent?: EvidencePackInput["packIntent"];
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  borrowerIdMasked?: string | null;
  moduleIds?: string[];
  eventTypes?: string[];
  traceRefs?: string[];
  replayRefs?: string[];
  auditAnchorRefs?: string[];
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
    v2Dimensions?: EvidenceEngineV2DimensionId[];
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type EvidenceEngineV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type EvidenceEngineV2Entry = {
  entryId: string;
  dimension: EvidenceEngineV2DimensionId;
  title: string;
  summary: string;
  fields: Array<{
    label: string;
    value: string;
  }>;
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type EvidenceEngineV2DimensionResult = {
  id: EvidenceEngineV2DimensionId;
  label: string;
  entries: EvidenceEngineV2Entry[];
  reviewRoute: string;
};

export type EvidenceEngineV2LegacyBridge = {
  governanceEvidenceEngineVersion: string;
  legacyModuleCount: number;
  legacyEventContractCount: number;
  legacyHandoffCount: number;
  legacyHumanAuthorityCount: number;
  legacyAuditAnchorCount: number;
  advancedIntelligenceV2Version: string;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type EvidenceEngineV2Summary = {
  v2DimensionCount: number;
  v2EntryCount: number;
  legacyModuleCount: number;
  legacyEventContractCount: number;
  legacyHandoffCount: number;
  legacyHumanAuthorityCount: number;
  legacyAuditAnchorCount: number;
  crossSourceConflictCount: number;
  customerTypeCoverageCount: number;
  capitalProgramCoverageCount: number;
  advancedIntelligenceV2DomainCount: number;
};

export type EvidenceEngineV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  packIntent: EvidencePackInput["packIntent"];
  reviewerRole: string | null;
  applicationId: string | null;
  borrowerIdMasked: string | null;
  summary: EvidenceEngineV2Summary;
  v2Dimensions: EvidenceEngineV2DimensionResult[];
  legacyPack: EvidencePackResult;
  crossSourceConflicts: EvidenceEngineV2CrossSourceConflict[];
  legacyBridge: EvidenceEngineV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  evidenceOnly: true;
  evidenceEngineV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noOfficialCertification: true;
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
  "approval",
  "preapproval",
  "autonomous customer eligibility determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "autonomous intelligence determination",
  "autonomous evidence determination",
  "credit decision",
  "underwriting decision",
  "lender commitment",
  "funding guarantee",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "official certification",
  "public verification",
  "guaranteed revenue",
  "official report publication",
  "regulatory reliance",
  "legal reliance",
  "live external action",
  "source certainty",
  "payment authorization",
  "notice send",
] as const;

export const GOVERNANCE_EVIDENCE_ENGINE_V2_DISCLOSURES = [
  "Evidence Engine v2 output is advisory evidence, replay-safe, audit-safe, and conflict-preserving.",
  "Evidence Engine v2 does not authorize approval, autonomous customer eligibility determination, autonomous pathway determination, autonomous opportunity determination, autonomous intelligence determination, autonomous evidence determination, credit decision, underwriting, lender commitment, official certification, public verification, regulatory reliance, or legal reliance.",
  "Evidence Engine v2 does not perform a live external customer, sponsor, source, or property fetch and does not claim source certainty.",
  "When the legacy v1 evidence engine and the canonical v2 stack disagree, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Three v2 governed dimensions (customer-type, capital-program, pathway-v2) inherit upstream Capital Graph + Customer Type + RI v2 doctrine refs and remain review-bound.",
  "Sovereign customer types and sovereign sponsor programs are visible only when named federation participation is authorized.",
  "Human review is required before any composed evidence signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const GOVERNANCE_EVIDENCE_ENGINE_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous intelligence determination",
  "no autonomous evidence determination",
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
  "no official certification",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no live external action",
  "no source certainty",
  "no notice send",
  "no payment authorization",
] as const;

const V2_DIMENSION_IDS: readonly EvidenceEngineV2DimensionId[] = [
  "customer_type_evidence",
  "capital_program_evidence",
  "pathway_v2_evidence",
];

const V2_DIMENSION_LABELS: Record<EvidenceEngineV2DimensionId, string> = {
  customer_type_evidence: "Customer Type Evidence",
  capital_program_evidence: "Capital Program Evidence",
  pathway_v2_evidence: "Pathway v2 Evidence",
};

const V2_DIMENSION_REVIEW_ROUTES: Record<EvidenceEngineV2DimensionId, string> =
  {
    customer_type_evidence: "/governance/customer-types",
    capital_program_evidence: "/governance/capital-graph",
    pathway_v2_evidence: "/governance/revenue-intelligence-v2",
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

function buildCustomerTypeEntries(
  aiV2Result: AdvancedIntelligenceV2Result
): EvidenceEngineV2Entry[] {
  const customerTypeDomain = aiV2Result.v2Domains.find(
    (domain) => domain.id === "customer_type_intelligence"
  );

  if (!customerTypeDomain) {
    return [];
  }

  return customerTypeDomain.insights.map((insight) => ({
    entryId: `ee-v2-customer-${insight.id}`,
    dimension: "customer_type_evidence" as const,
    title: insight.title,
    summary: insight.summary,
    fields: insight.signals.map((signal) => ({
      label: signal.label,
      value: signal.value,
    })),
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_DIMENSION_REVIEW_ROUTES.customer_type_evidence,
    doctrineRefs: [...insight.doctrineRefs],
  }));
}

function buildCapitalProgramEntries(
  aiV2Result: AdvancedIntelligenceV2Result
): EvidenceEngineV2Entry[] {
  const capitalProgramDomain = aiV2Result.v2Domains.find(
    (domain) => domain.id === "capital_program_intelligence"
  );

  if (!capitalProgramDomain) {
    return [];
  }

  return capitalProgramDomain.insights.map((insight) => ({
    entryId: `ee-v2-program-${insight.id}`,
    dimension: "capital_program_evidence" as const,
    title: insight.title,
    summary: insight.summary,
    fields: insight.signals.map((signal) => ({
      label: signal.label,
      value: signal.value,
    })),
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_DIMENSION_REVIEW_ROUTES.capital_program_evidence,
    doctrineRefs: [...insight.doctrineRefs],
  }));
}

function buildPathwayV2Entries(
  aiV2Result: AdvancedIntelligenceV2Result
): EvidenceEngineV2Entry[] {
  const pathwayDomain = aiV2Result.v2Domains.find(
    (domain) => domain.id === "pathway_v2_intelligence"
  );

  if (!pathwayDomain) {
    return [];
  }

  return pathwayDomain.insights.map((insight) => ({
    entryId: `ee-v2-pathway-${insight.id}`,
    dimension: "pathway_v2_evidence" as const,
    title: insight.title,
    summary: insight.summary,
    fields: insight.signals.map((signal) => ({
      label: signal.label,
      value: signal.value,
    })),
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_DIMENSION_REVIEW_ROUTES.pathway_v2_evidence,
    doctrineRefs: [...insight.doctrineRefs],
  }));
}

const V2_ENTRY_BUILDERS: Record<
  EvidenceEngineV2DimensionId,
  (aiV2Result: AdvancedIntelligenceV2Result) => EvidenceEngineV2Entry[]
> = {
  customer_type_evidence: buildCustomerTypeEntries,
  capital_program_evidence: buildCapitalProgramEntries,
  pathway_v2_evidence: buildPathwayV2Entries,
};

function buildLegacyInput(input: EvidenceEngineV2Input): EvidencePackInput {
  return {
    packIntent: input.packIntent,
    applicationId: input.applicationId ?? null,
    borrowerIdMasked: input.borrowerIdMasked ?? null,
    moduleIds: input.moduleIds,
    eventTypes: input.eventTypes,
    traceRefs: input.traceRefs,
    replayRefs: input.replayRefs,
    auditAnchorRefs: input.auditAnchorRefs,
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    metadata: input.metadata ?? null,
  };
}

function buildCrossSourceConflicts(
  aiV2Result: AdvancedIntelligenceV2Result,
  legacyPack: EvidencePackResult,
  v2EntryCount: number
): EvidenceEngineV2CrossSourceConflict[] {
  const conflicts: EvidenceEngineV2CrossSourceConflict[] = [];

  if (v2EntryCount > 0 && legacyPack.summary.moduleCount === 0) {
    conflicts.push({
      conflictId: "ee-v2-legacy-empty-coverage",
      topic:
        "Legacy v1 evidence pack returned zero modules while v2 dimensions returned entries",
      description: `Canonical v2 stack composed ${v2EntryCount} evidence entr(ies) but the legacy v1 evidence engine returned ${legacyPack.summary.moduleCount} module(s); review the v1 pack-intent default module list and pack input.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/evidence-engine-v2",
    });
  }

  if (v2EntryCount === 0 && legacyPack.summary.moduleCount > 0) {
    conflicts.push({
      conflictId: "ee-v2-v2-empty-coverage",
      topic:
        "Canonical v2 stack returned no evidence entries while legacy v1 pack produced modules",
      description: `Legacy v1 evidence engine returned ${legacyPack.summary.moduleCount} module(s) but the v2 stack returned no evidence entries; review whether the borrower context is incomplete or the v2 dimension scope is restricted.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/evidence-engine-v2",
    });
  }

  if (aiV2Result.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "ee-v2-upstream-cross-source-conflicts",
      topic:
        "Upstream Advanced Intelligence v2 surfaced cross-source conflicts",
      description: `Advanced Intelligence v2 composition surfaced ${aiV2Result.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Evidence Engine v2 evidence; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/evidence-engine-v2",
    });
  }

  return conflicts;
}

// =============================================================================
// Runtime composition
// =============================================================================

export function composeGovernanceEvidenceEngineV2(
  input: EvidenceEngineV2Input = {}
): EvidenceEngineV2Result {
  // 1. Compose Advanced Intelligence v2 (which composes the full
  //    canonical v2 stack at the borrower-context scope plus legacy
  //    v1 advanced intelligence).
  const aiV2Result: AdvancedIntelligenceV2Result =
    composeAdvancedIntelligenceV2({
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

  // 2. Compose legacy v1 evidence pack.
  const legacyPack = composeGovernanceEvidencePack(buildLegacyInput(input));

  // 3. Build v2 governed evidence dimensions.
  const requestedV2Dimensions: readonly EvidenceEngineV2DimensionId[] =
    input.scope?.v2Dimensions && input.scope.v2Dimensions.length > 0
      ? input.scope.v2Dimensions
      : V2_DIMENSION_IDS;

  const v2Dimensions: EvidenceEngineV2DimensionResult[] = requestedV2Dimensions
    .filter((id) => V2_DIMENSION_IDS.includes(id))
    .map((id) => {
      const entries = V2_ENTRY_BUILDERS[id](aiV2Result);
      return {
        id,
        label: V2_DIMENSION_LABELS[id],
        entries,
        reviewRoute: V2_DIMENSION_REVIEW_ROUTES[id],
      };
    });

  const v2EntryCount = v2Dimensions.reduce(
    (sum, dimension) => sum + dimension.entries.length,
    0
  );

  // 4. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    aiV2Result,
    legacyPack,
    v2EntryCount
  );

  // 5. Summarize.
  const summary: EvidenceEngineV2Summary = {
    v2DimensionCount: v2Dimensions.length,
    v2EntryCount,
    legacyModuleCount: legacyPack.summary.moduleCount,
    legacyEventContractCount: legacyPack.summary.eventContractCount,
    legacyHandoffCount: legacyPack.summary.handoffCount,
    legacyHumanAuthorityCount: legacyPack.summary.humanAuthorityCount,
    legacyAuditAnchorCount: legacyPack.summary.auditAnchorCount,
    crossSourceConflictCount: crossSourceConflicts.length,
    customerTypeCoverageCount: aiV2Result.summary.customerTypeCoverageCount,
    capitalProgramCoverageCount:
      aiV2Result.summary.capitalProgramCoverageCount,
    advancedIntelligenceV2DomainCount: aiV2Result.summary.v2DomainCount,
  };

  const recommendedReviewRoutes = unique([
    "/governance/evidence-engine-v2",
    "/governance/advanced-intelligence-v2",
    "/governance/lender-workflow-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/governance/evidence-engine",
    "/governance/certification-engine",
    "/governance/registry-framework",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    packIntent: input.packIntent,
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    borrowerIdMasked: input.borrowerIdMasked ?? null,
    summary,
    v2Dimensions,
    legacyPack,
    crossSourceConflicts,
    legacyBridge: {
      governanceEvidenceEngineVersion: GOVERNANCE_EVIDENCE_ENGINE_VERSION,
      legacyModuleCount: legacyPack.summary.moduleCount,
      legacyEventContractCount: legacyPack.summary.eventContractCount,
      legacyHandoffCount: legacyPack.summary.handoffCount,
      legacyHumanAuthorityCount: legacyPack.summary.humanAuthorityCount,
      legacyAuditAnchorCount: legacyPack.summary.auditAnchorCount,
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
      ...GOVERNANCE_EVIDENCE_ENGINE_V2_DISCLOSURES,
      ...GOVERNANCE_EVIDENCE_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...GOVERNANCE_EVIDENCE_ENGINE_V2_PRODUCTION_RESTRICTIONS,
      ...GOVERNANCE_EVIDENCE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    evidenceOnly: true,
    evidenceEngineV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noOfficialCertification: true,
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

export function governanceEvidenceEngineV2Lineage(): {
  runtimeVersion: string;
  advancedIntelligenceV2Version: string;
  lenderWorkflowV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyEvidenceEngineVersion: string;
} {
  return {
    runtimeVersion: GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION,
    advancedIntelligenceV2Version: ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION,
    lenderWorkflowV2Version: LENDER_WORKFLOW_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyEvidenceEngineVersion: GOVERNANCE_EVIDENCE_ENGINE_VERSION,
  };
}

export const GOVERNANCE_EVIDENCE_ENGINE_V2_DIMENSION_IDS = V2_DIMENSION_IDS;
