import { BorrowerOnboardingState } from "@/lib/borrower/onboardingCore";
import { BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION } from "@/lib/borrower/onboardingCoreV2Runtime";
import {
  CAPITAL_GRAPH_REGISTRY,
  CapitalCategoryId,
} from "@/lib/capital-graph/capitalGraphRuntime";
import {
  ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
  EnvironmentalComplianceV2GateInput,
  EnvironmentalComplianceV2Input,
  EnvironmentalComplianceV2Result,
  composeEnvironmentalComplianceV2,
} from "@/lib/environmental/complianceV2Runtime";
import { ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION } from "@/lib/environmental/intakeV2Runtime";
import { CUSTOMER_TYPE_REGISTRY } from "@/lib/customer-types/customerTypeRuntime";
import { FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION } from "@/lib/financing/pathwayEngineV2Runtime";
import { OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION } from "@/lib/platform/authorities/opportunity";
import { REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION } from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Environmental Risk Assessment v2 Runtime
 *
 * The fourteenth downstream consumer of the Capital Graph and
 * Customer Type Registry, composed on top of the full canonical v2
 * stack through Environmental Compliance v2 (Build 28). Adds a
 * declarative site-risk overlay that maps borrower-described site
 * descriptors to governed risk signals, preserving cross-source
 * conflicts where the v1 compliance gate is CLEARED but the v2 risk
 * overlay surfaces high-impact factors.
 *
 * There is no v1 environmental-risk-assessment runtime in the
 * canonical inventory. This is a v2-native composition: the
 * advisory replay is a pure-functional risk-factor evaluation over
 * borrower-declared site descriptors. The v2 runtime does NOT
 * fetch external risk data, does NOT contact mapping services, and
 * does NOT make environmental determinations. It composes an
 * advisory triage view that routes high-risk factors to human
 * review.
 *
 * Six governed risk dimensions are composed:
 * - `risk_site_contamination_alignment`
 * - `risk_water_wetland_alignment`
 * - `risk_floodplain_alignment`
 * - `risk_tribal_land_alignment`
 * - `risk_historic_district_alignment`
 * - `risk_endangered_species_habitat_alignment`
 * - `risk_brownfield_alignment`
 *
 * Each dimension reads borrower-declared descriptors with values
 * NONE / ADJACENT / ON_SITE (or ADJACENT_DISTRICT / WITHIN_DISTRICT
 * for historic; ON_SOVEREIGN_LAND for tribal; NONE / 100_YEAR /
 * 500_YEAR for floodplain; NONE / RECORDED / PENDING_INVESTIGATION
 * for contamination) and produces READY_FOR_REVIEW for NONE,
 * NEEDS_INPUT for UNKNOWN, and BLOCKED_BY_CONFLICT for high-impact
 * descriptors. Tribal-land ON_SOVEREIGN_LAND escalates to a
 * sovereign-federation conflict per Vol I.
 *
 * Cross-source conflicts:
 * - v1 environmental-compliance gate CLEARED while v2 risk surfaces
 *   any BLOCKED_BY_CONFLICT signal (review wedge).
 * - Upstream Environmental Compliance v2 cross-source conflict
 *   propagation.
 * - Tribal land declared ON_SOVEREIGN_LAND without sovereign
 *   federation authorization.
 * - Floodplain 100_YEAR with REAL_ESTATE pathway and the v1 gate
 *   not BLOCKED.
 * - Site contamination RECORDED or PENDING_INVESTIGATION with no
 *   Phase II ESA assessment type recorded.
 *
 * Constitutional posture:
 * - Internal advisory environmental risk posture only.
 * - No external environmental data fetch (mapping services, FEMA
 *   flood, FWS habitat, EPA brownfield).
 * - No environmental clearance, NEPA determination, Phase I ESA
 *   report, Phase II ESA report, permit issued.
 * - No autonomous environmental risk / compliance / intake /
 *   onboarding / readiness / eligibility / pathway / opportunity /
 *   intelligence / evidence / certification determination,
 *   credit decision, lender commitment, public verification,
 *   regulatory reliance, source certainty claim, payment
 *   authorization, live external action, notice send, or legal
 *   reliance.
 * - Environmental Engineering Spoke isolation preserved.
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): keeps risk assessment
 *   subordinate to constitutional authority; risk signals never
 *   grant authority.
 * - Vol II (Regulatory Governance): blocks risk assessment from
 *   becoming environmental clearance, NEPA, Phase I/II ESA report,
 *   permit, official environmental report, public verification,
 *   regulatory reliance, legal reliance.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining
 *   environmental-risk-assessment-v2-runtime-v0.1.0 →
 *   environmental-compliance-v2-runtime-v0.1.0 →
 *   environmental-intake-v2-runtime-v0.1.0 →
 *   borrower-onboarding-core-v2-runtime-v0.1.0 → ... → capital
 *   graph + customer type.
 * - Vol III-B: runtime evidence with classification, observability,
 *   explainability, replay verification posture.
 * - Vol IV: routes governed handoffs to Environmental Compliance
 *   v2, Environmental Intake v2, environmental-compliance v1,
 *   portal-borrower-environmental-intake, applications, documents,
 *   data-rights, evidence packets, audit replay, governance,
 *   reviews, module readiness.
 * - Vol V: preserves CANON-SOVEREIGNTY-001 tribal-land sovereign
 *   review, claims governance, controlled disclosure, replay,
 *   audit.
 * - Vol VI: keeps every composed entry behind a public-safe DTO;
 *   no raw site / property / borrower records; no live external
 *   fetch; no source-certainty claim.
 */

