import { annualLevelDebtService, transactionPrice } from "@/lib/property/calculationMath";
/**
 * financingProgramFit — property-first program ranking (founder premise,
 * stated 2026-08-05: "weigh the actual property values and determine which
 * program is the best fit mathematically for a yes from a lender — leaning
 * on the property metrics instead of the customer's financial situation.
 * Can this property support the proposed financing on its own paper without
 * collecting or scoring the customer's personal financial profile?").
 *
 * Replaces the lanes' static hard-coded orderings (FSA-always-first on farm,
 * SBA-always-first on commercial) with fit computed from THIS property:
 *   - eligibility gates: verified USDA rural-area designation (live layer),
 *     proposed loan amount vs. the dated program loan limit;
 *   - coverage math: the property's modeled income (farm enterprise NOI)
 *     against each program's debt service at its own rate and term, tested
 *     against the 1.25x DSCR floor — the standalone-lendability test.
 *
 * Advisory screening only: fit lines say what the property's paper shows,
 * never who qualifies. Deterministic; every figure carries its basis.
 */

import type { UsdaRuralEligibility } from "@/lib/property/usdaRuralLive";

export interface ProgramFitContext {
  laneId: "farm" | "commercial" | "residential";
  /** Actual asking/contract price or explicit intended offer only; never assessment. */
  screeningPrice: number | null;
  /** Proposed amount of this loan, not property value. Other debt still needs reconciliation. */
  proposedLoanAmount?: number | null;
  asOf?: string;
  priceBasis?: string;
  rateAsOf?: { mortgage: string | null; fsaDirect: string | null };
  /** Modeled property-standalone income (farm: best enterprise-mix NOI). */
  noiAnnual: number | null;
  /** Where the NOI figure came from, printed with every coverage line. */
  noiBasis: string | null;
  rates: {
    mortgage30Pct: number | null;
    fsaOwnershipDirectPct: number | null;
  } | null;
  usdaRural: Pick<
    UsdaRuralEligibility,
    "businessEligible" | "housingEligible"
  > | null;
}

/** CANON-EXPL / TECH-PROV: structured, replayable inputs; never parse prose for money. */
export interface FinancingCalculation {
  version: "financing-calculation-v1";
  purchasePrice: number;
  priceBasis: string;
  loanAmount: number;
  loanBasis: string;
  annualNoi: number;
  incomeBasis: string;
  ratePct: number;
  rateBasis: string;
  rateAsOf: string | null;
  termYears: number;
  paymentsPerYear: 12;
  monthlyPayment: number;
  annualDebtService: number;
  dscr: number;
  comparisonTarget: number;
}
export interface ProgramFit {
  calculation?: FinancingCalculation;
  /** Higher = better property-side fit. Excluded programs sort last. */
  score: number;
  /** One-line property-standalone finding, rendered under the program. */
  line: string;
  /** Set when a hard property-side gate fails (price limit, rural area). */
  excluded?: string;
}

const DSCR_FLOOR = 1.25;
// Official FSA ownership/guaranteed pages checked 2026-09-07. FY2026
// expires 2026-09-30; after that the indexed ceiling needs a refreshed source.
// https://www.fsa.usda.gov/resources/loans/farm-ownership-loans
// https://www.fsa.usda.gov/resources/loans/guaranteed-farm-loans
const FSA_DIRECT_LIMIT = 600_000;
const FSA_GUARANTEED_LIMIT = 2_343_000;

const dollars = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function levelAnnualDebtService(
  principal: number,
  ratePct: number,
  years: number,
): number {
  return annualLevelDebtService(principal, ratePct, years, 12) ?? NaN;
}

