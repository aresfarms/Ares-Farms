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
import {
  EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
  EvidenceResolutionWorkflowResult,
  composeEvidenceResolutionWorkflow,
} from "@/lib/evidence-resolution/evidenceResolutionWorkflowRuntime";
import {
  READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
  ReadinessAssessmentV2Result,
  composeReadinessAssessmentV2,
} from "@/lib/readiness/readinessAssessmentV2Runtime";

/**
 * Document Evidence Reconciliation Workflow v1 Runtime (Build 32)
 *
 * Goal: identify missing, conflicting, incomplete, or unreconciled
 * borrower-provided documents and convert each variance into a
 * respectful clarification request, third-party-verification
 * recommendation, or human-review escalation — never rejection,
 * accusation, or false conclusion.
 *
 * Purpose (per Caitlin): prevent Furlong from saying "no" merely
 * because documents do not reconcile yet. The system should say:
 * "These items do not currently line up. Here is what appears
 * inconsistent, why it matters, and what additional information
 * may resolve it."
 *
 * This is Build 32. It is a sibling of Build 31 (Evidence
 * Resolution Workflow v1, general variance detection across the v2
 * backbone). Build 31 focuses on declared / signal-level variance.
 * Build 32 focuses on financial DOCUMENT pair-wise reconciliation
 * (tax return vs operating cash flow, P&L vs tax return revenue,
 * rent rolls, property ownership records, environmental report
 * appendices).
 *
 * Eight resolution outputs:
 * - `CONSISTENT` — pair reconciles within tolerance.
 * - `INCOMPLETE` — one side missing; request the missing document.
 * - `UNRESOLVED_VARIANCE` — values differ but are explainable
 *   (e.g. depreciation, deductions); request clarification.
 * - `MATERIAL_CONFLICT` — values differ beyond explainable
 *   tolerance; request clarification + flag for human review.
 * - `CLARIFICATION_REQUESTED` — additional context is required
 *   (e.g. referenced appendix not provided).
 * - `THIRD_PARTY_VERIFICATION_RECOMMENDED` — borrower-declared fact
 *   is inconsistent with an external-records-class reference (e.g.
 *   property ownership); recommend third-party verification.
 * - `HUMAN_REVIEW_REQUIRED` — variance cannot be reconciled through
 *   borrower clarification alone.
 * - `BLOCKED_BY_CONFLICT` — upstream cross-source conflict
 *   propagated; reconciliation cannot proceed.
 *
 * Four governed reconciliation signals:
 * - `reconciliation_explanation_alignment` — every variance has a
 *   plain-English explanation.
 * - `reconciliation_evidence_alignment` — every variance carries a
 *   replay-safe evidence reference.
 * - `reconciliation_clarification_alignment` — every non-consistent
 *   variance carries a request for clarification or third-party
 *   verification or escalation; nothing collapses to denial.
 * - `reconciliation_material_conflict_routing_alignment` — every
 *   MATERIAL_CONFLICT routes to HUMAN_REVIEW.
 *
 * Five cross-source conflict classes:
 * - `der-v1-upstream-evidence-resolution-conflicts` — upstream
 *   Evidence Resolution Workflow v1 conflicts propagated.
 * - `der-v1-upstream-readiness-conflicts` — upstream RA v2
 *   conflicts propagated.
 * - `der-v1-upstream-borrower-onboarding-conflicts` — upstream BO
 *   v2 conflicts propagated.
 * - `der-v1-material-conflict-without-human-review` — MATERIAL_
 *   CONFLICT pair did not produce a HUMAN_REVIEW_REQUIRED routing
 *   (constitutional failure).
 * - `der-v1-banned-accusatory-language` — banned accusatory token
 *   detected in any reconciliation output (constitutional
 *   failure).
 *
 * Hard rules:
 * - Never accuse fraud.
 * - Never say a document is fake.
 * - Never say the borrower is lying.
 * - Never make a legal conclusion.
 * - Never make an underwriting decision.
 * - Never convert unreconciled evidence into automatic denial.
 * - Never hide conflicting evidence.
 * - Always ask for clarification when additional context could
 *   resolve the variance.
 * - Always preserve conflict lineage for replay.
 * - Always distinguish "missing," "inconsistent," "unverified,"
 *   and "material conflict."
 *
 * Master Volume Governance:
 * - Vol I: keeps reconciliation subordinate to constitutional
 *   authority and accountable human review.
 * - Vol II: blocks the workflow from becoming denial, fraud
 *   accusation, lender commitment, agency decision, official
 *   certification, public verification, regulatory reliance, or
 *   legal reliance.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining the runtime through Evidence
 *   Resolution Workflow v1, Readiness Assessment v2, Borrower
 *   Onboarding Core v2, and the full canonical v2 backbone.
 * - Vol III-B: runtime evidence with classification,
 *   observability, explainability, replay verification.
 * - Vol IV: routes clarification requests to BORROWER_INTAKE_REVIEWER /
 *   QUALIFIED_GOVERNANCE_REVIEWER / DOCUMENT_VERIFICATION_REVIEWER /
 *   THIRD_PARTY_RECORDS_AUTHORITY.
 * - Vol V: preserves claims governance, controlled disclosure,
 *   replay, audit, advisory-only boundaries.
 * - Vol VI: keeps every reconciliation output behind a public-safe
 *   DTO; no live external fetch; no source-certainty claim.
 */

export const DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION =
  "document-evidence-reconciliation-runtime-v0.1.0";

// =============================================================================
// Input types — borrower-provided document references
// =============================================================================

export type DocumentReferenceId = string;

export type FinancialPeriod = {
  year: number;
  // Quarter is optional; when omitted, treat as annual.
  quarter?: 1 | 2 | 3 | 4 | null;
};

export type TaxReturnReference = {
  documentRef: DocumentReferenceId;
  period: FinancialPeriod;
  reportedGrossRevenue?: number | null;
  reportedNetIncome?: number | null;
  declaredDepreciation?: number | null;
  declaredDeductions?: number | null;
};

export type ProfitAndLossReference = {
  documentRef: DocumentReferenceId;
  period: FinancialPeriod;
  reportedRevenue?: number | null;
  reportedOperatingExpenses?: number | null;
  reportedOperatingCashFlow?: number | null;
};

export type RentRollReference = {
  documentRef: DocumentReferenceId;
  period: FinancialPeriod;
  declaredUnits?: number | null;
  declaredOccupiedUnits?: number | null;
  declaredMonthlyGrossRent?: number | null;
};

export type PropertyOwnershipReference = {
  borrowerDeclaredOwner: string;
  externalRecordsOwner?: string | null;
  externalRecordsSource?: string | null;
  parcelOrAddress?: string | null;
};

export type EnvironmentalReportReference = {
  documentRef: DocumentReferenceId;
  reportType?: string | null;
  referencedAppendixIds?: string[];
  providedAppendixIds?: string[];
};

export type DocumentEvidenceReconciliationInput = {
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
  taxReturns?: TaxReturnReference[];
  profitAndLossStatements?: ProfitAndLossReference[];
  rentRolls?: RentRollReference[];
  propertyOwnership?: PropertyOwnershipReference;
  environmentalReports?: EnvironmentalReportReference[];
  borrowerExplanationNote?: string | null;
  metadata?: Record<string, unknown> | null;
};