export const ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION =
  "environmental-risk-assessment-v2-runtime-v0.1.0";

// =============================================================================
// Risk descriptor input types
// =============================================================================

export type EnvironmentalRiskContaminationStatus =
  | "NONE"
  | "RECORDED"
  | "PENDING_INVESTIGATION"
  | "UNKNOWN";

export type EnvironmentalRiskProximityStatus =
  | "NONE"
  | "ADJACENT"
  | "ON_SITE"
  | "UNKNOWN";

export type EnvironmentalRiskFloodplainStatus =
  | "NONE"
  | "500_YEAR"
  | "100_YEAR"
  | "UNKNOWN";

export type EnvironmentalRiskTribalLandStatus =
  | "NONE"
  | "ADJACENT"
  | "ON_SOVEREIGN_LAND"
  | "UNKNOWN";

export type EnvironmentalRiskHistoricDistrictStatus =
  | "NONE"
  | "ADJACENT"
  | "WITHIN_DISTRICT"
  | "UNKNOWN";

export type EnvironmentalRiskOverlayInput = {
  siteContaminationHistory?: EnvironmentalRiskContaminationStatus | null;
  waterWetlandProximity?: EnvironmentalRiskProximityStatus | null;
  floodplainStatus?: EnvironmentalRiskFloodplainStatus | null;
  tribalLandStatus?: EnvironmentalRiskTribalLandStatus | null;
  historicDistrictStatus?: EnvironmentalRiskHistoricDistrictStatus | null;
  endangeredSpeciesHabitatStatus?: EnvironmentalRiskProximityStatus | null;
  brownfieldStatus?: EnvironmentalRiskProximityStatus | null;
};

export type EnvironmentalRiskAssessmentV2Input = {
  reviewerRole?: string | null;
  userId?: string | null;
  applicationId?: string | null;
  onboardingState?: BorrowerOnboardingState;
  declaredCustomerTypes?: string[];
  intendedUses?: string[];
  legacyIntake?: EnvironmentalComplianceV2Input["legacyIntake"];
  scope?: {
    capitalCategoryIds?: CapitalCategoryId[];
    sovereignFederationAllowed?: boolean;
  } | null;
  complianceGate?: EnvironmentalComplianceV2GateInput;
  riskOverlay?: EnvironmentalRiskOverlayInput;
  metadata?: Record<string, unknown> | null;
};

// =============================================================================
// Signal types
// =============================================================================

export type EnvironmentalRiskAssessmentV2SignalId =
  | "risk_site_contamination_alignment"
  | "risk_water_wetland_alignment"
  | "risk_floodplain_alignment"
  | "risk_tribal_land_alignment"
  | "risk_historic_district_alignment"
  | "risk_endangered_species_habitat_alignment"
  | "risk_brownfield_alignment";

export type EnvironmentalRiskAssessmentV2SignalStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "BLOCKED_BY_CONFLICT"
  | "NOT_STARTED";