/** DSCR line for a program's own rate/term at the stated screening price. */
function coverage(
  ctx: ProgramFitContext,
  ratePct: number | null,
  rateBasis: string,
  amortYears: number,
  ltv: number,
): ProgramFit | null {
  if (transactionPrice(ctx.screeningPrice) == null || ctx.noiAnnual == null || !Number.isFinite(ctx.noiAnnual) || ratePct == null || !Number.isFinite(ratePct) || ratePct < 0)
    return null;
  const loanAmount = ctx.proposedLoanAmount ?? ctx.screeningPrice! * ltv;
  const ads = levelAnnualDebtService(
    loanAmount,
    ratePct,
    amortYears,
  );
  if (!Number.isFinite(ads) || ads <= 0) return null;
  const dscr = ctx.noiAnnual / ads;
  const verdict =
    dscr >= DSCR_FLOOR
      ? "meets the illustrative 1.25x comparison target; lender requirements may differ"
      : dscr >= 1.0
        ? "covers this modeled payment but is below the illustrative 1.25x comparison target"
        : "does not cover this modeled payment";
  return {
    calculation: {
      version: "financing-calculation-v1",
      purchasePrice: ctx.screeningPrice!,
      priceBasis: ctx.priceBasis ?? "Entered transaction scenario; independent price verification not supplied",
      loanAmount,
      loanBasis: ctx.proposedLoanAmount != null ? "Entered proposed loan; other debt is not included" : `Illustrative borrowing assumption: ${Math.round(ltv * 100)}% of the transaction price; not an approved loan-to-value ratio`,
      annualNoi: ctx.noiAnnual,
      incomeBasis: ctx.noiBasis ?? "Income source not supplied; do not rely on this scenario",
      ratePct, rateBasis,
      rateAsOf: /published FSA direct/.test(rateBasis) ? ctx.rateAsOf?.fsaDirect ?? null : ctx.rateAsOf?.mortgage ?? null,
      termYears: amortYears, paymentsPerYear: 12,
      monthlyPayment: ads / 12, annualDebtService: ads, dscr,
      comparisonTarget: DSCR_FLOOR,
    },
    score: dscr,
    line:
      `Property-standalone test: modeled income ${dollars(ctx.noiAnnual)}/yr vs ` +
      `${dollars(ads)}/yr debt service at ${ratePct.toFixed(2)}% (${rateBasis}, ${amortYears}-yr, ` +
      `${ctx.proposedLoanAmount != null ? dollars(ctx.proposedLoanAmount) + " proposed loan; other debt not included" : Math.round(ltv * 100) + "% illustrative LTV"}) → DSCR ${dscr.toFixed(2)} — ${verdict}.` +
      (ctx.noiBasis ? ` Income basis: ${ctx.noiBasis}.` : ""),
  };
}

const NEEDS_INPUTS =
  "We cannot calculate whether this property can cover loan payments yet. We need a purchase price or intended offer, a supported annual income-and-expense budget, and the proposed loan amount, interest rate, term and payment schedule. Tax assessment and generic crop budgets are not substitutes.";

export interface LenderTest {
  test: string;
  status: "pass" | "fail" | "unknown";
  detail: string;
}

/**
 * The property-side lender-test scorecard (founder ask 2026-08-05 was
 * "probability of a lender approving" — which the platform must never state:
 * approval is a licensed credit decision about a PERSON. What a lender's own
 * checklist tests about the PROPERTY is statable, and this is that list).
 */
