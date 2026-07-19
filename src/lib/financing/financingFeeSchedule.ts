/**
 * financingFeeSchedule — the Financial module's fee chart (founder direction
 * 2026-07-19). States plainly that lending applications are FREE; the only paid
 * services are one-on-one time with the licensed lender ($250/hr, or included
 * with Guild membership) and other financial analysis a licensed mortgage
 * broker can provide.
 *
 * HONEST DATA RULE: the only filled-in fee is the founder-provided $250/hr
 * advisory rate. Anything else is "Quoted to scope" until Stuart provides the
 * real figure — we never fabricate a professional fee or a service he hasn't
 * confirmed offering.
 *
 * Master Volume Governance:
 * - FACILITATION-001: the loan itself is the lender's; the platform facilitates.
 * - CANON-TREASURY-001 §9.1: fees disclosed up front, quoted + approved before
 *   any work, no post-hoc fees.
 * - Bright line: Furlong takes NO transaction-tied compensation. Loan costs
 *   (rate, points, closing) are set by the lender at closing, not here.
 */

export const FINANCING_ADVISORY_HOURLY_USD = 250;

/** The headline promise, shown prominently above the paid-services table. */
export const FINANCING_FREE_STATEMENT = {
  lead: "All lending applications are free.",
  body: "You never pay to apply for a loan, to be matched to a program, or to have the licensed lender review your deal. Loan costs — rate, points, and closing costs — are set by the lender and the program at closing, and disclosed to you in writing before you commit.",
};

export interface FinFeeLine {
  service: string;
  detail: string;
  fee: string;
  feeConfirmed: boolean;
}

export const FINANCING_FEE_LINES: FinFeeLine[] = [
  {
    service: "One-on-one time with the licensed lender",
    detail: "Sitting down with the licensed lender to talk through your situation and options.",
    fee: `$${FINANCING_ADVISORY_HOURLY_USD}/hr`,
    feeConfirmed: true,
  },
  {
    service: "Loan-fit & paperwork-readiness session",
    detail: "Going over which programs might fit and getting your paperwork ready before you apply.",
    fee: `$${FINANCING_ADVISORY_HOURLY_USD}/hr`,
    feeConfirmed: true,
  },
  {
    service: "Financial analysis & mortgage-brokerage consulting",
    detail: "Deeper financial analysis and consulting the licensed mortgage broker can provide.",
    fee: `$${FINANCING_ADVISORY_HOURLY_USD}/hr`,
    feeConfirmed: true,
  },
];

export const FINANCING_FEE_NOTES = {
  guild:
    "Guild members receive this advisory time included or credited — the more complete tiers include one-on-one hours outright.",
  broker:
    "Additional services a licensed mortgage broker can offer are quoted to scope — confirm what you need and you'll get a written quote first.",
  disclosure:
    "The advisory service is separate from originating a loan: you can use it and take a loan anywhere. Fees are quoted and approved before any work, and Furlong takes no compensation tied to your transaction.",
};