export type EnvironmentalRiskAssessmentV2RiskTier =
  | "NO_RISK"
  | "ADJACENT_REVIEW"
  | "ON_SITE_REVIEW"
  | "SOVEREIGN_REVIEW"
  | "DATA_GAP";

export type EnvironmentalRiskAssessmentV2Signal = {
  id: EnvironmentalRiskAssessmentV2SignalId;
  label: string;
  descriptor: string;
  declaredValue: string;
  riskTier: EnvironmentalRiskAssessmentV2RiskTier;
  status: EnvironmentalRiskAssessmentV2SignalStatus;
  readinessPercent: number;
  reviewSignals: string[];
  blockedClaims: string[];
  reviewRoute: string;
  doctrineRefs: string[];
};

export type EnvironmentalRiskAssessmentV2CrossSourceConflict = {
  conflictId: string;
  topic: string;
  description: string;
  resolution: "REQUIRES_HUMAN_REVIEW";
  reviewRoute: string;
};

export type EnvironmentalRiskAssessmentV2LegacyBridge = {
  environmentalComplianceV2Version: string;
  environmentalIntakeV2Version: string;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
};

export type EnvironmentalRiskAssessmentV2Summary = {
  v2SignalCount: number;
  v2ReadyCount: number;
  v2NeedsInputCount: number;
  v2BlockedCount: number;
  v2NotStartedCount: number;
  v2OverallReadinessPercent: number;
  v2HighRiskSignalCount: number;
  v2DataGapSignalCount: number;
  upstreamComplianceTriggered: boolean;
  upstreamComplianceLoanAdvancementAllowed: boolean;
  upstreamComplianceConflictCount: number;
  crossSourceConflictCount: number;
};

export type EnvironmentalRiskAssessmentV2Result = {
  runtimeVersion: string;
  generatedAt: string;
  reviewerRole: string | null;
  applicationId: string | null;
  summary: EnvironmentalRiskAssessmentV2Summary;
  v2Signals: EnvironmentalRiskAssessmentV2Signal[];
  environmentalComplianceV2: EnvironmentalComplianceV2Result;
  crossSourceConflicts: EnvironmentalRiskAssessmentV2CrossSourceConflict[];
  legacyBridge: EnvironmentalRiskAssessmentV2LegacyBridge;
  recommendedReviewRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  environmentalRiskAssessmentV2InternalOnly: true;
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
  noAutonomousEnvironmentalRiskAssessment: true;
  noPublicVerification: true;
  noRegulatoryReliance: true;
  noLenderCommitment: true;
  noLegalReliance: true;
  noOfficialEnvironmentalReport: true;
  noEnvironmentalClearance: true;
  noNEPADetermination: true;
  noPhaseIESAReport: true;
  noPhaseIIESAReport: true;
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
// Canonical disclosures / production restrictions
// =============================================================================

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "preapproval",
  "autonomous environmental risk determination",
  "autonomous environmental compliance determination",
  "autonomous environmental intake determination",
  "autonomous pathway determination",
  "autonomous opportunity determination",
  "credit decision",
  "lender commitment",
  "program approval",
  "official environmental report",
  "environmental clearance",
  "NEPA determination",
  "Phase I ESA report",
  "Phase II ESA report",
  "permit issued",
  "provider engagement",
  "fee authorization",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
  "live external action",
  "payment authorization",
  "notice send",
] as const;