export function buildLenderTestScorecard(args: {
  ctx: ProgramFitContext;
  /** Best modeled DSCR across uses/programs (farm mix or commercial best use). */
  bestDscr: number | null;
  bestDscrLabel: string | null;
  superfundWithin3mi: number | null;
  floodZone: string | null;
}): LenderTest[] {
  const tests: LenderTest[] = [];
  const { ctx } = args;

  tests.push(
    transactionPrice(ctx.screeningPrice) != null
      ? {
          test: "Stated value basis",
          status: "pass",
          detail: `Transaction price ${dollars(ctx.screeningPrice!)} supplied — this is a price basis, not a market-value finding.`,
        }
      : {
          test: "Stated value basis",
          status: "unknown",
          detail:
            "No verified asking price or intended offer is available — acquisition math is pending.",
        },
  );

  if (args.bestDscr != null && Number.isFinite(args.bestDscr)) {
    tests.push(
      args.bestDscr >= 1.25
        ? {
            test: "Debt-service coverage (illustrative 1.25x target)",
            status: "pass",
            detail: `Best modeled use${args.bestDscrLabel ? ` (${args.bestDscrLabel})` : ""} reaches DSCR ${args.bestDscr.toFixed(2)} — this scenario meets the comparison target, not a lender approval or verified repayment finding.`,
          }
        : {
            test: "Debt-service coverage (illustrative 1.25x target)",
            status: "fail",
            detail: `Best modeled use${args.bestDscrLabel ? ` (${args.bestDscrLabel})` : ""} reaches DSCR ${args.bestDscr.toFixed(2)} — this scenario is below the comparison target; review price, income, costs and debt terms.`,
          },
    );
  } else {
    tests.push({
      test: "Debt-service coverage (illustrative 1.25x target)",
      status: "unknown",
      detail:
        "Coverage needs a transaction price, a supported income-and-expense budget and debt terms. Acreage or square footage alone cannot establish income.",
    });
  }

  if (ctx.laneId !== "residential") {
    const rural =
      ctx.laneId === "commercial"
        ? ctx.usdaRural?.businessEligible
        : ctx.usdaRural?.businessEligible;
    tests.push(
      rural === true
        ? {
            test: "USDA rural-area gate (B&I/OneRD)",
            status: "pass",
            detail:
              "Verified inside the eligible rural area against USDA's own live layer.",
          }
        : rural === false
          ? {
              test: "USDA rural-area gate (B&I/OneRD)",
              status: "fail",
              detail:
                "Not in a USDA-eligible rural area — the USDA business programs are off the menu; SBA and conventional remain.",
            }
          : {
              test: "USDA rural-area gate (B&I/OneRD)",
              status: "unknown",
              detail:
                "Live rural check unavailable — verify at eligibility.sc.egov.usda.gov.",
            },
    );
  }

  if (args.superfundWithin3mi != null) {
    tests.push(
      args.superfundWithin3mi === 0
        ? {
            test: "Environmental screen (Superfund)",
            status: "pass",
            detail:
              "No Superfund (SEMS) sites within 3 miles — the first environmental question a lender asks starts clean.",
          }
        : {
            test: "Environmental screen (Superfund)",
            status: "fail",
            detail: `${args.superfundWithin3mi} Superfund (SEMS) site(s) within 3 miles — expect the lender's environmental diligence to look hard here.`,
          },
    );
  } else {
    tests.push({
      test: "Environmental screen (Superfund)",
      status: "unknown",
      detail: "EPA screen not resolved for this address yet.",
    });
  }

  if (args.floodZone) {
    const hazard = /^[AV]/.test(args.floodZone.trim().toUpperCase());
    tests.push(
      hazard
        ? {
            test: "Flood posture",
            status: "fail",
            detail: `FEMA zone ${args.floodZone} — inside a Special Flood Hazard Area; flood insurance is a lender requirement and a real carrying cost.`,
          }
        : {
            test: "Flood posture",
            status: "pass",
            detail: `FEMA zone ${args.floodZone} — outside the mapped Special Flood Hazard Area.`,
          },
    );
  } else {
    tests.push({
      test: "Flood posture",
      status: "unknown",
      detail: "Flood zone not resolved for this address yet.",
    });
  }

  return tests;
}

