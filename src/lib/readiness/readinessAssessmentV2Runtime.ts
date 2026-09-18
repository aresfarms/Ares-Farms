import {
  BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
  BorrowerOnboardingCoreV2Result,
  composeBorrowerOnboardingCoreV2,
} from "@/lib/borrower/onboardingCoreV2Runtime";
import { BorrowerOnboardingState } from "@/lib/borrower/onboardingCore";
import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/platform/authorities/opportunity";
import {
  READINESS_ASSESSMENT_RUNTIME_VERSION,
  READINESS_DISCLOSURES,
  READINESS_PRODUCTION_RESTRICTIONS,
  ReadinessAssessmentInput,
  ReadinessAssessmentResult,
  ReadinessSection,
  assessBorrowerReadiness,
} from "@/lib/readiness/readinessAssessment";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Borrower Readiness Assessment v2 Runtime
 *
 * The eleventh downstream consumer of the Capital Graph (Build 13)
 * and Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15), Financing Pathway Engine v2
 * (Build 16), Opportunity Discovery v2 (Build 17), and Borrower
 * Onboarding Core v2 (Build 24). It composes a unified,
 * deterministic, replay-safe, audit-safe, conflict-preserving
 * advisory readiness posture that joins:
 *
 * - The legacy v1 `assessBorrowerReadiness` runtime (6 sections:
 *   borrower_intake, financing_pathway, documents, environmental,
 *   opportunity_discovery, data_rights) preserved as an additive
 *   compatibility bridge.
 * - Borrower Onboarding Core v2 (which composes OD v2 + FPE v2 +
 *   RI v2 + Customer Type + Capital Graph + legacy v1 borrower
 *   onboarding workflow). The v2 onboarding pack provides matched
 *   customer profiles, Capital Graph-backed grant card counts, and
 *   legacy discovery section counts that inform readiness signals.
 * - Three new v2 governed readiness signals:
 *     - `customer_type_readiness` — matched customer profile count
 *       vs declared customer type count,
 *     - `capital_graph_readiness` — Capital Graph-backed grant
 *       card coverage,
 *     - `pathway_v2_readiness` — upstream cross-source conflict
 *       propagation.
 * - Cross-source conflict signals when v1 reports a section
 *   READY_FOR_REVIEW but v2 stack shows no Capital Graph coverage,
 *   when v1 overall readiness is high but v2 customer-type
 *   matching is empty, or when upstream BO v2 surfaced
 *   cross-source conflicts.
 *
 * Borrower Readiness Assessment v2 output is operational borrower
 * guidance only. It does not approve, deny, certify, commit credit,
 * or claim any external verification / public reliance / regulatory
 * clearance. Live external borrower communication remains gated by
 * the borrower notice modules.
 *
 * Master Volume Governance:
 * - Vol I: keeps readiness guidance subordinate to constitutional
 *   authority and accountable human review.
 * - Vol II: blocks readiness from becoming approval, eligibility,
 *   underwriting, official certification, public verification,
 *   regulatory clearance, or legal reliance.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining
 *   readiness-assessment-v2-runtime-v0.1.0 →
 *   borrower-onboarding-core-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   readiness-assessment-runtime-v0.1.0.
 * - Vol III-B: runtime evidence with classification,
 *   observability, explainability, replay verification posture.
 * - Vol IV: routes governed handoffs to Borrower Onboarding Core
 *   v2, Opportunity Discovery v2, Financing Pathway Engine v2,
 *   Revenue Intelligence v2, Customer Type Registry, Capital
 *   Graph, portal-borrower-readiness, applications, documents,
 *   data-rights, evidence packets, audit replay, governance,
 *   reviews, and module readiness.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, portability, advisory-only boundaries.
 * - Vol VI: keeps every composed entry behind a public-safe DTO;
 *   no live external fetch; no source-certainty claim.
 *
 * Safety boundary:
 * - Internal advisory readiness posture only.
 * - No autonomous customer eligibility / pathway / opportunity /
 *   intelligence / evidence / certification / onboarding /
 *   readiness determination, credit decision, lender commitment,
 *   program approval, tax-credit allocation, environmental
 *   clearance, carbon-credit issuance, public verification, source
 *   certainty claim, payment authorization, live external action,
 *   notice send, or legal reliance.
 */

export const READINESS_ASSESSMENT_V2_RUNTIME_VERSION =
  "readiness-assessment-v2-runtime-v0.1.0";

