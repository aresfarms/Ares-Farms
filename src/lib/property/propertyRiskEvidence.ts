import type {
  PropertyInfrastructureRiskImpact,
  PropertyRiskStatus,
  ScenarioInfrastructureAdjustment,
} from "@/lib/intelligence/scenarioRankingPlan";

export type EvidenceConfidence = "verified" | "supported" | "preliminary" | "unresolved";

export interface OfficialEvidenceSource {
  authority: string;
  jurisdiction: string;
  reference: string;
  asOf: string;
  effectiveDate?: string | null;
  replayRef?: string | null;
}

export type WaterSourceType =
  | "municipal"
  | "domestic-well"
  | "deep-well"
  | "irrigation-well"
  | "artesian-well"
  | "multiple-well-system"
  | "surface-water-irrigation"
  | "shared-well"
  | "other-private-source"
  | "unknown";

export interface WaterSourceProfile {
  sourceType: WaterSourceType;
  wellDepthFeet?: number | null;
  aquiferName?: string | null;
  testedYieldGpm?: number | null;
  sustainableWithdrawalGallonsPerDay?: number | null;
  irrigatedAcresSupported?: number | null;
  peakDemandAdequate?: boolean | null;
  waterQualityTested?: boolean | null;
  treatmentRequired?: boolean | null;
  withdrawalPermitRequired?: boolean | null;
  withdrawalPermitVerified?: boolean | null;
  waterRightRunsWithLand?: boolean | null;
  droughtRestrictionExposure?: "none-identified" | "conditional" | "material" | "unknown";
  sharedSource?: boolean | null;
  redundantSourceAvailable?: boolean | null;
  annualEnergyCost?: number | null;
  annualMaintenanceReserve?: number | null;
  replacementReserve?: number | null;
}

export type WaterEvidenceStatus =
  | "adequate-public-service"
  | "adequate-private-source"
  | "adequate-with-conditions"
  | "extension-required"
  | "capacity-constrained"
  | "rights-allocation-constrained"
  | "wastewater-septic-constrained"
  | "fire-flow-constrained"
  | "unavailable"
  | "unresolved";

export type InsuranceEvidenceStatus =
  | "normally-insurable"
  | "insurable-with-conditions"
  | "specialty-market-only"
  | "economically-burdensome"
  | "materially-uninsurable"
  | "unknown-pending-quote";

interface BaseRiskEvidence {
  confidence: EvidenceConfidence;
  source?: OfficialEvidenceSource | null;
  affectedScenarioIds?: string[];
  notes?: string[];
  annualCost?: number | null;
  oneTimeCost?: number | null;
}

export interface WaterRiskEvidence extends BaseRiskEvidence {
  kind: "water";
  status: WaterEvidenceStatus;
  sourceProfile?: WaterSourceProfile | null;
}

export interface InsuranceRiskEvidence extends BaseRiskEvidence {
  kind: "insurance";
  status: InsuranceEvidenceStatus;
}

export type PropertyRiskEvidence = WaterRiskEvidence | InsuranceRiskEvidence;

export function validatePropertyRiskEvidence(evidence: PropertyRiskEvidence): string[] {
  const errors: string[] = [];
  if (evidence.confidence === "verified") {
    if (!evidence.source?.authority?.trim()) errors.push("Verified evidence requires an official authority.");
    if (!evidence.source?.jurisdiction?.trim()) errors.push("Verified evidence requires a jurisdiction.");
    if (!evidence.source?.reference?.trim()) errors.push("Verified evidence requires an official reference.");
    if (!evidence.source?.asOf?.trim()) errors.push("Verified evidence requires an as-of date.");
  }
  if ((evidence.annualCost ?? 0) < 0 || (evidence.oneTimeCost ?? 0) < 0) {
    errors.push("Evidence costs cannot be negative.");
  }
  if (evidence.kind === "water" && evidence.sourceProfile) {
    const p = evidence.sourceProfile;
    for (const [label, value] of [
      ["well depth", p.wellDepthFeet],
      ["tested yield", p.testedYieldGpm],
      ["sustainable withdrawal", p.sustainableWithdrawalGallonsPerDay],
      ["irrigated acres", p.irrigatedAcresSupported],
      ["annual energy cost", p.annualEnergyCost],
      ["annual maintenance reserve", p.annualMaintenanceReserve],
      ["replacement reserve", p.replacementReserve],
    ] as const) {
      if ((value ?? 0) < 0) errors.push(`Water ${label} cannot be negative.`);
    }
    const wellTypes = ["domestic-well", "deep-well", "irrigation-well", "artesian-well", "multiple-well-system", "shared-well"];
    if (evidence.confidence === "verified" && wellTypes.includes(p.sourceType) && !p.testedYieldGpm) {
      errors.push("A verified well source requires tested yield evidence.");
    }
  }
  return errors;
}

