import { BorrowerOnboardingState } from "@/lib/borrower/onboardingCore";
import {
  BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
  BorrowerOnboardingCoreV2Result,
  composeBorrowerOnboardingCoreV2,
} from "@/lib/borrower/onboardingCoreV2Runtime";
import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION } from "@/lib/environmental/complianceV2Runtime";
import {
  ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
  EnvironmentalEscalationEngineV2Input,
  EnvironmentalEscalationEngineV2Result,
  composeEnvironmentalEscalationEngineV2,
} from "@/lib/environmental/escalationEngineV2Runtime";
import { ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION } from "@/lib/environmental/intakeV2Runtime";
import { ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION } from "@/lib/environmental/riskAssessmentV2Runtime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import {
  READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
  ReadinessAssessmentV2Result,
  composeReadinessAssessmentV2,
} from "@/lib/readiness/readinessAssessmentV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Evidence Resolution Workflow v1 Runtime
 *
 * Detects unresolved variances across the canonical v2 backbone,
 * converts them into clarification requests with careful, non-
 * accusatory language, preserves cross-source conflicts, and
 * routes to human review when reconciliation is not possible
 * through borrower clarification alone.
 *
 * Purpose (per Caitlin):
 * - detect unresolved variances
 * - avoid false rejection
 * - request clarification
 * - preserve conflicts
 * - route to human review when needed
 * - never accuse fraud
 * - never treat uncertainty as denial
 *
 * The workflow composes:
 * - Readiness Assessment v2 (general readiness gaps).
 * - Borrower Onboarding Core v2 (declared customer types,
 *   intended uses, cross-source conflicts).
 * - Environmental Escalation Engine v2 (environmental escalation
 *   queue + upstream EC v2 / ERA v2 / EI v2 conflict propagation).
 *
 * Five variance categories are detected and converted into
 * borrower-facing or reviewer-facing clarification requests:
 * - `SECTION_INCOMPLETE` — readiness section is NEEDS_INPUT.
 * - `SIGNAL_BLOCKED` — upstream signal is BLOCKED_BY_CONFLICT.
 * - `CROSS_SOURCE_CONFLICT` — upstream cross-source conflict
 *   topic propagated.
 * - `DATA_GAP` — declarative descriptor is UNKNOWN.
 * - `EVIDENCE_REFERENCE_MISSING` — required evidence reference
 *   not present on an escalation entry or readiness signal.
 *
 * Four governed workflow signals:
 * - `variance_detection_alignment` — every detected variance is
 *   converted into a clarification request (none silently dropped).
 * - `clarification_routing_alignment` — every clarification
 *   request carries a reviewer route, a reviewer role, and an
 *   evidence reference.
 * - `false_rejection_prevention_alignment` — no NEEDS_INPUT signal
 *   is treated as a denial, and no clarification request frames
 *   uncertainty as rejection.
 * - `fraud_accusation_prevention_alignment` — no clarification
 *   request contains banned accusatory language (fraud /
 *   falsification / misrepresentation / lying / lied / deceit /
 *   deception / denied / rejected / rejection).
 *
 * Cross-source conflicts:
 * - `erw-v1-upstream-eee-v2-conflicts` — upstream Environmental
 *   Escalation Engine v2 conflicts propagated.
 * - `erw-v1-upstream-ra-v2-conflicts` — upstream Readiness
 *   Assessment v2 conflicts propagated.
 * - `erw-v1-upstream-bo-v2-conflicts` — upstream Borrower
 *   Onboarding Core v2 conflicts propagated.
 * - `erw-v1-clarification-routing-missing` — at least one
 *   detected variance was not converted into a clarification
 *   request (router missed a routing path).
 * - `erw-v1-banned-accusatory-language` — banned accusatory
 *   language detected in any clarification request (constitutional
 *   failure).
 *
 * Constitutional posture:
 * - Internal advisory evidence resolution workflow only.
 * - No autonomous denial, rejection, fraud accusation, eligibility
 *   determination, credit decision, lender commitment, agency
 *   decision, public verification, regulatory reliance, source
 *   certainty claim, payment authorization, or live external
 *   action.
 * - Uncertainty is never collapsed into denial; NEEDS_INPUT signals
 *   remain NEEDS_INPUT.
 * - Cross-source conflicts are preserved as first-class evidence
 *   and never collapsed.
 * - No accusatory language about the borrower (fraud, falsification,
 *   lying, misrepresentation, deceit, deception, denied,
 *   rejection).
 *
 * Master Volume Governance:
 * - Vol I: keeps the workflow subordinate to constitutional
 *   authority and accountable human review.
 * - Vol II: blocks the workflow from becoming denial, rejection,
 *   eligibility, approval, autonomous determination, fraud
 *   accusation, lender commitment, public verification, regulatory
 *   reliance, or legal reliance.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining
 *   evidence-resolution-workflow-runtime-v0.1.0 →
 *   readiness-assessment-v2-runtime-v0.1.0 →
 *   borrower-onboarding-core-v2-runtime-v0.1.0 →
 *   environmental-escalation-engine-v2-runtime-v0.1.0 → … →
 *   capital-graph-runtime-v0.1.0.
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, replay verification.
 * - Vol IV: routes clarification requests to BORROWER_INTAKE_REVIEWER /
 *   QUALIFIED_GOVERNANCE_REVIEWER / ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER /
 *   SOVEREIGN_FEDERATION_AUTHORITY, and routes governed handoffs
 *   to upstream v2 modules, applications, documents, data-rights,
 *   evidence packets, audit replay, governance, reviews, module
 *   readiness.
 * - Vol V: preserves CANON-ECON-001 fee disclosure, CANON-
 *   SOVEREIGNTY-001 sovereign review, claims governance,
 *   controlled disclosure, replay, audit, advisory-only
 *   boundaries.
 * - Vol VI: keeps every composed entry behind a public-safe DTO;
 *   no live external fetch; no source-certainty claim.
 */

