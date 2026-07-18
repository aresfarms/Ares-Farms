/**
 * ownershipCostModel — what buying and OWNING this property is likely to
 * cost, in plain dollars (founder direction 2026-07-17: estimated
 * out-of-pocket purchase costs, then post-close monthly and years 1–5
 * ownership costs — the numbers people underestimate and get underwater on.
 * Not to scare anyone; because those numbers are the most important part of
 * ownership).
 *
 * PURE guidance math over committed public snapshots:
 *   - Freddie Mac PMMS weekly average rates (mortgageRatesGenerated)
 *   - Census ACS county tax medians (countyTaxContextGenerated)
 *   - EIA state electricity averages (stateElectricityGenerated)
 *   - Published federal program fee schedules (FHA MIP, USDA guarantee, VA
 *     funding fee — cited inline where used)
 *
 * Every output is ILLUSTRATIVE GUIDANCE — never a quote, an approval, an
 * eligibility determination, or advice. Deterministic: same inputs, same
 * snapshot, same output (replay-safe; no clock, no randomness).
 */

/**
 * Snapshot slice the SERVER resolves (resolveOwnershipCostContext) and hands
 * to this pure model — the client bundle never carries the full county tax
 * table, and the model itself imports no data.
 */
export interface OwnershipCostContext {
  rates: { weekOf: string; rate30: number; rate15: number | null };
  /** Current USDA FSA published farm-loan rates (farmMode only). */
  fsa?: {
    ownershipDirectPct: number;
    operatingDirectPct: number;
    downPaymentPct: number | null;
    effective: string | null;
  } | null;
  taxContext: {
    medianAnnualTax: number;
    medianHomeValue: number;
    effectiveRatePct: number;
  } | null;
  electricity: {
    resPriceCentsKwh: number;
    resAvgMonthlyBill: number | null;
  } | null;
  /** State FHFA trend factor walking the ACS-vintage median to today. */
  hpi: {
    factorSinceBase: number;
    latestQuarter: string;
    baseYear: number;
    /** State's published long-run annualized price change, percent (~30 yrs). */
    longRunAnnualPct: number;
    longRunSpanYears: number;
  } | null;
}

/**
 * Price context against PUBLISHED benchmarks (founder direction 2026-07-17):
 * the county's ACS median home value, walked forward by the state's FHFA
 * price trend, compared to this price. Context only — never an appraisal, an
 * opinion of value, or a bid recommendation. Opinion-of-value features stay
 * behind the counsel gate.
 */
export interface PriceContext {
  /** County median walked forward to the latest FHFA quarter, dollars. */
  adjustedMedian: number;
  /** price / adjustedMedian, e.g. 0.4 = 40% of the county's typical value. */
  ratio: number;
  text: string;
  provenance: string;
}

export function buildPriceContext(
  price: number,
  context: OwnershipCostContext
): PriceContext | null {
  if (!context.taxContext || !context.hpi) return null;
  if (!Number.isFinite(price) || price < 10_000) return null;
  const adjustedMedian = Math.round(context.taxContext.medianHomeValue * context.hpi.factorSinceBase);
  const ratio = price / adjustedMedian;
  const pct = Math.round(ratio * 100);
  const read =
    ratio < 0.5
      ? `well below the county's typical owner-occupied home value — a gap that usually reflects condition, an as-is sale posture, or a distressed disposition. The inspection explains the gap; the gap does not explain itself.`
      : ratio < 0.85
        ? `below the county's typical owner-occupied home value.`
        : ratio <= 1.15
          ? `in line with the county's typical owner-occupied home value.`
          : `above the county's typical owner-occupied home value — the appraisal will test whether this parcel supports it.`;
  return {
    adjustedMedian,
    ratio: Number(ratio.toFixed(2)),
    text:
      `This price is about ${pct}% of the county's typical home value ` +
      `(median $${context.taxContext.medianHomeValue.toLocaleString("en-US")} in the ${context.hpi.baseYear} Census survey, ` +
      `about $${adjustedMedian.toLocaleString("en-US")} walked forward by the state's FHFA price trend through ${context.hpi.latestQuarter}) — ${read} ` +
      `Context against published benchmarks only — not an appraisal, an opinion of value, or advice; a state-licensed appraisal is the official value.`,
    provenance: "Census ACS county median (B25077) + FHFA House Price Index state trend",
  };
}