// =============================================================================
// Resolution outputs
// =============================================================================

export type DocumentReconciliationResolution =
  | "CONSISTENT"
  | "INCOMPLETE"
  | "UNRESOLVED_VARIANCE"
  | "MATERIAL_CONFLICT"
  | "CLARIFICATION_REQUESTED"
  | "THIRD_PARTY_VERIFICATION_RECOMMENDED"
  | "HUMAN_REVIEW_REQUIRED"
  | "BLOCKED_BY_CONFLICT";

export type DocumentReconciliationCategory =
  | "TAX_RETURN_VS_OPERATING_CASH_FLOW"
  | "PROFIT_AND_LOSS_REVENUE_VS_TAX_RETURN_REVENUE"
  | "RENT_ROLL_PRESENCE"
  | "PROPERTY_OWNERSHIP_RECORD"
  | "ENVIRONMENTAL_REPORT_APPENDIX_REFERENCE"
  | "BORROWER_PROVIDED_DOCUMENT_CONFLICT"
  | "FULLY_CONSISTENT_PACKET";

export type DocumentReconciliationReviewerRole =
  | "BORROWER_INTAKE_REVIEWER"
  | "QUALIFIED_GOVERNANCE_REVIEWER"
  | "DOCUMENT_VERIFICATION_REVIEWER"
  | "THIRD_PARTY_RECORDS_AUTHORITY";

export type DocumentReconciliationClassificationLevel =
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED";

export type DocumentReconciliationFinding = {
  findingId: string;
  category: DocumentReconciliationCategory;
  resolutionStatus: DocumentReconciliationResolution;
  plainEnglishExplanation: string;
  conflictingOrMissingItems: string[];
  whyItMatters: string;
  whatAdditionalInformationMayResolveIt: string;
  nextRecommendedAction: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  classificationLevel: DocumentReconciliationClassificationLevel;
  redactionRequired: boolean;
  humanReviewFlag: boolean;
  reviewerRole: DocumentReconciliationReviewerRole;
  advisoryDisclaimer: string;
  fraudAccusationRiskFlag: boolean;
  documentFakenessAccusationRiskFlag: boolean;
  underwritingDecisionRiskFlag: boolean;
  legalConclusionRiskFlag: boolean;
  uncertaintyPreservedFlag: true;
  conflictLineagePreservedFlag: true;
  reviewRoute: string;
  doctrineRefs: string[];
  blockedClaims: string[];
};

// =============================================================================
// Signal types
// =============================================================================

export type DocumentReconciliationSignalId =
  | "reconciliation_explanation_alignment"
  | "reconciliation_evidence_alignment"
  | "reconciliation_clarification_alignment"
  | "reconciliation_material_conflict_routing_alignment";

