/**
 * Borrower Environmental Intake Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps environmental intake subordinate to the Environmental
 *   Engineering Spoke's constitutional authority and to Banker Spoke
 *   isolation; intake never replaces a determination.
 * - Vol II: blocks intake from becoming an official environmental report,
 *   environmental clearance, NEPA determination, permit, lender commitment,
 *   or regulatory or legal reliance.
 * - Vol III: provides deterministic, replay-safe trigger and exemption
 *   routing across NEPA screening, Phase I ESA, state environmental review,
 *   and exemption pathway scenarios.
 * - Vol III-B: supplies classification-, version-, observability-, and
 *   explainability-ready posture for runtime evidence.
 * - Vol IV: routes borrower handoffs to environmental compliance review
 *   (Module 21), documents, applications, readiness, and data rights.
 * - Vol V-VII: preserves claims controls, source authority, conformance,
 *   provider-license and fee-disclosure boundaries, and disclosure
 *   limits on borrower-readable environmental output.
 *
 * Safety boundary:
 * - Intake is operational guidance and review routing only.
 * - It does not engage an external environmental provider, authorize a
 *   provider fee, or create an official environmental determination,
 *   clearance, permit, or report.
 */

export const ENVIRONMENTAL_INTAKE_RUNTIME_VERSION =
  "environmental-intake-runtime-v0.1.0";

export type EnvironmentalAssessmentRoute =
  | "NEPA_SCREENING"
  | "PHASE_I_ESA"
  | "STATE_ENVIRONMENTAL_REVIEW"
  | "EXEMPTION_PATHWAY"
  | "AWAITING_INPUT";

export type EnvironmentalPathwayPosture =
  | "TRIGGERED"
  | "AWAITING_REVIEW"
  | "POTENTIAL_EXEMPTION"
  | "INDETERMINATE";

