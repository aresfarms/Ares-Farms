/**
 * farmFinancialScorecard — a FREE, facts-only Farm Financial Health self-check.
 *
 * Founder direction 2026-07-20 ("add it in"): the Pinion-SnapShot idea, done the
 * Furlong way. Pinion's SnapShot benchmarks a farm's finances as lead-gen for
 * their paid advisory — i.e. Furlong's exact free-tool → licensed-advisory model.
 * We rebuild the PUBLIC half of it and stop at the licensing seam.
 *
 * WHAT THIS IS
 *   A pure calculator over the PUBLIC "Farm Financial Scorecard" (Farm Financial
 *   Standards Council / University of Minnesota Center for Farm Financial
 *   Management). The farmer enters their OWN balance-sheet and income numbers;
 *   this returns the standard measures across the five FFSC categories —
 *   liquidity, solvency, profitability, efficiency, repayment capacity — each
 *   with its published "strong / watch / vulnerable" critical value.
 *
 * WHAT THIS IS NOT (governance boundary — CANON / advisory-not-decide)
 *   - NOT advice. It computes a ratio and shows the published benchmark band.
 *     It never says "you should" anything. "What do I do about it" routes to the
 *     Guild / Stuart's licensed advisory (the licensing seam).
 *   - NOT Pinion's proprietary peer dataset. The critical values below are the
 *     PUBLISHED FFSC/UMN thresholds, not a private client pool. We fabricate no
 *     peer comparison and no benchmark we cannot cite to a public source.
 *   - NOT persisted. This is a stateless calculator; the operator's own numbers
 *     stay in the browser. No PII store (see [[newsletter-tiers-and-dual-save]]).
 *
 * Deterministic + side-effect-free: same inputs → same measures, no I/O, no fs.
 * Safe to import from a client component (unlike the fs-backed price overlays).
 *
 * Public sources for the critical values:
 *   - Farm Financial Standards Council, "Financial Guidelines for Agriculture".
 *   - Univ. of Minnesota Center for Farm Financial Management (FINBIN) —
 *     the Farm Financial Scorecard, https://www.cffm.umn.edu (public).
 *   - Univ. of Illinois farmdoc — Balance Sheet & Repayment Capacity tools
 *     (public), https://farmdoc.illinois.edu (a "confirm your numbers" pointer).
 */

export type ScorecardZone = "strong" | "watch" | "vulnerable" | "info";

export interface ScorecardInputs {
  /** Total farm assets at market value ($). */
  totalFarmAssets: number | null;
  /** Total farm liabilities ($). */
  totalFarmLiabilities: number | null;
  /** Current farm assets — cash + things sold/used within 12 months ($). */
  currentFarmAssets: number | null;
  /** Current farm liabilities — due within 12 months ($). */
  currentFarmLiabilities: number | null;
  /** Gross farm revenue for the year ($). */
  grossFarmRevenue: number | null;
  /** Total cash operating expense EXCLUDING interest and depreciation ($). */
  operatingExpense: number | null;
  /** Total interest expense for the year ($). */
  interestExpense: number | null;
  /** Depreciation for the year ($). */
  depreciationExpense: number | null;
  /** Scheduled annual principal + interest on term (intermediate/long) debt ($). */
  termDebtPayments: number | null;
}

export function emptyScorecardInputs(): ScorecardInputs {
  return {
    totalFarmAssets: null,
    totalFarmLiabilities: null,
    currentFarmAssets: null,
    currentFarmLiabilities: null,
    grossFarmRevenue: null,
    operatingExpense: null,
    interestExpense: null,
    depreciationExpense: null,
    termDebtPayments: null,
  };
}

export type ScorecardCategory =
  | "Liquidity"
  | "Solvency"
  | "Profitability"
  | "Efficiency"
  | "Repayment capacity";