export type DocumentReconciliationSignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type DocumentReconciliationSignal = {
  id: DocumentReconciliationSignalId;
  label: string;
  status: DocumentReconciliationSignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type DocumentReconciliationCrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type DocumentReconciliationLegacyBridge = {
  evidenceResolutionWorkflowVersion: string;
  readinessAssessmentV2Version: string;
  borrowerOnboardingCoreV2Version: string;
};

export type DocumentReconciliationSummary = {
  findingCount: number;
  consistentCount: number;
  incompleteCount: number;
  unresolvedVarianceCount: number;
  materialConflictCount: number;
  clarificationRequestedCount: number;
  thirdPartyVerificationRecommendedCount: number;
  humanReviewRequiredCount: number;
  blockedByConflictCount: number;
  fraudAccusationRiskCount: number;
  documentFakenessAccusationRiskCount: number;
  underwritingDecisionRiskCount: number;
  legalConclusionRiskCount: number;
  v1SignalCount: number;
  v1ReadyCount: number;
  v1NeedsInputCount: number;
  v1BlockedCount: number;
  v1NotStartedCount: number;
  v1OverallReadinessPercent: number;
  upstreamEvidenceResolutionConflictCount: number;
  upstreamReadinessConflictCount: number;
  upstreamOnboardingConflictCount: number;
  crossSourceConflictCount: number;
};

export type DocumentEvidenceReconciliationResult = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: DocumentReconciliationSummary;
  v1Signals: DocumentReconciliationSignal[];
  findings: DocumentReconciliationFinding[];
  evidenceResolutionWorkflow: EvidenceResolutionWorkflowResult;
  readinessAssessmentV2: ReadinessAssessmentV2Result;
  borrowerOnboardingCoreV2: BorrowerOnboardingCoreV2Result;
  crossSourceConflicts: DocumentReconciliationCrossSourceConflict[];
  legacyBridge: DocumentReconciliationLegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  documentEvidenceReconciliationInternalOnly: true;
  uncertaintyPreserved: true;
  conflictLineagePreserved: true;
  noFraudAccusation: true;
  noDocumentFakenessAccusation: true;
  noBorrowerLyingAccusation: true;
  noLegalConclusion: true;
  noUnderwritingDecision: true;
  noAutomaticDenial: true;
  noConflictHiding: true;
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
// Banned-accusatory token registry (negation-aware detection)
// =============================================================================

export const DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS = [
  "fraud",
  "fraudulent",
  "fake document",
  "fake documents",
  "fake invoice",
  "fake statement",
  "forged",
  "forgery",
  "falsified",
  "falsification",
  "misrepresented",
  "misrepresentation",
  "lying",
  "lied",
  "liar",
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
  "underwriting decision",
  "credit decision",
  "legal conclusion",
  "regulatory determination",
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

const NEGATION_WINDOW = 40;

function isNegatedAt(haystack: string, index: number): boolean {
  const start = Math.max(0, index - NEGATION_WINDOW);
  const window = haystack.slice(start, index);
  return NEGATION_PREFIXES.some((prefix) => window.includes(prefix));
}

function detectBannedAccusatoryTokens(fragments: string[]): string[] {
  const hits = new Set<string>();
  for (const fragment of fragments) {
    const lower = fragment.toLowerCase();
    for (const token of DOCUMENT_RECONCILIATION_BANNED_ACCUSATORY_TOKENS) {
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
  "document fakeness accusation",
  "borrower lying accusation",
  "misrepresentation accusation",
  "legal conclusion",
  "regulatory determination",
  "underwriting decision",
  "credit decision",
  "approval",
  "preapproval",
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

export const DOCUMENT_EVIDENCE_RECONCILIATION_DISCLOSURES = [
  "Document Evidence Reconciliation v1 output is advisory document-reconciliation posture, replay-safe, audit-safe, and conflict-preserving.",
  "Unreconciled evidence is not denial. Documents that do not yet line up are surfaced as clarification requests, third-party verification recommendations, or human review escalations — never as rejection or accusation.",
  "Document Evidence Reconciliation v1 does not accuse fraud, does not say any document is fake, does not say the borrower is lying, does not make a legal conclusion, and does not make an underwriting decision.",
  "Findings distinguish between missing (INCOMPLETE), inconsistent (UNRESOLVED_VARIANCE), unverified (THIRD_PARTY_VERIFICATION_RECOMMENDED), and material conflict (MATERIAL_CONFLICT). Each carries a plain-English explanation and a request for the additional information that may resolve the variance.",
  "Cross-source conflicts surfaced by upstream Evidence Resolution Workflow v1, Readiness Assessment v2, and Borrower Onboarding Core v2 are preserved as first-class evidence and never collapsed.",
  "Document Evidence Reconciliation v1 does not authorize external escalation notification, ticket creation, paging, autonomous resolution, approval, preapproval, lender commitment, agency decision, public verification, regulatory reliance, source certainty claim, or legal reliance.",
  "Material conflicts route to HUMAN_REVIEW_REQUIRED. The workflow never converts unreconciled evidence into automatic denial.",
  "Conflict lineage is preserved for replay; nothing is hidden.",
  "Human review is required before any composed finding is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS = [
  "no denial",
  "no automatic denial",
  "no rejection",
  "no fraud accusation",
  "no document fakeness accusation",
  "no borrower lying accusation",
  "no misrepresentation accusation",
  "no legal conclusion",
  "no underwriting decision",
  "no credit decision",
  "no approval",
  "no preapproval",
  "no lender commitment",
  "no agency decision",
  "no official certification",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no autonomous lending decision",
  "no autonomous eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous readiness determination",
  "no autonomous environmental intake determination",
  "no autonomous environmental compliance determination",
  "no autonomous environmental risk determination",
  "no autonomous environmental escalation determination",
  "no autonomous evidence-resolution determination",
  "no autonomous document-reconciliation determination",
  "no source certainty",
  "no live external action",
  "no payment authorization",
  "no notice send",
  "no conflict hiding",
] as const;

// =============================================================================
// Pair-wise reconciliation rules
// =============================================================================

const TAX_VS_OCF_TOLERANCE_PCT = 0.25;
const TAX_VS_PL_REVENUE_TOLERANCE_PCT = 0.10;

const REVIEW_ROUTE = "/governance/document-evidence-reconciliation";

const DEFAULT_DOCTRINE_REFS = [
  "ROLE-ARCH-001",
  "CANON-ECON-001",
  "CANON-SOVEREIGNTY-001",
  "TECH-CONN-001",
];

const DEFAULT_FINDING_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "fraud accusation",
  "document fakeness accusation",
  "borrower lying accusation",
  "approval",
  "preapproval",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "legal conclusion",
  "underwriting decision",
];

const ADVISORY_DISCLAIMER =
  "Advisory document-reconciliation posture only. This is not a denial, a rejection, a fraud accusation, a credit decision, a legal conclusion, an underwriting determination, an agency decision, a lender commitment, a public verification, a regulatory reliance, or a source-certainty claim. Human review is required before any finding is treated as a decision.";

function buildFindingId(prefix: string, key: string): string {
  return `${prefix}-${key.replace(/[^a-z0-9-]/gi, "_").toLowerCase()}`;
}

function pctDiff(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  const denom = Math.max(Math.abs(a), Math.abs(b));
  if (denom === 0) return 0;
  return Math.abs(a - b) / denom;
}

function periodKey(p: FinancialPeriod): string {
  return `${p.year}${p.quarter ? `-q${p.quarter}` : ""}`;
}

// -----------------------------------------------------------------------------
// Rule 1 — Tax return income vs operating cash flow
// -----------------------------------------------------------------------------

function reconcileTaxReturnVsOperatingCashFlow(
  taxReturns: TaxReturnReference[],
  profitAndLossStatements: ProfitAndLossReference[]
): DocumentReconciliationFinding[] {
  const findings: DocumentReconciliationFinding[] = [];
  for (const tax of taxReturns) {
    const matchingPL = profitAndLossStatements.find(
      (pl) => periodKey(pl.period) === periodKey(tax.period)
    );
    if (!matchingPL) {
      findings.push({
        findingId: buildFindingId(
          "tax-vs-ocf-incomplete",
          `${tax.documentRef}-${periodKey(tax.period)}`
        ),
        category: "TAX_RETURN_VS_OPERATING_CASH_FLOW",
        resolutionStatus: "INCOMPLETE",
        plainEnglishExplanation: `We received the tax return for ${periodKey(
          tax.period
        )} but have not yet received a matching P&L or operating cash flow statement.`,
        conflictingOrMissingItems: [
          `profit-and-loss statement for ${periodKey(tax.period)}`,
        ],
        whyItMatters:
          "Reviewers compare reported net income against operating cash flow to understand whether non-cash items (depreciation, deductions) explain the difference. Without the matching P&L, reconciliation cannot proceed.",
        whatAdditionalInformationMayResolveIt: `Please share the profit-and-loss statement for ${periodKey(
          tax.period
        )} so the reviewer can compare it against the tax return.`,
        nextRecommendedAction:
          "Borrower may upload the matching P&L; reviewer routes to BORROWER_INTAKE_REVIEWER until received.",
        evidenceRefs: [tax.documentRef],
        sourceRefs: ["tax-return"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "BORROWER_INTAKE_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
      continue;
    }
    const reportedNetIncome = tax.reportedNetIncome ?? null;
    const reportedOCF = matchingPL.reportedOperatingCashFlow ?? null;
    if (reportedNetIncome === null || reportedOCF === null) {
      findings.push({
        findingId: buildFindingId(
          "tax-vs-ocf-incomplete-values",
          `${tax.documentRef}-${matchingPL.documentRef}`
        ),
        category: "TAX_RETURN_VS_OPERATING_CASH_FLOW",
        resolutionStatus: "INCOMPLETE",
        plainEnglishExplanation: `We have both documents for ${periodKey(
          tax.period
        )} but at least one of the reported figures (net income or operating cash flow) is not yet declared.`,
        conflictingOrMissingItems: [
          reportedNetIncome === null ? "reported net income" : null,
          reportedOCF === null ? "reported operating cash flow" : null,
        ].filter((v): v is string => v !== null),
        whyItMatters:
          "Both values are needed before the reviewer can compare them.",
        whatAdditionalInformationMayResolveIt:
          "Please confirm the missing figure(s) so the reviewer can complete the comparison.",
        nextRecommendedAction:
          "Borrower may confirm the missing value(s); reviewer routes to BORROWER_INTAKE_REVIEWER until received.",
        evidenceRefs: [tax.documentRef, matchingPL.documentRef],
        sourceRefs: ["tax-return", "profit-and-loss"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "BORROWER_INTAKE_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
      continue;
    }
    const diff = pctDiff(reportedNetIncome, reportedOCF);
    const depreciationOrDeductionsDeclared =
      (tax.declaredDepreciation ?? 0) > 0 ||
      (tax.declaredDeductions ?? 0) > 0;
    if (diff <= TAX_VS_OCF_TOLERANCE_PCT) {
      findings.push({
        findingId: buildFindingId(
          "tax-vs-ocf-consistent",
          `${tax.documentRef}-${matchingPL.documentRef}`
        ),
        category: "TAX_RETURN_VS_OPERATING_CASH_FLOW",
        resolutionStatus: "CONSISTENT",
        plainEnglishExplanation: `Tax return net income and the matching operating cash flow for ${periodKey(
          tax.period
        )} reconcile within tolerance.`,
        conflictingOrMissingItems: [],
        whyItMatters:
          "Consistency between tax return income and operating cash flow supports replay-safe review.",
        whatAdditionalInformationMayResolveIt:
          "No additional information requested at this time.",
        nextRecommendedAction:
          "Reviewer may proceed with the comparison; no clarification required.",
        evidenceRefs: [tax.documentRef, matchingPL.documentRef],
        sourceRefs: ["tax-return", "profit-and-loss"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "DOCUMENT_VERIFICATION_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    } else if (depreciationOrDeductionsDeclared) {
      findings.push({
        findingId: buildFindingId(
          "tax-vs-ocf-unresolved-variance",
          `${tax.documentRef}-${matchingPL.documentRef}`
        ),
        category: "TAX_RETURN_VS_OPERATING_CASH_FLOW",
        resolutionStatus: "UNRESOLVED_VARIANCE",
        plainEnglishExplanation: `Tax return net income and operating cash flow for ${periodKey(
          tax.period
        )} differ by more than ${Math.round(
          TAX_VS_OCF_TOLERANCE_PCT * 100
        )}%. The borrower declared depreciation and/or deductions on the tax return; non-cash items frequently explain this kind of difference.`,
        conflictingOrMissingItems: [
          `net income ${reportedNetIncome}`,
          `operating cash flow ${reportedOCF}`,
        ],
        whyItMatters:
          "Reviewers need to verify that depreciation and deductions account for the gap before treating the tax return and operating cash flow as reconciled.",
        whatAdditionalInformationMayResolveIt:
          "A short borrower-provided explanation that ties declared depreciation/deductions to the cash-flow difference would resolve the variance. Reviewer may also request supporting schedules (e.g. Form 4562 depreciation schedule).",
        nextRecommendedAction:
          "Request clarification from the borrower with a non-accusatory framing. Reviewer routes to BORROWER_INTAKE_REVIEWER for clarification.",
        evidenceRefs: [tax.documentRef, matchingPL.documentRef],
        sourceRefs: ["tax-return", "profit-and-loss"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "BORROWER_INTAKE_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    } else {
      findings.push({
        findingId: buildFindingId(
          "tax-vs-ocf-material-conflict",
          `${tax.documentRef}-${matchingPL.documentRef}`
        ),
        category: "TAX_RETURN_VS_OPERATING_CASH_FLOW",
        resolutionStatus: "MATERIAL_CONFLICT",
        plainEnglishExplanation: `Tax return net income and operating cash flow for ${periodKey(
          tax.period
        )} differ by more than ${Math.round(
          TAX_VS_OCF_TOLERANCE_PCT * 100
        )}%, and no depreciation or deductions were declared on the tax return to explain the gap.`,
        conflictingOrMissingItems: [
          `net income ${reportedNetIncome}`,
          `operating cash flow ${reportedOCF}`,
        ],
        whyItMatters:
          "Material differences require qualified-governance review to determine whether additional context (e.g. an off-cycle event) reconciles the figures.",
        whatAdditionalInformationMayResolveIt:
          "A reviewer-led conversation with the borrower and any relevant supporting documentation (e.g. one-time-event statement, restated cash-flow schedule) may resolve the variance.",
        nextRecommendedAction:
          "Route to HUMAN_REVIEW_REQUIRED with a non-accusatory framing; never convert to denial.",
        evidenceRefs: [tax.documentRef, matchingPL.documentRef],
        sourceRefs: ["tax-return", "profit-and-loss"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: true,
        reviewerRole: "QUALIFIED_GOVERNANCE_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  return findings;
}

// -----------------------------------------------------------------------------
// Rule 2 — P&L revenue vs tax return revenue
// -----------------------------------------------------------------------------

function reconcilePLRevenueVsTaxReturnRevenue(
  taxReturns: TaxReturnReference[],
  profitAndLossStatements: ProfitAndLossReference[]
): DocumentReconciliationFinding[] {
  const findings: DocumentReconciliationFinding[] = [];
  for (const tax of taxReturns) {
    const matchingPL = profitAndLossStatements.find(
      (pl) => periodKey(pl.period) === periodKey(tax.period)
    );
    if (!matchingPL) {
      continue;
    }
    const taxRev = tax.reportedGrossRevenue ?? null;
    const plRev = matchingPL.reportedRevenue ?? null;
    if (taxRev === null || plRev === null) {
      findings.push({
        findingId: buildFindingId(
          "pl-vs-tax-revenue-incomplete",
          `${tax.documentRef}-${matchingPL.documentRef}`
        ),
        category: "PROFIT_AND_LOSS_REVENUE_VS_TAX_RETURN_REVENUE",
        resolutionStatus: "INCOMPLETE",
        plainEnglishExplanation: `For ${periodKey(
          tax.period
        )}, at least one revenue figure (tax return gross revenue or P&L reported revenue) is not yet declared.`,
        conflictingOrMissingItems: [
          taxRev === null ? "tax return gross revenue" : null,
          plRev === null ? "P&L reported revenue" : null,
        ].filter((v): v is string => v !== null),
        whyItMatters:
          "Both revenue figures are needed before a reviewer can compare them.",
        whatAdditionalInformationMayResolveIt:
          "Please share the missing revenue figure so the reviewer can complete the comparison.",
        nextRecommendedAction:
          "Borrower may confirm the missing value(s); reviewer routes to BORROWER_INTAKE_REVIEWER.",
        evidenceRefs: [tax.documentRef, matchingPL.documentRef],
        sourceRefs: ["tax-return", "profit-and-loss"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "BORROWER_INTAKE_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
      continue;
    }
    const diff = pctDiff(taxRev, plRev);
    if (diff <= TAX_VS_PL_REVENUE_TOLERANCE_PCT) {
      findings.push({
        findingId: buildFindingId(
          "pl-vs-tax-revenue-consistent",
          `${tax.documentRef}-${matchingPL.documentRef}`
        ),
        category: "PROFIT_AND_LOSS_REVENUE_VS_TAX_RETURN_REVENUE",
        resolutionStatus: "CONSISTENT",
        plainEnglishExplanation: `Tax return gross revenue and P&L reported revenue for ${periodKey(
          tax.period
        )} reconcile within tolerance.`,
        conflictingOrMissingItems: [],
        whyItMatters:
          "Consistency between filed tax revenue and P&L revenue supports replay-safe review.",
        whatAdditionalInformationMayResolveIt:
          "No additional information requested at this time.",
        nextRecommendedAction:
          "Reviewer may proceed; no clarification required.",
        evidenceRefs: [tax.documentRef, matchingPL.documentRef],
        sourceRefs: ["tax-return", "profit-and-loss"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "DOCUMENT_VERIFICATION_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    } else if (diff <= TAX_VS_OCF_TOLERANCE_PCT) {
      findings.push({
        findingId: buildFindingId(
          "pl-vs-tax-revenue-unresolved-variance",
          `${tax.documentRef}-${matchingPL.documentRef}`
        ),
        category: "PROFIT_AND_LOSS_REVENUE_VS_TAX_RETURN_REVENUE",
        resolutionStatus: "UNRESOLVED_VARIANCE",
        plainEnglishExplanation: `Tax return gross revenue and P&L reported revenue for ${periodKey(
          tax.period
        )} differ by more than ${Math.round(
          TAX_VS_PL_REVENUE_TOLERANCE_PCT * 100
        )}%, within an explainable range (timing differences, accruals, cash vs accrual accounting).`,
        conflictingOrMissingItems: [
          `tax return revenue ${taxRev}`,
          `P&L revenue ${plRev}`,
        ],
        whyItMatters:
          "Reviewers need to understand the cause of the difference before treating the figures as reconciled.",
        whatAdditionalInformationMayResolveIt:
          "Please share a short borrower-provided explanation of the difference (e.g. cash vs accrual basis, timing differences, one-time adjustments) and any supporting schedule.",
        nextRecommendedAction:
          "Request clarification from the borrower with a non-accusatory framing. Reviewer routes to BORROWER_INTAKE_REVIEWER for clarification.",
        evidenceRefs: [tax.documentRef, matchingPL.documentRef],
        sourceRefs: ["tax-return", "profit-and-loss"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "BORROWER_INTAKE_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    } else {
      findings.push({
        findingId: buildFindingId(
          "pl-vs-tax-revenue-material-conflict",
          `${tax.documentRef}-${matchingPL.documentRef}`
        ),
        category: "PROFIT_AND_LOSS_REVENUE_VS_TAX_RETURN_REVENUE",
        resolutionStatus: "MATERIAL_CONFLICT",
        plainEnglishExplanation: `Tax return gross revenue and P&L reported revenue for ${periodKey(
          tax.period
        )} differ by more than ${Math.round(
          TAX_VS_OCF_TOLERANCE_PCT * 100
        )}%. Differences of this magnitude usually require qualified-governance review.`,
        conflictingOrMissingItems: [
          `tax return revenue ${taxRev}`,
          `P&L revenue ${plRev}`,
        ],
        whyItMatters:
          "Material differences require qualified-governance review to determine whether additional context reconciles the figures.",
        whatAdditionalInformationMayResolveIt:
          "A reviewer-led conversation with the borrower and supporting documentation (restated revenue schedule, supplemental statements) may resolve the variance.",
        nextRecommendedAction:
          "Route to HUMAN_REVIEW_REQUIRED with a non-accusatory framing; never convert to denial.",
        evidenceRefs: [tax.documentRef, matchingPL.documentRef],
        sourceRefs: ["tax-return", "profit-and-loss"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: true,
        reviewerRole: "QUALIFIED_GOVERNANCE_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
    }
  }
  return findings;
}

// -----------------------------------------------------------------------------
// Rule 3 — Rent roll presence (for income property)
// -----------------------------------------------------------------------------

function reconcileRentRolls(
  rentRolls: RentRollReference[] | undefined,
  intendedUses: string[]
): DocumentReconciliationFinding[] {
  const isIncomeProperty = intendedUses.some((u) =>
    /\b(rental|income property|multifamily|rent roll)\b/i.test(u)
  );
  if (!isIncomeProperty) {
    return [];
  }
  if (!rentRolls || rentRolls.length === 0) {
    return [
      {
        findingId: buildFindingId(
          "rent-roll-incomplete",
          "missing-for-income-property"
        ),
        category: "RENT_ROLL_PRESENCE",
        resolutionStatus: "INCOMPLETE",
        plainEnglishExplanation:
          "The borrower's intended use indicates rental income but no rent roll has been provided.",
        conflictingOrMissingItems: ["rent roll"],
        whyItMatters:
          "Rent rolls let the reviewer verify declared rental income at the unit / occupancy / rate level.",
        whatAdditionalInformationMayResolveIt:
          "Please upload the current rent roll showing units, occupancy, and contract rent amounts.",
        nextRecommendedAction:
          "Borrower may upload the rent roll; reviewer routes to BORROWER_INTAKE_REVIEWER until received.",
        evidenceRefs: [],
        sourceRefs: ["intended-uses"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "BORROWER_INTAKE_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      },
    ];
  }
  return rentRolls.map((rr) => ({
    findingId: buildFindingId("rent-roll-consistent", rr.documentRef),
    category: "RENT_ROLL_PRESENCE",
    resolutionStatus: "CONSISTENT" as const,
    plainEnglishExplanation: `Rent roll ${rr.documentRef} for ${periodKey(
      rr.period
    )} is present.`,
    conflictingOrMissingItems: [],
    whyItMatters:
      "Rent roll presence allows reviewers to verify declared rental income.",
    whatAdditionalInformationMayResolveIt:
      "No additional information requested at this time.",
    nextRecommendedAction: "Reviewer may proceed with verification.",
    evidenceRefs: [rr.documentRef],
    sourceRefs: ["rent-roll"],
    classificationLevel: "RESTRICTED" as const,
    redactionRequired: true,
    humanReviewFlag: false,
    reviewerRole: "DOCUMENT_VERIFICATION_REVIEWER" as const,
    advisoryDisclaimer: ADVISORY_DISCLAIMER,
    fraudAccusationRiskFlag: false,
    documentFakenessAccusationRiskFlag: false,
    underwritingDecisionRiskFlag: false,
    legalConclusionRiskFlag: false,
    uncertaintyPreservedFlag: true as const,
    conflictLineagePreservedFlag: true as const,
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
  }));
}

// -----------------------------------------------------------------------------
// Rule 4 — Property ownership record
// -----------------------------------------------------------------------------

function reconcilePropertyOwnership(
  ownership: PropertyOwnershipReference | undefined
): DocumentReconciliationFinding[] {
  if (!ownership) {
    return [];
  }
  const declaredOwner = ownership.borrowerDeclaredOwner.trim();
  const externalOwner = ownership.externalRecordsOwner?.trim() ?? null;
  if (externalOwner === null) {
    return [
      {
        findingId: buildFindingId(
          "property-ownership-third-party-verification",
          ownership.parcelOrAddress ?? "unknown-parcel"
        ),
        category: "PROPERTY_OWNERSHIP_RECORD",
        resolutionStatus: "THIRD_PARTY_VERIFICATION_RECOMMENDED",
        plainEnglishExplanation: `The borrower declared property ownership as ${declaredOwner}. No external records reference is on file to confirm this.`,
        conflictingOrMissingItems: ["external records ownership reference"],
        whyItMatters:
          "Third-party records (county recorder, assessor, registered title) provide independent verification of declared ownership.",
        whatAdditionalInformationMayResolveIt:
          "Reviewer may request an external records reference (e.g. county recorder or title report) to verify declared ownership.",
        nextRecommendedAction:
          "Route to DOCUMENT_VERIFICATION_REVIEWER to request third-party records verification.",
        evidenceRefs: [],
        sourceRefs: ["borrower-declared-ownership"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "DOCUMENT_VERIFICATION_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      },
    ];
  }
  if (declaredOwner.toLowerCase() === externalOwner.toLowerCase()) {
    return [
      {
        findingId: buildFindingId(
          "property-ownership-consistent",
          ownership.parcelOrAddress ?? "unknown-parcel"
        ),
        category: "PROPERTY_OWNERSHIP_RECORD",
        resolutionStatus: "CONSISTENT",
        plainEnglishExplanation: `Borrower-declared owner and external records owner match (${declaredOwner}).`,
        conflictingOrMissingItems: [],
        whyItMatters:
          "Matching ownership records support replay-safe review.",
        whatAdditionalInformationMayResolveIt:
          "No additional information requested at this time.",
        nextRecommendedAction: "Reviewer may proceed.",
        evidenceRefs: [],
        sourceRefs: [
          "borrower-declared-ownership",
          ownership.externalRecordsSource ?? "external-records",
        ],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "DOCUMENT_VERIFICATION_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      },
    ];
  }
  return [
    {
      findingId: buildFindingId(
        "property-ownership-third-party-verification-recommended",
        ownership.parcelOrAddress ?? "unknown-parcel"
      ),
      category: "PROPERTY_OWNERSHIP_RECORD",
      resolutionStatus: "THIRD_PARTY_VERIFICATION_RECOMMENDED",
      plainEnglishExplanation: `Borrower-declared owner (${declaredOwner}) and external records owner (${externalOwner}) do not currently line up.`,
      conflictingOrMissingItems: [
        `borrower-declared owner: ${declaredOwner}`,
        `external records owner: ${externalOwner}`,
      ],
      whyItMatters:
        "Mismatched ownership commonly reflects intervening transfers, name changes, or trust holdings; third-party verification clarifies the chain of title.",
      whatAdditionalInformationMayResolveIt:
        "Reviewer may request supporting documentation (recorded deeds, trust agreements, name-change records) and a borrower note explaining the chain of title.",
      nextRecommendedAction:
        "Route to THIRD_PARTY_RECORDS_AUTHORITY for verification with a non-accusatory framing; never convert to denial.",
      evidenceRefs: [],
      sourceRefs: [
        "borrower-declared-ownership",
        ownership.externalRecordsSource ?? "external-records",
      ],
      classificationLevel: "RESTRICTED",
      redactionRequired: true,
      humanReviewFlag: true,
      reviewerRole: "THIRD_PARTY_RECORDS_AUTHORITY",
      advisoryDisclaimer: ADVISORY_DISCLAIMER,
      fraudAccusationRiskFlag: false,
      documentFakenessAccusationRiskFlag: false,
      underwritingDecisionRiskFlag: false,
      legalConclusionRiskFlag: false,
      uncertaintyPreservedFlag: true,
      conflictLineagePreservedFlag: true,
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    },
  ];
}

// -----------------------------------------------------------------------------
// Rule 5 — Environmental report appendix references
// -----------------------------------------------------------------------------

function reconcileEnvironmentalReportAppendices(
  reports: EnvironmentalReportReference[] | undefined
): DocumentReconciliationFinding[] {
  if (!reports || reports.length === 0) {
    return [];
  }
  const findings: DocumentReconciliationFinding[] = [];
  for (const report of reports) {
    const referenced = report.referencedAppendixIds ?? [];
    const provided = report.providedAppendixIds ?? [];
    const missing = referenced.filter((ref) => !provided.includes(ref));
    if (missing.length === 0) {
      findings.push({
        findingId: buildFindingId(
          "environmental-appendix-consistent",
          report.documentRef
        ),
        category: "ENVIRONMENTAL_REPORT_APPENDIX_REFERENCE",
        resolutionStatus: "CONSISTENT",
        plainEnglishExplanation: `All appendices referenced by ${report.documentRef} are present.`,
        conflictingOrMissingItems: [],
        whyItMatters:
          "Appendix completeness lets reviewers verify the environmental report's full evidentiary base.",
        whatAdditionalInformationMayResolveIt:
          "No additional information requested at this time.",
        nextRecommendedAction: "Reviewer may proceed.",
        evidenceRefs: [report.documentRef, ...provided],
        sourceRefs: ["environmental-report"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: false,
        reviewerRole: "DOCUMENT_VERIFICATION_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      });
      continue;
    }
    findings.push({
      findingId: buildFindingId(
        "environmental-appendix-clarification",
        report.documentRef
      ),
      category: "ENVIRONMENTAL_REPORT_APPENDIX_REFERENCE",
      resolutionStatus: "CLARIFICATION_REQUESTED",
      plainEnglishExplanation: `Environmental report ${report.documentRef} references ${missing.length} appendix item(s) that have not yet been provided: ${missing.join(", ")}.`,
      conflictingOrMissingItems: missing.map(
        (m) => `referenced appendix not yet provided: ${m}`
      ),
      whyItMatters:
        "Referenced appendices are part of the report's evidentiary base; without them, reviewers cannot verify the supporting analysis.",
      whatAdditionalInformationMayResolveIt:
        "Please share the missing appendix items so the reviewer can complete the verification.",
      nextRecommendedAction:
        "Borrower may upload the missing appendix items; reviewer routes to DOCUMENT_VERIFICATION_REVIEWER until received.",
      evidenceRefs: [report.documentRef, ...provided],
      sourceRefs: ["environmental-report"],
      classificationLevel: "RESTRICTED",
      redactionRequired: true,
      humanReviewFlag: false,
      reviewerRole: "DOCUMENT_VERIFICATION_REVIEWER",
      advisoryDisclaimer: ADVISORY_DISCLAIMER,
      fraudAccusationRiskFlag: false,
      documentFakenessAccusationRiskFlag: false,
      underwritingDecisionRiskFlag: false,
      legalConclusionRiskFlag: false,
      uncertaintyPreservedFlag: true,
      conflictLineagePreservedFlag: true,
      reviewRoute: REVIEW_ROUTE,
      doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
      blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
    });
  }
  return findings;
}

// -----------------------------------------------------------------------------
// Rule 6 — Borrower-provided document conflict with no explanation
// -----------------------------------------------------------------------------

function reconcileBorrowerProvidedConflict(
  findingsSoFar: DocumentReconciliationFinding[],
  borrowerExplanationNote: string | null | undefined
): DocumentReconciliationFinding[] {
  const unresolvedOrMaterial = findingsSoFar.filter(
    (f) =>
      f.resolutionStatus === "UNRESOLVED_VARIANCE" ||
      f.resolutionStatus === "MATERIAL_CONFLICT"
  );
  if (unresolvedOrMaterial.length === 0) {
    return [];
  }
  const explanation = (borrowerExplanationNote ?? "").trim();
  if (explanation.length === 0) {
    return [
      {
        findingId: buildFindingId(
          "borrower-conflict-no-explanation",
          `unresolved-${unresolvedOrMaterial.length}`
        ),
        category: "BORROWER_PROVIDED_DOCUMENT_CONFLICT",
        resolutionStatus: "HUMAN_REVIEW_REQUIRED",
        plainEnglishExplanation: `Borrower-provided documents currently show ${unresolvedOrMaterial.length} unresolved variance(s) and no borrower-provided explanation note is on file.`,
        conflictingOrMissingItems: unresolvedOrMaterial.map((f) => f.findingId),
        whyItMatters:
          "Without a borrower-provided explanation, the reviewer cannot reconcile the documents through borrower clarification alone.",
        whatAdditionalInformationMayResolveIt:
          "A short borrower-provided explanation describing why the documents diverge (e.g. timing differences, one-time events, accounting basis) would help the reviewer reconcile them.",
        nextRecommendedAction:
          "Route to HUMAN_REVIEW_REQUIRED to gather context and follow up with the borrower. Never convert to denial.",
        evidenceRefs: unresolvedOrMaterial.flatMap((f) => f.evidenceRefs),
        sourceRefs: ["borrower-explanation-absent"],
        classificationLevel: "RESTRICTED",
        redactionRequired: true,
        humanReviewFlag: true,
        reviewerRole: "QUALIFIED_GOVERNANCE_REVIEWER",
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        fraudAccusationRiskFlag: false,
        documentFakenessAccusationRiskFlag: false,
        underwritingDecisionRiskFlag: false,
        legalConclusionRiskFlag: false,
        uncertaintyPreservedFlag: true,
        conflictLineagePreservedFlag: true,
        reviewRoute: REVIEW_ROUTE,
        doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
        blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
      },
    ];
  }
  return [];
}

// -----------------------------------------------------------------------------
// Fully-consistent packet finding (when nothing else fires)
// -----------------------------------------------------------------------------

function buildFullyConsistentFinding(
  findingsSoFar: DocumentReconciliationFinding[]
): DocumentReconciliationFinding | null {
  if (findingsSoFar.length === 0) {
    return null;
  }
  const anyNonConsistent = findingsSoFar.some(
    (f) => f.resolutionStatus !== "CONSISTENT"
  );
  if (anyNonConsistent) {
    return null;
  }
  return {
    findingId: "der-fully-consistent-packet",
    category: "FULLY_CONSISTENT_PACKET",
    resolutionStatus: "CONSISTENT",
    plainEnglishExplanation:
      "All reviewed documents reconcile within tolerance. No variances or missing items detected at this time.",
    conflictingOrMissingItems: [],
    whyItMatters:
      "A fully-consistent packet supports replay-safe review without follow-up clarification requests.",
    whatAdditionalInformationMayResolveIt:
      "No additional information requested at this time.",
    nextRecommendedAction:
      "Reviewer may proceed; no clarification required.",
    evidenceRefs: Array.from(
      new Set(findingsSoFar.flatMap((f) => f.evidenceRefs))
    ),
    sourceRefs: Array.from(
      new Set(findingsSoFar.flatMap((f) => f.sourceRefs))
    ),
    classificationLevel: "RESTRICTED",
    redactionRequired: true,
    humanReviewFlag: false,
    reviewerRole: "DOCUMENT_VERIFICATION_REVIEWER",
    advisoryDisclaimer: ADVISORY_DISCLAIMER,
    fraudAccusationRiskFlag: false,
    documentFakenessAccusationRiskFlag: false,
    underwritingDecisionRiskFlag: false,
    legalConclusionRiskFlag: false,
    uncertaintyPreservedFlag: true,
    conflictLineagePreservedFlag: true,
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_DOCTRINE_REFS],
    blockedClaims: [...DEFAULT_FINDING_BLOCKED_CLAIMS],
  };
}

// =============================================================================
// Signal builders
// =============================================================================

const V1_SIGNAL_IDS: readonly DocumentReconciliationSignalId[] = [
  "reconciliation_explanation_alignment",
  "reconciliation_evidence_alignment",
  "reconciliation_clarification_alignment",
  "reconciliation_material_conflict_routing_alignment",
];

const V1_SIGNAL_LABELS: Record<DocumentReconciliationSignalId, string> = {
  reconciliation_explanation_alignment: "Reconciliation explanation alignment",
  reconciliation_evidence_alignment: "Reconciliation evidence reference alignment",
  reconciliation_clarification_alignment:
    "Reconciliation clarification routing alignment",
  reconciliation_material_conflict_routing_alignment:
    "Material conflict routing alignment",
};

const DEFAULT_SIGNAL_BLOCKED_CLAIMS = [
  "denial",
  "rejection",
  "fraud accusation",
  "document fakeness accusation",
  "borrower lying accusation",
  "approval",
  "preapproval",
  "lender commitment",
  "agency decision",
  "official certification",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "underwriting decision",
  "legal conclusion",
];

function buildSignal(
  id: DocumentReconciliationSignalId,
  findings: DocumentReconciliationFinding[]
): DocumentReconciliationSignal {
  let satisfied = 0;
  let total = findings.length;
  const reviewSignals: string[] = [];
  switch (id) {
    case "reconciliation_explanation_alignment":
      satisfied = findings.filter(
        (f) =>
          f.plainEnglishExplanation.length > 0 && f.whyItMatters.length > 0
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} findings carry an explanation and a why-it-matters statement`
      );
      break;
    case "reconciliation_evidence_alignment":
      satisfied = findings.filter(
        (f) =>
          f.evidenceRefs.length > 0 ||
          f.sourceRefs.length > 0
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} findings carry at least one evidence or source reference`
      );
      break;
    case "reconciliation_clarification_alignment": {
      const requiringClarification = findings.filter(
        (f) =>
          f.resolutionStatus === "INCOMPLETE" ||
          f.resolutionStatus === "UNRESOLVED_VARIANCE" ||
          f.resolutionStatus === "MATERIAL_CONFLICT" ||
          f.resolutionStatus === "CLARIFICATION_REQUESTED" ||
          f.resolutionStatus === "THIRD_PARTY_VERIFICATION_RECOMMENDED" ||
          f.resolutionStatus === "HUMAN_REVIEW_REQUIRED"
      );
      total = requiringClarification.length;
      satisfied = requiringClarification.filter(
        (f) =>
          f.whatAdditionalInformationMayResolveIt.length > 0 &&
          f.nextRecommendedAction.length > 0
      ).length;
      reviewSignals.push(
        `${satisfied} of ${total} non-consistent findings carry both a clarification path and a next recommended action`
      );
      break;
    }
    case "reconciliation_material_conflict_routing_alignment": {
      const materialOrHumanReview = findings.filter(
        (f) =>
          f.resolutionStatus === "MATERIAL_CONFLICT" ||
          f.resolutionStatus === "HUMAN_REVIEW_REQUIRED"
      );
      total = materialOrHumanReview.length;
      satisfied = materialOrHumanReview.filter((f) => f.humanReviewFlag).length;
      reviewSignals.push(
        `${satisfied} of ${total} material-conflict / human-review findings carry humanReviewFlag = true`
      );
      break;
    }
  }
  const ready = total === 0 ? true : satisfied === total;
  const readinessPercent =
    total === 0 ? 100 : Math.round((satisfied / total) * 100);
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
  evidenceResolution: EvidenceResolutionWorkflowResult,
  raV2: ReadinessAssessmentV2Result,
  boV2: BorrowerOnboardingCoreV2Result,
  findings: DocumentReconciliationFinding[],
  bannedLanguageHits: string[]
): DocumentReconciliationCrossSourceConflict[] {
  const conflicts: DocumentReconciliationCrossSourceConflict[] = [];
  if (evidenceResolution.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "der-v1-upstream-evidence-resolution-conflicts",
      topic:
        "Upstream Evidence Resolution Workflow v1 surfaced cross-source conflicts",
      description: `Evidence Resolution Workflow v1 surfaced ${evidenceResolution.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Document Evidence Reconciliation v1.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (raV2.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "der-v1-upstream-readiness-conflicts",
      topic: "Upstream Readiness Assessment v2 surfaced cross-source conflicts",
      description: `Readiness Assessment v2 surfaced ${raV2.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Document Evidence Reconciliation v1.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (boV2.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "der-v1-upstream-borrower-onboarding-conflicts",
      topic:
        "Upstream Borrower Onboarding Core v2 surfaced cross-source conflicts",
      description: `Borrower Onboarding Core v2 surfaced ${boV2.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Document Evidence Reconciliation v1.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  const materialFindings = findings.filter(
    (f) => f.resolutionStatus === "MATERIAL_CONFLICT"
  );
  const materialWithoutHumanReview = materialFindings.filter(
    (f) => !f.humanReviewFlag
  );
  if (materialWithoutHumanReview.length > 0) {
    conflicts.push({
      conflictId: "der-v1-material-conflict-without-human-review",
      topic:
        "MATERIAL_CONFLICT finding did not produce a HUMAN_REVIEW routing",
      description: `${materialWithoutHumanReview.length} MATERIAL_CONFLICT finding(s) failed to set humanReviewFlag = true; this is a constitutional routing failure that requires human review before any treatment.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }
  if (bannedLanguageHits.length > 0) {
    conflicts.push({
      conflictId: "der-v1-banned-accusatory-language",
      topic:
        "Banned accusatory language detected in a reconciliation finding",
      description: `One or more reconciliation findings contain banned accusatory tokens (${bannedLanguageHits.join(", ")}); review the worker that produced the finding and rephrase the language.`,
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

export function composeDocumentEvidenceReconciliation(
  input: DocumentEvidenceReconciliationInput = {}
): DocumentEvidenceReconciliationResult {
  // 1. Compose upstream — Evidence Resolution Workflow v1, Readiness
  //    Assessment v2, Borrower Onboarding Core v2.
  const evidenceResolution = composeEvidenceResolutionWorkflow({
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    onboardingState: input.onboardingState,
    declaredCustomerTypes: input.declaredCustomerTypes ?? [],
    intendedUses: input.intendedUses ?? [],
    scope: input.scope ?? null,
    metadata: input.metadata ?? null,
  });
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

  // 2. Apply pair-wise reconciliation rules.
  const taxReturns = input.taxReturns ?? [];
  const profitAndLossStatements = input.profitAndLossStatements ?? [];
  const findings: DocumentReconciliationFinding[] = [];
  findings.push(
    ...reconcileTaxReturnVsOperatingCashFlow(
      taxReturns,
      profitAndLossStatements
    )
  );
  findings.push(
    ...reconcilePLRevenueVsTaxReturnRevenue(
      taxReturns,
      profitAndLossStatements
    )
  );
  findings.push(
    ...reconcileRentRolls(input.rentRolls, input.intendedUses ?? [])
  );
  findings.push(...reconcilePropertyOwnership(input.propertyOwnership));
  findings.push(
    ...reconcileEnvironmentalReportAppendices(input.environmentalReports)
  );
  findings.push(
    ...reconcileBorrowerProvidedConflict(
      findings,
      input.borrowerExplanationNote ?? null
    )
  );
  // Fully-consistent packet finding only when every other finding is
  // CONSISTENT.
  const fullyConsistentFinding = buildFullyConsistentFinding(findings);
  if (fullyConsistentFinding) {
    findings.push(fullyConsistentFinding);
  }

  // 3. Banned-language scan over every borrower-facing fragment.
  const fragments: string[] = [];
  for (const f of findings) {
    fragments.push(f.plainEnglishExplanation);
    fragments.push(f.whyItMatters);
    fragments.push(f.whatAdditionalInformationMayResolveIt);
    fragments.push(f.nextRecommendedAction);
  }
  const bannedLanguageHits = detectBannedAccusatoryTokens(fragments);

  // 4. Build v1 governed reconciliation signals.
  const v1Signals: DocumentReconciliationSignal[] = V1_SIGNAL_IDS.map((id) =>
    buildSignal(id, findings)
  );

  // 5. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    evidenceResolution,
    raV2,
    boV2,
    findings,
    bannedLanguageHits
  );

  // 6. Summarize.
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

  const summary: DocumentReconciliationSummary = {
    findingCount: findings.length,
    consistentCount: findings.filter(
      (f) => f.resolutionStatus === "CONSISTENT"
    ).length,
    incompleteCount: findings.filter(
      (f) => f.resolutionStatus === "INCOMPLETE"
    ).length,
    unresolvedVarianceCount: findings.filter(
      (f) => f.resolutionStatus === "UNRESOLVED_VARIANCE"
    ).length,
    materialConflictCount: findings.filter(
      (f) => f.resolutionStatus === "MATERIAL_CONFLICT"
    ).length,
    clarificationRequestedCount: findings.filter(
      (f) => f.resolutionStatus === "CLARIFICATION_REQUESTED"
    ).length,
    thirdPartyVerificationRecommendedCount: findings.filter(
      (f) => f.resolutionStatus === "THIRD_PARTY_VERIFICATION_RECOMMENDED"
    ).length,
    humanReviewRequiredCount: findings.filter(
      (f) => f.resolutionStatus === "HUMAN_REVIEW_REQUIRED"
    ).length,
    blockedByConflictCount: findings.filter(
      (f) => f.resolutionStatus === "BLOCKED_BY_CONFLICT"
    ).length,
    fraudAccusationRiskCount: findings.filter(
      (f) => f.fraudAccusationRiskFlag
    ).length,
    documentFakenessAccusationRiskCount: findings.filter(
      (f) => f.documentFakenessAccusationRiskFlag
    ).length,
    underwritingDecisionRiskCount: findings.filter(
      (f) => f.underwritingDecisionRiskFlag
    ).length,
    legalConclusionRiskCount: findings.filter(
      (f) => f.legalConclusionRiskFlag
    ).length,
    v1SignalCount: v1Signals.length,
    v1ReadyCount,
    v1NeedsInputCount,
    v1BlockedCount,
    v1NotStartedCount,
    v1OverallReadinessPercent,
    upstreamEvidenceResolutionConflictCount:
      evidenceResolution.summary.crossSourceConflictCount,
    upstreamReadinessConflictCount: raV2.summary.crossSourceConflictCount,
    upstreamOnboardingConflictCount: boV2.summary.crossSourceConflictCount,
    crossSourceConflictCount: crossSourceConflicts.length,
  };

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
    "/governance/evidence-resolution-workflow",
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
    runtimeVersion: DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v1Signals,
    findings,
    evidenceResolutionWorkflow: evidenceResolution,
    readinessAssessmentV2: raV2,
    borrowerOnboardingCoreV2: boV2,
    crossSourceConflicts,
    legacyBridge: {
      evidenceResolutionWorkflowVersion:
        EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
      readinessAssessmentV2Version: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
      borrowerOnboardingCoreV2Version:
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: [...DOCUMENT_EVIDENCE_RECONCILIATION_DISCLOSURES],
    productionRestrictions: [
      ...DOCUMENT_EVIDENCE_RECONCILIATION_PRODUCTION_RESTRICTIONS,
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    documentEvidenceReconciliationInternalOnly: true,
    uncertaintyPreserved: true,
    conflictLineagePreserved: true,
    noFraudAccusation: true,
    noDocumentFakenessAccusation: true,
    noBorrowerLyingAccusation: true,
    noLegalConclusion: true,
    noUnderwritingDecision: true,
    noAutomaticDenial: true,
    noConflictHiding: true,
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

export function documentEvidenceReconciliationLineage(): {
  runtimeVersion: string;
  evidenceResolutionWorkflowVersion: string;
  readinessAssessmentV2Version: string;
  borrowerOnboardingCoreV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
} {
  return {
    runtimeVersion: DOCUMENT_EVIDENCE_RECONCILIATION_RUNTIME_VERSION,
    evidenceResolutionWorkflowVersion:
      EVIDENCE_RESOLUTION_WORKFLOW_RUNTIME_VERSION,
    readinessAssessmentV2Version: READINESS_ASSESSMENT_V2_RUNTIME_VERSION,
    borrowerOnboardingCoreV2Version: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
  };
}

export const DOCUMENT_EVIDENCE_RECONCILIATION_SIGNAL_IDS = V1_SIGNAL_IDS;