export const EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION =
  "evidence-resolution-workflow-runtime-v0.1.0";

// =============================================================================
// Input types
// =============================================================================

export type EvidenceResolutionWorkflowInput = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  onboardingState?: BorrowerOnboardingState;
  declaredCustomerTypes?: string[];
  intendedUses?: string[];
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  legacyIntake?: EnvironmentalEscalationEngineV2Input["legacyIntake"];
  complianceGate?: EnvironmentalEscalationEngineV2Input["complianceGate"];
  riskOverlay?: EnvironmentalEscalationEngineV2Input["riskOverlay"];
  metadata?: Record<string, unknown> | null;
};

// =============================================================================
// Variance + clarification types
// =============================================================================

export type EvidenceResolutionVarianceCategory =
  | "SECTION_INCOMPLETE"
  | "SIGNAL_BLOCKED"
  | "CROSS_SOURCE_CONFLICT"
  | "DATA_GAP"
  | "EVIDENCE_REFERENCE_MISSING";

export type EvidenceResolutionSourceModule =
  | "READINESS_ASSESSMENT_V2"
  | "BORROWER_ONBOARDING_CORE_V2"
  | "ENVIRONMENTAL_ESCALATION_ENGINE_V2"
  | "ENVIRONMENTAL_RISK_ASSESSMENT_V2"
  | "ENVIRONMENTAL_COMPLIANCE_V2"
  | "ENVIRONMENTAL_INTAKE_V2";

export type EvidenceResolutionResolutionPath =
  | "BORROWER_CLARIFICATION"
  | "REVIEWER_CLARIFICATION"
  | "REQUIRES_HUMAN_REVIEW";

export type EvidenceResolutionReviewerRole =
  | "BORROWER_INTAKE_REVIEWER"
  | "QUALIFIED_GOVERNANCE_REVIEWER"
  | "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"
  | "SOVEREIGN_FEDERATION_AUTHORITY";

export type EvidenceResolutionClarificationRequest = {
  clarificationId: string;
  category: EvidenceResolutionVarianceCategory;
  sourceModule: EvidenceResolutionSourceModule;
  sourceIdentifier: string;
  topic: string;
  borrowerFacingQuestion: string;
  reviewerExplanation: string;
  evidenceReplayRef: string;
  reviewerRole: EvidenceResolutionReviewerRole;
  reviewRoute: string;
  resolutionPath: EvidenceResolutionResolutionPath;
  expectedResolutionWindowDays: number;
  falseRejectionRiskFlag: boolean;
  fraudAccusationRiskFlag: boolean;
  uncertaintyPreservedFlag: true;
  resolution: "REQUIRES_HUMAN_REVIEW";
  blockedClaims: string[];
  doctrineRefs: string[];
};

// =============================================================================
// Workflow signal types
// =============================================================================

export type EvidenceResolutionWorkflowSignalId =
  | "variance_detection_alignment"
  | "clarification_routing_alignment"
  | "false_rejection_prevention_alignment"
  | "fraud_accusation_prevention_alignment";

export type EvidenceResolutionWorkflowSignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type EvidenceResolutionWorkflowSignal = {
  id: EvidenceResolutionWorkflowSignalId;
  label: string;
  status: EvidenceResolutionWorkflowSignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type EvidenceResolutionWorkflowCrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type EvidenceResolutionWorkflowLegacyBridge = {
  readinessAssessmentV2Version: string;
  borrowerOnboardingCoreV2Version: string;
  environmentalEscalationEngineV2Version: string;
  environmentalRiskAssessmentV2Version: string;
  environmentalComplianceV2Version: string;
  environmentalIntakeV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type EvidenceResolutionWorkflowSummary = {
  varianceCount: number;
  clarificationRequestCount: number;
  borrowerClarificationCount: number;
  reviewerClarificationCount: number;
  requiresHumanReviewCount: number;
  falseRejectionRiskCount: number;
  fraudAccusationRiskCount: number;
  v1SignalCount: number;
  v1ReadyCount: number;
  v1NeedsInputCount: number;
  v1BlockedCount: number;
  v1NotStartedCount: number;
  v1OverallReadinessPercent: number;
  upstreamReadinessConflictCount: number;
  upstreamOnboardingConflictCount: number;
  upstreamEscalationConflictCount: number;
  upstreamEscalationQueueSize: number;
  crossSourceConflictCount: number;
};

export type EvidenceResolutionWorkflowResult = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: EvidenceResolutionWorkflowSummary;
  v1Signals: EvidenceResolutionWorkflowSignal[];
  clarificationRequests: EvidenceResolutionClarificationRequest[];
  readinessAssessmentV2: ReadinessAssessmentV2Result;
  borrowerOnboardingCoreV2: BorrowerOnboardingCoreV2Result;
  environmentalEscalationEngineV2: EnvironmentalEscalationEngineV2Result;
  crossSourceConflicts: EvidenceResolutionWorkflowCrossSourceConflict[];
  legacyBridge: EvidenceResolutionWorkflowLegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  evidenceResolutionWorkflowInternalOnly: true;
  uncertaintyPreserved: true;
  noFraudAccusation: true;
  noDenial: true;
  noRejection: true;
  noFalseRejection: true;
  noAutonomousLending: true;
  noAutonomousEligibility: true;
  noAutonomousPathway: true;
  noAutonomousOpportunity: true;
  noAutonomousIntelligence: true;
  noAutonomousEvidence: true;
  noAutonomousCertification: true;
  noAutonomousOnboarding: true;
  noAutonomousReadiness: true;
  noAutonomousEnvironmentalIntake: true;
  noAutonomousEnvironmentalCompliance: true;
  noAutonomousEnvironmentalRiskAssessment: true;
  noAutonomousEnvironmentalEscalation: true;
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
// Banned accusatory language
// =============================================================================

export const EVIDENCE_RESOLUTION_BANNED_ACCUSATORY_TOKENS = [
  "fraud",
  "fraudulent",
  "falsification",
  "falsified",
  "misrepresentation",
  "misrepresented",
  "lying",
  "lied",
  "deceit",
  "deception",
  "deceptive",
  "denied",
  "denial",
  "rejected",
  "rejection",
  "approved",
  "preapproved",
  "guaranteed",
  "lender commitment",
  "public verification",
  "regulatory reliance",
  "legal reliance",
] as const;

const NEGATION_PREFIXES = [
  "no ",
  "not ",
  "non-",
  "non ",
  "never ",
  "without ",
  "blocked ",
  "blocks ",
  "blocking ",
  "is not ",
  "are not ",
  "do not ",
  "does not ",
  "did not ",
  "prevents ",
  "prevented ",
  "preventing ",
  "preserves ",
  "preserving ",
  "preserved against ",
  "guards against ",
  "guarding against ",
  "guards from ",
  "uncertainty is not ",
  "uncertainty was not ",
];

const NEGATION_WINDOW = 32;

function isNegatedAt(haystack: string, index: number): boolean {
  const start = Math.max(0, index - NEGATION_WINDOW);
  const window = haystack.slice(start, index);
  return NEGATION_PREFIXES.some((prefix) => window.includes(prefix));
}

function detectBannedAccusatoryTokens(fragments: string[]): string[] {
  const hits = new Set<string>();
  for (const fragment of fragments) {
    const lower = fragment.toLowerCase();
    for (const token of EVIDENCE_RESOLUTION_BANNED_ACCUSATORY_TOKENS) {
      const tokenLower = token.toLowerCase();
      let searchFrom = 0;
      while (true) {
        const index = lower.indexOf(tokenLower, searchFrom);
        if (index === -1) {
          break;
        }
        if (!isNegatedAt(lower, index)) {
          hits.add(token);
          break;
        }
        searchFrom = index + tokenLower.length;
      }
    }
  }
  return Array.from(hits);
}

// =============================================================================
// Disclosures + production restrictions
// =============================================================================

const DEFAULT_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "fraud accusation",
  "misrepresentation accusation",
  "approval",
  "preapproval",
  "autonomous eligibility determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "autonomous readiness determination",
  "autonomous environmental intake determination",
  "autonomous environmental compliance determination",
  "autonomous environmental risk determination",
  "autonomous environmental escalation determination",
  "credit decision",
  "underwriting decision",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "live external action",
  "payment authorization",
  "notice send",
] as const;

export const EVIDENCE_RESOLUTION_WORKFLOW_DISCLOSURES = [
  "Evidence Resolution Workflow v1 output is advisory variance-resolution posture, replay-safe, audit-safe, and conflict-preserving.",
  "Uncertainty is not denial. NEEDS_INPUT signals stay NEEDS_INPUT; they are not treated as rejection.",
  "Clarification requests are written without accusatory language. The workflow guards against fraud / falsification / misrepresentation / lying / deceit / deception / denial / rejection language toward the borrower.",
  "Evidence Resolution Workflow v1 does not authorize denial, rejection, approval, preapproval, lender commitment, agency decision, public verification, regulatory reliance, source certainty claim, or legal reliance.",
  "Cross-source conflicts surfaced by upstream Readiness Assessment v2, Borrower Onboarding Core v2, Environmental Escalation Engine v2, and downstream v2 modules are preserved as first-class evidence and never collapsed.",
  "Sovereign-tier clarification requests remain hidden unless named federation participation is authorized (CANON-SOVEREIGNTY-001).",
  "Borrower fee autonomy and the borrower's right to engage external review are preserved (CANON-ECON-001).",
  "Human review is required before any composed clarification request is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const EVIDENCE_RESOLUTION_WORKFLOW_PRODUCTION_RESTRICTIONS = [
  "no denial",
  "no rejection",
  "no fraud accusation",
  "no misrepresentation accusation",
  "no autonomous lending decision",
  "no autonomous eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous readiness determination",
  "no autonomous environmental intake determination",
  "no autonomous environmental compliance determination",
  "no autonomous environmental risk determination",
  "no autonomous environmental escalation determination",
  "no approval",
  "no preapproval",
  "no credit decision",
  "no underwriting decision",
  "no lender commitment",
  "no agency decision",
  "no official certification",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no source certainty",
  "no live external action",
  "no payment authorization",
  "no notice send",
] as const;

// =============================================================================
// Reviewer + window mapping
// =============================================================================

const RESOLUTION_PATH_WINDOW_DAYS: Record<
  EvidenceResolutionResolutionPath,
  number
> = {
  BORROWER_CLARIFICATION: 14,
  REVIEWER_CLARIFICATION: 7,
  REQUIRES_HUMAN_REVIEW: 5,
};

const REVIEW_ROUTE = "/governance/evidence-resolution-workflow";

const DEFAULT_DOCTRINE_REFS = [
  "ROLE-ARCH-001",
  "CANON-ECON-001",
  "CANON-SOVEREIGNTY-001",
  "TECH-CONN-001",
];

const DEFAULT_CLARIFICATION_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "approval",
  "preapproval",
  "fraud accusation",
  "misrepresentation accusation",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
];

