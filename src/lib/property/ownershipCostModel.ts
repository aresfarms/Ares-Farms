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
  taxContext: {
    medianAnnualTax: number;
    medianHomeValue: number;
    effectiveRatePct: number;
  } | null;
  electricity: {
    resPriceCentsKwh: number;
    resAvgMonthlyBill: number | null;
  } | null;
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
  fiveYear: {
    /** Cumulative years 1–5 all-in (payments + recurring + maintenance). */
    cumulativeLow: number;
    cumulativeHigh: number;
    note: string;
  };
  disclaimers: string[];
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

  // Years 1–5, all-in, using the FHA scenario as the representative
  // financed path (most common first-home program).
  const fha = scenarios[1];
  const fhaMonthly = fha.monthlyPrincipalInterest + fha.monthlyMortgageInsurance;
  const fiveYear = {
    cumulativeLow: round10((fhaMonthly + recurringLow) * 60),
    cumulativeHigh: round10((fhaMonthly + recurringHigh) * 60),
    note:
      "Five years of payments, taxes, insurance, utilities, and the maintenance reserve on the FHA path — before any renovation you choose to take on. Not to scare anyone: these are the numbers that decide whether ownership stays comfortable, and knowing them up front is the whole point.",
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
    fiveYear,
    disclaimers: [
      `Payment estimates use the Freddie Mac national average 30-year rate (${rate}%, week of ${context.rates.weekOf}). Rates move weekly, and your quoted rate depends on credit, points, program, and lender.`,
      inputs.priceIsAssumption
        ? "Built on the price you entered — not a listed price, an appraisal, or an opinion of value."
        : "Built on the listed price — the negotiated price and appraisal decide the real numbers.",
      "Illustrative guidance only — not a quote, a pre-approval, an eligibility determination, or financial advice. Program terms (USDA, FHA, VA) have their own eligibility rules a lender confirms.",
    ],
  };
}