export type EnvironmentalIntakeInput = {
  borrowerId?: string | null;
  applicationId?: string | null;
  userId?: string | null;
  location?: {
    country?: string | null;
    state?: string | null;
    county?: string | null;
  } | null;
  realPropertyCollateral?: boolean | null;
  federalFundingTrigger?: boolean | null;
  federalActionInvolvement?: boolean | null;
  stateEnvironmentalActJurisdiction?: boolean | null;
  knownEnvironmentalStatuteTrigger?: boolean | null;
  knownContaminationConcern?: boolean | null;
  protectedHabitatProximity?: boolean | null;
  wetlandsOrFloodplainProximity?: boolean | null;
  equipmentAssetValue?: number | null;
  requestExemptionEvaluation?: boolean | null;
  borrowerExternalFirmInterest?: boolean | null;
  feeDisclosureAcknowledged?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

export type EnvironmentalIntakeHandoffStatus =
  | "complete"
  | "needs-input"
  | "pending-review";

export type EnvironmentalIntakeHandoff = {
  id: string;
  label: string;
  route: string;
  status: EnvironmentalIntakeHandoffStatus;
  reason: string;
};

export type EnvironmentalIntakeReadiness = {
  readinessPercent: number;
  missingItems: string[];
  reviewSignals: string[];
};

export type EnvironmentalIntakeResult = {
  runtimeVersion: string;
  generatedAt: string;
  readiness: EnvironmentalIntakeReadiness;
  assessmentRoute: EnvironmentalAssessmentRoute;
  pathwayPosture: EnvironmentalPathwayPosture;
  triggerSignals: string[];
  exemptionCandidates: string[];
  handoffs: EnvironmentalIntakeHandoff[];
  recommendedNextRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  feeAutonomyPreserved: true;
  spokeIsolationRequired: true;
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  noOfficialEnvironmentalReport: true;
  noEnvironmentalClearance: true;
  noProviderEngagement: true;
  noLegalOrRegulatoryReliance: true;
};

const REQUIRED_INTAKE_ITEMS = [
  "borrower identity",
  "farm location",
  "real property collateral disclosure",
  "federal funding or action disclosure",
  "known environmental statute trigger disclosure",
  "borrower external firm right acknowledgement",
  "provider fee disclosure acknowledgement",
] as const;

export const ENVIRONMENTAL_INTAKE_DISCLOSURES = [
  "Environmental intake is operational guidance and review routing only.",
  "Environmental intake is not an official environmental determination.",
  "Environmental intake is not an environmental clearance, permit, or release.",
  "Environmental intake does not engage an external environmental provider.",
  "Environmental intake does not authorize a provider fee or charge.",
  "Environmental intake does not authorize legal or regulatory reliance.",
  "Borrower retains the right to engage an approved external environmental firm.",
  "Provider fees may not exceed standard market rates and require explicit borrower fee disclosure.",
  "Banker Spoke isolation is preserved; the Environmental Engineering Spoke retains review authority.",
  "Human review is required before any environmental pathway routing is treated as a determination.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const ENVIRONMENTAL_INTAKE_PRODUCTION_RESTRICTIONS = [
  "no official environmental report",
  "no environmental clearance",
  "no environmental permit",
  "no provider engagement",
  "no provider fee authorization",
  "no environmental determination",
  "no legal or regulatory reliance",
  "no live external action",
  "no borrower notice send",
  "no payment capture",
] as const;

export const ENVIRONMENTAL_INTAKE_BLOCKED_CLAIMS = [
  "environmental clearance",
  "environmental permit",
  "environmental determination",
  "official environmental report",
  "provider engagement",
  "approved fee",
  "regulatory approval",
  "legal reliance",
] as const;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function buildMissingItems(input: EnvironmentalIntakeInput): string[] {
  const missingItems: string[] = [];

  if (!hasText(input.borrowerId)) {
    missingItems.push("borrower identity");
  }

  if (
    !hasText(input.location?.country) ||
    !hasText(input.location?.state) ||
    !hasText(input.location?.county)
  ) {
    missingItems.push("farm location");
  }

  if (typeof input.realPropertyCollateral !== "boolean") {
    missingItems.push("real property collateral disclosure");
  }

  if (
    typeof input.federalFundingTrigger !== "boolean" &&
    typeof input.federalActionInvolvement !== "boolean"
  ) {
    missingItems.push("federal funding or action disclosure");
  }

  if (typeof input.knownEnvironmentalStatuteTrigger !== "boolean") {
    missingItems.push("known environmental statute trigger disclosure");
  }

  if (input.borrowerExternalFirmInterest !== true && input.borrowerExternalFirmInterest !== false) {
    missingItems.push("borrower external firm right acknowledgement");
  }

  if (input.feeDisclosureAcknowledged !== true) {
    missingItems.push("provider fee disclosure acknowledgement");
  }

  return unique(missingItems);
}

function calculateReadiness(missingItems: string[]): number {
  const completed = Math.max(
    0,
    REQUIRED_INTAKE_ITEMS.length - missingItems.length
  );

  return clampPercent((completed / REQUIRED_INTAKE_ITEMS.length) * 100);
}

function deriveTriggerSignals(input: EnvironmentalIntakeInput): string[] {
  const signals: string[] = [];

  if (input.federalFundingTrigger === true) {
    signals.push("Federal funding involvement may trigger NEPA review.");
  }

  if (input.federalActionInvolvement === true) {
    signals.push("Federal action involvement may trigger NEPA review.");
  }

  if (input.stateEnvironmentalActJurisdiction === true) {
    signals.push("State environmental review jurisdiction may apply.");
  }

  if (input.knownEnvironmentalStatuteTrigger === true) {
    signals.push("Known environmental statute trigger disclosed by borrower.");
  }

  if (input.knownContaminationConcern === true) {
    signals.push(
      "Known contamination concern disclosed; Phase I ESA pathway is likely."
    );
  }

  if (input.protectedHabitatProximity === true) {
    signals.push("Protected habitat proximity disclosed.");
  }

  if (input.wetlandsOrFloodplainProximity === true) {
    signals.push("Wetlands or floodplain proximity disclosed.");
  }

  if (input.realPropertyCollateral === true) {
    signals.push(
      "Real property collateral disclosed; environmental review may be required."
    );
  }

  return unique(signals);
}

function deriveExemptionCandidates(input: EnvironmentalIntakeInput): string[] {
  const candidates: string[] = [];

  if (input.requestExemptionEvaluation === true) {
    candidates.push("Borrower requested exemption pathway evaluation.");
  }

  if (
    input.realPropertyCollateral === false &&
    input.federalFundingTrigger === false &&
    input.knownEnvironmentalStatuteTrigger === false
  ) {
    candidates.push(
      "No real property collateral, federal funding, or statute trigger disclosed; non-real-property pathway exemption may apply."
    );
  }

  if (
    typeof input.equipmentAssetValue === "number" &&
    input.equipmentAssetValue > 0 &&
    input.realPropertyCollateral === false
  ) {
    candidates.push(
      "Equipment-only collateral disclosed; equipment pathway exemption may apply pending review."
    );
  }

  return unique(candidates);
}

function deriveAssessmentRoute(
  input: EnvironmentalIntakeInput,
  triggerSignals: string[],
  exemptionCandidates: string[]
): { route: EnvironmentalAssessmentRoute; posture: EnvironmentalPathwayPosture } {
  if (
    input.federalFundingTrigger === true ||
    input.federalActionInvolvement === true
  ) {
    return { route: "NEPA_SCREENING", posture: "TRIGGERED" };
  }

  if (
    input.knownContaminationConcern === true ||
    (input.realPropertyCollateral === true &&
      (input.protectedHabitatProximity === true ||
        input.wetlandsOrFloodplainProximity === true))
  ) {
    return { route: "PHASE_I_ESA", posture: "TRIGGERED" };
  }

  if (input.stateEnvironmentalActJurisdiction === true) {
    return { route: "STATE_ENVIRONMENTAL_REVIEW", posture: "AWAITING_REVIEW" };
  }

  if (input.realPropertyCollateral === true) {
    return { route: "PHASE_I_ESA", posture: "AWAITING_REVIEW" };
  }

  if (exemptionCandidates.length > 0) {
    return { route: "EXEMPTION_PATHWAY", posture: "POTENTIAL_EXEMPTION" };
  }

  if (triggerSignals.length > 0) {
    return { route: "STATE_ENVIRONMENTAL_REVIEW", posture: "AWAITING_REVIEW" };
  }

  return { route: "AWAITING_INPUT", posture: "INDETERMINATE" };
}

function buildHandoffs(
  input: EnvironmentalIntakeInput,
  route: EnvironmentalAssessmentRoute,
  missingItems: string[]
): EnvironmentalIntakeHandoff[] {
  const reviewStatus: EnvironmentalIntakeHandoffStatus =
    missingItems.length === 0 ? "pending-review" : "needs-input";

  return [
    {
      id: "environmental-compliance-review",
      label: "Environmental compliance review",
      route: "/environmental-compliance",
      status: reviewStatus,
      reason:
        missingItems.length === 0
          ? "Intake is ready for Environmental Engineering Spoke review through Module 21."
          : `Complete ${missingItems.length} intake item(s) before routing for environmental compliance review.`,
    },
    {
      id: "documents",
      label: "Document preparation",
      route: "/portal/borrower/documents",
      status: "pending-review",
      reason:
        "Supporting environmental documents may be requested before review begins.",
    },
    {
      id: "applications",
      label: "Application status",
      route: "/portal/borrower/applications",
      status: "pending-review",
      reason:
        "Application status reflects environmental intake posture through governed review handoffs.",
    },
    {
      id: "readiness",
      label: "Readiness assessment",
      route: "/readiness",
      status:
        missingItems.length === 0 ? "pending-review" : "needs-input",
      reason:
        missingItems.length === 0
          ? "Environmental intake posture feeds the borrower readiness assessment."
          : "Complete intake items so readiness can reflect environmental review posture.",
    },
    {
      id: "data-rights",
      label: "Data rights",
      route: "/portal/borrower/data-rights",
      status: "pending-review",
      reason:
        "Borrower retains data portability and access rights across environmental review.",
    },
  ];
}

function buildReviewSignals(
  input: EnvironmentalIntakeInput,
  triggerSignals: string[],
  exemptionCandidates: string[],
  route: EnvironmentalAssessmentRoute
): string[] {
  const signals: string[] = [
    "Environmental intake remains review-bound and does not create an environmental determination, clearance, or provider engagement.",
    "Borrower retains the right to engage an approved external environmental firm.",
    "Provider fees may not exceed standard market rates and require explicit borrower fee disclosure.",
  ];

  if (input.feeDisclosureAcknowledged !== true) {
    signals.push("Provider fee disclosure has not been acknowledged.");
  }

  if (input.borrowerExternalFirmInterest === true) {
    signals.push(
      "Borrower expressed interest in engaging an approved external firm; this routes through governed review."
    );
  }

  if (route === "NEPA_SCREENING") {
    signals.push(
      "Disclosed federal involvement routes to NEPA screening for human review."
    );
  } else if (route === "PHASE_I_ESA") {
    signals.push(
      "Disclosed real property and environmental indicators route to Phase I ESA review."
    );
  } else if (route === "STATE_ENVIRONMENTAL_REVIEW") {
    signals.push(
      "Disclosed state environmental jurisdiction routes to state environmental review."
    );
  } else if (route === "EXEMPTION_PATHWAY") {
    signals.push(
      "Disclosed posture qualifies for exemption pathway evaluation pending human review."
    );
  } else if (route === "AWAITING_INPUT") {
    signals.push(
      "More information is required before an intake routing recommendation can be made."
    );
  }

  if (triggerSignals.length > 0) {
    signals.push(`${triggerSignals.length} trigger signal(s) recorded.`);
  }

  if (exemptionCandidates.length > 0) {
    signals.push(`${exemptionCandidates.length} exemption candidate(s) recorded.`);
  }

  return unique(signals);
}

export function evaluateEnvironmentalIntake(
  input: EnvironmentalIntakeInput = {}
): EnvironmentalIntakeResult {
  const missingItems = buildMissingItems(input);
  const readinessPercent = calculateReadiness(missingItems);
  const triggerSignals = deriveTriggerSignals(input);
  const exemptionCandidates = deriveExemptionCandidates(input);
  const { route, posture } = deriveAssessmentRoute(
    input,
    triggerSignals,
    exemptionCandidates
  );
  const reviewSignals = buildReviewSignals(
    input,
    triggerSignals,
    exemptionCandidates,
    route
  );
  const handoffs = buildHandoffs(input, route, missingItems);

  const recommendedNextRoutes = unique(
    handoffs
      .filter((handoff) => handoff.status !== "complete")
      .map((handoff) => handoff.route)
  );

  return {
    runtimeVersion: ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    readiness: {
      readinessPercent,
      missingItems,
      reviewSignals,
    },
    assessmentRoute: route,
    pathwayPosture: posture,
    triggerSignals,
    exemptionCandidates,
    handoffs,
    recommendedNextRoutes,
    disclosures: unique([...ENVIRONMENTAL_INTAKE_DISCLOSURES]),
    productionRestrictions: unique([
      ...ENVIRONMENTAL_INTAKE_PRODUCTION_RESTRICTIONS,
    ]),
    blockedClaims: unique([...ENVIRONMENTAL_INTAKE_BLOCKED_CLAIMS]),
    feeAutonomyPreserved: true,
    spokeIsolationRequired: true,
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    noOfficialEnvironmentalReport: true,
    noEnvironmentalClearance: true,
    noProviderEngagement: true,
    noLegalOrRegulatoryReliance: true,
  };
}