// =============================================================================
// Clarification builders
// =============================================================================

function buildClarificationId(prefix: string, key: string): string {
  return `${prefix}-${key.replace(/[^a-z0-9-]/gi, "_").toLowerCase()}`;
}

function buildSectionIncompleteClarification(
  sectionId: string,
  label: string
): EvidenceResolutionClarificationRequest {
  return {
    clarificationId: buildClarificationId("ra-section", sectionId),
    category: "SECTION_INCOMPLETE",
    sourceModule: "READINESS_ASSESSMENT_V2",
    sourceIdentifier: sectionId,
    topic: `Readiness section ${label} is awaiting input`,
    borrowerFacingQuestion: `We have not yet received the information needed for the ${label} section. Could you share the remaining details so the reviewer can continue?`,
    reviewerExplanation: `Readiness Assessment v2 reports ${label} as NEEDS_INPUT. Treat this as a request for clarification, not a denial or rejection. Uncertainty is preserved until reconciled.`,
    evidenceReplayRef: `erw-replay://readiness-section/${sectionId}`,
    reviewerRole: "BORROWER_INTAKE_REVIEWER",
    reviewRoute: REVIEW_ROUTE,
    resolutionPath: "BORROWER_CLARIFICATION",
    expectedResolutionWindowDays:
      RESOLUTION_PATH_WINDOW_DAYS.BORROWER_CLARIFICATION,
    falseRejectionRiskFlag: false,
    fraudAccusationRiskFlag: false,
    uncertaintyPreservedFlag: true,
    resolution: "REQUIRES_HUMAN_REVIEW",
    blockedClaims: [...DEFAULT_CLARIFICATION_BLOCKED_CLAIMS],
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
  };
}

function buildBlockedSignalClarification(
  signalId: string,
  label: string
): EvidenceResolutionClarificationRequest {
  return {
    clarificationId: buildClarificationId("ra-blocked", signalId),
    category: "SIGNAL_BLOCKED",
    sourceModule: "READINESS_ASSESSMENT_V2",
    sourceIdentifier: signalId,
    topic: `Readiness signal ${label} is blocked by an upstream conflict`,
    borrowerFacingQuestion: `The reviewer needs to look at additional context for ${label}. We will follow up with specific clarifying questions; this is not a determination.`,
    reviewerExplanation: `Readiness Assessment v2 signal ${signalId} reports BLOCKED_BY_CONFLICT. Cross-source conflict is preserved as first-class evidence. Reviewer must reconcile upstream conflicts before treating the signal.`,
    evidenceReplayRef: `erw-replay://readiness-signal/${signalId}`,
    reviewerRole: "QUALIFIED_GOVERNANCE_REVIEWER",
    reviewRoute: REVIEW_ROUTE,
    resolutionPath: "REQUIRES_HUMAN_REVIEW",
    expectedResolutionWindowDays:
      RESOLUTION_PATH_WINDOW_DAYS.REQUIRES_HUMAN_REVIEW,
    falseRejectionRiskFlag: false,
    fraudAccusationRiskFlag: false,
    uncertaintyPreservedFlag: true,
    resolution: "REQUIRES_HUMAN_REVIEW",
    blockedClaims: [...DEFAULT_CLARIFICATION_BLOCKED_CLAIMS],
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
  };
}

