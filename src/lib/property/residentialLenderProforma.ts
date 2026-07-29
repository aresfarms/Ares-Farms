/**
 * residentialLenderProforma — the REAL residential pro forma (founder
 * direction 2026-07-29: "it isn't giving them a real proforma which is the
 * entire point... They should receive a real pro forma for the property
 * period"). Built from the ownership-cost model's RAW numbers, presented in
 * the structure a lender actually reads: Sources & Uses of Funds, the
 * modeled financing structure, the monthly carrying schedule (PITI +
 * operating), the ten-year projection with principal paydown and equity,
 * the qualifying-income test, illustrative lane pricing, and cash to close.
 *
 * One neutral section structure feeds BOTH editions: the numbers-only Pro
 * Forma Report renders it as the document body, and the First-Time Buyer
 * Report carries it as the lender-ready appendix (founder 2026-07-29: first
 * -time buyers need the same numbers "for a lender if they don't choose
 * ours").
 *
 * Deterministic, anonymous, advisory: every figure derives from the entered
 * price and published benchmarks with their dates; nothing here is a Loan
 * Estimate, quote, or approval.
 */

import {
  estimateLanePricing,
  LANE_PRICING_BOUNDARY,
  type LaneRateContext,
} from "@/lib/financing/laneRateEstimates";

export interface LenderProformaScenario {
  program: string;
  downPayment: number;
  downPaymentPct: number;
  monthlyPrincipalInterest: number;
  monthlyMortgageInsurance: number;
  incomeComfortableAnnual: number;
  incomeStretchAnnual: number;
}

export interface LenderProformaMonthlyLine {
  label: string;
  low: number;
  high: number;
  note: string;
}

export interface LenderProformaEquityRow {
  year: number;
  loanBalance: number;
  flatValue: number;
  flatEquity: number;
  steadyValue: number;
  steadyEquity: number;
}

export interface ResidentialLenderProformaArgs {
  price: number;
  scenarios: LenderProformaScenario[];
  closingLow: number;
  closingHigh: number;
  monthly: LenderProformaMonthlyLine[];
  monthlyTotals: Array<{ program: string; low: number; high: number }>;
  equityRows: LenderProformaEquityRow[];
  financingLanes: string[];
  rates: LaneRateContext | null;
  disclaimers: string[];
}

/** Neutral pro forma section — both PDF renderers consume this shape. */
export interface LenderProformaSection {
  title: string;
  intro?: string;
  rows?: Array<{ label: string; value: string; emphasis?: boolean }>;
  paragraphs?: string[];
}

