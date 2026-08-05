/**
 * financingProgramFit — property-first program ranking (founder premise,
 * stated 2026-08-05: "weigh the actual property values and determine which
 * program is the best fit mathematically for a yes from a lender — leaning
 * on the property metrics instead of the customer's financial situation.
 * Can this property get a loan on its own paper before a customer ever adds
 * their financials?").
 *
 * Replaces the lanes' static hard-coded orderings (FSA-always-first on farm,
 * SBA-always-first on commercial) with fit computed from THIS property:
 *   - eligibility gates: verified USDA rural-area designation (live layer),
 *     purchase price vs. each program's statutory loan limit;
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
  /** Entered/listed price, else county-assessed total (the screening basis). */
  screeningPrice: number | null;
  /** Modeled property-standalone income (farm: best enterprise-mix NOI). */
  noiAnnual: number | null;
  /** Where the NOI figure came from, printed with every coverage line. */
  noiBasis: string | null;
  rates: { mortgage30Pct: number | null; fsaOwnershipDirectPct: number | null } | null;
  usdaRural: Pick<UsdaRuralEligibility, "businessEligible" | "housingEligible"> | null;
}

export interface ProgramFit {
  /** Higher = better property-side fit. Excluded programs sort last. */
  score: number;
  /** One-line property-standalone finding, rendered under the program. */
  line: string;
  /** Set when a hard property-side gate fails (price limit, rural area). */
  excluded?: string;
}

const DSCR_FLOOR = 1.25;
// Statutory / program screening parameters (indexed figures noted as ≈).
const FSA_DIRECT_LIMIT = 600_000;
const FSA_GUARANTEED_LIMIT = 2_251_000;

const dollars = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function levelAnnualDebtService(principal: number, ratePct: number, years: number): number {
  const r = ratePct / 100;
  if (r <= 0) return principal / years;
  return (principal * r) / (1 - Math.pow(1 + r, -years));
}

/** DSCR line for a program's own rate/term at the stated screening price. */
function coverage(
  ctx: ProgramFitContext,
  ratePct: number | null,
  rateBasis: string,
  amortYears: number,
  ltv: number
): { score: number; line: string } | null {
  if (ctx.screeningPrice == null || ctx.noiAnnual == null || ratePct == null) return null;
  const ads = levelAnnualDebtService(ctx.screeningPrice * ltv, ratePct, amortYears);
  if (ads <= 0) return null;
  const dscr = ctx.noiAnnual / ads;
  const verdict =
    dscr >= DSCR_FLOOR ? "clears the 1.25x floor on its own paper" :
    dscr >= 1.0 ? "covers the payment but sits under the 1.25x floor" :
    "does not cover the payment on its own paper";
  return {
    score: dscr,
    line:
      `Property-standalone test: modeled income ${dollars(ctx.noiAnnual)}/yr vs ` +
      `${dollars(ads)}/yr debt service at ${ratePct.toFixed(2)}% (${rateBasis}, ${amortYears}-yr, ` +
      `${Math.round(ltv * 100)}% LTV) → DSCR ${dscr.toFixed(2)} — ${verdict}.` +
      (ctx.noiBasis ? ` Income basis: ${ctx.noiBasis}.` : ""),
  };
}

const NEEDS_INPUTS =
  "Property-standalone test needs a price and a modeled income figure — enter the asking price or your intended offer to run it.";