export interface ScorecardMeasure {
  id: string;
  label: string;
  category: ScorecardCategory;
  /** Raw computed value (ratio, percent as 0–100, or dollars); null if inputs missing. */
  value: number | null;
  /** Human-readable value, e.g. "1.84", "42%", "$38,500", or "—". */
  display: string;
  unit: "ratio" | "percent" | "dollars";
  zone: ScorecardZone;
  /** "Strong" | "Watch" | "Vulnerable" | "For context". */
  zoneLabel: string;
  /** Plain-English: what this number tells you. */
  whatItMeasures: string;
  /** Published critical-value band, e.g. "Strong > 2.0 · Watch 1.3–2.0 · Vulnerable < 1.3". */
  benchmark: string;
  /** True when the quick-check formula simplifies the full FFSC definition. */
  approximate?: boolean;
}

export interface ScorecardCategoryGroup {
  name: ScorecardCategory;
  blurb: string;
  measures: ScorecardMeasure[];
}

export interface ScorecardResult {
  /** Net farm income from operations, if it could be computed ($). */
  netFarmIncome: number | null;
  /** All measures, in display order. */
  measures: ScorecardMeasure[];
  /** Same measures grouped by FFSC category. */
  categories: ScorecardCategoryGroup[];
  /** How many measures had enough inputs to compute. */
  computedCount: number;
  /** Count of computed measures sitting in the "vulnerable" band. */
  vulnerableCount: number;
}

// --- zone helpers -----------------------------------------------------------

/** Higher value is healthier (current ratio, margins, coverage, …). */
function zoneHigherBetter(v: number, strongAt: number, watchAt: number): ScorecardZone {
  if (v >= strongAt) return "strong";
  if (v >= watchAt) return "watch";
  return "vulnerable";
}

/** Lower value is healthier (debt-to-asset, operating-expense ratio, …). */
function zoneLowerBetter(v: number, strongBelow: number, watchBelow: number): ScorecardZone {
  if (v <= strongBelow) return "strong";
  if (v <= watchBelow) return "watch";
  return "vulnerable";
}

function zoneLabelOf(z: ScorecardZone): string {
  switch (z) {
    case "strong":
      return "Strong";
    case "watch":
      return "Watch";
    case "vulnerable":
      return "Vulnerable";
    default:
      return "For context";
  }
}

// --- formatting -------------------------------------------------------------

function fmtRatio(v: number): string {
  return v.toFixed(2);
}

function fmtPercent(v: number): string {
  // v is already a percent (0–100 scale)
  return `${v.toFixed(v < 10 ? 1 : 0)}%`;
}