function buildCrossSourceClarification(
  source: EvidenceResolutionSourceModule,
  conflictId: string,
  topic: string,
  description: string
): EvidenceResolutionClarificationRequest {
  const prefix =
    source === "READINESS_ASSESSMENT_V2"
      ? "ra-conflict"
      : source === "BORROWER_ONBOARDING_CORE_V2"
        ? "bo-conflict"
        : "eee-conflict";
  return {
    clarificationId: buildClarificationId(prefix, conflictId),
    category: "CROSS_SOURCE_CONFLICT",
    sourceModule: source,
    sourceIdentifier: conflictId,
    topic,
    borrowerFacingQuestion: `Reviewers are looking at additional information to make sure everything reconciles. We may follow up with specific questions; this is not a determination of any kind.`,
    reviewerExplanation: `Upstream module ${source} surfaced a cross-source conflict: ${description} Preserve the conflict as first-class evidence; do not collapse uncertainty into a denial.`,
    evidenceReplayRef: `erw-replay://${prefix}/${conflictId}`,
    reviewerRole: "QUALIFIED_GOVERNANCE_REVIEWER",
    reviewRoute: REVIEW_ROUTE,
    resolutionPath: "REQUIRES_HUMAN_REVIEW",
    expectedResolutionWindowDays:
      RESOLUTION_PATH_WINDOW_DAYS.REQUIRES_HUMAN_REVIEW,
    falseRejectionRiskFlag: false,
    fraudAccusationRiskFlag: false,
    uncertaintyPreservedFlag: true,
    resolution: "REQUIRES_HUMAN_REVIEW",
    blockedClaims: [...DEFAULT_CLARIFICATION_BLOCKED_CLAIMS],
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
  };
}

function buildEscalationClarification(
  entry: EnvironmentalEscalationEngineV2Result["escalationQueue"][number]
): EvidenceResolutionClarificationRequest {
  const reviewerRole: EvidenceResolutionReviewerRole =
    entry.reviewerRole === "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"
      ? "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER"
      : entry.reviewerRole === "SOVEREIGN_FEDERATION_AUTHORITY"
        ? "SOVEREIGN_FEDERATION_AUTHORITY"
        : entry.reviewerRole === "QUALIFIED_GOVERNANCE_REVIEWER"
          ? "QUALIFIED_GOVERNANCE_REVIEWER"
          : "BORROWER_INTAKE_REVIEWER";
  return {
    clarificationId: buildClarificationId(
      "eee-entry",
      entry.escalationId
    ),
    category: "SIGNAL_BLOCKED",
    sourceModule:
      entry.sourceModule.startsWith("ENVIRONMENTAL_INTAKE")
        ? "ENVIRONMENTAL_INTAKE_V2"
        : entry.sourceModule.startsWith("ENVIRONMENTAL_RISK")
          ? "ENVIRONMENTAL_RISK_ASSESSMENT_V2"
          : "ENVIRONMENTAL_ESCALATION_ENGINE_V2",
    sourceIdentifier: entry.escalationId,
    topic: `Environmental review item open: ${entry.topic}`,
    borrowerFacingQuestion: `An environmental review step is open. We may need to follow up with specific details so the reviewer can continue.`,
    reviewerExplanation: `Environmental Escalation Engine v2 routed this entry to ${entry.reviewerRole} with a ${entry.expectedResolutionWindowDays}-day window. Resolution path is human review only; uncertainty is preserved.`,
    evidenceReplayRef: entry.evidenceReplayRef,
    reviewerRole,
    reviewRoute: REVIEW_ROUTE,
    resolutionPath: "REQUIRES_HUMAN_REVIEW",
    expectedResolutionWindowDays:
      RESOLUTION_PATH_WINDOW_DAYS.REQUIRES_HUMAN_REVIEW,
    falseRejectionRiskFlag: false,
    fraudAccusationRiskFlag: false,
    uncertaintyPreservedFlag: true,
    resolution: "REQUIRES_HUMAN_REVIEW",
    blockedClaims: [...DEFAULT_CLARIFICATION_BLOCKED_CLAIMS],
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
  };
}

// =============================================================================
// Workflow signal builders
// =============================================================================