export function evaluateProgramFit(programName: string, ctx: ProgramFitContext): ProgramFit | null {
  const name = programName.toLowerCase();
  const bench = ctx.rates?.mortgage30Pct ?? null;
  const fsaDirect = ctx.rates?.fsaOwnershipDirectPct ?? null;

  // ── Farm lane ──
  if (ctx.laneId === "farm") {
    if (/fsa direct/.test(name)) {
      if (ctx.screeningPrice != null && ctx.screeningPrice > FSA_DIRECT_LIMIT) {
        return {
          score: -1,
          line: "",
          excluded: `Screening price ${dollars(ctx.screeningPrice)} exceeds the FSA direct loan limit (≈${dollars(FSA_DIRECT_LIMIT)}, indexed) — the direct program cannot carry this purchase alone.`,
        };
      }
      const c = coverage(ctx, fsaDirect, "published FSA direct rate", 40, 1.0);
      return c ?? { score: 0, line: NEEDS_INPUTS };
    }
    if (/fsa guaranteed/.test(name)) {
      if (ctx.screeningPrice != null && ctx.screeningPrice > FSA_GUARANTEED_LIMIT) {
        return {
          score: -1,
          line: "",
          excluded: `Screening price ${dollars(ctx.screeningPrice)} exceeds the FSA guaranteed loan limit (≈${dollars(FSA_GUARANTEED_LIMIT)}, indexed annually).`,
        };
      }
      const c = coverage(ctx, bench != null ? bench + 0.75 : null, "illustrative bank rate ≈ benchmark +0.75", 30, 0.9);
      return c ?? { score: 0, line: NEEDS_INPUTS };
    }
    if (/farm credit/.test(name)) {
      const c = coverage(ctx, bench != null ? bench + 1.0 : null, "illustrative association rate ≈ benchmark +1.0", 25, 0.75);
      return c ?? { score: 0, line: NEEDS_INPUTS };
    }
    if (/conventional farm|mixed-use/.test(name)) {
      const c = coverage(ctx, bench != null ? bench + 1.25 : null, "illustrative bank rate ≈ benchmark +1.25", 20, 0.7);
      return c ?? { score: 0, line: NEEDS_INPUTS };
    }
    if (/rural development housing/.test(name)) {
      if (ctx.usdaRural?.housingEligible === false) {
        return { score: -1, line: "", excluded: "This address is NOT in a USDA-eligible rural area for RD housing programs (verified live against USDA's own layer)." };
      }
      if (ctx.usdaRural?.housingEligible === true) {
        return { score: 0.5, line: "Address verified inside the USDA-eligible rural area for RD housing (live USDA layer) — applies only if owner-occupied residential use fits." };
      }
      return null;
    }
    return null; // seller / bridge etc. keep the lane's fallback order
  }

  // ── Commercial lane ──
  if (ctx.laneId === "commercial") {
    if (/usda business|business & industry|business and industry/.test(name)) {
      if (ctx.usdaRural?.businessEligible === true) {
        return {
          score: 3,
          line: "Address verified inside the USDA-eligible rural area for business programs (live USDA layer) — the B&I geographic gate passes; eligible business purpose and lender participation still control.",
        };
      }
      if (ctx.usdaRural?.businessEligible === false) {
        return { score: -1, line: "", excluded: "This address is NOT in a USDA-eligible rural area (verified live against USDA's own layer) — B&I/OneRD business programs are unavailable here." };
      }
      return { score: 0.5, line: "USDA rural-area check unavailable right now — the B&I geographic gate is unverified; check eligibility.sc.egov.usda.gov." };
    }
    if (/sba/.test(name)) {
      return { score: 2, line: "Fit turns on owner-occupancy: SBA financing requires an eligible operating business occupying the property — a property-plus-business question, not a property-alone one." };
    }
    if (/conventional/.test(name)) {
      return { score: 1.5, line: "Conventional CRE underwrites the property's own income first: the coverage test needs a rent roll or operating NOI — bring either and the standalone math runs." };
    }
    return null;
  }

  // ── Residential lane ──
  if (/usda rural development purchase|rural development purchase/.test(name)) {
    if (ctx.usdaRural?.housingEligible === true) {
      return { score: 3, line: "Address verified inside the USDA-eligible rural area (live USDA layer) — the 0%-down RD geographic gate passes; income limits and lender underwriting still control." };
    }
    if (ctx.usdaRural?.housingEligible === false) {
      return { score: -1, line: "", excluded: "This address is NOT in a USDA-eligible rural area (verified live) — USDA RD home loans are unavailable here." };
    }
    return { score: 0.5, line: "USDA rural-area check unavailable right now — geographic eligibility unverified." };
  }
  return null;
}
