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
      if (item.kind === "water") current.waterPenalty = penalty;
      else current.insurancePenalty = penalty;
      current.verified = current.verified !== false && item.confidence === "verified";
      current.notes = [...(current.notes ?? []), ...(item.notes ?? []), `${item.kind}: ${item.status}`];
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