export const ENVIRONMENTAL_RISK_ASSESSMENT_V2_DISCLOSURES = [
  "Environmental Risk Assessment v2 output is advisory site-risk-overlay posture only, replay-safe, audit-safe, and conflict-preserving.",
  "Environmental Risk Assessment v2 does not perform a live external risk data fetch (no mapping services, no FEMA flood data, no FWS habitat data, no EPA brownfield data) and does not claim source certainty.",
  "Environmental Risk Assessment v2 does not authorize external environmental provider engagement, fee authorization, official environmental report, environmental clearance, NEPA determination, Phase I/II ESA report, permit issued, autonomous environmental risk / compliance / intake / onboarding / readiness / customer eligibility / pathway / opportunity / intelligence / evidence / certification determination, credit decision, lender commitment, public verification, regulatory reliance, or legal reliance.",
  "Risk signals are constructed from borrower-declared site descriptors and serve as triage routing into human review. Reviewers must independently verify each high-risk descriptor before any treatment.",
  "Tribal-land ON_SOVEREIGN_LAND escalates to a sovereign-federation review; sovereign customer types remain hidden unless named federation participation is authorized (CANON-SOVEREIGNTY-001).",
  "Cross-source conflicts between Environmental Compliance v2, Environmental Intake v2, the v1 environmental-compliance gate posture, and the v2 risk overlay are preserved as first-class evidence and never collapsed.",
  "Environmental Engineering Spoke isolation is preserved; no Banker Spoke decision flows from this risk posture.",
  "Human review is required before any composed risk signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const ENVIRONMENTAL_RISK_ASSESSMENT_V2_PRODUCTION_RESTRICTIONS = [
  "no autonomous lending decision",
  "no autonomous environmental risk determination",
  "no autonomous environmental compliance determination",
  "no autonomous environmental intake determination",
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
  "no official environmental report",
  "no environmental clearance",
  "no NEPA determination",
  "no Phase I ESA report",
  "no Phase II ESA report",
  "no permit issued",
  "no provider engagement",
  "no fee authorization",
  "no public verification",
  "no regulatory reliance",
  "no legal reliance",
  "no live external action",
  "no source certainty",
  "no notice send",
  "no payment authorization",
] as const;

// =============================================================================
// Signal definitions
// =============================================================================

const V2_SIGNAL_IDS: readonly EnvironmentalRiskAssessmentV2SignalId[] = [
  "risk_site_contamination_alignment",
  "risk_water_wetland_alignment",
  "risk_floodplain_alignment",
  "risk_tribal_land_alignment",
  "risk_historic_district_alignment",
  "risk_endangered_species_habitat_alignment",
  "risk_brownfield_alignment",
];

const V2_SIGNAL_LABELS: Record<
  EnvironmentalRiskAssessmentV2SignalId,
  string
> = {
  risk_site_contamination_alignment: "Site contamination history",
  risk_water_wetland_alignment: "Water / wetland proximity",
  risk_floodplain_alignment: "Floodplain status",
  risk_tribal_land_alignment: "Tribal land status",
  risk_historic_district_alignment: "Historic district status",
  risk_endangered_species_habitat_alignment:
    "Endangered species habitat proximity",
  risk_brownfield_alignment: "Brownfield status",
};

const V2_SIGNAL_DESCRIPTORS: Record<
  EnvironmentalRiskAssessmentV2SignalId,
  string
> = {
  risk_site_contamination_alignment:
    "borrower-declared site contamination history (NONE / RECORDED / PENDING_INVESTIGATION / UNKNOWN)",
  risk_water_wetland_alignment:
    "borrower-declared water / wetland proximity (NONE / ADJACENT / ON_SITE / UNKNOWN)",
  risk_floodplain_alignment:
    "borrower-declared floodplain status (NONE / 500_YEAR / 100_YEAR / UNKNOWN)",
  risk_tribal_land_alignment:
    "borrower-declared tribal land status (NONE / ADJACENT / ON_SOVEREIGN_LAND / UNKNOWN)",
  risk_historic_district_alignment:
    "borrower-declared historic district status (NONE / ADJACENT / WITHIN_DISTRICT / UNKNOWN)",
  risk_endangered_species_habitat_alignment:
    "borrower-declared endangered species habitat proximity (NONE / ADJACENT / ON_SITE / UNKNOWN)",
  risk_brownfield_alignment:
    "borrower-declared brownfield status (NONE / ADJACENT / ON_SITE / UNKNOWN)",
};

const REVIEW_ROUTE = "/governance/environmental-risk-assessment-v2";

const DEFAULT_SIGNAL_DOCTRINE_REFS = [
  "ROLE-ARCH-001",
  "CANON-SOVEREIGNTY-001",
  "TECH-CONN-001",
];

const DEFAULT_SIGNAL_BLOCKED_CLAIMS = [
  "official environmental report",
  "environmental clearance",
  "NEPA determination",
  "Phase I ESA report",
  "Phase II ESA report",
  "permit issued",
  "provider engagement",
  "fee authorization",
  "lender commitment",
  "public verification",
  "regulatory reliance",
  "legal reliance",
  "source certainty",
];

