import {
  borrowerProtectionFeeControls,
  environmentalComplianceRecords,
} from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Environmental Compliance Governance Runtime
 *
 * Master Volume Governance:
 * - Vol I: enforces ROLE-ARCH-001 Environmental Engineering Spoke scope and
 *   Banker Spoke isolation.
 * - Vol II: preserves regulated environmental pathway boundaries without
 *   making official environmental determinations.
 * - Vol III: writes TECH-CONN-001 environmental_compliance_records with
 *   deterministic audit anchors and replay references.
 * - Vol IV: implements OPS-BORROWER-JOURNEY-001 Steps 2.5-2.7.
 * - Vol V: enforces CANON-ECON-001 fee disclosure and CANON-SOVEREIGNTY-001
 *   jurisdictional license verification.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "RESTRICTED";
const SOURCE = "environmental-compliance-runtime";

export type EnvironmentalAssessmentType =
  | "NEPA_SCREENING"
  | "PHASE_I_ESA"
  | "PHASE_II_ESA"
  | "PHASE_III_ESA"
  | "STATE_ENVIRONMENTAL_REVIEW"
  | "NOT_REQUIRED_PATHWAY_EXEMPTION";

export type EnvironmentalAssessmentProviderType =
  | "ENVIRONMENTAL_ENGINEERING_SPOKE"
  | "APPROVED_EXTERNAL_FIRM"
  | "NOT_APPLICABLE";

export type EnvironmentalAssessmentOutcome =
  | "CLEARED"
  | "CONDITIONAL"
  | "ESCALATED"
  | "FAILED";

export type EnvironmentalComplianceInput = {
  traceId: string;
  journeyId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
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
  metadata?: Record<string, unknown>;
};

export type EnvironmentalComplianceGates = Record<string, boolean>;

export type EnvironmentalComplianceResult = {
  complianceRecord: typeof environmentalComplianceRecords.$inferSelect;
  feeControl: typeof borrowerProtectionFeeControls.$inferSelect;
  gates: EnvironmentalComplianceGates;
  blockerReasons: string[];
  environmentalAssessmentTriggered: boolean;
  loanPathwayAdvancementAllowed: boolean;
};

const allowedAssessmentTypes = new Set<EnvironmentalAssessmentType>([
  "NEPA_SCREENING",
  "PHASE_I_ESA",
  "PHASE_II_ESA",
  "PHASE_III_ESA",
  "STATE_ENVIRONMENTAL_REVIEW",
  "NOT_REQUIRED_PATHWAY_EXEMPTION",
]);

const allowedProviderTypes = new Set<EnvironmentalAssessmentProviderType>([
  "ENVIRONMENTAL_ENGINEERING_SPOKE",
  "APPROVED_EXTERNAL_FIRM",
  "NOT_APPLICABLE",
]);

const allowedOutcomes = new Set<EnvironmentalAssessmentOutcome>([
  "CLEARED",
  "CONDITIONAL",
  "ESCALATED",
  "FAILED",
]);

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function requiredText(value: unknown, label: string): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function normalizePathway(value: unknown): string {
  return requiredText(value, "pathwayType")
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function normalizeAssessmentType(
  value: unknown,
  environmentalAssessmentTriggered: boolean
): EnvironmentalAssessmentType {
  const normalized = normalizeText(value)?.toUpperCase();

  if (!environmentalAssessmentTriggered) {
    return "NOT_REQUIRED_PATHWAY_EXEMPTION";
  }

  if (
    normalized &&
    allowedAssessmentTypes.has(normalized as EnvironmentalAssessmentType) &&
    normalized !== "NOT_REQUIRED_PATHWAY_EXEMPTION"
  ) {
    return normalized as EnvironmentalAssessmentType;
  }

  return "NEPA_SCREENING";
}

function normalizeProviderType(
  value: unknown,
  environmentalAssessmentTriggered: boolean
): EnvironmentalAssessmentProviderType {
  const normalized = normalizeText(value)?.toUpperCase();

  if (!environmentalAssessmentTriggered) {
    return "NOT_APPLICABLE";
  }

  if (
    normalized &&
    allowedProviderTypes.has(normalized as EnvironmentalAssessmentProviderType) &&
    normalized !== "NOT_APPLICABLE"
  ) {
    return normalized as EnvironmentalAssessmentProviderType;
  }

  return "ENVIRONMENTAL_ENGINEERING_SPOKE";
}

function normalizeOutcome(value: unknown): EnvironmentalAssessmentOutcome {
  const normalized = normalizeText(value)?.toUpperCase();

  if (normalized && allowedOutcomes.has(normalized as EnvironmentalAssessmentOutcome)) {
    return normalized as EnvironmentalAssessmentOutcome;
  }

  return "ESCALATED";
}

function positiveAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value);
}