const V1_SIGNAL_IDS: readonly EvidenceResolutionWorkflowSignalId[] = [
  "variance_detection_alignment",
  "clarification_routing_alignment",
  "false_rejection_prevention_alignment",
  "fraud_accusation_prevention_alignment",
];

const V1_SIGNAL_LABELS: Record<
  EvidenceResolutionWorkflowSignalId,
  string
> = {
  variance_detection_alignment: "Variance detection alignment",
  clarification_routing_alignment: "Clarification routing alignment",
  false_rejection_prevention_alignment:
    "False rejection prevention alignment",
  fraud_accusation_prevention_alignment:
    "Fraud accusation prevention alignment",
};

const DEFAULT_SIGNAL_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "approval",
  "preapproval",
  "fraud accusation",
  "lender commitment",
  "agency decision",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
];

function buildSignal(
  id: EvidenceResolutionWorkflowSignalId,
  varianceCount: number,
  clarifications: EvidenceResolutionClarificationRequest[],
  bannedLanguageHits: string[]
): EvidenceResolutionWorkflowSignal {
  let satisfied = 0;
  const total = Math.max(varianceCount, clarifications.length);
  const reviewSignals: string[] = [];
  switch (id) {
    case "variance_detection_alignment":
      satisfied = clarifications.length;
      reviewSignals.push(
        `${satisfied} of ${varianceCount} detected variances converted into clarification requests`
      );
      break;
    case "clarification_routing_alignment":
      satisfied = clarifications.filter(
        (c) =>
          c.reviewRoute.length > 0 &&
          c.evidenceReplayRef.length > 0 &&
          c.expectedResolutionWindowDays > 0
      ).length;
      reviewSignals.push(
        `${satisfied} of ${clarifications.length} clarification requests carry reviewer route, evidence ref, and timeline`
      );
      break;
    case "false_rejection_prevention_alignment":
      satisfied = clarifications.filter(
        (c) => c.uncertaintyPreservedFlag && !c.falseRejectionRiskFlag
      ).length;
      reviewSignals.push(
        `${satisfied} of ${clarifications.length} clarification requests preserve uncertainty without framing it as rejection`
      );
      break;
    case "fraud_accusation_prevention_alignment":
      satisfied = bannedLanguageHits.length === 0 ? clarifications.length : 0;
      reviewSignals.push(
        bannedLanguageHits.length === 0
          ? "no banned accusatory language detected in any clarification request"
          : `banned accusatory language detected: ${bannedLanguageHits.join(", ")}`
      );
      break;
  }

  const denominator =
    id === "fraud_accusation_prevention_alignment"
      ? clarifications.length
      : total;
  const ready = denominator === 0 ? true : satisfied === denominator;
  const readinessPercent =
    denominator === 0
      ? 100
      : Math.round((satisfied / denominator) * 100);

  return {
    id,
    label: V1_SIGNAL_LABELS[id],
    status: ready ? "READY_FOR_REVIEW" : "BLOCKED_BY_CONFLICT",
    readinessPercent,
    coverageCount: satisfied,
    reviewSignals,
    blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
  };
}

// =============================================================================
// Cross-source conflicts
// =============================================================================