function tierToStatus(
  tier: EnvironmentalRiskAssessmentV2RiskTier
): EnvironmentalRiskAssessmentV2SignalStatus {
  switch (tier) {
    case "NO_RISK":
      return "READY_FOR_REVIEW";
    case "ADJACENT_REVIEW":
      return "NEEDS_INPUT";
    case "ON_SITE_REVIEW":
      return "BLOCKED_BY_CONFLICT";
    case "SOVEREIGN_REVIEW":
      return "BLOCKED_BY_CONFLICT";
    case "DATA_GAP":
      return "NEEDS_INPUT";
  }
}

function tierToReadiness(
  tier: EnvironmentalRiskAssessmentV2RiskTier
): number {
  switch (tier) {
    case "NO_RISK":
      return 100;
    case "ADJACENT_REVIEW":
      return 60;
    case "ON_SITE_REVIEW":
      return 25;
    case "SOVEREIGN_REVIEW":
      return 25;
    case "DATA_GAP":
      return 40;
  }
}

function evalContaminationTier(
  value: EnvironmentalRiskContaminationStatus
): EnvironmentalRiskAssessmentV2RiskTier {
  switch (value) {
    case "NONE":
      return "NO_RISK";
    case "RECORDED":
      return "ON_SITE_REVIEW";
    case "PENDING_INVESTIGATION":
      return "ON_SITE_REVIEW";
    case "UNKNOWN":
      return "DATA_GAP";
  }
}

function evalProximityTier(
  value: EnvironmentalRiskProximityStatus
): EnvironmentalRiskAssessmentV2RiskTier {
  switch (value) {
    case "NONE":
      return "NO_RISK";
    case "ADJACENT":
      return "ADJACENT_REVIEW";
    case "ON_SITE":
      return "ON_SITE_REVIEW";
    case "UNKNOWN":
      return "DATA_GAP";
  }
}

function evalFloodplainTier(
  value: EnvironmentalRiskFloodplainStatus
): EnvironmentalRiskAssessmentV2RiskTier {
  switch (value) {
    case "NONE":
      return "NO_RISK";
    case "500_YEAR":
      return "ADJACENT_REVIEW";
    case "100_YEAR":
      return "ON_SITE_REVIEW";
    case "UNKNOWN":
      return "DATA_GAP";
  }
}

function evalTribalLandTier(
  value: EnvironmentalRiskTribalLandStatus
): EnvironmentalRiskAssessmentV2RiskTier {
  switch (value) {
    case "NONE":
      return "NO_RISK";
    case "ADJACENT":
      return "ADJACENT_REVIEW";
    case "ON_SOVEREIGN_LAND":
      return "SOVEREIGN_REVIEW";
    case "UNKNOWN":
      return "DATA_GAP";
  }
}

function evalHistoricDistrictTier(
  value: EnvironmentalRiskHistoricDistrictStatus
): EnvironmentalRiskAssessmentV2RiskTier {
  switch (value) {
    case "NONE":
      return "NO_RISK";
    case "ADJACENT":
      return "ADJACENT_REVIEW";
    case "WITHIN_DISTRICT":
      return "ON_SITE_REVIEW";
    case "UNKNOWN":
      return "DATA_GAP";
  }
}

type SignalDescriptor = {
  declared: string;
  tier: EnvironmentalRiskAssessmentV2RiskTier;
};

function resolveOverlay(
  overlay: EnvironmentalRiskOverlayInput | undefined
): Record<EnvironmentalRiskAssessmentV2SignalId, SignalDescriptor> {
  const o = overlay ?? {};
  const siteContamination: EnvironmentalRiskContaminationStatus =
    o.siteContaminationHistory ?? "UNKNOWN";
  const waterWetland: EnvironmentalRiskProximityStatus =
    o.waterWetlandProximity ?? "UNKNOWN";
  const floodplain: EnvironmentalRiskFloodplainStatus =
    o.floodplainStatus ?? "UNKNOWN";
  const tribalLand: EnvironmentalRiskTribalLandStatus =
    o.tribalLandStatus ?? "UNKNOWN";
  const historic: EnvironmentalRiskHistoricDistrictStatus =
    o.historicDistrictStatus ?? "UNKNOWN";
  const habitat: EnvironmentalRiskProximityStatus =
    o.endangeredSpeciesHabitatStatus ?? "UNKNOWN";
  const brownfield: EnvironmentalRiskProximityStatus =
    o.brownfieldStatus ?? "UNKNOWN";

  return {
    risk_site_contamination_alignment: {
      declared: siteContamination,
      tier: evalContaminationTier(siteContamination),
    },
    risk_water_wetland_alignment: {
      declared: waterWetland,
      tier: evalProximityTier(waterWetland),
    },
    risk_floodplain_alignment: {
      declared: floodplain,
      tier: evalFloodplainTier(floodplain),
    },
    risk_tribal_land_alignment: {
      declared: tribalLand,
      tier: evalTribalLandTier(tribalLand),
    },
    risk_historic_district_alignment: {
      declared: historic,
      tier: evalHistoricDistrictTier(historic),
    },
    risk_endangered_species_habitat_alignment: {
      declared: habitat,
      tier: evalProximityTier(habitat),
    },
    risk_brownfield_alignment: {
      declared: brownfield,
      tier: evalProximityTier(brownfield),
    },
  };
}

