/**
 * Property-specific agricultural answers. TECH-PROV-001 / CANON-EXPL-001.
 * Removes uncalibrated acreage/prime-soil scores and invented stocking/gross
 * income claims. County context is not parcel productivity or profitability.
 * Pure deterministic replay; no clock, random values, or concealed defaults.
 */
import { assessAlfalfaSuitability, type AgronomicSoilEvidence } from "@/lib/property/cropSuitability";
export const FARM_USE_INTEGRITY_VERSION = "farm-use-integrity-v2.0.0" as const;
export interface FarmPropertyFacts {
  /** Parcel acreage in acres, when the source feed carries it (often null). */
  acres: number | null;
  soil?: AgronomicSoilEvidence | null;
  evidenceAsOf?: string;
  /** Independently sourced, comparable whole-parcel alternatives, not generic
   * dollars/acre, sliders, or undocumented AI estimates. */
  enterpriseBudgets?: Array<{
    name: string; annualRevenue: number; annualOperatingCosts: number;
    annualReplacementReserve: number; startupCapital: number;
    sourceRef: string; asOf: string; coversWholeParcel: boolean;
    agronomyVerified: boolean; marketVerified: boolean; legalUseVerified: boolean;
  }>;
  county: string | null;
  state: string | null;
  /** County-average cropland cash rent, $/acre/yr (USDA NASS), when resolved. */
  croplandRentPerAcre: number | null;
  pastureRentPerAcre: number | null;
  /** State average farm real-estate value, $/acre (USDA), when resolved. */
  stateFarmlandPerAcre: number | null;
  /** Straight-line miles to the nearest MAJOR (metro) airport — a proxy for
      metro/market proximity, which drives direct-market specialty, agritourism,
      and developer interest. Null when unresolved. */
  nearestMetroMiles?: number | null;
  /** USDA-NRCS SSURGO dominant-soil facts (public), when resolved. */
  primeFarmland?: string | null; // e.g. "All areas are prime farmland" | "Not prime farmland"
  /** Non-irrigated land-capability class 1–8 (1–4 = arable cropland; 5–8 = pasture/limited). */
  capabilityClass?: number | null;
  /** NRCS drainage class, e.g. "Well drained" | "Poorly drained" — steers
      orchard/vineyard (need drainage) vs hay/pasture (tolerate wet ground). */
  drainageClass?: string | null;
  /** USDA plant-hardiness zone, e.g. "7b". */
  hardinessZone?: string | null;
  /** County-average crop yields, bu/acre (USDA NASS Survey), when resolved — a
      productivity benchmark for the parcel's county, never a parcel guarantee. */
  cornYieldPerAcre?: number | null;
  soybeanYieldPerAcre?: number | null;
  wheatYieldPerAcre?: number | null;
  /** Survey year the county yields are drawn from. */
  yieldYear?: number | null;
  /** Parcel-record land use and zoning. Zoning semantics are attached only when
      Furlong has an exact, source-cited jurisdiction interpretation. */
  landUse?: string | null;
  zoningCode?: string | null;
  zoningLabel?: string | null;
  zoningSummary?: string | null;
  zoningSource?: string | null;
  zoningSourceUrl?: string | null;
  propertyWideCandidates?: string[];
  developmentNote?: string | null;
  energyNote?: string | null;
  publicWater?: boolean | null;
  publicSewer?: boolean | null;
  /** Parcel allocation by land cover/use. No segment is presumed worthless. */
  tillableAcres?: number | null;
  pastureAcres?: number | null;
  forestedAcres?: number | null;
  wetlandAcres?: number | null;
  developedAcres?: number | null;
  otherAcres?: number | null;
  /** NOI of a complete, segment-aware parcel operating scenario. */
  parcelPortfolioNoiAnnual?: number | null;
  parcelPortfolioBasis?: string | null;
  /** Verified rather than inferred from distance to a metro. */
  buyerDemandVerified?: boolean;
  competitionVerified?: boolean;
  waterCapacityVerified?: boolean;
  /** Representative parcel slope when the soil/topography resolver supplies it. */
  slopePct?: number | null;
}

export interface BestUseOption {
  name: string;
  /** This is an AGRICULTURAL enterprise screen, not a property-wide HBU verdict. */
  tier: "leading-screen" | "strong" | "possible" | "marginal" | "needs-evidence";
  /** Kept for payload compatibility. The text itself states gross/net/unpriced. */
  grossPerAcre: string;
  economicsBasis: "gross" | "net" | "mixed" | "unpriced";
  why: string;
}

