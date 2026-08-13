/**
 * hazardRebuildEstimate — a parcel-specific, hazard-adjusted rebuild cost RANGE
 * (founder direction 2026-08-13). Purpose: a customer should see not just
 * "rebuild ≈ $X" but the real range for THIS parcel given the natural hazards
 * that drive its building code — so they can tell immediately whether a
 * contractor's bid is padded or lowballed, and whether the rebuild legitimately
 * needs piers, hurricane strapping, seismic bracing, or fire hardening.
 *
 * Grounded in PUBLIC data — never a guess:
 *   - FEMA National Risk Index county ratings (hurricane, earthquake, coastal
 *     & inland flood, wildfire) — src/lib/property/countyHazardRiskGenerated.ts.
 *   - FEMA flood ZONE (A/AE/V/VE/coastal) when resolved for the parcel.
 *
 * NOT an appraisal, an insurance determination, or a construction bid. A real
 * contractor estimate and a licensed appraisal outrank it. Square footage is
 * never trusted on entry (record OR customer): implausible area is rejected so
 * a wrong number can't skew the result, and only a MEASURED/calculated footprint
 * is treated as verified.
 *
 * Reusable across all three lanes (farm improvements, residential, commercial).
 */

import type { CountyHazardRisk } from "@/lib/property/countyHazardRiskGenerated";

// ── Tunable screening constants (founder-reviewable) ─────────────────────────
/** Base replacement cost range, $/ft² — reflects the ordinary spread across
 *  quality tier and region; a real bid narrows it. Stated AS-OF a year and
 *  auto-escalated to the current year so it never goes stale between data
 *  re-ingests (founder direction 2026-08-13: account for inflation, keep current).
 *  Re-base BASE_COST_AS_OF_YEAR + these figures whenever the cost index re-ingests. */
const BASE_LOW_PER_SQFT = 130;
const BASE_HIGH_PER_SQFT = 260;
const BASE_COST_AS_OF_YEAR = 2026;
/** Annual construction-cost escalation (~ENR Building Cost Index long-run).
 *  Applied from BASE_COST_AS_OF_YEAR to the current year; tie to an ingested
 *  index for automatic freshness, same pattern as the FHFA HPI. */
const CONSTRUCTION_COST_ANNUAL_ESCALATION = 0.045;
/** FEMA NRI qualitative class → fraction of a hazard's MAX premium applied. */
const RISK_FACTOR: Record<string, number> = {
  "Very High": 1.0,
  "Relatively High": 0.7,
  "Relatively Moderate": 0.35,
  "Relatively Low": 0.1,
  "Very Low": 0,
};
/** Each hazard's maximum construction premium (at "Very High" risk). */
const HAZARD_MAX_PREMIUM = { flood: 0.25, wind: 0.15, seismic: 0.12, wildfire: 0.08 } as const;
/** Sqft plausibility guards (shared intent with farmlandValuation). */
const SQFT_ABS_MIN = 100;
const SQFT_ABS_MAX = 200_000;
const SQFT_MAX_PARCEL_COVERAGE = 0.5;

export interface RebuildEstimateInput {
  squareFeet: number | null;
  squareFeetVerified?: boolean;
  yearBuilt?: number | null;
  acres?: number | null;
  countyHazard?: CountyHazardRisk | null;
  /** FEMA flood zone code, e.g. "AE", "VE", "X". A/V/coastal force elevation. */
  femaFloodZone?: string | null;
  asOfYear: number;
}

export interface HazardRequirement {
  hazard: "flood" | "wind" | "seismic" | "wildfire";
  riskLabel: string;
  requirement: string;
  premiumPct: number;
}

export interface RebuildEstimate {
  status: "estimated" | "unavailable";
  areaSqft: number | null;
  areaVerified: boolean;
  sqftImplausible: boolean;
  baseLowUsd: number | null;
  baseHighUsd: number | null;
  hazardRequirements: HazardRequirement[];
  totalPremiumPct: number;
  rebuildLowUsd: number | null;
  rebuildHighUsd: number | null;
  notes: string[];
  sources: string[];
}

const round1000 = (n: number) => Math.round(n / 1000) * 1000;
const factorFor = (cls: string | null | undefined) => (cls != null && RISK_FACTOR[cls] != null ? RISK_FACTOR[cls] : 0);

