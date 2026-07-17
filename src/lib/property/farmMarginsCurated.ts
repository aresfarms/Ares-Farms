/**
 * farmMarginsCurated — what a bushel price actually MEANS for a farmer
 * (founder direction 2026-07-17: "$4.54 corn" and "costs up 22%" sitting side
 * by side don't say anything — say the per-truckload gross and the net
 * estimated profit for corn, soybeans, wheat; and poultry, per pound).
 *
 * The honest core (USDA ERS Commodity Costs & Returns): at today's prices the
 * three crops clear their OPERATING (cash) cost with room, but none covers its
 * full ECONOMIC cost once land and equipment are charged. So a truthful tool
 * shows TWO net lines — over cash cost (feels like profit) and over full cost
 * (tells you whether the whole operation is paying for itself). One number
 * alone misleads.
 *
 * Poultry is different in kind: ~97% of US broilers are raised under contract,
 * where the grower owns no birds and buys no feed — they're paid a housing fee
 * per pound, NOT the market price. So there is no "market margin per pound" for
 * the farmer; the honest figure is the fee against the barn debt it services.
 *
 * Curated national-average snapshot (like farmEditorialCurated), maintained by
 * the team from USDA releases. Illustrative — a specific operation's costs and
 * local basis differ. Scanned by verify:brief-copy. Deterministic.
 */

export type CropCommodity = "corn" | "soybeans" | "wheat";

export interface CropCostBasis {
  label: string;
  /** Test weight — corn 56 lb/bu, soybeans & wheat 60 lb/bu. */
  bushelWeightLb: number;
  /** USDA ERS operating (cash) cost per bushel, national average. */
  operatingCostPerBu: number;
  /** USDA ERS total economic cost per bushel (adds land + capital recovery). */
  totalCostPerBu: number;
  /** USDA WASDE season-average price forecast per bushel (fallback price). */
  nationalPrice: number;
}

/** A legal grain load is weight-limited (~50,000 lb payload at 80k GVW). */
const LEGAL_LOAD_LB = 50_000;

export const CROP_COST_BASIS: Record<CropCommodity, CropCostBasis> = {
  // Costs: ERS 2026 forecast per planted acre ÷ 2025 NASS yield (midpoint of
  // the planted/harvested range). Prices: WASDE 2026/27 season-average.
  corn: { label: "Corn", bushelWeightLb: 56, operatingCostPerBu: 2.65, totalCostPerBu: 5.2, nationalPrice: 4.4 },
  soybeans: { label: "Soybeans", bushelWeightLb: 60, operatingCostPerBu: 4.88, totalCostPerBu: 12.95, nationalPrice: 11.4 },
  wheat: { label: "Wheat", bushelWeightLb: 60, operatingCostPerBu: 3.2, totalCostPerBu: 8.0, nationalPrice: 6.5 },
};

export const FARM_MARGINS_PROVENANCE = {
  costSource: "USDA ERS Commodity Costs & Returns, 2026 forecast (Jun 2026); per-bushel derived with 2025 NASS yields",
  priceSource: "USDA WASDE 2026/27 season-average forecast; local elevator bid where shown",
  note: "National averages, illustrative — a specific operation's costs, yields, and local basis differ. Not a projection of your result.",
} as const;

export interface TruckloadMargin {
  commodity: CropCommodity;
  label: string;
  pricePerBu: number;
  priceIsLocal: boolean;
  /** Bushels in a legal (weight-limited) load for this crop's test weight. */
  bushelsPerLoad: number;
  gross: number;
  /** Net over operating (cash) cost — the number that feels like profit. */
  netOverOperating: number;
  /** Net over full economic cost — the number that includes land + equipment. */
  netOverTotal: number;
}

const round10 = (n: number): number => Math.round(n / 10) * 10;

/**
 * Per-truckload economics for one crop at a given price (local bid preferred,
 * else the national season-average). Weight-limited load, so heavier soybeans
 * and wheat carry fewer bushels than corn.
 */
export function truckloadMargin(
  commodity: CropCommodity,
  localPrice?: number | null
): TruckloadMargin {
  const b = CROP_COST_BASIS[commodity];
  const priceIsLocal = typeof localPrice === "number" && localPrice > 0;
  const price = priceIsLocal ? (localPrice as number) : b.nationalPrice;
  const bushelsPerLoad = Math.round(LEGAL_LOAD_LB / b.bushelWeightLb);
  return {
    commodity,
    label: b.label,
    pricePerBu: price,
    priceIsLocal,
    bushelsPerLoad,
    gross: round10(price * bushelsPerLoad),
    netOverOperating: round10((price - b.operatingCostPerBu) * bushelsPerLoad),
    netOverTotal: round10((price - b.totalCostPerBu) * bushelsPerLoad),
  };
}

/**
 * Poultry reality for a contract grower — a fee per pound, not a market margin
 * (the whole point). Kept as an explainer, never a fabricated profit number.
 */
export const POULTRY_GROWER_NOTE = {
  growerFeeCentsPerLb: { low: 4.3, median: 6.8, high: 9.6 }, // USDA ERS, 2020 median
  integratorMarketCentsPerLb: 122, // USDA AMS wholesale composite, 2026
  asOf: "grower fee: USDA ERS 2020; market price: USDA AMS 2026",
  text:
    "Poultry pays on a different clock. Under contract — how nearly every bird here is raised — the grower " +
    "owns no birds and buys no feed or chicks; the integrator does. The grower is paid a housing fee of about " +
    "5–9¢ per pound of live weight (roughly 45¢ a bird), and that fee has to cover utilities, labor, litter, " +
    "and the debt on the houses. The ~$1.22/lb market price is the integrator's, not the grower's — so for a " +
    "grower, \"profit per pound\" is the fee minus your own costs, not the price of chicken.",
} as const;

/** A one-line, honest read of a crop's truckload margin. */
export function truckloadLine(m: TruckloadMargin): string {
  const usd = (n: number): string => `$${Math.abs(n).toLocaleString("en-US")}`;
  const cash = m.netOverOperating >= 0 ? `about ${usd(m.netOverOperating)} over your cash costs` : `about ${usd(m.netOverOperating)} short of cash costs`;
  const full =
    m.netOverTotal >= 0
      ? `and still ${usd(m.netOverTotal)} ahead after land and equipment`
      : `but roughly ${usd(m.netOverTotal)} in the red once land and equipment are counted`;
  return `${m.label} at $${m.pricePerBu.toFixed(2)} → ${usd(m.gross)} a truckload (${m.bushelsPerLoad} bu): ${cash}, ${full}.`;
}
