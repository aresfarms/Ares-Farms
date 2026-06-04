import { BorrowerOnboardingState } from "@/lib/borrower/onboardingCore";
import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import {
  ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
  EnvironmentalIntakeV2Input,
  EnvironmentalIntakeV2Result,
  composeEnvironmentalIntakeV2,
} from "@/lib/environmental/intakeV2Runtime";
import { ENVIRONMENTAL_INTAKE_RUNTIME_VERSION } from "@/lib/environmental/intakeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/opportunity/discoveryV2Runtime";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Environmental Compliance v2 Runtime
 *
 * The thirteenth downstream consumer of the Capital Graph (Build 13)
 * and Customer Type Registry (Build 14), composed on top of Revenue
 * Intelligence v2 (Build 15), Financing Pathway Engine v2 (Build
 * 16), Opportunity Discovery v2 (Build 17), Borrower Onboarding
 * Core v2 (Build 24), Readiness Assessment v2 (Build 25), and
 * Environmental Intake v2 (Build 26). It joins:
 *
 * - Environmental Intake v2 (which composes BO v2 + the full
 *   canonical v2 stack + legacy v1 environmental intake).
 * - A pure-functional advisory replay of the v1
 *   environmental-compliance gate semantics
 *   (`gateSnapshot` in `src/lib/governance/environmentalComplianceStore`):
 *   pathway exemption, NEPA / Phase I ESA / state environmental
 *   review assessment type, provider type / license / verification,
 *   fee disclosure ref + disclosed-before-initiation, borrower
 *   external-firm right preservation, no fee surcharge or
 *   preference, Environmental Engineering Spoke isolation, Banker
 *   Spoke isolation, audit anchor ref, escalation ref when
 *   conditional / escalated / failed outcome.
 *   The v2 runtime does NOT write to the v1
 *   `environmental_compliance_records` table — it composes an
 *   advisory posture only. The v1 store remains the canonical write
 *   path; this v2 runtime composes the canonical advisory view of
 *   that gate posture without DB side effects.
 * - Four new v2 governed compliance signals:
 *   - `compliance_provider_license_alignment` — provider license
 *     present and verified for triggered pathway with at least one
 *     environmental Capital Graph match.
 *   - `compliance_fee_disclosure_alignment` — fee disclosure ref
 *     present + disclosed before initiation + no surcharge /
 *     preference + borrower external-firm right preserved.
 *   - `compliance_spoke_isolation_alignment` — Environmental
 *     Engineering Spoke isolation confirmed + Banker Spoke
 *     isolation confirmed.
 *   - `compliance_audit_anchor_alignment` — audit anchor ref
 *     present + escalation ref when required.
 * - Cross-source conflicts: v1 gate-snapshot blocked while v2
 *   environmental Capital Graph coverage is present (review wedge);
 *   upstream Environmental Intake v2 cross-source conflicts
 *   propagated; sovereign customer types declared without sovereign
 *   federation authorization; spoke isolation NOT confirmed while
 *   v2 environmental pathway is TRIGGERED; conditional / escalated
 *   / failed assessment outcome without escalation ref.
 *
 * Environmental Compliance v2 output is advisory operational
 * environmental compliance posture only. It does NOT create
 * external environmental provider engagement, fee authorization,
 * official environmental report, environmental clearance, NEPA
 * determination, Phase I ESA report, permit issued, autonomous
 * environmental compliance / intake / onboarding / readiness /
 * customer eligibility / pathway / opportunity / intelligence /
 * evidence / certification determination, credit decision, lender
 * commitment, public verification, regulatory reliance, source
 * certainty claim, payment authorization, live external action,
 * notice send, or legal reliance. Environmental Engineering Spoke
 * isolation remains preserved.
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): preserves Environmental
 *   Engineering Spoke / Banker Spoke isolation (ROLE-ARCH-001);
 *   composition never grants authority and never replaces external
 *   environmental review.
 * - Vol II (Regulatory Governance): blocks Environmental Compliance
 *   v2 from becoming approval, eligibility, autonomous
 *   environmental compliance, NEPA determination, Phase I ESA
 *   report, permit, official environmental report, public
 *   verification, regulatory reliance, or legal reliance.
 * - Vol III (Technical Infrastructure): deterministic, replay-safe
 *   composition with explicit version lineage chaining
 *   environmental-compliance-v2-runtime-v0.1.0 →
 *   environmental-intake-v2-runtime-v0.1.0 →
 *   borrower-onboarding-core-v2-runtime-v0.1.0 →
 *   opportunity-discovery-v2-runtime-v0.1.0 →
 *   financing-pathway-engine-v2-runtime-v0.1.0 →
 *   revenue-intelligence-v2-runtime-v0.1.0 →
 *   customer-type-runtime-v0.1.0 →
 *   capital-graph-runtime-v0.1.0 →
 *   environmental-intake-runtime-v0.1.0 →
 *   environmental-compliance-runtime-v0.1.0 (the v1 store seal as
 *   conceptual reference).
 * - Vol III-B (Governance Runtime): runtime evidence with
 *   classification, observability, explainability, replay
 *   verification posture.
 * - Vol IV (Operational Runbooks): routes governed handoffs to
 *   Environmental Intake v2, Borrower Onboarding Core v2,
 *   Readiness Assessment v2, Opportunity Discovery v2, Financing
 *   Pathway Engine v2, Revenue Intelligence v2, Customer Type
 *   Registry, Capital Graph, environmental-compliance v1 review,
 *   portal-borrower-environmental-intake, applications, documents,
 *   data-rights, evidence packets, audit replay, governance,
 *   reviews, and module readiness.
 * - Vol V (Canonical Doctrines): preserves CANON-ECON-001 fee
 *   disclosure and CANON-SOVEREIGNTY-001 jurisdictional license
 *   verification, claims governance, controlled disclosure,
 *   replay, audit, portability, advisory-only boundaries.
 * - Vol VI (Source Intelligence Integration): keeps every composed
 *   entry behind a public-safe DTO; no raw provider, sponsor, or
 *   borrower records; no live external fetch; no source-certainty
 *   claim.
 */