export function evaluateProgramFit(
  programName: string,
  ctx: ProgramFitContext,
): ProgramFit | null {
  const name = programName.toLowerCase();
  const bench = ctx.rates?.mortgage30Pct ?? null;
  const fsaDirect = ctx.rates?.fsaOwnershipDirectPct ?? null;

  // ── Farm lane ──
  if (ctx.laneId === "farm") {
    if (/usda business|business & industry|business and industry/.test(name)) {
      if (ctx.usdaRural?.businessEligible === false) {
        return {
          score: -1,
          line: "",
          excluded:
            "This address is outside USDA Rural Development's verified business-program geography. SBA, FSA, and conventional paths remain available subject to their own rules.",
        };
      }
      const c = coverage(
        ctx,
        bench != null ? bench + 0.75 : null,
        "illustrative B&I lender rate ≈ benchmark +0.75",
        25,
        0.8,
      );
      const eligibility =
        "USDA Rural Development B&I/OneRD must confirm an eligible rural business purpose; primary agricultural production and integrated/value-added components require program-specific review.";
      return c
        ? { ...c, line: `${eligibility} ${c.line}` }
        : { score: 0, line: `${eligibility} ${NEEDS_INPUTS}` };
    }
    if (/sba 504/.test(name)) {
      const c = coverage(
        ctx,
        bench != null ? bench + 0.4 : null,
        "illustrative 504 blended rate ≈ benchmark +0.4",
        25,
        0.9,
      );
      const eligibility =
        "SBA 504 must confirm an eligible owner-occupied business fixed-asset use; Furlong does not treat ordinary primary-production acreage as automatically SBA-eligible.";
      return c
        ? { ...c, line: `${eligibility} ${c.line}` }
        : { score: 0, line: `${eligibility} ${NEEDS_INPUTS}` };
    }
    if (/sba 7\(a\)|sba 7a/.test(name)) {
      const c = coverage(
        ctx,
        bench != null ? bench + 1.0 : null,
        "illustrative 7(a) rate ≈ benchmark +1.0",
        25,
        0.85,
      );
      const eligibility =
        "SBA 7(a) must confirm an eligible value-added or commercial operating purpose; primary farm production is not assumed eligible.";
      return c
        ? { ...c, line: `${eligibility} ${c.line}` }
        : { score: 0, line: `${eligibility} ${NEEDS_INPUTS}` };
    }
    if (/fsa direct|fsa guaranteed/.test(name)) {
      const direct = /fsa direct/.test(name);
      const asOf = Date.parse(ctx.asOf ?? new Date().toISOString());
      if (!Number.isFinite(asOf) || asOf >= Date.parse("2026-10-01T00:00:00Z")) {
        return { score: 0, line: "FSA limit evidence requires refresh for this calculation date; no program exclusion or coverage ranking is issued." };
      }
      const limit = direct ? FSA_DIRECT_LIMIT : FSA_GUARANTEED_LIMIT;
      const proposed = ctx.proposedLoanAmount;
      if (proposed != null && (!Number.isFinite(proposed) || proposed <= 0)) {
        return { score: 0, line: "Enter a positive proposed loan amount; the purchase price is not the loan amount." };
      }
      if (proposed != null && proposed > limit) {
        return { score: -1, line: "", excluded: `Proposed FSA loan ${dollars(proposed)} exceeds the dated ${direct ? "direct" : "FY2026 guaranteed"} loan ceiling of ${dollars(limit)}. This excludes that loan structure, not the property or a revised blended structure. FSA/lender review is required.` };
      }
      const modeledPrincipal = proposed ?? (transactionPrice(ctx.screeningPrice) == null ? null : ctx.screeningPrice! * (direct ? 1 : 0.9));
      if (proposed == null && modeledPrincipal != null && modeledPrincipal > limit) {
        return { score: 0, line: `Loan structure pending: the illustrative principal exceeds the dated ${dollars(limit)} FSA ceiling. Purchase price alone does not disqualify this property. Supply the requested FSA loan, equity, any joint financing and total debt service for review.` };
      }
      const c = direct
        ? coverage(ctx, fsaDirect, "published FSA direct rate; payment schedule assumed monthly", 40, 1.0)
        : coverage(ctx, bench != null ? bench + 0.75 : null, "illustrative bank rate ≈ benchmark +0.75", 30, 0.9);
      return c ?? { score: 0, line: NEEDS_INPUTS };
    }
    if (/farm credit/.test(name)) {
      const c = coverage(
        ctx,
        bench != null ? bench + 1.0 : null,
        "illustrative association rate ≈ benchmark +1.0",
        25,
        0.75,
      );
      return c ?? { score: 0, line: NEEDS_INPUTS };
    }
    if (/conventional farm|mixed-use/.test(name)) {
      const c = coverage(
        ctx,
        bench != null ? bench + 1.25 : null,
        "illustrative bank rate ≈ benchmark +1.25",
        20,
        0.7,
      );
      return c ?? { score: 0, line: NEEDS_INPUTS };
    }
    if (/rural development housing/.test(name)) {
      return {
        score: -1,
        line: "",
        excluded:
          ctx.usdaRural?.housingEligible === false
            ? "This address is outside USDA Rural Development's verified housing-program geography."
            : "USDA Rural Development housing is not ranked for an agricultural transaction unless the customer separately confirms that an owner-occupied residence is part of the proposed use. Rural geography alone is not enough.",
      };
    }
    return null; // seller / bridge etc. keep the lane's fallback order
  }

  // ── Commercial lane ──
  if (ctx.laneId === "commercial") {
    if (/usda business|business & industry|business and industry/.test(name)) {
      if (ctx.usdaRural?.businessEligible === true) {
        const c = coverage(
          ctx,
          bench != null ? bench + 0.75 : null,
          "illustrative B&I bank rate ≈ benchmark +0.75",
          25,
          0.8,
        );
        const ruralLine =
          "Address verified inside the USDA-eligible rural area for business programs (live USDA layer) — the B&I geographic gate passes; eligible business purpose and lender participation still control. Borrower underwriting is performed separately by the selected provider and is not part of Furlong's property score.";
        return c
          ? { ...c, score: c.score + 1, line: `${ruralLine} ${c.line}` }
          : { score: 3, line: ruralLine };
      }
      if (ctx.usdaRural?.businessEligible === false) {
        return {
          score: -1,
          line: "",
          excluded:
            "This address is NOT in a USDA-eligible rural area (verified live against USDA's own layer) — B&I/OneRD business programs are unavailable here.",
        };
      }
      return {
        score: 0.5,
        line: "USDA rural-area check unavailable right now — the B&I geographic gate is unverified; check eligibility.sc.egov.usda.gov.",
      };
    }
    if (/sba 504/.test(name)) {
      const c = coverage(
        ctx,
        bench != null ? bench + 0.4 : null,
        "illustrative 504 blended rate ≈ benchmark +0.4",
        25,
        0.9,
      );
      return c
        ? {
            ...c,
            line: `${c.line} Owner-occupancy by an eligible operating business is a program-side gate. Borrower underwriting is provider-side and does not affect Furlong's property ranking.`,
          }
        : {
            score: 2,
            line: "Fit turns on owner-occupancy: SBA 504 requires an eligible operating business occupying the property.",
          };
    }
    if (/sba/.test(name)) {
      const c = coverage(
        ctx,
        bench != null ? bench + 1.0 : null,
        "illustrative 7(a) rate ≈ benchmark +1.0",
        25,
        0.85,
      );
      return c
        ? {
            ...c,
            line: `${c.line} Owner-occupancy by an eligible operating business is a program-side gate. Borrower underwriting is provider-side and does not affect Furlong's property ranking.`,
          }
        : {
            score: 2,
            line: "Property/program fit turns on owner-occupancy: SBA financing requires an eligible operating business occupying the property. Furlong does not use personal financials for this ranking; borrower creditworthiness and repayment underwriting are handled by the selected SBA lender.",
          };
    }
    if (/conventional/.test(name)) {
      const c = coverage(
        ctx,
        bench != null ? bench + 1.0 : null,
        "illustrative bank CRE rate ≈ benchmark +1.0",
        20,
        0.75,
      );
      return (
        c ?? {
          score: 1.5,
          line: "Conventional CRE underwrites the property's own income first: the coverage test needs a rent roll or operating NOI — bring either and the standalone math runs.",
        }
      );
    }
    return null;
  }

  // ── Residential lane ──
  if (/usda rural development purchase|rural development purchase/.test(name)) {
    if (ctx.usdaRural?.housingEligible === true) {
      return {
        score: 3,
        line: "Address verified inside the USDA-eligible rural area (live USDA layer) — the 0%-down RD geographic gate passes; income limits and lender underwriting still control.",
      };
    }
    if (ctx.usdaRural?.housingEligible === false) {
      return {
        score: -1,
        line: "",
        excluded:
          "This address is NOT in a USDA-eligible rural area (verified live) — USDA RD home loans are unavailable here.",
      };
    }
    return {
      score: 0.5,
      line: "USDA rural-area check unavailable right now — geographic eligibility unverified.",
    };
  }
  return null;
}


