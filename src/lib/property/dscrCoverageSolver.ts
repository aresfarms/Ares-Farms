/**
 * dscrCoverageSolver — answers the founder's question (2026-07-29): "what
 * combination of crops, livestock, hay, flowers, or orchard would clear the
 * 1.25x DSCR floor for THIS property — and if none can, say so plainly."
 *
 * Deterministic screening over the agricultural-opportunity optimizer's
 * enterprise models. Three honest verdicts:
 *   - clears: a modeled single enterprise or mix services the debt at ≥1.25x;
 *   - close:  the best mix covers the payment (≥1.0x) but misses the lender
 *             floor — the gap is stated in dollars, with the off-farm-income
 *             (global DSCR) and price paths that close it;
 *   - cannot: no modeled combination covers the payment — agriculture alone
 *             will not carry this purchase at the screening price; outside
 *             income or a lower price is required, both quantified.
 *
 * The borrower's documented history always outranks the model — that is
 * stated in the output, because real operating records (e.g. an owner who
 * actually nets more than the county screen) are exactly what underwriting
 * substitutes for these assumptions.
 */

import { optimizeAgriculturalOpportunities, type OpportunityAssumptions } from "@/lib/property/agriculturalOpportunityOptimizer";

export const DSCR_FLOOR = 1.25;

export interface SoilConstraintInput {
  mapUnitName: string | null;
  farmlandClass: string | null;
  drainageClass: string | null;
  slopePct: number | null;
  capabilityClass: number | null;
}

/**
 * Agronomic constraints (founder direction 2026-07-29: "not everything grows
 * in all soil types... that and topography as well"). Enterprises the mapped
 * soil cannot sustain WITHOUT costly amendments are excluded from being the
 * clearing plan; marginal fits are penalized, with the soil basis named.
 * Deterministic and conservative — amendments (tile, terracing, irrigation
 * development) are never silently assumed.
 */