export const ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION =
  "environmental-compliance-v2-runtime-v0.1.0";

export const ENVIRONMENTAL_COMPLIANCE_V1_LINEAGE_REF =
  "environmental-compliance-runtime-v0.1.0";

// =============================================================================
// Input / Output Types
// =============================================================================

export type EnvironmentalComplianceV2AssessmentType =
  | "NEPA_SCREENING"
  | "PHASE_I_ESA"
  | "PHASE_II_ESA"
  | "PHASE_III_ESA"
  | "STATE_ENVIRONMENTAL_REVIEW"
  | "NOT_REQUIRED_PATHWAY_EXEMPTION";

export type EnvironmentalComplianceV2ProviderType =
  | "ENVIRONMENTAL_ENGINEERING_SPOKE"
  | "APPROVED_EXTERNAL_FIRM"
  | "NOT_APPLICABLE";

export type EnvironmentalComplianceV2Outcome =
  | "CLEARED"
  | "CONDITIONAL"
  | "ESCALATED"
  | "FAILED";

export type EnvironmentalComplianceV2GateInput = {
  pathwayType?: string | null;
  triggeringPathway?: string | null;
  realPropertyCollateral?: boolean | null;
  environmentalStatuteTriggered?: boolean | null;
  equipmentAssetValue?: number | null;
  assessmentType?: string | null;
  assessmentProviderType?: string | null;
  providerName?: string | null;
  providerLicenseRef?: string | null;
  providerLicenseVerified?: boolean | null;
  assessmentOutcome?: string | null;
  feeAmount?: number | null;
  standardMarketRateAmount?: number | null;
  feeDisclosureRef?: string | null;
  feeDisclosedBeforeInitiation?: boolean | null;
  borrowerExternalFirmRightPreserved?: boolean | null;
  noFeeSurchargeOrPreference?: boolean | null;
  spokeIsolationConfirmed?: boolean | null;
  bankerSpokeIsolated?: boolean | null;
  auditAnchorRef?: string | null;
  escalationRef?: string | null;
};

export type EnvironmentalComplianceV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  onboardingState?: BorrowerOnboardingState;
  declaredCustomerTypes?: string[];
  intendedUses?: string[];
  legacyIntake?: EnvironmentalIntakeV2Input["legacy"];
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  complianceGate?: EnvironmentalComplianceV2GateInput;
  metadata?: Record<string, unknown> | null;
};

export type EnvironmentalComplianceV2SignalId =
  | "compliance_provider_license_alignment"
  | "compliance_fee_disclosure_alignment"
  | "compliance_spoke_isolation_alignment"
  | "compliance_audit_anchor_alignment";