export interface PropertyUseScenario {
  id: string;
  label: string;
  noiAnnual: number | null;
  noiLow?: number | null;
  noiHigh?: number | null;
  basis: string;
  evidenceStatus: "supported" | "screening" | "needs-evidence";
  timeToIncome?: string | null;
}

export interface ScenarioFinancingMatch {
  scenario: PropertyUseScenario;
  program: string;
  fit: ProgramFit;
}

export interface ScenarioFinancingMatrix {
  matches: ScenarioFinancingMatch[];
  best: ScenarioFinancingMatch | null;
  alternatives: ScenarioFinancingMatch[];
  note: string;
}

export function buildScenarioFinancingMatrix(args: {
  baseContext: ProgramFitContext;
  programs: string[];
  scenarios: PropertyUseScenario[];
}): ScenarioFinancingMatrix {
  const matches: ScenarioFinancingMatch[] = [];
  for (const scenario of args.scenarios) {
    for (const program of args.programs) {
      const fit = evaluateProgramFit(program, {
        ...args.baseContext,
        noiAnnual: scenario.evidenceStatus === "supported" ? scenario.noiAnnual : null,
        noiBasis: scenario.basis,
      });
      if (fit) matches.push({ scenario, program, fit });
    }
  }
  matches.sort((a, b) => {
    const evidenceA = a.scenario.evidenceStatus === "supported" ? 2 : a.scenario.evidenceStatus === "screening" ? 1 : 0;
    const evidenceB = b.scenario.evidenceStatus === "supported" ? 2 : b.scenario.evidenceStatus === "screening" ? 1 : 0;
    const executableA = a.fit.excluded ? -1 : a.fit.score;
    const executableB = b.fit.excluded ? -1 : b.fit.score;
    return evidenceB - evidenceA || executableB - executableA;
  });
  const viable = matches.filter((match) => !match.fit.excluded && match.fit.calculation != null && match.scenario.evidenceStatus === "supported" && Number.isFinite(match.scenario.noiAnnual) && transactionPrice(args.baseContext.screeningPrice) != null);
  return {
    matches,
    best: viable[0] ?? null,
    alternatives: viable.slice(1, 4),
    note:
      "Furlong ranks the supported property-use and financing combination that appears most executable on the property's own evidence. This is an advisory screen, not a financing approval, closing assurance, or promise of keys.",
  };
}