function refPresent(value: unknown): boolean {
  return Boolean(normalizeText(value));
}

function hasRealPropertyTrigger(input: EnvironmentalComplianceInput): boolean {
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

function isPathwayExempt(input: EnvironmentalComplianceInput): boolean {
  const pathway = normalizePathway(input.pathwayType);
  const equipmentAssetValue = positiveAmount(input.equipmentAssetValue);

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

function environmentalAssessmentTriggered(
  input: EnvironmentalComplianceInput
): boolean {
  return hasRealPropertyTrigger(input) && !isPathwayExempt(input);
}

function blockerReasons(gates: EnvironmentalComplianceGates): string[] {
  return Object.entries(gates)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate);
}

function allGatesPass(gates: EnvironmentalComplianceGates): boolean {
  return Object.values(gates).every((passed) => passed === true);
}

function gateSnapshot(input: {
  triggered: boolean;
  assessmentType: EnvironmentalAssessmentType;
  providerType: EnvironmentalAssessmentProviderType;
  outcome: EnvironmentalAssessmentOutcome;
  payload: EnvironmentalComplianceInput;
}): EnvironmentalComplianceGates {
  if (!input.triggered) {
    return {
      pathwayExemptionRecorded: true,
      environmentalAssessmentNotRequired: true,
      loanPathwayAdvancementAllowed: true,
      officialReportNotGenerated: true,
      liveExternalActionNotPerformed: true,
    };
  }

  const escalationRequired = ["CONDITIONAL", "ESCALATED", "FAILED"].includes(
    input.outcome
  );

  return {
    environmentalAssessmentTriggered: true,
    assessmentTypeAllowed:
      allowedAssessmentTypes.has(input.assessmentType) &&
      input.assessmentType !== "NOT_REQUIRED_PATHWAY_EXEMPTION",
    providerTypeAllowed:
      allowedProviderTypes.has(input.providerType) &&
      input.providerType !== "NOT_APPLICABLE",
    providerLicenseRefPresent: refPresent(input.payload.providerLicenseRef),
    providerLicenseVerified: input.payload.providerLicenseVerified === true,
    feeDisclosureRefPresent: refPresent(input.payload.feeDisclosureRef),
    feeDisclosedBeforeInitiation:
      input.payload.feeDisclosedBeforeInitiation === true,
    borrowerExternalFirmRightPreserved:
      input.payload.borrowerExternalFirmRightPreserved === true,
    noFeeSurchargeOrPreference:
      input.payload.noFeeSurchargeOrPreference === true,
    spokeIsolationConfirmed:
      input.payload.spokeIsolationConfirmed === true,
    bankerSpokeIsolated: input.payload.bankerSpokeIsolated === true,
    auditAnchorRefPresent: refPresent(input.payload.auditAnchorRef),
    escalationRefPresentWhenRequired:
      !escalationRequired || refPresent(input.payload.escalationRef),
    officialReportNotGenerated: true,
    liveExternalActionNotPerformed: true,
  };
}

export async function createEnvironmentalComplianceRecord(
  input: EnvironmentalComplianceInput
): Promise<EnvironmentalComplianceResult> {
  const traceId = requiredText(input.traceId, "traceId");
  const tenantId = requiredText(input.tenantId, "tenantId");
  const journeyId = requiredText(
    input.journeyId ?? input.applicationId,
    "journeyId"
  );
  const pathwayType = normalizePathway(input.pathwayType);
  const triggered = environmentalAssessmentTriggered(input);
  const assessmentType = normalizeAssessmentType(
    input.assessmentType,
    triggered
  );
  const providerType = normalizeProviderType(
    input.assessmentProviderType,
    triggered
  );
  const assessmentOutcome = triggered
    ? normalizeOutcome(input.assessmentOutcome)
    : "CLEARED";
  const feeAmount = triggered ? positiveAmount(input.feeAmount) : 0;
  const standardMarketRateAmount = triggered
    ? positiveAmount(input.standardMarketRateAmount)
    : 0;
  const feeDisclosureRef =
    normalizeText(input.feeDisclosureRef) ??
    `fee-disclosure://${traceId}/environmental`;
  const complianceRecordId = `environmental-compliance-${traceId}`;
  const feeControlId = `borrower-protection-fee-${traceId}`;
  const gates = gateSnapshot({
    triggered,
    assessmentType,
    providerType,
    outcome: assessmentOutcome,
    payload: input,
  });
  const blockers = blockerReasons(gates);
  const loanPathwayAdvancementAllowed =
    allGatesPass(gates) && assessmentOutcome === "CLEARED";
  const assessmentRequirementStatus = triggered
    ? loanPathwayAdvancementAllowed
      ? "ENVIRONMENTAL_LINEAGE_CONFIRMED"
      : "ENVIRONMENTAL_GATE_BLOCKED"
    : "PATHWAY_EXEMPTION_RECORDED";

  const feeControlRows = await db
    .insert(borrowerProtectionFeeControls)
    .values({
      feeControlId,
      journeyId,
      applicationId: normalizeText(input.applicationId),
      borrowerId: normalizeText(input.borrowerId),
      tenantId,
      actorId: normalizeText(input.actorId),
      feeType: "ENVIRONMENTAL_ASSESSMENT",
      feeAmount,
      standardMarketRateAmount,
      advisoryDiscountPercent:
        providerType === "ENVIRONMENTAL_ENGINEERING_SPOKE" && triggered
          ? 10
          : 0,
      feeDisclosureRef,
      disclosureStatus: triggered
        ? input.feeDisclosedBeforeInitiation === true
          ? "DISCLOSED_BEFORE_ASSESSMENT"
          : "DISCLOSURE_BLOCKED"
        : "NO_FEE_PATHWAY_EXEMPTION",
      disclosedBeforeAssessment:
        !triggered || input.feeDisclosedBeforeInitiation === true,
      borrowerExternalFirmRightPreserved:
        !triggered || input.borrowerExternalFirmRightPreserved === true,
      noSurchargeOrPreferenceIncentive:
        !triggered || input.noFeeSurchargeOrPreference === true,
      providerSelection: providerType,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: traceId,
      traceId,
      source: SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        triggered,
        officialEnvironmentalReport: false,
      },
    })
    .returning();

  const feeControl = feeControlRows[0];

  const complianceRows = await db
    .insert(environmentalComplianceRecords)
    .values({
      complianceRecordId,
      journeyId,
      applicationId: normalizeText(input.applicationId),
      borrowerId: normalizeText(input.borrowerId),
      tenantId,
      actorId: normalizeText(input.actorId),
      pathwayType,
      triggeringPathway:
        normalizeText(input.triggeringPathway) ??
        (triggered ? "ENVIRONMENTAL_REVIEW_TRIGGERED" : "PATHWAY_EXEMPTION"),
      assessmentRequirementStatus,
      assessmentType,
      assessmentProviderType: providerType,
      providerName: normalizeText(input.providerName),
      providerLicenseRef: normalizeText(input.providerLicenseRef),
      providerLicenseVerified:
        !triggered || input.providerLicenseVerified === true,
      assessmentOutcome,
      feeAmount,
      feeDisclosureRef,
      borrowerProtectionFeeControlId: feeControl.feeControlId,
      feeDisclosedBeforeInitiation:
        !triggered || input.feeDisclosedBeforeInitiation === true,
      borrowerExternalFirmRightPreserved:
        !triggered || input.borrowerExternalFirmRightPreserved === true,
      noFeeSurchargeOrPreference:
        !triggered || input.noFeeSurchargeOrPreference === true,
      spokeIsolationConfirmed:
        !triggered || input.spokeIsolationConfirmed === true,
      bankerSpokeIsolated: !triggered || input.bankerSpokeIsolated === true,
      environmentalAssessmentTriggered: triggered,
      pathwayExemptionEventRef: triggered
        ? null
        : `pathway-exemption://${traceId}`,
      escalationRef: normalizeText(input.escalationRef),
      auditAnchorRef: normalizeText(input.auditAnchorRef) ?? traceId,
      loanPathwayAdvancementAllowed,
      officialReportGenerated: false,
      liveExternalActionPerformed: false,
      gateSnapshot: gates,
      blockerReasons: blockers,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: traceId,
      traceId,
      source: SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        standardMarketRateAmount,
        advisoryOnly: true,
        officialEnvironmentalReport: false,
        liveExternalActionPerformed: false,
        borrowerAutonomyProtected: true,
      },
      assessmentTimestamp: triggered ? new Date() : null,
    })
    .returning();

  return {
    complianceRecord: complianceRows[0],
    feeControl,
    gates,
    blockerReasons: blockers,
    environmentalAssessmentTriggered: triggered,
    loanPathwayAdvancementAllowed,
  };
}