export interface OwnershipCostInputs {
  /** Purchase price in dollars — listed price, or the visitor's assumption. */
  price: number;
  /** True when the visitor typed the price (price-on-request listings). */
  priceIsAssumption: boolean;
  /** Home-shaped property (house/residence) vs. land-only. */
  isHome: boolean;
  /** Farm-shaped — adds irrigation/outbuilding upkeep expectations. */
  farmShaped: boolean;
  /** Working-farm/ranch purchase (founder direction 2026-07-17): swap the
      consumer mortgage lanes for FSA/USDA/Farm Credit farm-loan lanes — no
      farmer finances working ground with FHA or a conventional mortgage. */
  farmMode?: boolean;
}

export interface ProgramScenario {
  /** Program name as a buyer would say it. */
  program: string;
  /** Who it typically fits — one plain sentence. */
  fit: string;
  downPaymentPct: number;
  downPayment: number;
  /** Amount financed, including any financed upfront program fee. */
  loanAmount: number;
  upfrontFeeNote: string | null;
  /** Rate used for the estimate (PMMS 30-year average), percent. */
  ratePct: number;
  monthlyPrincipalInterest: number;
  /** FHA MIP / USDA annual fee / conventional PMI, monthly dollars. */
  monthlyMortgageInsurance: number;
  mortgageInsuranceNote: string | null;
  /** Household income that typically supports this lane's payment (founder
      direction 2026-07-17: people should see up front whether their income
      bracket can plausibly fund this — without disclosing anything). */
  incomeGuidance: {
    /** Annual household income where this payment fits the program's standard
        housing ratio — the "typically works from about" number. */
    comfortableAnnual: number;
    /** Stretch floor — approvals happen down here with strong compensating
        factors, below it the payment rarely fits. */
    stretchAnnual: number;
    note: string;
  };
}

export interface CostRangeLine {
  label: string;
  /** Monthly dollars unless the label says otherwise. */
  low: number;
  high: number;
  note: string;
  provenance: string;
}

export interface OwnershipCostModel {
  /** PMMS survey week the rates came from, YYYY-MM-DD. */
  rateWeekOf: string;
  rate30Pct: number;
  purchase: {
    scenarios: ProgramScenario[];
    /** Closing costs beyond down payment (lender/title/escrow/recording). */
    closingLow: number;
    closingHigh: number;
    closingNote: string;
  };
  /** Recurring non-mortgage costs, monthly. */
  monthly: CostRangeLine[];
  /** Total monthly range for the cheapest-entry and 20%-down scenarios. */
  monthlyTotals: {
    program: string;
    low: number;
    high: number;
  }[];
  /** Cost horizon in bands (founder direction 2026-07-17): year 1 stands
      alone (it carries the cash to start), then 2–5, 6–10, and 11–30. */
  horizon: {
    year1: { low: number; high: number; note: string };
    years2to5: { low: number; high: number; note: string };
    years6to10: { low: number; high: number; note: string };
    years11to30: { low: number; high: number; note: string };
  };
  disclaimers: string[];
}

/**
 * Equity outlook — what ownership MIGHT be worth later (founder direction
 * 2026-07-17: potential value and equity at 3/5/10/15/20/30/50 years).
 * SCENARIO ILLUSTRATIONS ONLY, anchored to the state's PUBLISHED long-run
 * FHFA trend: a steady path repeating that history, a slower path at half
 * of it, and a flat path at zero. No one can predict prices — these show
 * how the arithmetic of appreciation scenarios and loan paydown interacts,
 * never a prediction, valuation, or investment advice.
 */
export interface EquityOutlookRow {
  year: number;
  /** Remaining FHA-path loan balance, dollars (0 once the loan retires). */
  loanBalance: number;
  flat: { value: number; equity: number };
  slower: { value: number; equity: number };
  steady: { value: number; equity: number };
}

export interface EquityOutlook {
  rows: EquityOutlookRow[];
  steadyRatePct: number;
  slowerRatePct: number;
  spanYears: number;
  intro: string;
  disclaimers: string[];
}

const EQUITY_YEARS = [3, 5, 10, 15, 20, 30, 50];