function soilAdjustments(soil: SoilConstraintInput | null): {
  excluded: Map<string, string>;
  penalties: Map<string, { factor: number; reason: string }>;
  soilSuitability: number | null;
  notes: string[];
} {
  const excluded = new Map<string, string>();
  const penalties = new Map<string, { factor: number; reason: string }>();
  const notes: string[] = [];
  if (!soil) {
    return {
      excluded,
      penalties,
      soilSuitability: null,
      notes: ["No parcel soil survey attached — enterprise screening ran without soil constraints; the NRCS soil map and an on-site evaluation govern before committing acreage."],
    };
  }
  const ground = soil.mapUnitName ?? "the mapped soil";
  const drainage = (soil.drainageClass ?? "").toLowerCase();
  const wet = /(^|\s)(very )?poorly drained/.test(drainage) && !/somewhat/.test(drainage);
  const somewhatWet = /somewhat poorly drained/.test(drainage);
  const droughty = /excessively drained/.test(drainage);
  const slope = soil.slopePct;
  const cap = soil.capabilityClass;

  if (wet) {
    excluded.set("alfalfa-small-square", `${ground} is ${soil.drainageClass?.toLowerCase()} — alfalfa cannot stand wet ground; drainage amendments are costly and not assumed`);
    penalties.set("row-crops", { factor: 0.7, reason: `${soil.drainageClass} ground needs tile drainage before reliable row-crop yields — cost not assumed` });
    penalties.set("specialty-crops", { factor: 0.75, reason: `vegetables, berries, and orchard plantings need raised beds or drainage on ${soil.drainageClass?.toLowerCase()} ground` });
    notes.push(`Drainage constraint: ${ground} (${soil.drainageClass}) favors forage, pasture, and grazing over deep-rooted or bedded plantings.`);
  } else if (somewhatWet) {
    penalties.set("alfalfa-small-square", { factor: 0.5, reason: `alfalfa persistence suffers on ${soil.drainageClass?.toLowerCase()} ground without tile — stand life and yield reduced` });
    penalties.set("row-crops", { factor: 0.85, reason: `wet-season field access and yield drag on ${soil.drainageClass?.toLowerCase()} ground` });
  }
  if (droughty) {
    penalties.set("row-crops", { factor: 0.8, reason: `droughty ${ground} — dryland row-crop yields unreliable; irrigation water source required` });
    penalties.set("hay-pasture", { factor: 0.85, reason: "droughty ground cuts forage tonnage in dry years" });
    notes.push(`Droughty soils: ${ground} (${soil.drainageClass}) — irrigated enterprises carry their development cost in the model; dryland enterprises are penalized.`);
  }
  if (slope != null && slope >= 15) {
    excluded.set("row-crops", `~${slope}% slopes — row-crop equipment operation and erosion control are impractical without terracing (costly, not assumed)`);
    excluded.set("alfalfa-small-square", `~${slope}% slopes — irrigated hay systems and harvest equipment are impractical on this topography`);
    penalties.set("specialty-crops", { factor: 0.7, reason: `~${slope}% slopes limit bedded and irrigated plantings; orchard on contour remains possible with care` });
    notes.push(`Topography constraint: ~${slope}% representative slope steers this ground toward pasture, grazing, and orchard-on-contour uses.`);
  } else if (slope != null && slope >= 8) {
    penalties.set("row-crops", { factor: 0.85, reason: `~${slope}% slopes require contour practices and erosion planning for row crops` });
  }
  if (cap != null && cap >= 6) {
    excluded.set("row-crops", `land-capability class ${cap} — not arable cropland (NRCS); pasture, range, or woodland uses`);
    excluded.set("alfalfa-small-square", `land-capability class ${cap} — not suited to cultivated hay production`);
    excluded.set("specialty-crops", `land-capability class ${cap} — cultivation limitations too severe for intensive plantings`);
    notes.push(`Capability constraint: class ${cap} ground is not cropland — grazing and non-cultivated uses only.`);
  } else if (cap === 5) {
    penalties.set("row-crops", { factor: 0.7, reason: "land-capability class 5 — cultivation limited; cropping is marginal" });
  }

  // Optimizer knob: capability class → 0–100 suitability, farmland-class bump.
  let soilSuitability: number | null = null;
  if (cap != null) {
    soilSuitability = cap <= 2 ? 85 : cap === 3 ? 70 : cap === 4 ? 55 : cap === 5 ? 40 : cap === 6 ? 30 : 15;
  }
  const farmland = (soil.farmlandClass ?? "").toLowerCase();
  if (soilSuitability != null) {
    if (/prime farmland/.test(farmland) && !/not prime/.test(farmland)) soilSuitability = Math.min(100, soilSuitability + 10);
    else if (/statewide importance/.test(farmland)) soilSuitability = Math.min(100, soilSuitability + 5);
    else if (/not prime/.test(farmland)) soilSuitability = Math.max(0, soilSuitability - 10);
  }

  if (excluded.size === 0 && penalties.size === 0) {
    notes.push(`Soil check: ${ground}${soil.drainageClass ? ` (${soil.drainageClass.toLowerCase()}${slope != null ? `, ~${slope}% slope` : ""})` : ""} carries no modeled agronomic exclusions — enterprise budgets and an on-site soil evaluation still govern.`);
  }
  return { excluded, penalties, soilSuitability, notes };
}

export interface CoverageMixPart {
  label: string;
  sharePct: number;
  annualNoi: number;
}

export interface CoverageSolution {
  floor: number;
  annualDebtService: number;
  requiredNoi: number;
  bestSingle: { label: string; annualNoi: number; dscr: number } | null;
  bestMix: { parts: CoverageMixPart[]; annualNoi: number; dscr: number } | null;
  verdict: "clears" | "close" | "cannot";
  /** Dollars/yr the best option falls short of the 1.25x floor (null when clear). */
  gapAnnual: number | null;
  /** Off-farm income counted in GLOBAL DSCR that closes the gap (== gapAnnual). */
  outsideIncomeNeeded: number | null;
  /** Screening price at which the best modeled income clears 1.25x. */
  maxSupportablePrice: number | null;
  notes: string[];
}