export type EnvironmentalComplianceV2SignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type EnvironmentalComplianceV2Signal = {
  id: EnvironmentalComplianceV2SignalId;
  label: string;
  status: EnvironmentalComplianceV2SignalStatus;
  readinessPercent: number;
  coverageCount: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type EnvironmentalComplianceV2GateSnapshot = {
  triggered: boolean;
  pathwayExempt: boolean;
  pathwayType: string;
  assessmentType: EnvironmentalComplianceV2AssessmentType;
  providerType: EnvironmentalComplianceV2ProviderType;
  assessmentOutcome: EnvironmentalComplianceV2Outcome;
  feeAmount: number;
  standardMarketRateAmount: number;
  gates: Record<string, boolean>;
  blockerReasons: string[];
  loanPathwayAdvancementAllowed: boolean;
  assessmentRequirementStatus:
    | "ENVIRONMENTAL_LINEAGE_CONFIRMED"
    | "ENVIRONMENTAL_GATE_BLOCKED"
    | "PATHWAY_EXEMPTION_RECORDED";
};

export type EnvironmentalComplianceV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type EnvironmentalComplianceV2LegacyBridge = {
  environmentalComplianceVersion: string;
  environmentalIntakeV2Version: string;
  environmentalIntakeVersion: string;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type EnvironmentalComplianceV2Summary = {
  v2SignalCount: number;
  v2ReadyCount: number;
  v2NeedsInputCount: number;
  v2BlockedCount: number;
  v2NotStartedCount: number;
  v2OverallReadinessPercent: number;
  v1GateCount: number;
  v1GatesPassedCount: number;
  v1GatesBlockedCount: number;
  v1BlockerReasonCount: number;
  v1EnvironmentalAssessmentTriggered: boolean;
  v1LoanPathwayAdvancementAllowed: boolean;
  v1FeeAmount: number;
  v1StandardMarketRateAmount: number;
  v1AssessmentOutcome: EnvironmentalComplianceV2Outcome;
  environmentalIntakeV2SignalCount: number;
  environmentalIntakeV2BlockedCount: number;
  environmentalEligibleCustomerTypeCount: number;
  environmentalCapitalProgramCount: number;
  crossSourceConflictCount: number;
};

export type EnvironmentalComplianceV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: EnvironmentalComplianceV2Summary;
  v2Signals: EnvironmentalComplianceV2Signal[];
  gateSnapshot: EnvironmentalComplianceV2GateSnapshot;
  environmentalIntakeV2: EnvironmentalIntakeV2Result;
  crossSourceConflicts: EnvironmentalComplianceV2CrossSourceConflict[];
  legacyBridge: EnvironmentalComplianceV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  environmentalComplianceV2InternalOnly: true;
  spokeIsolationRequired: true;
  feeAutonomyPreserved: true;
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
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noOfficialEnvironmentalReport: true;
  noEnvironmentalClearance: true;
  noNEPADetermination: true;
  noPhaseIESAReport: true;
  noPermitIssued: true;
  noProviderEngagement: true;
  noFeeAuthorization: true;
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
  "autonomous readiness determination",
  "autonomous environmental intake determination",
  "autonomous environmental compliance determination",
  "credit decision",
  "underwriting decision",
  "lender commitment",
  "funding guarantee",
  "program approval",
  "official environmental report",
  "environmental clearance",
  "NEPA determination",
  "Phase I ESA report",
  "permit issued",
  "provider engagement",
  "fee authorization",
  "tax-credit allocation",
  "carbon-credit issuance",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "payment authorization",
  "notice send",
  "live external action",
] as const;

export const ENVIRONMENTAL_COMPLIANCE_V2_DISCLOSURES = [
  "Environmental Compliance v2 output is advisory operational environmental compliance posture, replay-safe, audit-safe, and conflict-preserving.",
  "Environmental Compliance v2 does not authorize external environmental provider engagement, fee authorization, official environmental report, environmental clearance, NEPA determination, Phase I ESA report, permit issued, autonomous environmental compliance / intake / onboarding / readiness / customer eligibility / pathway / opportunity / intelligence / evidence / certification determination, credit decision, lender commitment, public verification, regulatory reliance, or legal reliance.",
  "Environmental Compliance v2 does not perform a live external customer, sponsor, source, provider, or property fetch and does not claim source certainty.",
  "Sponsor authority, provider license verification, fee disclosure, customer-type review boundaries, and qualified-reviewer approval remain with the named human authorities.",
  "Environmental Engineering Spoke isolation is preserved; no Banker Spoke decision flows from this compliance posture.",
  "Borrower fee autonomy and the borrower's right to engage an external environmental firm are preserved (CANON-ECON-001 / CANON-SOVEREIGNTY-001).",
  "Cross-source conflicts between Environmental Intake v2, the v1 environmental-compliance gate posture, and upstream canonical v2 modules are preserved as first-class evidence and never collapsed.",
  "Sovereign customer types remain hidden unless named federation participation is authorized.",
  "Human review is required before any composed environmental compliance signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const ENVIRONMENTAL_COMPLIANCE_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous customer eligibility determination",
  "no autonomous pathway determination",
  "no autonomous opportunity determination",
  "no autonomous readiness determination",
  "no autonomous environmental intake determination",
  "no autonomous environmental compliance determination",
  "no approval",
  "no preapproval",
  "no credit decision",
  "no underwriting decision",
  "no lender commitment",
  "no funding guarantee",
  "no program approval",
  "no official environmental report",
  "no environmental clearance",
  "no NEPA determination",
  "no Phase I ESA report",
  "no permit issued",
  "no provider engagement",
  "no fee authorization",
  "no tax-credit allocation",
  "no carbon-credit issuance",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no live external action",
  "no source certainty",
  "no notice send",
  "no payment authorization",
] as const;

// =============================================================================
// Gate evaluator (advisory replay of v1 store gate semantics, no DB writes)
// =============================================================================

const ALLOWED_ASSESSMENT_TYPES = new Set<EnvironmentalComplianceV2AssessmentType>(
  [
    "NEPA_SCREENING",
    "PHASE_I_ESA",
    "PHASE_II_ESA",
    "PHASE_III_ESA",
    "STATE_ENVIRONMENTAL_REVIEW",
    "NOT_REQUIRED_PATHWAY_EXEMPTION",
  ]
);

const ALLOWED_PROVIDER_TYPES = new Set<EnvironmentalComplianceV2ProviderType>([
  "ENVIRONMENTAL_ENGINEERING_SPOKE",
  "APPROVED_EXTERNAL_FIRM",
  "NOT_APPLICABLE",
]);

const ALLOWED_OUTCOMES = new Set<EnvironmentalComplianceV2Outcome>([
  "CLEARED",
  "CONDITIONAL",
  "ESCALATED",
  "FAILED",
]);

function normalizePathway(value: unknown): string {
  if (typeof value !== "string") {
    return "UNSPECIFIED_PATHWAY";
  }
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  return normalized.length > 0 ? normalized : "UNSPECIFIED_PATHWAY";
}

function hasRealPropertyTrigger(input: EnvironmentalComplianceV2GateInput): boolean {
  const pathway = normalizePathway(input.pathwayType);
  return (
    input.realPropertyCollateral === true ||
    input.environmentalStatuteTriggered === true ||
    [
      "REAL_ESTATE",
      "USDA_BI_REAL_ESTATE",
      "COMMUNITY_FACILITIES",
      "REAP_INSTALLATION",
      "STATE_ENVIRONMENTAL_REVIEW",
    ].includes(pathway)
  );
}

function isPathwayExempt(input: EnvironmentalComplianceV2GateInput): boolean {
  const pathway = normalizePathway(input.pathwayType);
  const equipmentAssetValue =
    typeof input.equipmentAssetValue === "number" &&
    Number.isFinite(input.equipmentAssetValue) &&
    input.equipmentAssetValue >= 0
      ? Math.round(input.equipmentAssetValue)
      : 0;

  if (pathway === "WORKING_CAPITAL") {
    return true;
  }
  if (
    pathway === "EQUIPMENT_FINANCING" &&
    equipmentAssetValue > 0 &&
    equipmentAssetValue < 50000
  ) {
    return true;
  }
  return pathway === "REFINANCING" && input.realPropertyCollateral !== true;
}

function normalizeAssessmentType(
  value: unknown,
  triggered: boolean
): EnvironmentalComplianceV2AssessmentType {
  if (!triggered) {
    return "NOT_REQUIRED_PATHWAY_EXEMPTION";
  }
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : null;
  if (
    normalized &&
    ALLOWED_ASSESSMENT_TYPES.has(
      normalized as EnvironmentalComplianceV2AssessmentType
    ) &&
    normalized !== "NOT_REQUIRED_PATHWAY_EXEMPTION"
  ) {
    return normalized as EnvironmentalComplianceV2AssessmentType;
  }
  return "NEPA_SCREENING";
}

function normalizeProviderType(
  value: unknown,
  triggered: boolean
): EnvironmentalComplianceV2ProviderType {
  if (!triggered) {
    return "NOT_APPLICABLE";
  }
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : null;
  if (
    normalized &&
    ALLOWED_PROVIDER_TYPES.has(
      normalized as EnvironmentalComplianceV2ProviderType
    ) &&
    normalized !== "NOT_APPLICABLE"
  ) {
    return normalized as EnvironmentalComplianceV2ProviderType;
  }
  return "ENVIRONMENTAL_ENGINEERING_SPOKE";
}

function normalizeOutcome(
  value: unknown,
  triggered: boolean
): EnvironmentalComplianceV2Outcome {
  if (!triggered) {
    return "CLEARED";
  }
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : null;
  if (
    normalized &&
    ALLOWED_OUTCOMES.has(normalized as EnvironmentalComplianceV2Outcome)
  ) {
    return normalized as EnvironmentalComplianceV2Outcome;
  }
  return "ESCALATED";
}

function refPresent(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  return value.trim().length > 0;
}

function positiveAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.round(value);
}