const dollars = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function buildResidentialLenderProforma(
  args: ResidentialLenderProformaArgs
): LenderProformaSection[] {
  const sections: LenderProformaSection[] = [];
  const anchor = args.scenarios[0] ?? null;
  const closingMid = Math.round((args.closingLow + args.closingHigh) / 2);

  if (anchor) {
    const loanAmount = args.price - anchor.downPayment;
    sections.push({
      title: "I. SOURCES & USES OF FUNDS",
      intro: `Modeled on the ${anchor.program} scenario at the stated price. Every scenario in Section II re-runs this structure.`,
      rows: [
        { label: "USES — Purchase price", value: dollars(args.price) },
        { label: "USES — Closing costs (modeled midpoint of the published 2–5% band)", value: `${dollars(closingMid)}  (band ${dollars(args.closingLow)}–${dollars(args.closingHigh)})` },
        { label: "TOTAL USES", value: dollars(args.price + closingMid), emphasis: true },
        { label: `SOURCES — Borrower down payment (${anchor.downPaymentPct}%)`, value: dollars(anchor.downPayment) },
        { label: "SOURCES — First mortgage loan", value: dollars(loanAmount) },
        { label: "SOURCES — Borrower cash for closing costs", value: dollars(closingMid) },
        { label: "TOTAL SOURCES", value: dollars(args.price + closingMid), emphasis: true },
      ],
    });

    sections.push({
      title: "II. FINANCING STRUCTURE — MODELED SCENARIOS",
      intro: args.rates?.mortgage30Pct != null
        ? `Each scenario is modeled at the published ${args.rates.mortgage30Pct.toFixed(2)}% national 30-year average${args.rates.mortgageWeekOf ? ` (week of ${args.rates.mortgageWeekOf})` : ""}, 30-year amortization. A lender's actual pricing replaces this basis.`
        : "Modeled at published national average rates, 30-year amortization. A lender's actual pricing replaces this basis.",
      rows: args.scenarios.map((s) => ({
        label: s.program,
        value:
          `${s.downPayment === 0 ? "$0 (0%)" : `${dollars(s.downPayment)} (${s.downPaymentPct}%)`} down · ` +
          `loan ${dollars(args.price - s.downPayment)} · ` +
          `${dollars(s.monthlyPrincipalInterest)}/mo P&I` +
          (s.monthlyMortgageInsurance > 0 ? ` + ${dollars(s.monthlyMortgageInsurance)}/mo mortgage ins.` : " · no mortgage ins."),
      })),
    });
  }

  if (args.monthly.length) {
    sections.push({
      title: "III. MONTHLY CARRYING SCHEDULE (PITI + OPERATING)",
      rows: [
        ...args.monthly.map((line) => ({
          label: line.label,
          value: `${dollars(line.low)}–${dollars(line.high)}/mo — ${line.note}`,
        })),
        ...args.monthlyTotals.map((total) => ({
          label: `ALL-IN MONTHLY — ${total.program}`,
          value: `${dollars(total.low)}–${dollars(total.high)}/mo`,
          emphasis: true,
        })),
      ],
    });
  }

  if (args.monthlyTotals.length || args.equityRows.length) {
    const annual = args.monthlyTotals[0] ?? null;
    sections.push({
      title: "IV. ANNUAL & TEN-YEAR PROJECTION",
      rows: [
        ...(annual
          ? [{
              label: `Annual carrying (12 × all-in, ${annual.program})`,
              value: `${dollars(annual.low * 12)}–${dollars(annual.high * 12)}/yr`,
            }]
          : []),
        ...args.equityRows.map((row) => ({
          label: `Year ${row.year}`,
          value:
            `Loan balance ${row.loanBalance > 0 ? dollars(row.loanBalance) : "$0 (paid off)"} · ` +
            `value flat ${dollars(row.flatValue)} → equity ${dollars(row.flatEquity)} · ` +
            `steady ${dollars(row.steadyValue)} → equity ${dollars(row.steadyEquity)}`,
        })),
      ],
      paragraphs: [
        "Principal paydown follows the modeled amortization; property-value scenarios are illustrative bands (flat and steady appreciation), not predictions.",
      ],
    });
  }

  if (args.scenarios.length) {
    sections.push({
      title: "V. QUALIFYING INCOME — THE TEST A LENDER RUNS",
      rows: args.scenarios.map((s) => ({
        label: s.program,
        value: `≈${dollars(s.incomeComfortableAnnual)}/yr household income supports the full payment at customary housing ratios (sometimes workable from ${dollars(s.incomeStretchAnnual)}/yr)`,
      })),
      paragraphs: [
        "Lenders size the full housing payment — principal, interest, taxes, and insurance — against household income and total debts. These figures run that test in reverse at customary ratios; credit, debts, and program rules move the real answer.",
      ],
    });
  }

  if (args.financingLanes.length) {
    sections.push({
      title: "VI. FINANCING LANES & ILLUSTRATIVE PRICING",
      rows: args.financingLanes.slice(0, 8).map((laneName, index) => ({
        label: `${index + 1}. ${laneName}`,
        value: estimateLanePricing(laneName, args.rates, args.price).pricing,
      })),
      paragraphs: [LANE_PRICING_BOUNDARY],
    });
  }

  if (args.scenarios.length) {
    sections.push({
      title: "VII. CASH TO CLOSE",
      rows: args.scenarios.map((s) => ({
        label: s.program,
        value: `${dollars(s.downPayment + args.closingLow)}–${dollars(s.downPayment + args.closingHigh)}  (${s.downPayment === 0 ? "$0 down" : `${dollars(s.downPayment)} down`} + ${dollars(args.closingLow)}–${dollars(args.closingHigh)} closing)`,
      })),
    });
  }

  sections.push({
    title: "ADVISORY BOUNDARY",
    paragraphs: [
      ...args.disclaimers,
      "This pro forma is an advisory screening document prepared without collecting any personal information. It is not a Loan Estimate under TRID, not a rate quote, not a commitment to lend, and not an eligibility or approval finding. Take it to any licensed lender — ours or your own — as the starting numbers; their underwriting and disclosures govern every figure before reliance.",
    ],
  });

  return sections;
}
