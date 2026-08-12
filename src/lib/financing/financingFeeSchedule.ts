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
  /** How this line is handled for Guild members. */
  guild: string;
  /** An emphasized selling-point line rendered in bold under the detail. */
  emphasis?: string;
}

export const FINANCING_FEE_LINES: FinFeeLine[] = [
  {
    service: "Hourly consulting",
    detail: "Strategic planning, credit-repair guidance, or complex financial structuring — for when you just want advice, not to apply yet.",
    fee: `$${FINANCING_ADVISORY_HOURLY_USD}/hr`,
    feeConfirmed: true,
    guild: "Included / credited",
  },
  {
    // "Financial Tune-Up" (founder 2026-07-29): plain-language rename —
    // "Engagement retainer" read as jargon even to the founder.
    service: "Financial Tune-Up",
    detail: "A flat-fee financial check-up: we evaluate your tax returns, assess debt-to-income, and map a long-term borrowing strategy.",
    emphasis: "Credited back to you in full if a loan closes.",
    fee: "$500 – $2,500",
    feeConfirmed: true,
    guild: "Free — every tier",
  },
  {
    // "Advisory fee" (founder 2026-07-29): a "flat" fee cannot carry a range —
    // the range stays, the contradiction goes.
    service: "Advisory fee",
    detail: "Shopping the market, negotiating with multiple wholesale lenders, and reviewing tailored loan offers on your behalf. Quoted up front for your situation before any work begins.",
    fee: "$500 – $2,000",
    feeConfirmed: true,
    guild: "Included / credited",
  },
];

/** What the licensed mortgage broker does for you — descriptive, no fee. */
export const FINANCING_OFFERINGS: { title: string; body: string }[] = [
  {
    title: "Market sourcing",
    body: "Access to wholesale lenders and products that aren't offered directly to the public.",
  },
  {
    title: "Credit analysis & repair strategy",
    body: "A close read of your credit report to catch errors and a step-by-step plan to strengthen your score before you shop.",
  },
  {
    title: "DTI & affordability modeling",
    body: "Structuring non-traditional income, self-employment, or complex assets so you can actually qualify.",
  },
  {
    title: "Pre-approval & documentation prep",
    body: "Collecting, organizing, and vetting your paperwork into a rock-solid pre-approval that makes you competitive.",
  },
  {
    title: "Loan structuring & negotiation",
    body: "Helping you pick the right loan — FHA, VA, conventional, jumbo, or non-QM — and negotiating the terms.",
  },
  {
    title: "Coordination through closing",
    body: "Acting as your liaison with the underwriter, appraiser, and title company all the way to the closing table.",
  },
];

export interface FinancingTrustLine {
  text: string;
  /** Optional trailing link (e.g. the NMLS Consumer Access lookup). */
  link?: { label: string; href: string };
}

/** Trust + compliance signals for a licensed mortgage broker. */
export const FINANCING_TRUST: FinancingTrustLine[] = [
  {
    text: "Licensed mortgage broker, registered in the NMLS — verify the license and status in the",
    link: {
      label: "NMLS Consumer Access database",
      href: "https://www.nmlsconsumeraccess.org/",
    },
  },
  { text: "By federal law, a broker cannot be paid by both you and the lender on the same transaction." },
  { text: "Broker fees are capped by federal law and are never tied to the interest rate you're given." },
  { text: "Every fee is itemized in writing on your fee agreement and Loan Estimate (CFPB / TILA / RESPA)." },
  { text: "A broker owes you a fiduciary duty — to act in your best interest, not a lender's." },
];

export const FINANCING_FEE_NOTES = {
  guild:
    "Guild members receive this advisory time included or credited — the more complete tiers include one-on-one hours outright.",
  broker:
    "Fee ranges are typical; you receive a written quote for your specific engagement before any work begins.",
  disclosure:
    "The advisory service is separate from originating a loan: you can use it and take a loan anywhere. Fees are quoted and approved before any work, and Furlong takes no compensation tied to your transaction.",
};