function computeGateSnapshot(
  input: EnvironmentalComplianceV2GateInput
): EnvironmentalComplianceV2GateSnapshot {
  const pathwayType = normalizePathway(input.pathwayType);
  const triggered = hasRealPropertyTrigger(input) && !isPathwayExempt(input);
  const pathwayExempt = isPathwayExempt(input);
  const assessmentType = normalizeAssessmentType(input.assessmentType, triggered);
  const providerType = normalizeProviderType(
    input.assessmentProviderType,
    triggered
  );
  const assessmentOutcome = normalizeOutcome(input.assessmentOutcome, triggered);
  const feeAmount = triggered ? positiveAmount(input.feeAmount) : 0;
  const standardMarketRateAmount = triggered
    ? positiveAmount(input.standardMarketRateAmount)
    : 0;

  let gates: Record<string, boolean>;
  if (!triggered) {
    gates = {
      pathwayExemptionRecorded: true,
      environmentalAssessmentNotRequired: true,
      loanPathwayAdvancementAllowed: true,
      officialReportNotGenerated: true,
      liveExternalActionNotPerformed: true,
    };
  } else {
    const escalationRequired = ["CONDITIONAL", "ESCALATED", "FAILED"].includes(
      assessmentOutcome
    );
    gates = {
      environmentalAssessmentTriggered: true,
      assessmentTypeAllowed:
        ALLOWED_ASSESSMENT_TYPES.has(assessmentType) &&
        assessmentType !== "NOT_REQUIRED_PATHWAY_EXEMPTION",
      providerTypeAllowed:
        ALLOWED_PROVIDER_TYPES.has(providerType) &&
        providerType !== "NOT_APPLICABLE",
      providerLicenseRefPresent: refPresent(input.providerLicenseRef),
      providerLicenseVerified: input.providerLicenseVerified === true,
      feeDisclosureRefPresent: refPresent(input.feeDisclosureRef),
      feeDisclosedBeforeInitiation:
        input.feeDisclosedBeforeInitiation === true,
      borrowerExternalFirmRightPreserved:
        input.borrowerExternalFirmRightPreserved === true,
      noFeeSurchargeOrPreference: input.noFeeSurchargeOrPreference === true,
      spokeIsolationConfirmed: input.spokeIsolationConfirmed === true,
      bankerSpokeIsolated: input.bankerSpokeIsolated === true,
      auditAnchorRefPresent: refPresent(input.auditAnchorRef),
      escalationRefPresentWhenRequired:
        !escalationRequired || refPresent(input.escalationRef),
      officialReportNotGenerated: true,
      liveExternalActionNotPerformed: true,
    };
  }

  const blockerReasons = Object.entries(gates)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate);
  const allPass = Object.values(gates).every((passed) => passed === true);
  const loanPathwayAdvancementAllowed =
    allPass && assessmentOutcome === "CLEARED";
  const assessmentRequirementStatus = triggered
    ? loanPathwayAdvancementAllowed
      ? "ENVIRONMENTAL_LINEAGE_CONFIRMED"
      : "ENVIRONMENTAL_GATE_BLOCKED"
    : "PATHWAY_EXEMPTION_RECORDED";

  return {
    triggered,
    pathwayExempt,
    pathwayType,
    assessmentType,
    providerType,
    assessmentOutcome,
    feeAmount,
    standardMarketRateAmount,
    gates,
    blockerReasons,
    loanPathwayAdvancementAllowed,
    assessmentRequirementStatus,
  };
}