/** Remaining balance on a fixed-rate loan after `months` payments. */
function remainingBalance(loanAmount: number, annualRatePct: number, years: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (months >= n) return 0;
  if (r <= 0) return loanAmount * (1 - months / n);
  const growth = Math.pow(1 + r, n);
  const paid = Math.pow(1 + r, months);
  return loanAmount * ((growth - paid) / (growth - 1));
}

export function buildEquityOutlook(
  price: number,
  context: OwnershipCostContext,
  farmMode = false
): EquityOutlook | null {
  if (!context.hpi) return null;
  if (!Number.isFinite(price) || price < 10_000 || price > 50_000_000) return null;
  const steadyRate = context.hpi.longRunAnnualPct / 100;
  const slowerRate = steadyRate / 2;
  // FHA representative path — consistent with the cost model's horizon.
  const loan = price * 0.965 * 1.0175;
  const rate = context.rates.rate30;

  const rows: EquityOutlookRow[] = EQUITY_YEARS.map((year) => {
    const loanBalance = Math.round(remainingBalance(loan, rate, 30, year * 12));
    const valueAt = (annualRate: number) => Math.round(price * Math.pow(1 + annualRate, year));
    const rowFor = (annualRate: number) => {
      const value = valueAt(annualRate);
      return { value, equity: Math.max(0, value - loanBalance) };
    };
    return {
      year,
      loanBalance,
      flat: rowFor(0),
      slower: rowFor(slowerRate),
      steady: rowFor(steadyRate),
    };
  });

  return {
    rows,
    steadyRatePct: context.hpi.longRunAnnualPct,
    slowerRatePct: Number((context.hpi.longRunAnnualPct / 2).toFixed(2)),
    spanYears: context.hpi.longRunSpanYears,
    intro:
      `What ownership might be WORTH later, under three price scenarios: flat (0%/yr), slower ` +
      `(${(context.hpi.longRunAnnualPct / 2).toFixed(1)}%/yr), and steady — the state's own published ` +
      `${context.hpi.longRunSpanYears}-year average of ${context.hpi.longRunAnnualPct}%/yr (FHFA House Price Index). ` +
      `Equity = scenario value minus what would still be owed on the loan (${farmMode ? "FSA" : "FHA"} path).`,
    disclaimers: [
      "Scenario illustrations, not predictions — past price trends do not guarantee future ones, and any single property can move very differently from its state. Not a valuation, an appraisal, or investment advice.",
      "Selling typically costs about 6–10% of the sale price (agent commissions, transfer taxes, closing) — subtract that from any equity figure you act on. A state-licensed appraisal is the official value at any point in time.",
    ],
  };
}

/** Standard amortization: monthly payment on a fixed-rate loan. */
function monthlyPayment(loanAmount: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r <= 0) return loanAmount / n;
  return (loanAmount * r) / (1 - Math.pow(1 + r, -n));
}

const round10 = (n: number): number => Math.round(n / 10) * 10;