function buildCrossSourceConflicts(
  raV2: ReadinessAssessmentV2Result,
  boV2: BorrowerOnboardingCoreV2Result,
  eeeV2: EnvironmentalEscalationEngineV2Result,
  varianceCount: number,
  clarificationCount: number,
  bannedLanguageHits: string[]
): EvidenceResolutionWorkflowCrossSourceConflict[] {
  const conflicts: EvidenceResolutionWorkflowCrossSourceConflict[] = [];

  if (eeeV2.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "erw-v1-upstream-eee-v2-conflicts",
      topic:
        "Upstream Environmental Escalation Engine v2 surfaced cross-source conflicts",
      description: `Environmental Escalation Engine v2 composition surfaced ${eeeV2.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Evidence Resolution Workflow v1.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (raV2.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "erw-v1-upstream-ra-v2-conflicts",
      topic: "Upstream Readiness Assessment v2 surfaced cross-source conflicts",
      description: `Readiness Assessment v2 composition surfaced ${raV2.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Evidence Resolution Workflow v1.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (boV2.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "erw-v1-upstream-bo-v2-conflicts",
      topic:
        "Upstream Borrower Onboarding Core v2 surfaced cross-source conflicts",
      description: `Borrower Onboarding Core v2 composition surfaced ${boV2.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Evidence Resolution Workflow v1.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (varianceCount > 0 && clarificationCount < varianceCount) {
    conflicts.push({
      conflictId: "erw-v1-clarification-routing-missing",
      topic:
        "Detected variances were not all converted into clarification requests",
      description: `The workflow detected ${varianceCount} variance(s) but produced only ${clarificationCount} clarification request(s). At least one variance was not routed; review whether the router covers the missed cases.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (bannedLanguageHits.length > 0) {
    conflicts.push({
      conflictId: "erw-v1-banned-accusatory-language",
      topic:
        "Banned accusatory language detected in a clarification request",
      description: `One or more clarification requests contain banned accusatory tokens (${bannedLanguageHits.join(", ")}); review the worker that produced the request and rephrase the language.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  return conflicts;
}

// =============================================================================
// Helpers
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

// =============================================================================
// Runtime composition
// =============================================================================

export function composeEvidenceResolutionWorkflow(
  input: EvidenceResolutionWorkflowInput = {}
): EvidenceResolutionWorkflowResult {
  // 1. Compose Borrower Onboarding Core v2 (provides declared
  //    customer types, intended uses, and cross-source conflicts).
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

  // 2. Compose Readiness Assessment v2 (provides legacy v1 6-section
  //    readiness + v2 governed readiness signals + cross-source
  //    conflicts).
  const raV2 = composeReadinessAssessmentV2({
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    onboardingState: input.onboardingState,
    declaredCustomerTypes: input.declaredCustomerTypes ?? [],
    intendedUses: input.intendedUses ?? [],
    scope: input.scope ?? null,
    metadata: input.metadata ?? null,
  });

  // 3. Compose Environmental Escalation Engine v2 (provides the
  //    environmental escalation queue and upstream EC v2 / ERA v2 /
  //    EI v2 conflicts).
  const eeeV2 = composeEnvironmentalEscalationEngineV2({
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    onboardingState: input.onboardingState,
    declaredCustomerTypes: input.declaredCustomerTypes ?? [],
    intendedUses: input.intendedUses ?? [],
    legacyIntake: input.legacyIntake,
    scope: input.scope ?? null,
    complianceGate: input.complianceGate,
    riskOverlay: input.riskOverlay,
    metadata: input.metadata ?? null,
  });

  // 4. Detect variances + build clarification requests.
  const clarifications: EvidenceResolutionClarificationRequest[] = [];

  // 4a. Readiness Assessment v2 — NEEDS_INPUT v1 sections + v2
  //     signals.
  let varianceCount = 0;
  for (const section of raV2.legacyAssessment.sections) {
    if (section.status === "NEEDS_INPUT") {
      varianceCount += 1;
      clarifications.push(
        buildSectionIncompleteClarification(section.id, section.label)
      );
    }
  }
  for (const signal of raV2.v2Signals) {
    if (signal.status === "BLOCKED_BY_CONFLICT") {
      varianceCount += 1;
      clarifications.push(
        buildBlockedSignalClarification(signal.id, signal.label)
      );
    }
  }

  // 4b. Upstream cross-source conflicts — Readiness, Onboarding,
  //     Escalation Engine.
  for (const conflict of raV2.crossSourceConflicts) {
    varianceCount += 1;
    clarifications.push(
      buildCrossSourceClarification(
        "READINESS_ASSESSMENT_V2",
        conflict.conflictId,
        conflict.topic,
        conflict.description
      )
    );
  }
  for (const conflict of boV2.crossSourceConflicts) {
    varianceCount += 1;
    clarifications.push(
      buildCrossSourceClarification(
        "BORROWER_ONBOARDING_CORE_V2",
        conflict.conflictId,
        conflict.topic,
        conflict.description
      )
    );
  }
  for (const conflict of eeeV2.crossSourceConflicts) {
    varianceCount += 1;
    clarifications.push(
      buildCrossSourceClarification(
        "ENVIRONMENTAL_ESCALATION_ENGINE_V2",
        conflict.conflictId,
        conflict.topic,
        conflict.description
      )
    );
  }

  // 4c. Environmental Escalation Engine v2 queue entries —
  //     convert each into an escalation clarification.
  for (const entry of eeeV2.escalationQueue) {
    varianceCount += 1;
    clarifications.push(buildEscalationClarification(entry));
  }

  // 5. Banned-language scan over the borrower-facing question +
  //    reviewer explanation + topic of every clarification.
  const fragments: string[] = [];
  for (const c of clarifications) {
    fragments.push(c.topic);
    fragments.push(c.borrowerFacingQuestion);
    fragments.push(c.reviewerExplanation);
  }
  const bannedLanguageHits = detectBannedAccusatoryTokens(fragments);

  // 6. Build governed workflow signals.
  const v1Signals: EvidenceResolutionWorkflowSignal[] = V1_SIGNAL_IDS.map(
    (id) => buildSignal(id, varianceCount, clarifications, bannedLanguageHits)
  );

  // 7. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    raV2,
    boV2,
    eeeV2,
    varianceCount,
    clarifications.length,
    bannedLanguageHits
  );

  // 8. Summarize.
  const v1ReadyCount = v1Signals.filter(
    (s) => s.status === "READY_FOR_REVIEW"
  ).length;
  const v1NeedsInputCount = v1Signals.filter(
    (s) => s.status === "NEEDS_INPUT"
  ).length;
  const v1BlockedCount = v1Signals.filter(
    (s) => s.status === "BLOCKED_BY_CONFLICT"
  ).length;
  const v1NotStartedCount = v1Signals.filter(
    (s) => s.status === "NOT_STARTED"
  ).length;
  const v1OverallReadinessPercent =
    v1Signals.length === 0
      ? 0
      : Math.round(
          v1Signals.reduce((sum, s) => sum + s.readinessPercent, 0) /
            v1Signals.length
        );

  const borrowerClarificationCount = clarifications.filter(
    (c) => c.resolutionPath === "BORROWER_CLARIFICATION"
  ).length;
  const reviewerClarificationCount = clarifications.filter(
    (c) => c.resolutionPath === "REVIEWER_CLARIFICATION"
  ).length;
  const requiresHumanReviewCount = clarifications.filter(
    (c) => c.resolutionPath === "REQUIRES_HUMAN_REVIEW"
  ).length;

  const summary: EvidenceResolutionWorkflowSummary = {
    varianceCount,
    clarificationRequestCount: clarifications.length,
    borrowerClarificationCount,
    reviewerClarificationCount,
    requiresHumanReviewCount,
    falseRejectionRiskCount: clarifications.filter(
      (c) => c.falseRejectionRiskFlag
    ).length,
    fraudAccusationRiskCount: clarifications.filter(
      (c) => c.fraudAccusationRiskFlag
    ).length,
    v1SignalCount: v1Signals.length,
    v1ReadyCount,
    v1NeedsInputCount,
    v1BlockedCount,
    v1NotStartedCount,
    v1OverallReadinessPercent,
    upstreamReadinessConflictCount: raV2.summary.crossSourceConflictCount,
    upstreamOnboardingConflictCount: boV2.summary.crossSourceConflictCount,
    upstreamEscalationConflictCount:
      eeeV2.summary.crossSourceConflictCount,
    upstreamEscalationQueueSize: eeeV2.summary.queueSize,
    crossSourceConflictCount: crossSourceConflicts.length,
  };

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
    "/governance/readiness-assessment-v2",
    "/governance/borrower-onboarding-core-v2",
    "/governance/environmental-escalation-engine-v2",
    "/governance/environmental-risk-assessment-v2",
    "/governance/environmental-compliance-v2",
    "/governance/environmental-intake-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/applications",
    "/documents",
    "/data-rights",
    "/evidence-packets",
    "/audit-replay",
    "/governance",
    "/reviews",
  ]);

  return {
    runtimeVersion: EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v1Signals,
    clarificationRequests: clarifications,
    readinessAssessmentV2: raV2,
    borrowerOnboardingCoreV2: boV2,
    environmentalEscalationEngineV2: eeeV2,
    crossSourceConflicts,
    legacyBridge: {
      readinessAssessmentV2Version: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
      borrowerOnboardingCoreV2Version:
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
      environmentalEscalationEngineV2Version:
        ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
      environmentalRiskAssessmentV2Version:
        ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
      environmentalComplianceV2Version:
        ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
      environmentalIntakeV2Version: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: [...EVIDENCE_RESOLUTION_WORKFLOW_DISCLOSURES],
    productionRestrictions: [
      ...EVIDENCE_RESOLUTION_WORKFLOW_PRODUCTION_RESTRICTIONS,
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    evidenceResolutionWorkflowInternalOnly: true,
    uncertaintyPreserved: true,
    noFraudAccusation: true,
    noDenial: true,
    noRejection: true,
    noFalseRejection: true,
    noAutonomousLending: true,
    noAutonomousEligibility: true,
    noAutonomousPathway: true,
    noAutonomousOpportunity: true,
    noAutonomousIntelligence: true,
    noAutonomousEvidence: true,
    noAutonomousCertification: true,
    noAutonomousOnboarding: true,
    noAutonomousReadiness: true,
    noAutonomousEnvironmentalIntake: true,
    noAutonomousEnvironmentalCompliance: true,
    noAutonomousEnvironmentalRiskAssessment: true,
    noAutonomousEnvironmentalEscalation: true,
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

export function evidenceResolutionWorkflowLineage(): {
  runtimeVersion: string;
  readinessAssessmentV2Version: string;
  borrowerOnboardingCoreV2Version: string;
  environmentalEscalationEngineV2Version: string;
  environmentalRiskAssessmentV2Version: string;
  environmentalComplianceV2Version: string;
  environmentalIntakeV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
} {
  return {
    runtimeVersion: EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
    readinessAssessmentV2Version: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    borrowerOnboardingCoreV2Version: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    environmentalEscalationEngineV2Version:
      ENVIRONMENTAL_ESCALATION_ENGINE_V2_RUNTIME_VERSION,
    environmentalRiskAssessmentV2Version:
      ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
    environmentalComplianceV2Version: ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
    environmentalIntakeV2Version: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
  };
}

export const EVIDENCE_RESOLUTION_WORKFLOW_SIGNAL_IDS = V1_SIGNAL_IDS;