// =============================================================================
// V2 signal builders
// =============================================================================

const V2_SIGNAL_IDS: readonly EnvironmentalComplianceV2SignalId[] = [
  "compliance_provider_license_alignment",
  "compliance_fee_disclosure_alignment",
  "compliance_spoke_isolation_alignment",
  "compliance_audit_anchor_alignment",
];

const V2_SIGNAL_LABELS: Record<EnvironmentalComplianceV2SignalId, string> = {
  compliance_provider_license_alignment: "Provider license alignment",
  compliance_fee_disclosure_alignment: "Fee disclosure alignment",
  compliance_spoke_isolation_alignment: "Spoke isolation alignment",
  compliance_audit_anchor_alignment: "Audit anchor alignment",
};

const V2_SIGNAL_REVIEW_ROUTES: Record<
  EnvironmentalComplianceV2SignalId,
  string
> = {
  compliance_provider_license_alignment:
    "/governance/environmental-compliance-v2",
  compliance_fee_disclosure_alignment:
    "/governance/environmental-compliance-v2",
  compliance_spoke_isolation_alignment:
    "/governance/environmental-compliance-v2",
  compliance_audit_anchor_alignment:
    "/governance/environmental-compliance-v2",
};

const DEFAULT_SIGNAL_DOCTRINE_REFS = [
  "ROLE-ARCH-001",
  "CANON-ECON-001",
  "CANON-SOVEREIGNTY-001",
  "TECH-CONN-001",
];

const DEFAULT_SIGNAL_BLOCKED_CLAIMS = [
  "official environmental report",
  "environmental clearance",
  "NEPA determination",
  "Phase I ESA report",
  "permit issued",
  "provider engagement",
  "fee authorization",
  "lender commitment",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
];

function readinessFromGates(gateNames: string[], gates: Record<string, boolean>): {
  ready: boolean;
  readinessPercent: number;
  coverageCount: number;
  failedGates: string[];
} {
  const checks = gateNames.map((name) => ({
    name,
    passed: gates[name] === true,
  }));
  const passedCount = checks.filter((c) => c.passed).length;
  const failedGates = checks.filter((c) => !c.passed).map((c) => c.name);
  return {
    ready: failedGates.length === 0,
    readinessPercent: Math.round((passedCount / gateNames.length) * 100),
    coverageCount: passedCount,
    failedGates,
  };
}

function buildProviderLicenseSignal(
  snapshot: EnvironmentalComplianceV2GateSnapshot,
  environmentalCapitalProgramCount: number
): EnvironmentalComplianceV2Signal {
  const id: EnvironmentalComplianceV2SignalId =
    "compliance_provider_license_alignment";

  if (!snapshot.triggered) {
    return {
      id,
      label: V2_SIGNAL_LABELS[id],
      status: "READY_FOR_REVIEW",
      readinessPercent: 100,
      coverageCount: 0,
      reviewSignals: [
        "pathway exemption recorded; provider license not required",
      ],
      blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
      reviewRoute: V2_SIGNAL_REVIEW_ROUTES[id],
      doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
    };
  }

  const { ready, readinessPercent, coverageCount, failedGates } =
    readinessFromGates(
      [
        "providerTypeAllowed",
        "providerLicenseRefPresent",
        "providerLicenseVerified",
      ],
      snapshot.gates
    );

  let status: EnvironmentalComplianceV2SignalStatus = "NEEDS_INPUT";
  if (ready) {
    status = "READY_FOR_REVIEW";
  } else if (
    environmentalCapitalProgramCount > 0 &&
    failedGates.includes("providerLicenseVerified")
  ) {
    status = "BLOCKED_BY_CONFLICT";
  }

  const reviewSignals = [
    `assessment type ${snapshot.assessmentType}`,
    `provider type ${snapshot.providerType}`,
    ...failedGates.map((gate) => `gate not satisfied: ${gate}`),
  ];

  return {
    id,
    label: V2_SIGNAL_LABELS[id],
    status,
    readinessPercent,
    coverageCount,
    reviewSignals,
    blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES[id],
    doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
  };
}