function buildSignal(
  id: EnvironmentalRiskAssessmentV2SignalId,
  descriptor: SignalDescriptor
): EnvironmentalRiskAssessmentV2Signal {
  const reviewSignals: string[] = [
    `declared value ${descriptor.declared}`,
    `risk tier ${descriptor.tier}`,
  ];
  if (descriptor.tier === "ON_SITE_REVIEW") {
    reviewSignals.push("escalate to Environmental Engineering Spoke review");
  }
  if (descriptor.tier === "SOVEREIGN_REVIEW") {
    reviewSignals.push(
      "sovereign federation participation required before any review treatment"
    );
  }
  if (descriptor.tier === "DATA_GAP") {
    reviewSignals.push("borrower must declare or confirm value");
  }
  return {
    id,
    label: V2_SIGNAL_LABELS[id],
    descriptor: V2_SIGNAL_DESCRIPTORS[id],
    declaredValue: descriptor.declared,
    riskTier: descriptor.tier,
    status: tierToStatus(descriptor.tier),
    readinessPercent: tierToReadiness(descriptor.tier),
    reviewSignals,
    blockedClaims: [...DEFAULT_SIGNAL_BLOCKED_CLAIMS],
    reviewRoute: REVIEW_ROUTE,
    doctrineRefs: [...DEFAULT_SIGNAL_DOCTRINE_REFS],
  };
}

// =============================================================================
// Cross-source conflicts
// =============================================================================