export interface FarmBestUse {
  /** Explicit scope prevents a crop ranking from masquerading as highest-and-best use. */
  scope: "agricultural-enterprise-screen";
  evidenceStatus: "insufficient" | "screening" | "supported-screen";
  missingCriticalInputs: string[];
  parcelPortfolio: {
    totalAcres: number | null;
    segments: {
      tillable: number | null;
      pasture: number | null;
      forested: number | null;
      wetland: number | null;
      developed: number | null;
      other: number | null;
    };
    modeledNoiAnnual: number | null;
    basis: string | null;
  };
  headline: string;
  options: BestUseOption[];
  propertyWideContext: {
    currentUse: string | null;
    zoning: string | null;
    zoningSummary: string | null;
    source: string | null;
    sourceUrl: string | null;
    candidates: string[];
    note: string;
  };
  /** Single-enterprise vs diversified AGRICULTURAL screen only. */
  portfolioAdvice: {
    verdict: "single-anchor" | "diversify" | "not-yet-ranked";
    title: string;
    reasons: string[];
  };
}

export interface FarmPropertyAnswer {
  id: string;
  /** Property-specific answer — leads with what we can say about THIS parcel. */
  propertyAnswer: string;
  /** Honest "we can't see X — confirm at Y" note when parcel data is missing. */
  confirm: string | null;
}


const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const knownAcres = (f: FarmPropertyFacts) => finite(f.acres) && f.acres > 0;
const CANDIDATES = [
  ["Alfalfa — crop-specific evidence required", "Field pH, drainage, establishment costs, water and verified hay buyers govern; grass hay is not interchangeable with alfalfa."],
  ["Commodity row crops (corn/soy/wheat)", "Compare local rotation and lease budgets against this parcel's actual productive fields. Acreage alone does not determine whether grain is profitable."],
  ["Grass hay / forage (not alfalfa)", "Species, field soil tests, usable acreage, yield, machinery, storage and attainable local prices must be established."],
  ["Pasture livestock (cattle, sheep, goats)", "Stocking capacity requires measured forage supply, animal demand, grazing plan, water and winter feed; total parcel acreage is not grazing acreage."],
  ["Specialty crops / cut flowers / market produce", "Crop-specific soils, water, labor, post-harvest costs and buyers are required; no generic gross-per-acre return is credited."],
  ["Orchard / fruit", "Species/rootstock, soil depth, drainage, pH, chill/frost exposure, establishment period and market evidence govern."],
  ["Greenhouse / nursery / controlled environment", "Structures, power, water, labor, permits and buyer contracts require an operating and capital budget."],
  ["Vineyard / winery", "Variety-specific soil/climate and disease pressure, establishment time, permits and market evidence are unresolved."],
  ["Agritourism / farm experience", "Visitor demand, permitted use, access, parking, sanitation, facilities, insurance and operating costs require evidence."],
  ["Managed woodland / timber / recreation / forest products", "Inventory and management plans, access, conservation restrictions, market evidence and harvest timing govern; wooded acres are not assigned zero value."],
] as const;