export function estimateHazardRebuild(input: RebuildEstimateInput): RebuildEstimate {
  const empty: RebuildEstimate = {
    status: "unavailable",
    areaSqft: null, areaVerified: false, sqftImplausible: false,
    baseLowUsd: null, baseHighUsd: null,
    hazardRequirements: [], totalPremiumPct: 0,
    rebuildLowUsd: null, rebuildHighUsd: null,
    notes: [], sources: [],
  };

  const sqft = input.squareFeet;
  if (sqft == null || sqft <= 0) {
    return { ...empty, notes: ["No building area to price a rebuild — provide (and verify) the footprint."] };
  }
  const parcelSqft = input.acres != null && input.acres > 0 ? input.acres * 43_560 : null;
  const plausible =
    sqft >= SQFT_ABS_MIN && sqft <= SQFT_ABS_MAX && (parcelSqft == null || sqft <= parcelSqft * SQFT_MAX_PARCEL_COVERAGE);
  if (!plausible) {
    return {
      ...empty,
      sqftImplausible: true,
      notes: [`The building area on file (${sqft.toLocaleString("en-US")} ft²) is implausible for this parcel — not used; a wrong number can't be allowed to set the rebuild. Verify the footprint.`],
    };
  }

  const h = input.countyHazard ?? null;
  const zone = (input.femaFloodZone ?? "").toUpperCase();
  const inCoastalOrHighFloodZone = /^V/.test(zone) || /^A/.test(zone); // V = coastal high-hazard; A = 1% annual flood
  const reqs: HazardRequirement[] = [];

  // Flood — the flood ZONE forces elevation regardless of the county class; the
  // NRI coastal-flood class scales the premium up.
  {
    const coastalClass = h?.floodCoastal ?? null;
    const floodFactor = Math.max(factorFor(coastalClass), inCoastalOrHighFloodZone ? 0.7 : 0);
    if (floodFactor > 0) {
      reqs.push({
        hazard: "flood",
        riskLabel: coastalClass ?? (zone ? `FEMA zone ${zone}` : "flood-prone"),
        requirement:
          "Elevated foundation — piers/pilings above base flood elevation, breakaway walls, and flood vents" +
          (/^V/.test(zone) ? " (V-zone: engineered pilings + free-of-obstruction ground level required)" : "") +
          ". Applies to beach, riverfront, and lakefront (incl. Great Lakes) sites.",
        premiumPct: Math.round(HAZARD_MAX_PREMIUM.flood * floodFactor * 1000) / 10,
      });
    }
  }
  // Wind / hurricane.
  {
    const f = factorFor(h?.hurricane);
    if (f >= 0.35) {
      reqs.push({
        hazard: "wind",
        riskLabel: h!.hurricane!,
        requirement:
          "High-wind construction — continuous load-path hurricane straps/clips, impact-rated (or shuttered) glazing, and enhanced roof-deck attachment. FL/GA/NC and Gulf coasts follow the strictest codes (Florida Building Code; Miami-Dade/Broward High-Velocity Hurricane Zone).",
        premiumPct: Math.round(HAZARD_MAX_PREMIUM.wind * f * 1000) / 10,
      });
    }
  }
  // Seismic / earthquake.
  {
    const f = factorFor(h?.earthquake);
    if (f >= 0.35) {
      reqs.push({
        hazard: "seismic",
        riskLabel: h!.earthquake!,
        requirement: "Seismic detailing — braced/shear walls, foundation anchorage and hold-downs, and flexible utility connections per the local seismic design category.",
        premiumPct: Math.round(HAZARD_MAX_PREMIUM.seismic * f * 1000) / 10,
      });
    }
  }
  // Wildfire.
  {
    const f = factorFor(h?.wildfire);
    if (f >= 0.35) {
      reqs.push({
        hazard: "wildfire",
        riskLabel: h!.wildfire!,
        requirement: "Ignition-resistant construction — Class-A roofing, ember-resistant vents, non-combustible siding/decking near grade, and defensible-space clearance (WUI code).",
        premiumPct: Math.round(HAZARD_MAX_PREMIUM.wildfire * f * 1000) / 10,
      });
    }
  }

  const totalPremiumPct = Math.round(reqs.reduce((s, r) => s + r.premiumPct, 0) * 10) / 10;
  const mult = 1 + totalPremiumPct / 100;
  // Inflation: escalate the base cost from its as-of year to the current year so
  // the number tracks real construction costs and never presents as timeless.
  const escalation = Math.pow(1 + CONSTRUCTION_COST_ANNUAL_ESCALATION, Math.max(0, input.asOfYear - BASE_COST_AS_OF_YEAR));
  const baseLow = round1000(sqft * BASE_LOW_PER_SQFT * escalation);
  const baseHigh = round1000(sqft * BASE_HIGH_PER_SQFT * escalation);
  const areaVerified = !!input.squareFeetVerified;

  const notes: string[] = [];
  if (!areaVerified) {
    notes.push("Square footage is UNVERIFIED — this rebuild range is a screening estimate; a measured footprint tightens it.");
  }
  if (reqs.length > 0) {
    notes.push(
      `Code on this parcel requires ${reqs.map((r) => r.hazard).join(", ")} construction (+${totalPremiumPct}% over a base build) — a bid materially under this range is likely missing that hazard work.`,
    );
  } else {
    notes.push("No elevated natural-hazard construction requirements flagged for this county — a base build range applies.");
  }
  notes.push("Screening range from public hazard data — not a contractor bid or an insurance determination. Get local bids before you rely on a number.");

  return {
    status: "estimated",
    areaSqft: sqft,
    areaVerified,
    sqftImplausible: false,
    baseLowUsd: baseLow,
    baseHighUsd: baseHigh,
    hazardRequirements: reqs,
    totalPremiumPct,
    rebuildLowUsd: round1000(baseLow * mult),
    rebuildHighUsd: round1000(baseHigh * mult),
    notes,
    sources: [
      "FEMA National Risk Index — county hazard ratings",
      ...(zone ? ["FEMA flood map — parcel flood zone"] : []),
      `Base construction cost as-of ${BASE_COST_AS_OF_YEAR}, escalated ×${escalation.toFixed(2)} to ${input.asOfYear} at ${(CONSTRUCTION_COST_ANNUAL_ESCALATION * 100).toFixed(1)}%/yr (construction cost index)`,
    ],
  };
}