export type ReadinessAssessmentV2SignalId =
  | "customer_type_readiness"
  | "capital_graph_readiness"
  | "pathway_v2_readiness";

export type ReadinessAssessmentV2SignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type ReadinessAssessmentV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  onboardingState?: BorrowerOnboardingState;
  declaredCustomerTypes?: string[];
  intendedUses?: string[];
  legacy?: ReadinessAssessmentInput;
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type ReadinessAssessmentV2Signal = {
  id: ReadinessAssessmentV2SignalId;
  label: string;
  status: ReadinessAssessmentV2SignalStatus;
  readinessPercent: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type ReadinessAssessmentV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type ReadinessAssessmentV2LegacyBridge = {
  readinessAssessmentVersion: string;
  legacyOverallReadinessPercent: number;
  legacySectionCount: number;
  legacyHandoffCount: number;
  legacyMissingItemCount: number;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type ReadinessAssessmentV2Summary = {
  v2SignalCount: number;
  v2ReadyCount: number;
  v2NeedsInputCount: number;
  v2BlockedCount: number;
  v2NotStartedCount: number;
  v2OverallReadinessPercent: number;
  v1OverallReadinessPercent: number;
  v1SectionCount: number;
  v1ReadyForReviewSectionCount: number;
  v1NeedsInputSectionCount: number;
  crossSourceConflictCount: number;
  declaredCustomerTypeCount: number;
  matchedCustomerProfileCount: number;
  totalGrantCardCount: number;
};

export type ReadinessAssessmentV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: ReadinessAssessmentV2Summary;
  v2Signals: ReadinessAssessmentV2Signal[];
  legacyAssessment: ReadinessAssessmentResult;
  borrowerOnboardingCoreV2: BorrowerOnboardingCoreV2Result;
  crossSourceConflicts: ReadinessAssessmentV2CrossSourceConflict[];
  legacyBridge: ReadinessAssessmentV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  readinessAssessmentV2InternalOnly: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noAutonomousCertification: true;
  noAutonomousOnboarding: true;
  noAutonomousReadiness: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noLiveExternalAction: true;
  noSourceCertainty: true;
  noNoticeSend: true;
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
  "autonomous certification determination",
  "autonomous onboarding determination",
  "autonomous readiness determination",
  "credit decision",
  "underwriting decision",
  "lender commitment",
  "funding guarantee",
  "program approval",
  "tax-credit allocation",
  "environmental clearance",
  "carbon-credit issuance",
  "guaranteed revenue",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "live external action",
  "source certainty",
  "payment authorization",
  "notice send",
] as const;

export const READINESS_ASSESSMENT_V2_DISCLOSURES = [
  "Readiness Assessment v2 output is advisory borrower guidance, replay-safe, audit-safe, and conflict-preserving.",
  "Readiness Assessment v2 does not authorize approval, autonomous customer eligibility / pathway / opportunity / intelligence / evidence / certification / onboarding / readiness determination, credit decision, underwriting decision, lender commitment, funding guarantee, program approval, tax-credit allocation, environmental clearance, carbon-credit issuance, official certification, public verification, regulatory reliance, or legal reliance.",
  "Readiness Assessment v2 does not perform a live external customer, sponsor, source, or property fetch and does not claim source certainty.",
  "Readiness Assessment v2 does not send borrower notices; notice delivery is gated by the borrower notice modules.",
  "When the legacy v1 readiness assessment reports a READY_FOR_REVIEW section but the canonical v2 stack returns no Capital Graph coverage, the cross-source conflict is preserved as first-class evidence and never collapsed.",
  "Three v2 governed signals (customer-type readiness, capital-graph readiness, pathway-v2 readiness) inherit upstream BO v2 + OD v2 + RI v2 doctrine refs and remain review-bound.",
  "Sovereign customer types are visible only when named federation participation is authorized.",
  "Human review is required before any composed readiness signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const READINESS_ASSESSMENT_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous intelligence determination",
  "no autonomous evidence determination",
  "no autonomous certification determination",
  "no autonomous onboarding determination",
  "no autonomous readiness determination",
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

const V2_SIGNAL_IDS: readonly ReadinessAssessmentV2SignalId[] = [
  "customer_type_readiness",
  "capital_graph_readiness",
  "pathway_v2_readiness",
];

const V2_SIGNAL_LABELS: Record<ReadinessAssessmentV2SignalId, string> = {
  customer_type_readiness: "Customer Type Readiness",
  capital_graph_readiness: "Capital Graph Readiness",
  pathway_v2_readiness: "Pathway v2 Readiness",
};

const V2_SIGNAL_REVIEW_ROUTES: Record<ReadinessAssessmentV2SignalId, string> = {
  customer_type_readiness: "/governance/customer-types",
  capital_graph_readiness: "/governance/capital-graph",
  pathway_v2_readiness: "/governance/financing-pathway-engine-v2",
};

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

function buildCustomerTypeReadinessSignal(
  boV2: BorrowerOnboardingCoreV2Result
): ReadinessAssessmentV2Signal {
  const declared = boV2.summary.declaredCustomerTypeCount;
  const matched = boV2.summary.matchedCustomerProfileCount;
  const reviewSignals: string[] = [];

  let status: ReadinessAssessmentV2SignalStatus;
  let readinessPercent: number;

  if (declared === 0) {
    status = "NOT_STARTED";
    readinessPercent = 0;
    reviewSignals.push("no declared customer types");
  } else if (matched === 0) {
    status = "BLOCKED_BY_CONFLICT";
    readinessPercent = 0;
    reviewSignals.push(
      "declared customer types did not match any registered customer type"
    );
  } else {
    status = matched >= declared ? "READY_FOR_REVIEW" : "NEEDS_INPUT";
    readinessPercent = Math.min(
      100,
      Math.round((matched / Math.max(declared, 1)) * 100)
    );
  }

  return {
    id: "customer_type_readiness",
    label: V2_SIGNAL_LABELS.customer_type_readiness,
    status,
    readinessPercent,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES.customer_type_readiness,
    doctrineRefs: [
      "Vol I §Customer Type Review Boundary",
      "Vol III §Customer Type Composition Determinism",
      "Vol V §Customer Type Claims Governance",
    ],
  };
}

function buildCapitalGraphReadinessSignal(
  boV2: BorrowerOnboardingCoreV2Result
): ReadinessAssessmentV2Signal {
  const grantCards = boV2.summary.totalGrantCardCount;
  const reviewSignals: string[] = [];

  let status: ReadinessAssessmentV2SignalStatus;
  let readinessPercent: number;

  if (grantCards === 0) {
    status = "NEEDS_INPUT";
    readinessPercent = 0;
    reviewSignals.push("no Capital Graph-backed grant cards available");
  } else if (grantCards < 5) {
    status = "NEEDS_INPUT";
    readinessPercent = 50;
    reviewSignals.push(
      `${grantCards} Capital Graph-backed grant card(s) — limited coverage`
    );
  } else {
    status = "READY_FOR_REVIEW";
    readinessPercent = 100;
  }

  return {
    id: "capital_graph_readiness",
    label: V2_SIGNAL_LABELS.capital_graph_readiness,
    status,
    readinessPercent,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES.capital_graph_readiness,
    doctrineRefs: [
      "Vol I §Capital Graph Sponsor Authority",
      "Vol III §Capital Graph Composition Determinism",
      "Vol V §Capital Graph Claims Governance",
    ],
  };
}

function buildPathwayV2ReadinessSignal(
  boV2: BorrowerOnboardingCoreV2Result
): ReadinessAssessmentV2Signal {
  const reviewSignals: string[] = [];
  const conflicts = boV2.summary.crossSourceConflictCount;
  const grantCards = boV2.summary.totalGrantCardCount;

  let status: ReadinessAssessmentV2SignalStatus;
  let readinessPercent: number;

  if (conflicts > 0) {
    reviewSignals.push(
      `${conflicts} upstream Borrower Onboarding v2 cross-source conflict(s) propagated`
    );
  }

  if (grantCards === 0) {
    status = "NOT_STARTED";
    readinessPercent = 0;
  } else if (conflicts > 0) {
    status = "NEEDS_INPUT";
    readinessPercent = 50;
  } else {
    status = "READY_FOR_REVIEW";
    readinessPercent = 100;
  }

  return {
    id: "pathway_v2_readiness",
    label: V2_SIGNAL_LABELS.pathway_v2_readiness,
    status,
    readinessPercent,
    reviewSignals,
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES.pathway_v2_readiness,
    doctrineRefs: [
      "Vol III §Pathway v2 Composition Determinism",
      "Vol IV §Pathway v2 Review Route",
      "Vol V §Pathway v2 Claims Governance",
    ],
  };
}

const V2_SIGNAL_BUILDERS: Record<
  ReadinessAssessmentV2SignalId,
  (boV2: BorrowerOnboardingCoreV2Result) => ReadinessAssessmentV2Signal
> = {
  customer_type_readiness: buildCustomerTypeReadinessSignal,
  capital_graph_readiness: buildCapitalGraphReadinessSignal,
  pathway_v2_readiness: buildPathwayV2ReadinessSignal,
};

function buildLegacyInput(
  input: ReadinessAssessmentV2Input
): ReadinessAssessmentInput {
  const legacy = input.legacy ?? {};
  return {
    borrowerId: legacy.borrowerId ?? null,
    applicationId: legacy.applicationId ?? input.applicationId ?? null,
    userId: legacy.userId ?? input.userId ?? null,
    onboarding: legacy.onboarding ?? input.onboardingState ?? null,
    financing: legacy.financing ?? null,
    documents: legacy.documents ?? null,
    environmental: legacy.environmental ?? null,
    discovery: legacy.discovery ?? null,
    dataRights: legacy.dataRights ?? null,
    metadata: legacy.metadata ?? input.metadata ?? null,
  };
}

function buildCrossSourceConflicts(
  legacyResult: ReadinessAssessmentResult,
  boV2: BorrowerOnboardingCoreV2Result,
  v2Signals: ReadinessAssessmentV2Signal[]
): ReadinessAssessmentV2CrossSourceConflict[] {
  const conflicts: ReadinessAssessmentV2CrossSourceConflict[] = [];

  const legacyReadyForReview = legacyResult.sections.filter(
    (section: ReadinessSection) => section.status === "READY_FOR_REVIEW"
  ).length;

  if (
    legacyReadyForReview > 0 &&
    boV2.summary.totalGrantCardCount === 0
  ) {
    conflicts.push({
      conflictId: "ra-v2-legacy-ready-no-grants",
      topic:
        "Legacy v1 readiness reports READY_FOR_REVIEW sections while v2 stack returned no Capital Graph coverage",
      description: `Legacy v1 readiness reports ${legacyReadyForReview} READY_FOR_REVIEW section(s), but the canonical v2 stack returned zero Capital Graph-backed grant cards. Review whether declared customer types or borrower context need to be expanded for Capital Graph composition.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/readiness-assessment-v2",
    });
  }

  if (
    legacyResult.overallReadinessPercent >= 80 &&
    boV2.summary.matchedCustomerProfileCount === 0
  ) {
    conflicts.push({
      conflictId: "ra-v2-legacy-high-readiness-no-matches",
      topic:
        "Legacy v1 reports high overall readiness while v2 stack returned no matched customer profiles",
      description: `Legacy v1 readiness reports ${legacyResult.overallReadinessPercent}% overall readiness, but the canonical v2 stack returned no matched customer profiles. Review whether declared customer types are missing or whether v2 registry coverage requires additional eligibility tokens.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/readiness-assessment-v2",
    });
  }

  if (boV2.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "ra-v2-upstream-bo-v2-conflicts",
      topic:
        "Upstream Borrower Onboarding Core v2 surfaced cross-source conflicts",
      description: `Borrower Onboarding Core v2 composition surfaced ${boV2.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Readiness Assessment v2 evidence; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/readiness-assessment-v2",
    });
  }

  const v2Blocked = v2Signals.filter(
    (signal) => signal.status === "BLOCKED_BY_CONFLICT"
  ).length;
  if (v2Blocked > 0) {
    conflicts.push({
      conflictId: "ra-v2-blocked-signals",
      topic:
        "v2 readiness signals report blocked-by-conflict status",
      description: `${v2Blocked} v2 readiness signal(s) report BLOCKED_BY_CONFLICT status; review whether declared customer types resolve to registered archetypes or whether v2 registry coverage needs to be expanded.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/readiness-assessment-v2",
    });
  }

  return conflicts;
}