function buildFeeDisclosureSignal(
  snapshot: EnvironmentalComplianceV2GateSnapshot
): EnvironmentalComplianceV2Signal {
  const id: EnvironmentalComplianceV2SignalId =
    "compliance_fee_disclosure_alignment";

  if (!snapshot.triggered) {
    return {
      id,
      label: V2_SIGNAL_LABELS[id],
      status: "READY_FOR_REVIEW",
      readinessPercent: 100,
      coverageCount: 0,
      reviewSignals: ["pathway exemption recorded; no fee required"],
      blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
      reviewRoute: V2_SIGNAL_REVIEW_ROUTES[id],
      doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
    };
  }

  const { ready, readinessPercent, coverageCount, failedGates } =
    readinessFromGates(
      [
        "feeDisclosureRefPresent",
        "feeDisclosedBeforeInitiation",
        "borrowerExternalFirmRightPreserved",
        "noFeeSurchargeOrPreference",
      ],
      snapshot.gates
    );

  const status: EnvironmentalComplianceV2SignalStatus = ready
    ? "READY_FOR_REVIEW"
    : "NEEDS_INPUT";

  const reviewSignals = [
    `fee amount ${snapshot.feeAmount}`,
    `standard market rate ${snapshot.standardMarketRateAmount}`,
    ...failedGates.map((gate) => `gate not satisfied: ${gate}`),
  ];

  return {
    id,
    label: V2_SIGNAL_LABELS[id],
    status,
    readinessPercent,
    coverageCount,
    reviewSignals,
    blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES[id],
    doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
  };
}

function buildSpokeIsolationSignal(
  snapshot: EnvironmentalComplianceV2GateSnapshot
): EnvironmentalComplianceV2Signal {
  const id: EnvironmentalComplianceV2SignalId =
    "compliance_spoke_isolation_alignment";

  if (!snapshot.triggered) {
    return {
      id,
      label: V2_SIGNAL_LABELS[id],
      status: "READY_FOR_REVIEW",
      readinessPercent: 100,
      coverageCount: 0,
      reviewSignals: [
        "pathway exemption recorded; spoke isolation review not triggered",
      ],
      blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
      reviewRoute: V2_SIGNAL_REVIEW_ROUTES[id],
      doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
    };
  }

  const { ready, readinessPercent, coverageCount, failedGates } =
    readinessFromGates(
      ["spokeIsolationConfirmed", "bankerSpokeIsolated"],
      snapshot.gates
    );

  // Spoke isolation is a constitutional gate (Vol I ROLE-ARCH-001).
  // Failure escalates to BLOCKED_BY_CONFLICT, not just NEEDS_INPUT.
  const status: EnvironmentalComplianceV2SignalStatus = ready
    ? "READY_FOR_REVIEW"
    : "BLOCKED_BY_CONFLICT";

  const reviewSignals = [
    ...failedGates.map((gate) => `gate not satisfied: ${gate}`),
    ready
      ? "Environmental Engineering Spoke and Banker Spoke isolation confirmed"
      : "spoke isolation not confirmed while environmental pathway is TRIGGERED",
  ];

  return {
    id,
    label: V2_SIGNAL_LABELS[id],
    status,
    readinessPercent,
    coverageCount,
    reviewSignals,
    blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES[id],
    doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
  };
}

function buildAuditAnchorSignal(
  snapshot: EnvironmentalComplianceV2GateSnapshot
): EnvironmentalComplianceV2Signal {
  const id: EnvironmentalComplianceV2SignalId =
    "compliance_audit_anchor_alignment";

  if (!snapshot.triggered) {
    return {
      id,
      label: V2_SIGNAL_LABELS[id],
      status: "READY_FOR_REVIEW",
      readinessPercent: 100,
      coverageCount: 0,
      reviewSignals: [
        "pathway exemption recorded; audit anchor not triggered",
      ],
      blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
      reviewRoute: V2_SIGNAL_REVIEW_ROUTES[id],
      doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
    };
  }

  const { ready, readinessPercent, coverageCount, failedGates } =
    readinessFromGates(
      ["auditAnchorRefPresent", "escalationRefPresentWhenRequired"],
      snapshot.gates
    );

  const status: EnvironmentalComplianceV2SignalStatus = ready
    ? "READY_FOR_REVIEW"
    : "NEEDS_INPUT";

  const reviewSignals = [
    `assessment outcome ${snapshot.assessmentOutcome}`,
    ...failedGates.map((gate) => `gate not satisfied: ${gate}`),
  ];

  return {
    id,
    label: V2_SIGNAL_LABELS[id],
    status,
    readinessPercent,
    coverageCount,
    reviewSignals,
    blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    reviewRoute: V2_SIGNAL_REVIEW_ROUTES[id],
    doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
  };
}

const V2_SIGNAL_BUILDERS: Record<
  EnvironmentalComplianceV2SignalId,
  (
    snapshot: EnvironmentalComplianceV2GateSnapshot,
    eiV2: EnvironmentalIntakeV2Result
  ) => EnvironmentalComplianceV2Signal
