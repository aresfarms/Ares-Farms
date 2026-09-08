/**
 * Source-backed construction scenario. TECH-PROV-001 / CANON-EXPL-001.
 * County hazard ratings identify diligence; they are neither parcel building-code
 * determinations nor dollar multipliers. No invented cost index or premiums.
 */
import type { CountyHazardRisk } from "@/lib/property/countyHazardRiskGenerated";
export interface RebuildEstimateInput {
  squareFeet: number | null; squareFeetVerified?: boolean;
  yearBuilt?: number | null; acres?: number | null;
  countyHazard?: CountyHazardRisk | null; femaFloodZone?: string | null;
  asOfYear: number;
  costEvidence?: { lowPerSqft: number; highPerSqft: number; sourceRef: string; asOfYear: number; includesSiteHazards: boolean } | null;
}
export interface HazardRequirement {
  hazard: "flood" | "wind" | "seismic" | "wildfire";
  riskLabel: string; requirement: string; premiumPct: number;
}
export interface RebuildEstimate {
  status: "estimated" | "unavailable"; areaSqft: number | null; areaVerified: boolean; sqftImplausible: boolean;
  baseLowUsd: number | null; baseHighUsd: number | null; hazardRequirements: HazardRequirement[];
  totalPremiumPct: number; rebuildLowUsd: number | null; rebuildHighUsd: number | null;
  notes: string[]; sources: string[];
}
export const REBUILD_CALCULATION_VERSION = "source-backed-rebuild-v2.0.0";
const positive = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
export function estimateHazardRebuild(input: RebuildEstimateInput): RebuildEstimate {
  const h = input.countyHazard;
  const zone = (input.femaFloodZone ?? "").toUpperCase();
  const candidates: Array<[HazardRequirement["hazard"], string | null | undefined]> = [
    ["flood", /^[AV]/.test(zone) ? "FEMA zone " + zone : h?.floodCoastal],
    ["wind", h?.hurricane], ["seismic", h?.earthquake], ["wildfire", h?.wildfire],
  ];
  const hazardRequirements: HazardRequirement[] = candidates.filter(([, risk]) => risk && !/^(Very Low|Relatively Low)$/.test(risk)).map(([hazard, risk]) => ({
    hazard, riskLabel: risk!, premiumPct: 0,
    requirement: "Review " + hazard + " exposure with the local building authority and qualified designer; parcel-specific requirements and priced mitigation are not established by a county rating.",
  }));
  const area = positive(input.squareFeet) && input.squareFeet >= 100 && input.squareFeet <= 200_000 ? input.squareFeet : null;
  const base: RebuildEstimate = {
    status: "unavailable", areaSqft: area, areaVerified: input.squareFeetVerified === true, sqftImplausible: input.squareFeet != null && area == null,
    baseLowUsd: null, baseHighUsd: null, hazardRequirements, totalPremiumPct: 0, rebuildLowUsd: null, rebuildHighUsd: null,
    notes: ["Construction-cost evidence pending. FEMA hazard ratings do not establish rebuild prices, required construction methods, or whether a contractor bid is padded.",
      "No hazard flag is not an all-clear. Obtain parcel-specific design/code review and current itemized local estimates."],
    sources: [...(h ? ["FEMA National Risk Index — county context only"] : []), ...(zone ? ["FEMA flood map — reported zone " + zone] : [])],
  };
  const cost = input.costEvidence;
  if (!area || !input.squareFeetVerified || !cost || !positive(cost.lowPerSqft) || !positive(cost.highPerSqft) ||
      cost.highPerSqft < cost.lowPerSqft || !cost.sourceRef.trim() || !cost.includesSiteHazards ||
      !Number.isInteger(input.asOfYear) || cost.asOfYear !== input.asOfYear) return base;
  const low = area * cost.lowPerSqft, high = area * cost.highPerSqft;
  if (!Number.isFinite(low) || !Number.isFinite(high)) return base;
  return { ...base, status: "estimated", baseLowUsd: low, baseHighUsd: high, rebuildLowUsd: low, rebuildHighUsd: high,
    notes: ["Current supplied site-specific unit-cost range × verified building area. No automatic inflation or hazard percentage is added.",
      "Cost scenario, not market value, a bid fairness finding, an insurance determination or a code certification."],
    sources: [...base.sources, cost.sourceRef + "; as of " + cost.asOfYear] };
}