export function buildOwnershipCostModel(
  inputs: OwnershipCostInputs,
  context: OwnershipCostContext
): OwnershipCostModel | null {
  const { price } = inputs;
  if (!Number.isFinite(price) || price < 10_000 || price > 50_000_000) return null;

  const rate = context.rates.rate30;
  // Income guidance attaches after taxes/insurance are known (buildIncome below).
  const scenarios: Array<Omit<ProgramScenario, "incomeGuidance">> = [];

  // ── FARM-LOAN LANES (working farm/ranch) ─────────────────────────────────
  // FSA/USDA/Farm Credit, not consumer mortgages. The FSA Direct rate is the
  // agency's own PUBLISHED monthly rate (fsaRatesGenerated); the FSA-guaranteed
  // and Farm Credit lanes are lender-negotiated, so those payments are shown at
  // the FSA Direct rate as a reasonable benchmark and labeled as such. The
  // county FSA office and the ag lender quote the binding number. FSA Farm
  // Ownership loans run up to 40-year terms.
  if (inputs.farmMode) {
    // Published FSA Direct Farm Ownership rate when available; PMMS proxy only
    // if the snapshot is missing (keeps the model total even without the slice).
    const fsaDirect = context.fsa?.ownershipDirectPct ?? rate;
    // The Down Payment PROGRAM's own subsidized rate (2.0% at ingest).
    const fsaDpRate = context.fsa?.downPaymentPct ?? Math.max(1.5, fsaDirect - 4);
    const fsaEffective = context.fsa?.effective ?? null;
    const effNote = fsaEffective ? ` (FSA rates effective ${fsaEffective})` : "";

    // FSA Direct Farm Ownership — can finance UP TO 100% of the purchase
    // (founder correction 2026-07-18: cash down is NOT required when the
    // security supports the loan; the old "~5% down" here wrongly borrowed
    // the Down Payment Program's figure).
    {
      scenarios.push({
        program: "FSA Direct Farm Ownership (up to 100% financed — $0 down possible)",
        fit: `USDA Farm Service Agency direct loan — can finance up to 100% of the purchase when the security supports it; up to $600,000, terms to 40 years${effNote}.`,
        downPaymentPct: 0,
        downPayment: 0,
        loanAmount: Math.round(price),
        upfrontFeeNote: "No mortgage insurance; loan-making is through the county FSA office.",
        ratePct: fsaDirect,
        monthlyPrincipalInterest: round10(monthlyPayment(price, fsaDirect, 40)),
        monthlyMortgageInsurance: 0,
        mortgageInsuranceNote: null,
      });
    }
    // FSA Down Payment Program — the beginning/underserved-farmer structure:
    // borrower 5%, FSA 45% at the program's SUBSIDIZED rate (20-yr), a
    // commercial lender the remaining 50% (priced here at the Direct benchmark,
    // 30-yr). Payment is the honest blend of the two notes.
    {
      const down = price * 0.05;
      const fsaShare = price * 0.45;
      const lenderShare = price * 0.5;
      const blendedMonthly = monthlyPayment(fsaShare, fsaDpRate, 20) + monthlyPayment(lenderShare, fsaDirect, 30);
      const blendedRate = Math.round(((fsaShare * fsaDpRate + lenderShare * fsaDirect) / (fsaShare + lenderShare)) * 10) / 10;
      scenarios.push({
        program: "FSA Down Payment Program (beginning farmer — 5% down)",
        fit: `The beginning/underserved-farmer structure: you put 5% down, FSA lends 45% at its subsidized ${fsaDpRate}% Down Payment rate (20 years), and a commercial lender carries the rest (shown at the Direct benchmark)${effNote}.`,
        downPaymentPct: 5,
        downPayment: Math.round(down),
        loanAmount: Math.round(price - down),
        upfrontFeeNote: "No mortgage insurance; the lender share is separately priced by that lender.",
        ratePct: blendedRate,
        monthlyPrincipalInterest: round10(blendedMonthly),
        monthlyMortgageInsurance: 0,
        mortgageInsuranceNote: null,
      });
    }
    // FSA Guaranteed Farm Ownership — via a commercial lender, FSA guarantee.
    {
      const down = price * 0.1;
      const loan = price - down;
      scenarios.push({
        program: "FSA Guaranteed Farm Ownership (0–10% down)",
        fit: "A commercial lender's loan with an FSA guarantee (up to ~$2.25M); terms to 40 years — and it can finance up to 100% when the collateral supports it. Rate is negotiated with the lender — shown here at the FSA Direct benchmark on 10% down.",
        downPaymentPct: 10,
        downPayment: Math.round(down),
        loanAmount: Math.round(loan),
        upfrontFeeNote: "FSA guarantee fee applies; the lender sets the rate.",
        ratePct: fsaDirect,
        monthlyPrincipalInterest: round10(monthlyPayment(loan, fsaDirect, 30)),
        monthlyMortgageInsurance: 0,
        mortgageInsuranceNote: null,
      });
    }
    // Equity-secured / cross-collateralized — the "I'm not spending my cash"
    // lane (founder correction 2026-07-18: her own farm closed at essentially
    // zero down with other land pledged as security; ag lenders do this
    // routinely and the table must show it).
    {
      scenarios.push({
        program: "Equity-secured ag loan ($0 cash — other land as collateral)",
        fit: "Instead of cash, equity in land you already own stands in as the down payment (a blanket or cross-collateral lien). Farm Credit associations and ag banks structure purchases this way routinely — 100% of THIS purchase financed, secured by both properties. Shown at the FSA Direct benchmark.",
        downPaymentPct: 0,
        downPayment: 0,
        loanAmount: Math.round(price),
        upfrontFeeNote: "The pledged land carries the lien until released — its equity is committed, not spent.",
        ratePct: fsaDirect,
        monthlyPrincipalInterest: round10(monthlyPayment(price, fsaDirect, 25)),
        monthlyMortgageInsurance: 0,
        mortgageInsuranceNote: null,
      });
    }
    // Farm Credit System / conventional ag lender — the classic cash-down case.
    {
      const down = price * 0.25;
      const loan = price - down;
      scenarios.push({
        program: "Farm Credit / ag lender (~25% cash down)",
        fit: "The Farm Credit System or a commercial ag bank with cash equity in — typically 20–30% down, 15–30 year terms, no government cap; pledged land can replace some or all of the cash (see the equity-secured lane). Rate is lender-set — shown here at the FSA Direct benchmark.",
        downPaymentPct: 25,
        downPayment: Math.round(down),
        loanAmount: Math.round(loan),
        upfrontFeeNote: null,
        ratePct: fsaDirect,
        monthlyPrincipalInterest: round10(monthlyPayment(loan, fsaDirect, 25)),
        monthlyMortgageInsurance: 0,
        mortgageInsuranceNote: null,
      });
    }
  } else {

  // USDA Rural Development — 0% down, 1% upfront guarantee fee (financeable),
  // 0.35%/yr annual fee (published USDA RD fee schedule).
  {
    const down = 0;
    const base = price - down;
    const loan = base * 1.01;
    scenarios.push({
      program: "USDA Rural Development (0% down)",
      fit: "Rural-eligible areas, income limits apply — many of the properties Furlong tracks sit in eligible territory.",
      downPaymentPct: 0,
      downPayment: down,
      loanAmount: Math.round(loan),
      upfrontFeeNote: "1% upfront guarantee fee, usually financed into the loan.",
      ratePct: rate,
      monthlyPrincipalInterest: round10(monthlyPayment(loan, rate, 30)),
      monthlyMortgageInsurance: round10((loan * 0.0035) / 12),
      mortgageInsuranceNote: "USDA annual fee, 0.35% of the loan per year.",
    });
  }

  // FHA — 3.5% down, 1.75% upfront MIP (financeable), 0.55%/yr annual MIP
  // (published HUD schedule for 30-year loans with minimum down).
  {
    const down = price * 0.035;
    const base = price - down;
    const loan = base * 1.0175;
    scenarios.push({
      program: "FHA (3.5% down)",
      fit: "The most common first-home path — flexible on credit history.",
      downPaymentPct: 3.5,
      downPayment: Math.round(down),
      loanAmount: Math.round(loan),
      upfrontFeeNote: "1.75% upfront mortgage insurance premium, usually financed.",
      ratePct: rate,
      monthlyPrincipalInterest: round10(monthlyPayment(loan, rate, 30)),
      monthlyMortgageInsurance: round10((loan * 0.0055) / 12),
      mortgageInsuranceNote: "FHA annual mortgage insurance, 0.55% of the loan per year.",
    });
  }

  // VA — 0% down, 2.15% first-use funding fee (financeable), no monthly MI.
  {
    const loan = price * 1.0215;
    scenarios.push({
      program: "VA (0% down, eligible veterans)",
      fit: "Veterans, active-duty service members, and eligible surviving spouses.",
      downPaymentPct: 0,
      downPayment: 0,
      loanAmount: Math.round(loan),
      upfrontFeeNote: "2.15% funding fee on first use, usually financed. Waived for some disabled veterans.",
      ratePct: rate,
      monthlyPrincipalInterest: round10(monthlyPayment(loan, rate, 30)),
      monthlyMortgageInsurance: 0,
      mortgageInsuranceNote: null,
    });
  }

  // Conventional 5% down — PMI until ~20% equity (guidance midpoint 0.6%/yr).
  {
    const down = price * 0.05;
    const loan = price - down;
    scenarios.push({
      program: "Conventional (5% down)",
      fit: "Solid credit; private mortgage insurance drops off once you reach about 20% equity.",
      downPaymentPct: 5,
      downPayment: Math.round(down),
      loanAmount: Math.round(loan),
      upfrontFeeNote: null,
      ratePct: rate,
      monthlyPrincipalInterest: round10(monthlyPayment(loan, rate, 30)),
      monthlyMortgageInsurance: round10((loan * 0.006) / 12),
      mortgageInsuranceNote: "Private mortgage insurance, roughly 0.3–1.5% of the loan per year depending on credit — 0.6% shown.",
    });
  }

  // Conventional 20% down — no mortgage insurance at all.
  {
    const down = price * 0.2;
    const loan = price - down;
    scenarios.push({
      program: "Conventional (20% down)",
      fit: "The lowest monthly payment — no mortgage insurance of any kind.",
      downPaymentPct: 20,
      downPayment: Math.round(down),
      loanAmount: Math.round(loan),
      upfrontFeeNote: null,
      ratePct: rate,
      monthlyPrincipalInterest: round10(monthlyPayment(loan, rate, 30)),
      monthlyMortgageInsurance: 0,
      mortgageInsuranceNote: null,
    });
  }

  } // end consumer-mortgage lanes (else of farmMode)

  // ── Recurring non-mortgage monthly costs ────────────────────────────────
  const monthly: CostRangeLine[] = [];

  const taxContext = context.taxContext;
  if (taxContext) {
    const annual = price * (taxContext.effectiveRatePct / 100);
    monthly.push({
      label: "Property taxes",
      low: round10((annual * 0.85) / 12),
      high: round10((annual * 1.15) / 12),
      note:
        `This county's owner-occupied median works out to about ${taxContext.effectiveRatePct}% of home value per year ` +
        `(median bill $${taxContext.medianAnnualTax.toLocaleString("en-US")}). Your parcel's assessment and exemptions decide the actual bill.`,
      provenance: "Census ACS county medians",
    });
  } else {
    monthly.push({
      label: "Property taxes",
      low: round10((price * 0.008) / 12),
      high: round10((price * 0.014) / 12),
      note:
        "National guidance of roughly 0.8–1.4% of value per year — county-level context is not on file for this area yet. The county treasurer can quote the actual bill.",
      provenance: "National guidance",
    });
  }

  monthly.push({
    label: "Homeowner's insurance",
    low: 125,
    high: 250,
    note:
      "Typical $1,500–$3,000 per year for a rural single-family home. Hazard exposure (wind, flood, wildfire) can add rider costs — see the hazard profile above.",
    provenance: "National guidance",
  });

  const electricity = context.electricity;
  if (electricity?.resAvgMonthlyBill) {
    const bill = electricity.resAvgMonthlyBill;
    monthly.push({
      label: "Electricity",
      low: round10(bill * 0.8),
      high: round10(bill * 1.3),
      note: `The state's average residential bill runs about $${bill}/month at ${electricity.resPriceCentsKwh}¢/kWh. Bigger homes, electric heat, and well pumps push it up.`,
      provenance: "U.S. EIA state averages",
    });
  } else {
    monthly.push({
      label: "Electricity",
      low: 100,
      high: 200,
      note: "National guidance — the serving utility's tariff decides actuals.",
      provenance: "National guidance",
    });
  }

  monthly.push({
    label: "Water, sewer / septic",
    low: 30,
    high: 90,
    note:
      "On municipal service, expect a monthly bill. On well and septic there is no bill — but budget for septic pumping every 3–5 years (about $300–$600) and eventual well-pump replacement.",
    provenance: "National guidance",
  });

  const maintenanceNote = inputs.farmShaped
    ? "The steady 1–2% of home value per year that ownership actually costs — roofs, HVAC, gutters, paint — plus fencing, outbuildings, and any irrigation equipment on a farm property. It arrives as occasional big bills, not smooth months."
    : "The steady 1–2% of home value per year that ownership actually costs — roof, HVAC, water heater, gutters, paint. It arrives as occasional big bills, not smooth months, so the honest move is to set it aside monthly.";
  monthly.push({
    label: "Maintenance reserve",
    low: round10((price * 0.01) / 12),
    high: round10((price * 0.02) / 12),
    note: maintenanceNote,
    provenance: "National guidance",
  });

  // ── Income guidance per lane (founder direction 2026-07-17) ─────────────
  // Lenders size the house payment (PITI) against gross income using each
  // program's customary housing ratio. Publishing the bracket lets a visitor
  // see whether their income plausibly funds this WITHOUT disclosing it.
  const taxLine = monthly.find((line) => line.label === "Property taxes");
  const insuranceLine = monthly.find((line) => line.label === "Homeowner's insurance");
  const taxesMid = taxLine ? (taxLine.low + taxLine.high) / 2 : 0;
  const insuranceMid = insuranceLine ? (insuranceLine.low + insuranceLine.high) / 2 : 0;
  const HOUSING_RATIOS: Record<string, number> = {
    "USDA Rural Development (0% down)": 0.29,
    "FHA (3.5% down)": 0.31,
    "VA (0% down, eligible veterans)": 0.31,
    "Conventional (5% down)": 0.28,
    "Conventional (20% down)": 0.28,
  };
  const roundK = (n: number): number => Math.round(n / 1000) * 1000;
  const fullScenarios: ProgramScenario[] = scenarios.map((s) => {
    const piti = s.monthlyPrincipalInterest + s.monthlyMortgageInsurance + taxesMid + insuranceMid;
    // Farm loans qualify on the OPERATION's debt-service coverage, not a
    // household income ratio — reflect that instead of a consumer bracket.
    if (inputs.farmMode) {
      const annualDebt = (s.monthlyPrincipalInterest + taxesMid + insuranceMid) * 12;
      const comfortableAnnual = roundK(annualDebt * 1.25); // 1.25x DSCR is a common ag floor
      const stretchAnnual = roundK(annualDebt * 1.1);
      return {
        ...s,
        incomeGuidance: {
          comfortableAnnual,
          stretchAnnual,
          note:
            `Farm loans qualify on the OPERATION's cash flow, not a household paycheck: lenders want net farm ` +
            `income (plus off-farm income) to cover the payment with a cushion — a debt-service coverage ratio ` +
            `around 1.25x is a common floor, so roughly $${comfortableAnnual.toLocaleString("en-US")}/yr of income available ` +
            `to service debt fits comfortably, $${stretchAnnual.toLocaleString("en-US")} is tighter. The county FSA office and your ` +
            `ag lender run the actual cash-flow projection.`,
        },
      };
    }
    const ratio = HOUSING_RATIOS[s.program] ?? 0.29;
    const comfortableAnnual = roundK((piti * 12) / ratio);
    const stretchAnnual = roundK((piti * 12) / (ratio + 0.08));
    const capNote = s.program.startsWith("USDA")
      ? " USDA also CAPS eligible household income by county (the moderate-income limit) — USDA's eligibility site or a lender confirms the county cap."
      : "";
    return {
      ...s,
      incomeGuidance: {
        comfortableAnnual,
        stretchAnnual,
        note:
          `Household income from about $${stretchAnnual.toLocaleString("en-US")} can sometimes carry this payment with strong compensating factors; ` +
          `around $${comfortableAnnual.toLocaleString("en-US")} it fits the program's customary ~${Math.round(ratio * 100)}% housing ratio comfortably. ` +
          `Lenders qualify on the whole picture — existing debts, credit, and down payment — never income alone.${capNote}`,
      },
    };
  });

  const recurringLow = monthly.reduce((sum, line) => sum + line.low, 0);
  const recurringHigh = monthly.reduce((sum, line) => sum + line.high, 0);

  const cheapestEntry = scenarios[0];
  const twentyDown = scenarios[scenarios.length - 1];
  const monthlyTotals = [cheapestEntry, twentyDown].map((s) => ({
    program: s.program,
    low: round10(s.monthlyPrincipalInterest + s.monthlyMortgageInsurance + recurringLow),
    high: round10(s.monthlyPrincipalInterest + s.monthlyMortgageInsurance + recurringHigh),
  }));

  // Cost horizon in bands, using a representative financed path (the second
  // scenario — FHA for a home, the FSA Down Payment Program for a farm). Year 1
  // stands alone because it carries the cash to start; later bands note what
  // changes.
  const repPath = scenarios[1];
  const repMonthly = repPath.monthlyPrincipalInterest + repPath.monthlyMortgageInsurance;
  const annualLow = (repMonthly + recurringLow) * 12;
  const annualHigh = (repMonthly + recurringHigh) * 12;
  const horizon = {
    year1: {
      low: round10(repPath.downPayment + price * 0.02 + annualLow),
      high: round10(repPath.downPayment + price * 0.05 + annualHigh),
      note:
        "The expensive year: down payment, closing costs, and twelve months of payments, taxes, insurance, utilities, and reserve — plus the inspections itemized above and any move-in repairs.",
    },
    years2to5: {
      low: round10(annualLow * 4),
      high: round10(annualHigh * 4),
      note:
        "Four steady years — payments, taxes, insurance, utilities, and the maintenance reserve. The years that decide whether ownership stays comfortable.",
    },
    years6to10: {
      low: round10(annualLow * 5),
      high: round10(annualHigh * 5),
      note:
        "Five more years — and the window where big systems start coming due: a roof, HVAC, or water heater usually arrives in this stretch, which is exactly what the maintenance reserve has been for.",
    },
    years11to30: {
      low: round10(annualLow * 20),
      high: round10(annualHigh * 20),
      note:
        inputs.farmMode
        ? "The long haul, in today's dollars. Taxes and insurance drift up over decades; FSA Farm Ownership loans run up to 40-year terms, so at year 40 the loan retires and the payment drops to taxes, insurance, and upkeep — sooner if you prepay or refinance."
        : "The long haul, in today's dollars. Taxes and insurance drift up over decades; the FHA annual mortgage insurance runs the life of the loan at minimum down (many owners refinance out of it at ~20% equity); at year 30 the loan itself retires and the payment drops to taxes, insurance, and upkeep.",
    },
  };

  return {
    rateWeekOf: context.rates.weekOf,
    rate30Pct: rate,
    purchase: {
      scenarios: fullScenarios,
      closingLow: round10(price * 0.02),
      closingHigh: round10(price * 0.05),
      closingNote:
        "Lender fees, title, escrow, recording, and prepaid taxes and insurance — typically 2–5% of the price, on top of the down payment. Sellers sometimes cover part of this; it is negotiable.",
    },
    monthly,
    monthlyTotals,
    horizon,
    disclaimers: [
      inputs.farmMode
        ? (() => {
            const fsaDirect = context.fsa?.ownershipDirectPct ?? rate;
            const eff = context.fsa?.effective;
            return context.fsa
              ? `The FSA Direct Farm Ownership payment uses USDA FSA's published direct-loan rate (${fsaDirect}%${eff ? `, effective ${eff}` : ""}); FSA updates it monthly. The FSA-guaranteed and Farm Credit lanes are lender-negotiated and shown at that same FSA Direct rate as a benchmark — your lender quotes the real number. Down payments shown are CASH scenarios: in ag lending, equity in land you already own routinely stands in for some or all of the cash (see the equity-secured lane), so a strong balance sheet can close with little or none of its own cash spent. FSA loans run longer terms (up to 40 years) than a consumer mortgage.`
              : `Farm-loan payments are ILLUSTRATIVE at ${rate}% — FSA sets its direct-loan rate monthly and ag lenders negotiate theirs; the county FSA office and your lender quote the real number, and FSA loans run longer terms (up to 40 years) than the consumer rate shown.`;
          })()
        : `Payment estimates use the Freddie Mac national average 30-year rate (${rate}%, week of ${context.rates.weekOf}). Rates move weekly, and your quoted rate depends on credit, points, program, and lender.`,
      inputs.priceIsAssumption
        ? "Built on the price you entered — not a listed price, an appraisal, or an opinion of value."
        : "Built on the listed price — the negotiated price and appraisal decide the real numbers.",
      ...(inputs.farmMode
        ? []
        : [
            "Consumer mortgages generally do not take other property as collateral the way ag and commercial lenders do — but if you own other real estate, borrowing against its equity (a home-equity loan or HELOC) is the common way to raise the down payment without selling. That is a separate loan with its own payment; count both.",
          ]),
      "Illustrative guidance only — not a quote, a pre-approval, an eligibility determination, or financial advice. Program terms (USDA, FHA, VA) have their own eligibility rules a lender confirms.",
    ],
  };
}