export function solveDscrCoverage(args: {
  acres: number;
  screeningPrice: number;
  annualDebtService: number;
  ratePct: number;
  amortYears: number;
  ltv: number;
  soil?: SoilConstraintInput | null;
  assumptions?: Partial<OpportunityAssumptions>;
}): CoverageSolution {
  const soilAdj = soilAdjustments(args.soil ?? null);
  const model = optimizeAgriculturalOpportunities({
    acres: args.acres,
    purchasePrice: args.screeningPrice,
    debtService: args.annualDebtService,
    waterScore: 70,
    laborCapacity: 55,
    capitalCapacity: 55,
    marketAccess: 60,
    gridEvidence: false,
    solarZoningEvidence: false,
    ...(soilAdj.soilSuitability != null ? { soilSuitability: soilAdj.soilSuitability } : {}),
    ...args.assumptions,
  });

  const ds = args.annualDebtService;
  const requiredNoi = ds * DSCR_FLOOR;

  // Apply the agronomic layer: excluded enterprises cannot be the clearing
  // plan; penalized ones carry reduced NOI with the reason named.
  const adjustedNoi = (key: string, noi: number): number | null => {
    if (soilAdj.excluded.has(key)) return null;
    const penalty = soilAdj.penalties.get(key);
    return penalty ? noi * penalty.factor : noi;
  };
  const adjustedRanked = model.ranked
    .filter((r) => r.eligible)
    .map((r) => ({ ...r, adjNoi: adjustedNoi(r.key, r.noi) }))
    .filter((r): r is typeof r & { adjNoi: number } => r.adjNoi != null)
    .sort((x, y) => y.adjNoi - x.adjNoi);

  const bestSingleRaw = adjustedRanked[0] ?? null;
  const bestSingle = bestSingleRaw
    ? { label: bestSingleRaw.label, annualNoi: Math.round(bestSingleRaw.adjNoi), dscr: ds > 0 ? bestSingleRaw.adjNoi / ds : 0 }
    : null;

  const mixParts = model.diversified
    .map((r) => ({ r, adjNoi: adjustedNoi(r.key, r.noi) }))
    .filter((entry): entry is { r: (typeof model.diversified)[number]; adjNoi: number } => entry.adjNoi != null);
  const mixShareTotal = mixParts.reduce((sum, entry) => sum + entry.r.portfolioShare, 0);
  const bestMix = mixParts.length && mixShareTotal > 0
    ? (() => {
        const parts = mixParts.map((entry) => ({
          label: entry.r.label,
          sharePct: Math.round((entry.r.portfolioShare / mixShareTotal) * 100),
          annualNoi: Math.round(entry.adjNoi * (entry.r.portfolioShare / mixShareTotal)),
        }));
        const annualNoi = parts.reduce((sum, part) => sum + part.annualNoi, 0);
        return { parts, annualNoi, dscr: ds > 0 ? annualNoi / ds : 0 };
      })()
    : null;

  const bestNoi = Math.max(bestSingle?.annualNoi ?? 0, bestMix?.annualNoi ?? 0);
  const bestDscr = ds > 0 ? bestNoi / ds : 0;

  const verdict: CoverageSolution["verdict"] =
    bestDscr >= DSCR_FLOOR ? "clears" : bestDscr >= 1.0 ? "close" : "cannot";
  const gapAnnual = verdict === "clears" ? null : Math.round(requiredNoi - bestNoi);

  // Invert the level-payment screen: the price at which the best modeled
  // income clears the floor. DS(price) = price·LTV·r/(1−(1+r)^−n) →
  // price = (bestNoi/1.25) / (LTV·r/(1−(1+r)^−n)).
  const r = args.ratePct / 100;
  const paymentFactor = args.ltv * (r > 0 ? r / (1 - Math.pow(1 + r, -args.amortYears)) : 1 / args.amortYears);
  const maxSupportablePrice = bestNoi > 0 && paymentFactor > 0 ? Math.round(bestNoi / DSCR_FLOOR / paymentFactor) : null;

  const exclusionNotes = [...soilAdj.excluded.entries()].map(
    ([, reason]) => `EXCLUDED by soil/topography: ${reason}.`
  );
  const penaltyNotes = [...soilAdj.penalties.entries()].map(
    ([, penalty]) => `Penalized ${Math.round((1 - penalty.factor) * 100)}%: ${penalty.reason}.`
  );
  const notes = [
    ...soilAdj.notes,
    ...exclusionNotes,
    ...penaltyNotes,
    "Screening model over county economics and stated capacity assumptions — enterprise budgets, contracts, and site evidence move every figure.",
    "The borrower's documented operating history OUTRANKS this model at underwriting: an operator with real records (e.g. Schedule F showing stronger commodity income on this ground) substitutes those records for these assumptions — bring three years.",
    "Off-farm income counts in GLOBAL debt-service coverage under FSA and most lender conventions — the outside-income figure below is stated on that basis.",
  ];

  return {
    floor: DSCR_FLOOR,
    annualDebtService: Math.round(ds),
    requiredNoi: Math.round(requiredNoi),
    bestSingle,
    bestMix,
    verdict,
    gapAnnual,
    outsideIncomeNeeded: gapAnnual,
    maxSupportablePrice,
    notes,
  };
}