function fmtDollars(v: number): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.round(Math.abs(v)).toLocaleString("en-US")}`;
}

function isNum(x: number | null | undefined): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Safe divide — returns null when the denominator is missing or zero. */
function div(a: number | null, b: number | null): number | null {
  if (!isNum(a) || !isNum(b) || b === 0) return null;
  return a / b;
}

// --- the calculator ---------------------------------------------------------

const CATEGORY_BLURBS: Record<ScorecardCategory, string> = {
  Liquidity: "Can the farm cover the next twelve months without selling something it needs to keep?",
  Solvency: "How much of the farm the farm actually owns, versus the bank.",
  Profitability: "Whether a year of operating leaves money on the table after every real cost.",
  Efficiency: "Where each dollar of revenue goes — to expenses, interest, depreciation, or income.",
  "Repayment capacity": "Whether the operation throws off enough to make its scheduled loan payments.",
};

/**
 * Compute the Farm Financial Scorecard from a farmer's self-reported numbers.
 * Every measure is optional — a measure whose inputs are missing comes back with
 * value: null / zone: "info" / display: "—", so a partial entry still returns a
 * partial, honest scorecard.
 */
export function computeScorecard(inputs: ScorecardInputs): ScorecardResult {
  const {
    totalFarmAssets: assets,
    totalFarmLiabilities: liabilities,
    currentFarmAssets: curAssets,
    currentFarmLiabilities: curLiab,
    grossFarmRevenue: gross,
    operatingExpense: opex,
    interestExpense: interest,
    depreciationExpense: deprec,
    termDebtPayments: termPmt,
  } = inputs;

  // Net farm income from operations = gross − operating expense − interest − depreciation.
  const netFarmIncome =
    isNum(gross) && isNum(opex) && isNum(interest) && isNum(deprec)
      ? gross - opex - interest - deprec
      : null;

  const measures: ScorecardMeasure[] = [];

  const push = (
    id: string,
    label: string,
    category: ScorecardCategory,
    value: number | null,
    unit: ScorecardMeasure["unit"],
    zone: ScorecardZone,
    whatItMeasures: string,
    benchmark: string,
    approximate?: boolean,
  ) => {
    let display = "—";
    if (isNum(value)) {
      display = unit === "percent" ? fmtPercent(value) : unit === "dollars" ? fmtDollars(value) : fmtRatio(value);
    }
    measures.push({
      id,
      label,
      category,
      value: isNum(value) ? value : null,
      display,
      unit,
      zone: isNum(value) ? zone : "info",
      zoneLabel: zoneLabelOf(isNum(value) ? zone : "info"),
      whatItMeasures,
      benchmark,
      approximate,
    });
  };

  // --- Liquidity ------------------------------------------------------------
  const currentRatio = div(curAssets, curLiab);
  push(
    "current-ratio",
    "Current ratio",
    "Liquidity",
    currentRatio,
    "ratio",
    isNum(currentRatio) ? zoneHigherBetter(currentRatio, 2.0, 1.3) : "info",
    "Current assets divided by current liabilities — how many times over you could cover the next year's obligations from short-term assets.",
    "Strong > 2.0 · Watch 1.3–2.0 · Vulnerable < 1.3",
  );

  const workingCapital = isNum(curAssets) && isNum(curLiab) ? curAssets - curLiab : null;
  const wcToRevenue = div(workingCapital, gross);
  push(
    "working-capital-ratio",
    "Working capital to revenue",
    "Liquidity",
    isNum(wcToRevenue) ? wcToRevenue * 100 : null,
    "percent",
    isNum(wcToRevenue) ? zoneHigherBetter(wcToRevenue, 0.3, 0.1) : "info",
    "Working capital (current assets − current liabilities) as a share of a year's revenue — the cushion the operation carries relative to its size.",
    "Strong > 30% · Watch 10–30% · Vulnerable < 10%",
  );

  // --- Solvency -------------------------------------------------------------
  const debtToAsset = div(liabilities, assets);
  push(
    "debt-to-asset",
    "Debt-to-asset ratio",
    "Solvency",
    isNum(debtToAsset) ? debtToAsset * 100 : null,
    "percent",
    isNum(debtToAsset) ? zoneLowerBetter(debtToAsset, 0.3, 0.6) : "info",
    "The share of total farm assets financed by debt. Lower means the farm — not the lender — owns more of itself.",
    "Strong < 30% · Watch 30–60% · Vulnerable > 60%",
  );

  const equityToAsset =
    isNum(assets) && isNum(liabilities) && assets !== 0 ? (assets - liabilities) / assets : null;
  push(
    "equity-to-asset",
    "Equity-to-asset ratio",
    "Solvency",
    isNum(equityToAsset) ? equityToAsset * 100 : null,
    "percent",
    isNum(equityToAsset) ? zoneHigherBetter(equityToAsset, 0.7, 0.4) : "info",
    "The share of farm assets owned free and clear — the mirror image of debt-to-asset.",
    "Strong > 70% · Watch 40–70% · Vulnerable < 40%",
  );

  // --- Profitability --------------------------------------------------------
  push(
    "net-farm-income",
    "Net farm income from operations",
    "Profitability",
    netFarmIncome,
    "dollars",
    isNum(netFarmIncome) ? (netFarmIncome > 0 ? "strong" : "vulnerable") : "info",
    "What a year of operating leaves after operating expense, interest, and depreciation — before family living and income tax.",
    "A positive number means operations covered every cost measured here.",
  );

  // Operating profit margin ≈ (net farm income + interest) / gross revenue.
  // (The full FFSC measure also adds back unpaid operator labor; this quick
  // check omits it, so it reads slightly low — flagged approximate.)
  const opmNumer = isNum(netFarmIncome) && isNum(interest) ? netFarmIncome + interest : null;
  const opMargin = div(opmNumer, gross);
  push(
    "operating-profit-margin",
    "Operating profit margin",
    "Profitability",
    isNum(opMargin) ? opMargin * 100 : null,
    "percent",
    isNum(opMargin) ? zoneHigherBetter(opMargin, 0.25, 0.1) : "info",
    "The share of each revenue dollar that survives as operating profit (income plus interest). A durability measure, not a cash measure.",
    "Strong > 25% · Watch 10–25% · Vulnerable < 10%",
    true,
  );

  // --- Efficiency -----------------------------------------------------------
  const assetTurnover = div(gross, assets);
  push(
    "asset-turnover",
    "Asset turnover rate",
    "Efficiency",
    isNum(assetTurnover) ? assetTurnover * 100 : null,
    "percent",
    isNum(assetTurnover) ? zoneHigherBetter(assetTurnover, 0.45, 0.3) : "info",
    "Revenue generated per dollar of assets — how hard the balance sheet is working. Land-heavy farms read lower by nature.",
    "Strong > 45% · Watch 30–45% · Vulnerable < 30%",
  );

  const opExpRatio = div(opex, gross);
  push(
    "operating-expense-ratio",
    "Operating expense ratio",
    "Efficiency",
    isNum(opExpRatio) ? opExpRatio * 100 : null,
    "percent",
    isNum(opExpRatio) ? zoneLowerBetter(opExpRatio, 0.65, 0.8) : "info",
    "The share of revenue consumed by operating expense (excluding interest and depreciation). Lower leaves more for debt and profit.",
    "Strong < 65% · Watch 65–80% · Vulnerable > 80%",
  );

  const interestRatio = div(interest, gross);
  push(
    "interest-expense-ratio",
    "Interest expense ratio",
    "Efficiency",
    isNum(interestRatio) ? interestRatio * 100 : null,
    "percent",
    isNum(interestRatio) ? zoneLowerBetter(interestRatio, 0.05, 0.1) : "info",
    "The share of revenue going to interest — a direct read on how heavily debt is weighing on the operation.",
    "Strong < 5% · Watch 5–10% · Vulnerable > 10%",
  );

  // --- Repayment capacity ---------------------------------------------------
  // Rough term-debt-coverage ≈ (net farm income + depreciation + interest) /
  // scheduled term payments. The full FFSC measure adds off-farm income and
  // subtracts family living + income tax; this quick check has none of those,
  // so it OVERSTATES coverage. Flagged approximate + routed to the Guild.
  const capacity =
    isNum(netFarmIncome) && isNum(deprec) && isNum(interest)
      ? netFarmIncome + deprec + interest
      : null;
  const termCoverage = div(capacity, termPmt);
  push(
    "term-debt-coverage",
    "Term-debt coverage (rough)",
    "Repayment capacity",
    termCoverage,
    "ratio",
    isNum(termCoverage) ? zoneHigherBetter(termCoverage, 1.75, 1.25) : "info",
    "A rough screen: operating cash (income + depreciation + interest) divided by scheduled term-loan payments. The real ratio also nets out family living and income tax — so treat a pass here as a floor, not a finding.",
    "Strong > 1.75 · Watch 1.25–1.75 · Vulnerable < 1.25",
    true,
  );

  // --- group + summarize ----------------------------------------------------
  const order: ScorecardCategory[] = [
    "Liquidity",
    "Solvency",
    "Profitability",
    "Efficiency",
    "Repayment capacity",
  ];
  const categories: ScorecardCategoryGroup[] = order.map((name) => ({
    name,
    blurb: CATEGORY_BLURBS[name],
    measures: measures.filter((m) => m.category === name),
  }));

  const computed = measures.filter((m) => m.value !== null);
  return {
    netFarmIncome,
    measures,
    categories,
    computedCount: computed.length,
    vulnerableCount: computed.filter((m) => m.zone === "vulnerable").length,
  };
}