function waterPenalty(status: WaterEvidenceStatus): number {
  return ({
    "adequate-public-service": 0,
    "adequate-private-source": 0,
    "adequate-with-conditions": 5,
    "extension-required": 12,
    "capacity-constrained": 18,
    "rights-allocation-constrained": 22,
    "wastewater-septic-constrained": 20,
    "fire-flow-constrained": 25,
    unavailable: 35,
    unresolved: 4,
  })[status];
}

function waterBenefit(evidence: WaterRiskEvidence): number {
  const p = evidence.sourceProfile;
  if (!p || evidence.confidence !== "verified" || evidence.status !== "adequate-private-source") return 0;
  const agricultural = (evidence.affectedScenarioIds ?? []).some((id) =>
    ["operating-agriculture", "specialty-direct-market", "productive-land"].includes(id)
  );
  if (!agricultural) return 0;
  const strongYield = (p.testedYieldGpm ?? 0) >= 20 || (p.sustainableWithdrawalGallonsPerDay ?? 0) >= 20000;
  const irrigationReady = ["irrigation-well", "deep-well", "artesian-well", "multiple-well-system"].includes(p.sourceType)
    && p.peakDemandAdequate === true;
  const rightsSecure = p.withdrawalPermitRequired !== true || p.withdrawalPermitVerified === true;
  const landRightSecure = p.waterRightRunsWithLand !== false;
  const droughtAcceptable = !["material", "unknown"].includes(p.droughtRestrictionExposure ?? "unknown");
  if (!(strongYield && irrigationReady && rightsSecure && landRightSecure && droughtAcceptable)) return 0;
  let benefit = 8;
  if (p.redundantSourceAvailable) benefit += 3;
  if ((p.annualEnergyCost ?? 0) + (p.annualMaintenanceReserve ?? 0) <= 5000) benefit += 2;
  return Math.min(12, benefit);
}

function insurancePenalty(status: InsuranceEvidenceStatus): number {
  return ({
    "normally-insurable": 0,
    "insurable-with-conditions": 6,
    "specialty-market-only": 14,
    "economically-burdensome": 20,
    "materially-uninsurable": 35,
    "unknown-pending-quote": 4,
  })[status];
}

function riskStatus(evidence: PropertyRiskEvidence | undefined): PropertyRiskStatus {
  if (!evidence || evidence.confidence === "unresolved") return "unknown";
  const clear = evidence.kind === "water"
    ? ["adequate-public-service", "adequate-private-source"].includes(evidence.status)
    : evidence.status === "normally-insurable";
  return clear ? "verified-clear" : "verified-constrained";
}

export function buildWaterInsuranceRiskImpact(args: {
  water?: WaterRiskEvidence | null;
  insurance?: InsuranceRiskEvidence | null;
}): PropertyInfrastructureRiskImpact {
  const evidence = [args.water ?? undefined, args.insurance ?? undefined].filter(Boolean) as PropertyRiskEvidence[];
  for (const item of evidence) {
    const errors = validatePropertyRiskEvidence(item);
    if (errors.length) throw new Error(errors.join(" "));
  }

  const adjustments: Record<string, ScenarioInfrastructureAdjustment> = {};
  for (const item of evidence) {
    const scenarioIds = item.affectedScenarioIds ?? [];
    const penalty = item.kind === "water" ? waterPenalty(item.status) : insurancePenalty(item.status);
    for (const id of scenarioIds) {
      const current = adjustments[id] ?? { verified: true, notes: [] };
      if (item.kind === "water") {
        current.waterPenalty = penalty;
        current.waterBenefit = waterBenefit(item);
      }
      else current.insurancePenalty = penalty;
      current.verified = current.verified !== false && item.confidence === "verified";
      current.notes = [...(current.notes ?? []), ...(item.notes ?? []), `${item.kind}: ${item.status}`];
      if (item.kind === "water" && item.sourceProfile) {
        const p = item.sourceProfile;
        current.notes.push(`water source: ${p.sourceType}`);
        if (p.testedYieldGpm) current.notes.push(`tested yield: ${p.testedYieldGpm} gpm`);
        if (p.aquiferName) current.notes.push(`aquifer: ${p.aquiferName}`);
      }
      adjustments[id] = current;
    }
  }

  return {
    water: riskStatus(args.water ?? undefined),
    insurance: riskStatus(args.insurance ?? undefined),
    publicProject: "unknown",
    governmentAction: "unknown",
    scenarioAdjustments: adjustments,
  };
}