export function farmBestUse(f: FarmPropertyFacts): FarmBestUse {
  const acreageKnown = knownAcres(f);
  const segments = { tillable: f.tillableAcres ?? null, pasture: f.pastureAcres ?? null,
    forested: f.forestedAcres ?? null, wetland: f.wetlandAcres ?? null,
    developed: f.developedAcres ?? null, other: f.otherAcres ?? null };
  const values = Object.values(segments);
  const allocationKnown = acreageKnown && values.every(v => finite(v) && v >= 0) &&
    Math.abs(values.reduce<number>((s, v) => s + (v ?? 0), 0) - f.acres!) <= 0.01;
  const alfalfa = assessAlfalfaSuitability(f.soil ?? {
    mapUnitName: null, farmlandClass: f.primeFarmland ?? null,
    drainageClass: f.drainageClass ?? null, slopePct: f.slopePct ?? null,
    capabilityClass: f.capabilityClass ?? null,
  }, f.evidenceAsOf);
  // An as-of date is an explicit input for freshness and replay; no hidden clock.
  const asOf = Date.parse(f.evidenceAsOf ?? "");
  const budgets = (f.enterpriseBudgets ?? []).filter(b => {
    const date = Date.parse(b.asOf);
    return b.name.trim() && b.sourceRef.trim() && b.coversWholeParcel &&
      b.agronomyVerified && b.marketVerified && b.legalUseVerified &&
      [b.annualRevenue, b.annualOperatingCosts, b.annualReplacementReserve, b.startupCapital].every(v => finite(v) && v >= 0) &&
      Number.isFinite(asOf) && Number.isFinite(date) && date <= asOf && asOf - date <= 365 * 86400000 &&
      // A document saying "verified" cannot override the canonical crop gate.
      (!/alfalfa/i.test(b.name) || alfalfa.status === "supported-screen");
  });
  const distinctBudgets = [...new Map(budgets.map(b => [b.name.trim().toLowerCase(), b])).values()];
  const missingCriticalInputs = [
    !acreageKnown ? "verified acreage" : null,
    !allocationKnown ? "complete non-overlapping acreage allocation across tillable, pasture, forest, wetland, developed, and other ground" : null,
    f.soil?.spatialScope !== "parcel-intersection" || (f.soil.parcelCoveragePct ?? 0) < 99 ? "parcel-boundary soil coverage and field-specific crop suitability" : null,
    !f.soil?.fieldPh ? "current field soil tests, including pH and amendment history" : null,
    f.slopePct == null && f.soil?.slopePct == null ? "field topography/slope evidence" : null,
    !f.hardinessZone ? "crop-specific climate and growing-season fit" : null,
    !f.buyerDemandVerified ? "verified buyer demand/offtake" : null,
    !f.competitionVerified ? "local competition and attainable market share" : null,
    !f.waterCapacityVerified ? "water/irrigation capacity" : null,
    !f.zoningCode || !f.zoningSourceUrl ? "source-cited zoning and proposed-use interpretation" : null,
    distinctBudgets.length < 2 ? "at least two current, source-backed, whole-parcel alternatives with comparable operating costs, reserves and startup capital" : null,
  ].filter((x): x is string => Boolean(x));
  const supported = missingCriticalInputs.length === 0;
  const ranked = supported ? distinctBudgets.sort((a,b) =>
    (b.annualRevenue-b.annualOperatingCosts-b.annualReplacementReserve) -
    (a.annualRevenue-a.annualOperatingCosts-a.annualReplacementReserve) || a.name.localeCompare(b.name)) : [];
  const options: BestUseOption[] = ranked.length ? ranked.map((b,i) => ({
    name: b.name, tier: i === 0 ? "leading-screen" : "possible", economicsBasis: "net",
    grossPerAcre: "Whole-parcel annual NOI after operating expenses and replacement reserves: $" +
      (b.annualRevenue-b.annualOperatingCosts-b.annualReplacementReserve).toLocaleString("en-US") +
      "; startup capital: $" + b.startupCapital.toLocaleString("en-US"),
    why: "Compared only with the documented alternatives, before financing. Source: " + b.sourceRef + "; as of " + b.asOf,
  })) : CANDIDATES.map(([name, why]) => ({
    name, tier: "needs-evidence", economicsBasis: "unpriced",
    grossPerAcre: "Property-specific economics pending",
    why: /Alfalfa/.test(name) ? alfalfa.reasons.join(" ") + " Required: " + alfalfa.requiredEvidence.join("; ") + "." : why,
  }));
  const parcel = acreageKnown ? "this " + f.acres!.toLocaleString("en-US") + "-acre parcel" : "this parcel with unverified acreage";
  return {
    scope: "agricultural-enterprise-screen",
    evidenceStatus: !acreageKnown ? "insufficient" : supported ? "supported-screen" : "screening",
    missingCriticalInputs,
    parcelPortfolio: { totalAcres: acreageKnown ? f.acres : null, segments,
      modeledNoiAnnual: supported && ranked[0] ? ranked[0].annualRevenue - ranked[0].annualOperatingCosts - ranked[0].annualReplacementReserve : null,
      basis: supported && ranked[0] ? ranked[0].name + "; source: " + ranked[0].sourceRef + "; as of " + ranked[0].asOf : null },
    headline: supported
      ? "Among the source-backed whole-parcel alternatives tested for " + parcel + ", " + options[0].name + " has the highest documented scenario NOI. This is not a property-wide highest-and-best-use conclusion."
      : "Agricultural enterprise comparison: evidence pending for " + parcel + ". Furlong is not naming or ranking a best agricultural enterprise. Soil, pH, usable field acreage, actual costs and attainable buyers must support that answer; prime farmland and acreage alone cannot establish profitability.",
    options,
    portfolioAdvice: { verdict: "not-yet-ranked",
      title: supported ? "Compare capital needs, timing and risk before selecting a plan" : "Single enterprise versus diversified mix: evidence pending",
      reasons: ["No automatic diversification, acreage-based winner or generic profit estimate. Compare complete alternatives on the same land, time period and net-income basis.", ...missingCriticalInputs] },
    propertyWideContext: { currentUse: f.landUse ?? null, zoning: f.zoningLabel ?? f.zoningCode ?? null,
      zoningSummary: f.zoningSummary ?? null, source: f.zoningSource ?? null, sourceUrl: f.zoningSourceUrl ?? null,
      candidates: f.propertyWideCandidates ?? ["Agricultural production", "Agritourism / value-added agriculture", "Rural residential where permitted", "Energy/storage where permitted", "Conservation / forestry / hold"],
      note: [f.developmentNote, f.energyNote, "Legal permissibility, physical feasibility, entitlement/infrastructure, market demand and comparable economics must be tested before naming a property-wide highest/best-supported use."].filter(Boolean).join(" ") },
  };
}