export function composeReadinessAssessmentV2(
  input: ReadinessAssessmentV2Input = {}
): ReadinessAssessmentV2Result {
  // 1. Compose Borrower Onboarding Core v2 (the full canonical v2
  //    stack at the borrower-context scope plus legacy v1 borrower
  //    onboarding workflow).
  const boV2 = composeBorrowerOnboardingCoreV2({
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    onboardingState: input.onboardingState,
    declaredCustomerTypes: input.declaredCustomerTypes ?? [],
    intendedUses: input.intendedUses ?? [],
    scope: input.scope ?? null,
    metadata: input.metadata ?? null,
  });

  // 2. Compose legacy v1 readiness assessment.
  const legacyResult = assessBorrowerReadiness(buildLegacyInput(input));

  // 3. Build v2 governed readiness signals.
  const v2Signals: ReadinessAssessmentV2Signal[] = V2_SIGNAL_IDS.map((id) =>
    V2_SIGNAL_BUILDERS[id](boV2)
  );

  // 4. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    legacyResult,
    boV2,
    v2Signals
  );

  // 5. Summarize.
  const v2ReadyCount = v2Signals.filter(
    (signal) => signal.status === "READY_FOR_REVIEW"
  ).length;
  const v2NeedsInputCount = v2Signals.filter(
    (signal) => signal.status === "NEEDS_INPUT"
  ).length;
  const v2BlockedCount = v2Signals.filter(
    (signal) => signal.status === "BLOCKED_BY_CONFLICT"
  ).length;
  const v2NotStartedCount = v2Signals.filter(
    (signal) => signal.status === "NOT_STARTED"
  ).length;
  const v2OverallReadinessPercent =
    v2Signals.length === 0
      ? 0
      : Math.round(
          v2Signals.reduce(
            (sum, signal) => sum + signal.readinessPercent,
            0
          ) / v2Signals.length
        );

  const summary: ReadinessAssessmentV2Summary = {
    v2SignalCount: v2Signals.length,
    v2ReadyCount,
    v2NeedsInputCount,
    v2BlockedCount,
    v2NotStartedCount,
    v2OverallReadinessPercent,
    v1OverallReadinessPercent: legacyResult.overallReadinessPercent,
    v1SectionCount: legacyResult.sections.length,
    v1ReadyForReviewSectionCount: legacyResult.sections.filter(
      (section: ReadinessSection) => section.status === "READY_FOR_REVIEW"
    ).length,
    v1NeedsInputSectionCount: legacyResult.sections.filter(
      (section: ReadinessSection) => section.status === "NEEDS_INPUT"
    ).length,
    crossSourceConflictCount: crossSourceConflicts.length,
    declaredCustomerTypeCount: boV2.summary.declaredCustomerTypeCount,
    matchedCustomerProfileCount: boV2.summary.matchedCustomerProfileCount,
    totalGrantCardCount: boV2.summary.totalGrantCardCount,
  };

  const recommendedReviewRoutes = unique([
    "/governance/readiness-assessment-v2",
    "/governance/borrower-onboarding-core-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/portal/borrower/readiness",
    "/portal/borrower/onboarding",
    "/portal/borrower/opportunities",
    "/financing-pathways",
    "/readiness",
    "/governance",
    "/reviews",
    "/evidence-packets",
    "/audit-replay",
  ]);

  return {
    runtimeVersion: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v2Signals,
    legacyAssessment: legacyResult,
    borrowerOnboardingCoreV2: boV2,
    crossSourceConflicts,
    legacyBridge: {
      readinessAssessmentVersion: READINESS_ASSESSMENT_RUNTIME_VERSION,
      legacyOverallReadinessPercent: legacyResult.overallReadinessPercent,
      legacySectionCount: legacyResult.sections.length,
      legacyHandoffCount: legacyResult.handoffs.length,
      legacyMissingItemCount: legacyResult.missingItems.length,
      borrowerOnboardingCoreV2Version:
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: unique([
      ...READINESS_ASSESSMENT_V2_DISCLOSURES,
      ...READINESS_DISCLOSURES,
    ]),
    productionRestrictions: unique([
      ...READINESS_ASSESSMENT_V2_PRODUCTION_RESTRICTIONS,
      ...READINESS_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    readinessAssessmentV2InternalOnly: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noAutonomousCertification: true,
    noAutonomousOnboarding: true,
    noAutonomousReadiness: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    noNoticeSend: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function readinessAssessmentV2Lineage(): {
  runtimeVersion: string;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyReadinessAssessmentVersion: string;
} {
  return {
    runtimeVersion: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    borrowerOnboardingCoreV2Version: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version:
      FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyReadinessAssessmentVersion: READINESS_ASSESSMENT_RUNTIME_VERSION,
  };
}

export const READINESS_ASSESSMENT_V2_SIGNAL_IDS = V2_SIGNAL_IDS;