export type PublicProjectExposureStatus =
  | "no-identified-exposure"
  | "long-range-conceptual"
  | "funded-planning"
  | "preliminary-design"
  | "right-of-way-anticipated"
  | "active-acquisition-condemnation"
  | "existing-partial-taking-easement"
  | "unknown";

export type GovernmentActionStatus =
  | "proposed"
  | "in-committee"
  | "passed-one-chamber"
  | "passed-legislature"
  | "awaiting-signature"
  | "enacted-not-yet-effective"
  | "effective-implementation-pending"
  | "active"
  | "vetoed"
  | "failed"
  | "withdrawn"
  | "expired";

export interface PublicProjectRiskEvidence extends BaseRiskEvidence {
  kind: "public-project";
  status: PublicProjectExposureStatus;
  projectName?: string | null;
  projectType?: "road" | "rail" | "airport" | "utility" | "pipeline" | "transmission" | "drainage" | "flood-control" | "other";
  acquisitionStage?: string | null;
  accessEffect?: "beneficial" | "neutral" | "restrictive" | "unknown";
}

export interface GovernmentActionRiskEvidence extends BaseRiskEvidence {
  kind: "government-action";
  status: GovernmentActionStatus;
  governmentBody: string;
  actionNumber?: string | null;
  officialTitle: string;
  lastOfficialAction: string;
  implementationDate?: string | null;
  geographicScope: string;
  financialEffect?: string | null;
}

export type ExtendedPropertyRiskEvidence = PropertyRiskEvidence | PublicProjectRiskEvidence | GovernmentActionRiskEvidence;

function publicProjectPenalty(status: PublicProjectExposureStatus): number {
  return ({
    "no-identified-exposure": 0,
    "long-range-conceptual": 4,
    "funded-planning": 10,
    "preliminary-design": 16,
    "right-of-way-anticipated": 24,
    "active-acquisition-condemnation": 35,
    "existing-partial-taking-easement": 28,
    unknown: 4,
  })[status];
}

function governmentActionPenalty(status: GovernmentActionStatus): number {
  return ({
    proposed: 4,
    "in-committee": 5,
    "passed-one-chamber": 7,
    "passed-legislature": 10,
    "awaiting-signature": 11,
    "enacted-not-yet-effective": 14,
    "effective-implementation-pending": 16,
    active: 18,
    vetoed: 0,
    failed: 0,
    withdrawn: 0,
    expired: 0,
  })[status];
}

export function buildPublicActionRiskImpact(args: {
  publicProject?: PublicProjectRiskEvidence | null;
  governmentAction?: GovernmentActionRiskEvidence | null;
}): PropertyInfrastructureRiskImpact {
  const adjustments: Record<string, ScenarioInfrastructureAdjustment> = {};
  const project = args.publicProject ?? undefined;
  const action = args.governmentAction ?? undefined;
  for (const item of [project, action].filter(Boolean) as Array<PublicProjectRiskEvidence | GovernmentActionRiskEvidence>) {
    const errors = validatePropertyRiskEvidence(item as unknown as PropertyRiskEvidence);
    if (item.kind === "public-project" && item.confidence === "verified" && !item.projectName?.trim()) {
      errors.push("Verified public-project evidence requires a project name.");
    }
    if (item.kind === "government-action") {
      if (!item.governmentBody?.trim()) errors.push("Government-action evidence requires a government body.");
      if (!item.officialTitle?.trim()) errors.push("Government-action evidence requires an official title.");
      if (!item.lastOfficialAction?.trim()) errors.push("Government-action evidence requires the last official action.");
      if (!item.geographicScope?.trim()) errors.push("Government-action evidence requires geographic scope.");
    }
    if (errors.length) throw new Error(errors.join(" "));
    for (const id of item.affectedScenarioIds ?? []) {
      const current = adjustments[id] ?? { verified: true, notes: [] };
      if (item.kind === "public-project") current.publicProjectPenalty = publicProjectPenalty(item.status);
      else current.governmentActionPenalty = governmentActionPenalty(item.status);
      current.verified = current.verified !== false && item.confidence === "verified";
      current.notes = [...(current.notes ?? []), ...(item.notes ?? []), `${item.kind}: ${item.status}`];
      adjustments[id] = current;
    }
  }
  const projectClear = project?.status === "no-identified-exposure";
  const actionClear = !action || ["vetoed", "failed", "withdrawn", "expired"].includes(action.status);
  return {
    water: "unknown",
    insurance: "unknown",
    publicProject: !project || project.confidence === "unresolved" ? "unknown" : projectClear ? "verified-clear" : "verified-constrained",
    governmentAction: !action || action.confidence === "unresolved" ? "unknown" : actionClear ? "verified-clear" : "verified-constrained",
    scenarioAdjustments: adjustments,
  };
}