export function answerFarmQuestions(f: FarmPropertyFacts): FarmPropertyAnswer[] {
  const acres = knownAcres(f) ? f.acres!.toLocaleString("en-US") + " acres" : "unverified acreage";
  const soil = assessAlfalfaSuitability(f.soil, f.evidenceAsOf);
  const out: FarmPropertyAnswer[] = [
    { id: "acreage", propertyAnswer: "The record identifies " + acres + ". Total parcel acreage is not automatically tillable, grazeable or developable acreage. Size alone cannot identify a profitable enterprise.", confirm: "Obtain the field/land-cover allocation and reconcile it to the parcel boundary." },
    { id: "livestock", propertyAnswer: "Stocking capacity is not calculated yet. It requires usable pasture acres, measured forage production, utilization, animal class and feed demand. Furlong does not divide the entire parcel by a generic acres-per-cow rule.", confirm: "Supply a grazing and winter-feed plan with water and fencing costs." },
    { id: "flowers", propertyAnswer: "Flower/produce profitability is not established. Crop-specific soil and water suitability, realistic saleable yield, labor, packing, losses, startup costs and verified buyers are required.", confirm: "Supply a local enterprise budget and buyer evidence." },
    { id: "equestrian", propertyAnswer: "Horse capacity and boarding income are not established from parcel size. Usable turnout area, feed imports, facilities, waste handling, permitted use and local occupancy/pricing evidence govern.", confirm: "Supply a facility plan, permitted capacity and operating budget." },
    { id: "diversified", propertyAnswer: "A diversified mix is not automatically more profitable than a single enterprise. Compare complete, non-overlapping land allocations and operating budgets, including startup capital and time to income.", confirm: farmBestUse(f).missingCriticalInputs.join("; ") || null },
    { id: "alfalfa", propertyAnswer: soil.reasons.join(" "), confirm: soil.requiredEvidence.join("; ") },
    { id: "expansion-rent", propertyAnswer: finite(f.croplandRentPerAcre)
      ? "The supplied county USDA NASS cropland-rent benchmark is $" + f.croplandRentPerAcre.toLocaleString("en-US") + "/acre/year. This is county context, not this parcel's lease income or NOI."
      : "Local lease evidence is pending. Furlong has no parcel-specific lease price to credit as income.", confirm: "Verify usable leased acres, lease terms, taxes, insurance and owner-paid costs." },
    { id: "usda-number", propertyAnswer: "Ask the local USDA Service Center about farm/tract registration and the records needed for the specific program. Registration alone does not establish program eligibility.", confirm: null },
  ];
  const yields = [["corn", f.cornYieldPerAcre], ["soybeans", f.soybeanYieldPerAcre], ["wheat", f.wheatYieldPerAcre]]
    .filter(([,v]) => finite(v)).map(([name,v]) => name + " " + v + " bu/acre");
  if (yields.length) out.push({ id: "productivity", propertyAnswer: "USDA NASS county benchmarks" + (f.yieldYear ? " (" + f.yieldYear + ")" : "") + ": " + yields.join(", ") + ". These are not measured or predicted parcel yields.", confirm: "Use field production history and agronomic review before adopting yields in an operating plan." });
  return out;
}