function buildCrossSourceConflicts(
  signals: EnvironmentalRiskAssessmentV2Signal[],
  ecV2: EnvironmentalComplianceV2Result,
  scope: EnvironmentalRiskAssessmentV2Input["scope"],
  complianceGate: EnvironmentalComplianceV2GateInput | undefined
): EnvironmentalRiskAssessmentV2CrossSourceConflict[] {
  const conflicts: EnvironmentalRiskAssessmentV2CrossSourceConflict[] = [];

  const blockingSignals = signals.filter(
    (s) => s.status === "BLOCKED_BY_CONFLICT"
  );

  // v1 environmental-compliance gate CLEARED while v2 risk overlay
  // surfaces any BLOCKED_BY_CONFLICT signal (review wedge).
  if (
    ecV2.gateSnapshot.assessmentRequirementStatus ===
      "ENVIRONMENTAL_LINEAGE_CONFIRMED" &&
    blockingSignals.length > 0
  ) {
    conflicts.push({
      conflictId: "era-v2-gate-cleared-risk-blocked",
      topic:
        "v1 environmental-compliance gate confirmed lineage while v2 risk overlay surfaces high-impact factors",
      description: `Environmental Compliance v2 reports ENVIRONMENTAL_LINEAGE_CONFIRMED while ${blockingSignals.length} risk overlay signal(s) (${blockingSignals.map((s) => s.id).join(", ")}) are BLOCKED_BY_CONFLICT; reviewer must reconcile compliance posture against declared site descriptors before any treatment.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  // Upstream Environmental Compliance v2 cross-source conflicts
  // propagated.
  if (ecV2.summary.crossSourceConflictCount > 0) {
    conflicts.push({
      conflictId: "era-v2-upstream-ec-v2-conflicts",
      topic:
        "Upstream Environmental Compliance v2 surfaced cross-source conflicts",
      description: `Environmental Compliance v2 composition surfaced ${ecV2.summary.crossSourceConflictCount} cross-source conflict(s) that propagate into Environmental Risk Assessment v2; review with paired governance handoffs.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  // Tribal land ON_SOVEREIGN_LAND without sovereign federation
  // authorization.
  const tribalSignal = signals.find(
    (s) => s.id === "risk_tribal_land_alignment"
  );
  if (
    tribalSignal &&
    tribalSignal.declaredValue === "ON_SOVEREIGN_LAND" &&
    scope?.sovereignFederationAllowed !== true
  ) {
    conflicts.push({
      conflictId: "era-v2-tribal-land-without-sovereign-authorization",
      topic:
        "Borrower declared site on sovereign tribal land without sovereign federation authorization",
      description:
        "Tribal-land descriptor reports ON_SOVEREIGN_LAND, but the scope did not authorize sovereign federation participation. Sovereign risk posture remains hidden until a reviewer explicitly authorizes sovereign federation participation (CANON-SOVEREIGNTY-001).",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  // Floodplain 100_YEAR with REAL_ESTATE pathway and the v1 gate
  // not BLOCKED.
  const floodSignal = signals.find(
    (s) => s.id === "risk_floodplain_alignment"
  );
  if (
    floodSignal &&
    floodSignal.declaredValue === "100_YEAR" &&
    /REAL_ESTATE/i.test(complianceGate?.pathwayType ?? "") &&
    ecV2.gateSnapshot.assessmentRequirementStatus !==
      "ENVIRONMENTAL_GATE_BLOCKED"
  ) {
    conflicts.push({
      conflictId: "era-v2-floodplain-real-estate-without-block",
      topic:
        "100-year floodplain with REAL_ESTATE pathway but v1 gate not blocked",
      description:
        "Floodplain descriptor reports 100_YEAR in a REAL_ESTATE pathway, but the v1 environmental-compliance gate is not blocking the loan pathway. Reviewer must reconcile flood exposure against the v1 gate posture before any treatment.",
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  // Site contamination RECORDED / PENDING_INVESTIGATION without
  // PHASE_II_ESA assessment type.
  const contaminationSignal = signals.find(
    (s) => s.id === "risk_site_contamination_alignment"
  );
  if (
    contaminationSignal &&
    (contaminationSignal.declaredValue === "RECORDED" ||
      contaminationSignal.declaredValue === "PENDING_INVESTIGATION") &&
    ecV2.gateSnapshot.assessmentType !== "PHASE_II_ESA" &&
    ecV2.gateSnapshot.assessmentType !== "PHASE_III_ESA"
  ) {
    conflicts.push({
      conflictId: "era-v2-contamination-without-phase-ii",
      topic:
        "Site contamination declared without a Phase II/III ESA assessment type",
      description: `Contamination descriptor reports ${contaminationSignal.declaredValue}, but the v1 environmental-compliance gate assessment type is ${ecV2.gateSnapshot.assessmentType}. Reviewer must determine whether a Phase II / Phase III ESA assessment is required before treating the risk posture.`,
      resolution: "REQUIRES_HUMAN_REVIEW",
      reviewRoute: REVIEW_ROUTE,
    });
  }

  return conflicts;
}

// =============================================================================
// Composition helper
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

export function composeEnvironmentalRiskAssessmentV2(
  input: EnvironmentalRiskAssessmentV2Input = {}
): EnvironmentalRiskAssessmentV2Result {
  // 1. Compose Environmental Compliance v2 (the full canonical v2
  //    stack at the borrower-context scope + v1 environmental
  //    intake + advisory replay of v1 environmental compliance
  //    gate semantics).
  const ecV2 = composeEnvironmentalComplianceV2({
    reviewerRole: input.reviewerRole ?? null,
    userId: input.userId ?? null,
    applicationId: input.applicationId ?? null,
    onboardingState: input.onboardingState,
    declaredCustomerTypes: input.declaredCustomerTypes ?? [],
    intendedUses: input.intendedUses ?? [],
    legacyIntake: input.legacyIntake,
    scope: input.scope ?? null,
    complianceGate: input.complianceGate,
    metadata: input.metadata ?? null,
  });

  // 2. Resolve the risk overlay into per-signal descriptors.
  const descriptors = resolveOverlay(input.riskOverlay);

  // 3. Build v2 governed risk signals.
  const v2Signals: EnvironmentalRiskAssessmentV2Signal[] = V2_SIGNAL_IDS.map(
    (id) => buildSignal(id, descriptors[id])
  );

  // 4. Cross-source conflicts.
  const crossSourceConflicts = buildCrossSourceConflicts(
    v2Signals,
    ecV2,
    input.scope ?? null,
    input.complianceGate
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
  const v2HighRiskSignalCount = v2Signals.filter(
    (s) =>
      s.riskTier === "ON_SITE_REVIEW" || s.riskTier === "SOVEREIGN_REVIEW"
  ).length;
  const v2DataGapSignalCount = v2Signals.filter(
    (s) => s.riskTier === "DATA_GAP"
  ).length;

  const summary: EnvironmentalRiskAssessmentV2Summary = {
    v2SignalCount: v2Signals.length,
    v2ReadyCount,
    v2NeedsInputCount,
    v2BlockedCount,
    v2NotStartedCount,
    v2OverallReadinessPercent,
    v2HighRiskSignalCount,
    v2DataGapSignalCount,
    upstreamComplianceTriggered:
      ecV2.summary.v1EnvironmentalAssessmentTriggered,
    upstreamComplianceLoanAdvancementAllowed:
      ecV2.summary.v1LoanPathwayAdvancementAllowed,
    upstreamComplianceConflictCount: ecV2.summary.crossSourceConflictCount,
    crossSourceConflictCount: crossSourceConflicts.length,
  };

  const recommendedReviewRoutes = unique([
    REVIEW_ROUTE,
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
    runtimeVersion: ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    reviewerRole: input.reviewerRole ?? null,
    applicationId: input.applicationId ?? null,
    summary,
    v2Signals,
    environmentalComplianceV2: ecV2,
    crossSourceConflicts,
    legacyBridge: {
      environmentalComplianceV2Version:
        ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
      environmentalIntakeV2Version: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
      borrowerOnboardingCoreV2Version:
        BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
      opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      financingPathwayEngineV2Version:
        FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    },
    recommendedReviewRoutes,
    disclosures: [...ENVIRONMENTAL_RISK_ASSESSMENT_V2_DISCLOSURES],
    productionRestrictions: [
      ...ENVIRONMENTAL_RISK_ASSESSMENT_V2_PRODUCTION_RESTRICTIONS,
    ],
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    environmentalRiskAssessmentV2InternalOnly: true,
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
    noAutonomousEnvironmentalRiskAssessment: true,
    noPublicVerification: true,
    noRegulatoryReliance: true,
    noLenderCommitment: true,
    noLegalReliance: true,
    noOfficialEnvironmentalReport: true,
    noEnvironmentalClearance: true,
    noNEPADetermination: true,
    noPhaseIESAReport: true,
    noPhaseIIESAReport: true,
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

export function environmentalRiskAssessmentV2Lineage(): {
  runtimeVersion: string;
  environmentalComplianceV2Version: string;
  environmentalIntakeV2Version: string;
  borrowerOnboardingCoreV2Version: string;
  opportunityDiscoveryV2Version: string;
  financingPathwayEngineV2Version: string;
  revenueIntelligenceV2Version: string;
  customerTypeCount: number;
  capitalProgramCount: number;
} {
  return {
    runtimeVersion: ENVIRONMENTAL_RISK_ASSESSMENT_V2_RUNTIME_VERSION,
    environmentalComplianceV2Version:
      ENVIRONMENTAL_COMPLIANCE_V2_RUNTIME_VERSION,
    environmentalIntakeV2Version: ENVIRONMENTAL_INTAKE_V2_RUNTIME_VERSION,
    borrowerOnboardingCoreV2Version: BORROWER_ONBOARDING_CORE_V2_RUNTIME_VERSION,
    opportunityDiscoveryV2Version: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
    financingPathwayEngineV2Version: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
    revenueIntelligenceV2Version: REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION,
    customerTypeCount: CUSTOMER_TYPE_REGISTRY.length,
    capitalProgramCount: CAPITAL_GRAPH_REGISTRY.length,
  };
}

export const ENVIRONMENTAL_RISK_ASSESSMENT_V2_SIGNAL_IDS = V2_SIGNAL_IDS;