> = {
  compliance_provider_license_alignment: (snapshot, eiV2) =>
    buildProviderLicenseSignal(
      snapshot,
      eiV2.summary.environmentalCapitalProgramCount
    ),
  compliance_fee_disclosure_alignment: (snapshot) =>
    buildFeeDisclosureSignal(snapshot),
  compliance_spoke_isolation_alignment: (snapshot) =>
    buildSpokeIsolationSignal(snapshot),
  compliance_audit_anchor_alignment: (snapshot) =>
    buildAuditAnchorSignal(snapshot),
};

// =============================================================================
// Cross-source conflicts
// =============================================================================

function buildCrossSourceConflicts(
  snapshot: EnvironmentalComplianceV2GateSnapshot,
  eiV2: EnvironmentalIntakeV2Result,
  declaredCustomerTypes: string[],
  sovereignFederationAllowed: boolean
): EnvironmentalComplianceV2CrossSourceConflict[] {
  const conflicts: EnvironmentalComplianceV2CrossSourceConflict[] = [];

  // v1 gate-snapshot blocked while v2 environmental Capital Graph
  // coverage is present (review wedge).
  if (
    snapshot.triggered &&
    !snapshot.loanPathwayAdvancementAllowed &&
    eiV2.summary.environmentalCapitalProgramCount > 0
  ) {
    conflicts.push({
      conflictId: "ec-v2-gate-blocked-capital-coverage-present",
      topic:
        "v1 environmental-compliance gate posture blocked while v2 environmental Capital Graph coverage is present",
      description: `The v1 gate posture reported ${snapshot.blockerReasons.length} blocker reason(s) (${snapshot.blockerReasons.join(", ")}) while Environmental Intake v2 surfaced ${eiV2.summary.environmentalCapitalProgramCount} environmental Capital Graph program(s). Review whether provider license / fee disclosure / spoke isolation / audit anchor signals are awaiting reviewer evidence.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/environmental-compliance-v2",
    });
  }

  // Upstream Environmental Intake v2 cross-source conflicts propagated.
  if (eiV2.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "ec-v2-upstream-ei-v2-conflicts",
      topic:
        "Upstream Environmental Intake v2 surfaced cross-source conflicts",
      description: `Environmental Intake v2 composition surfaced ${eiV2.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Environmental Compliance v2; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/environmental-compliance-v2",
    });
  }

  // Sovereign customer types declared without authorization.
  const declaredSovereign = declaredCustomerTypes.some((token) =>
    /tribe|tribal|sovereign/i.test(token)
  );
  if (declaredSovereign && !sovereignFederationAllowed) {
    conflicts.push({
      conflictId: "ec-v2-sovereign-declared-without-authorization",
      topic:
        "Borrower declared a sovereign customer type without sovereign federation authorization",
      description:
        "One or more declared customer types reference a sovereign archetype (e.g. federally recognized tribe), but the scope did not authorize sovereign federation participation. Sovereign environmental compliance posture remains hidden until a reviewer explicitly authorizes sovereign federation participation.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/environmental-compliance-v2",
    });
  }

  // Spoke isolation not confirmed while v2 environmental pathway is TRIGGERED.
  if (snapshot.triggered && snapshot.gates.spokeIsolationConfirmed !== true) {
    conflicts.push({
      conflictId: "ec-v2-spoke-isolation-not-confirmed",
      topic:
        "Environmental Engineering Spoke isolation not confirmed while v2 environmental pathway is TRIGGERED",
      description:
        "Vol I ROLE-ARCH-001 requires Environmental Engineering Spoke isolation from the Banker Spoke when an environmental pathway is triggered. The v1 gate posture has not confirmed spoke isolation; environmental compliance posture is BLOCKED_BY_CONFLICT until a reviewer confirms isolation.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/environmental-compliance-v2",
    });
  }

  // Conditional / escalated / failed outcome without escalation ref.
  if (
    snapshot.triggered &&
    ["CONDITIONAL", "ESCALATED", "FAILED"].includes(snapshot.assessmentOutcome) &&
    snapshot.gates.escalationRefPresentWhenRequired !== true
  ) {
    conflicts.push({
      conflictId: "ec-v2-escalation-ref-missing",
      topic: `Assessment outcome ${snapshot.assessmentOutcome} without escalation reference`,
      description: `The v1 gate posture reports an ${snapshot.assessmentOutcome} assessment outcome but no escalation reference is present. Review escalation routing to environmental-compliance v1 before declaring environmental lineage confirmed.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: "/governance/environmental-compliance-v2",
    });
  }

  return conflicts;
}

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

// =============================================================================
// Runtime composition
// =============================================================================

export function composeEnvironmentalComplianceV2(
  input: EnvironmentalComplianceV2Input = {}
): EnvironmentalComplianceV2Result {
  // 1. Compose Environmental Intake v2 (the full canonical v2 stack
  //    at the borrower-context scope + legacy v1 environmental
  //    intake bridge).
  const eiV2 = composeEnvironmentalIntakeV2({
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    onboardingState: input.onboardingState,
    declaredCustomerTypes: input.declaredCustomerTypes ?? [],
    intendedUses: input.intendedUses ?? [],
    legacy: input.legacyIntake,
    scope: input.scope ?? null,
    metadata: input.metadata ?? null,
  });

  // 2. Compose v1 environmental-compliance gate snapshot
  //    (advisory replay; no DB writes).
  const snapshot = computeGateSnapshot(input.complianceGate ?? {});

  // 3. Build v2 governed compliance signals.
  const v2Signals: EnvironmentalComplianceV2Signal[] = V2_SIGNAL_IDS.map((id) =>
    V2_SIGNAL_BUILDERS[id](snapshot, eiV2)
  );

  // 4. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    snapshot,
    eiV2,
    input.declaredCustomerTypes ?? [],
    input.scope?.sovereignFederationAllowed === true
  );

  // 5. Summarize.
  const v2ReadyCount = v2Signals.filter(
    (s) => s.status === "READY_FOR_REVIEW"
  ).length;
  const v2NeedsInputCount = v2Signals.filter(
    (s) => s.status === "NEEDS_INPUT"
  ).length;
  const v2BlockedCount = v2Signals.filter(
    (s) => s.status === "BLOCKED_BY_CONFLICT"
  ).length;
  const v2NotStartedCount = v2Signals.filter(
    (s) => s.status === "NOT_STARTED"
  ).length;
  const v2OverallReadinessPercent =
    v2Signals.length === 0
      ? 0
      : Math.round(
          v2Signals.reduce((sum, s) => sum + s.readinessPercent, 0) /
            v2Signals.length
        );

  const v1GateCount = Object.keys(snapshot.gates).length;
  const v1GatesPassedCount = Object.values(snapshot.gates).filter(
    (v) => v === true
  ).length;
  const v1GatesBlockedCount = v1GateCount - v1GatesPassedCount;

  const summary: EnvironmentalComplianceV2Summary = {
    v2SignalCount: v2Signals.length,
    v2ReadyCount,
    v2NeedsInputCount,
    v2BlockedCount,
    v2NotStartedCount,
    v2OverallReadinessPercent,
    v1GateCount,
    v1GatesPassedCount,
    v1GatesBlockedCount,
    v1BlockerReasonCount: snapshot.blockerReasons.length,
    v1EnvironmentalAssessmentTriggered: snapshot.triggered,
    v1LoanPathwayAdvancementAllowed: snapshot.loanPathwayAdvancementAllowed,
    v1FeeAmount: snapshot.feeAmount,
    v1StandardMarketRateAmount: snapshot.standardMarketRateAmount,
    v1AssessmentOutcome: snapshot.assessmentOutcome,
    environmentalIntakeV2SignalCount: eiV2.summary.v2SignalCount,
    environmentalIntakeV2BlockedCount: eiV2.summary.v2BlockedCount,
    environmentalEligibleCustomerTypeCount:
      eiV2.summary.environmentalEligibleCustomerTypeCount,
    environmentalCapitalProgramCount:
      eiV2.summary.environmentalCapitalProgramCount,
    crossSourceConflictCount: crossSourceConflicts.length,
  };

  const recommendedReviewRoutes = unique([
    "/governance/environmental-compliance-v2",
    "/governance/environmental-intake-v2",
    "/governance/readiness-assessment-v2",
    "/governance/borrower-onboarding-core-v2",
    "/governance/opportunity-discovery-v2",
    "/governance/financing-pathway-engine-v2",
    "/governance/revenue-intelligence-v2",
    "/governance/capital-graph",
    "/governance/customer-types",
    "/environmental-compliance",
    "/portal/borrower/environmental-intake",
    "/applications",
    "/documents",
    "/data-rights",
    "/evidence-packets",
    "/audit-replay",
    "/governance",
    "/reviews",
  ]);

  return {
    runtimeVersion: ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v2Signals,
    gateSnapshot: snapshot,
    environmentalIntakeV2: eiV2,
    crossSourceConflicts,
    legacyBridge: {
      environmentalComplianceVersion: ENVIRONMENTAL_COMPLIANCE_V1_LINEAGE_REF,
      environmentalIntakeV2Version: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
      environmentalIntakeVersion: ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
      borrowerOnboardingCoreV2Version:
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: [...ENVIRONMENTAL_COMPLIANCE_V2_DISCLOSURES],
    productionRestrictions: [
      ...ENVIRONMENTAL_COMPLIANCE_V2_PRODUCTION_RESTRICTIONS,
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    environmentalComplianceV2InternalOnly: true,
    spokeIsolationRequired: true,
    feeAutonomyPreserved: true,
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
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noOfficialEnvironmentalReport: true,
    noEnvironmentalClearance: true,
    noNEPADetermination: true,
    noPhaseIESAReport: true,
    noPermitIssued: true,
    noProviderEngagement: true,
    noFeeAuthorization: true,
    noLiveExternalAction: true,
    noSourceCertainty: true,
    noNoticeSend: true,
    replaySafe: true,
    auditSafe: true,
    federationScoped: true,
    conflictPreserving: true,
  };
}

export function environmentalComplianceV2Lineage(): {
  runtimeVersion: string;
  environmentalIntakeV2Version: string;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
  legacyEnvironmentalIntakeVersion: string;
  legacyEnvironmentalComplianceVersion: string;
} {
  return {
    runtimeVersion: ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
    environmentalIntakeV2Version: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    borrowerOnboardingCoreV2Version: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
    legacyEnvironmentalIntakeVersion: ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
    legacyEnvironmentalComplianceVersion:
      ENVIRONMENTAL_COMPLIANCE_V1_LINEAGE_REF,
  };
}

export const ENVIRONMENTAL_COMPLIANCE_V2_SIGNAL_IDS = V2_SIGNAL_IDS;
