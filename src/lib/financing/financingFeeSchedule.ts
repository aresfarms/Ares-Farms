/**
 * Financing fee posture — owner-controlled Furlong Capital Desk.
 *
 * Intake, program navigation, and initial readiness coordination are free.
 * Compensated packaging, brokerage/referral, or consulting is NOT activated by
 * this schedule. Any paid activity requires state/program authority clearance,
 * an accepted written scope, advance fee disclosure, and SBA Form 159 handling
 * when applicable.
 *
 * Master Volume Governance:
 * - FACILITATION-001 / CONST-FAIR-001: no credit decision or paid placement.
 * - REG-STATE-001 / REG-LICENSE-001: jurisdictional authority before activity.
 * - CANON-TREASURY-001: no undisclosed or post-hoc compensation.
 */

export const FINANCING_FREE_STATEMENT = {
  lead: "Capital Desk intake and initial readiness review are free.",
  body:
    "You can submit a deal, compare program pathways, organize the first readiness picture, and identify potential lender categories without paying Furlong. The funding institution sets its own loan pricing and closing costs. Any later paid Furlong professional service requires a separate written engagement and legal/program clearance before work begins.",
};

export interface FinFeeLine {
  service: string;
  detail: string;
  fee: string;
  feeConfirmed: boolean;
  guild: string;
  emphasis?: string;
}

export const FINANCING_FEE_LINES: FinFeeLine[] = [
  {
    service: "Capital Desk intake & program navigation",
    detail:
      "Record the project, compare SBA/USDA/FSA/conventional pathways, and build the initial readiness picture.",
    fee: "$0",
    feeConfirmed: true,
    guild: "Included",
  },
  {
    service: "Initial document-readiness organization",
    detail:
      "Identify common document gaps and organize evidence already supplied by the customer without making a credit decision.",
    fee: "$0",
    feeConfirmed: true,
    guild: "Included",
  },
  {
    service: "Compensated packaging / brokerage / referral",
    detail:
      "Not currently activated. Before any paid work begins, Furlong must clear the activity for the applicable state and program, issue a written scope and compensation disclosure, and satisfy any program-specific agent disclosure requirement.",
    fee: "Not activated",
    feeConfirmed: true,
    guild: "Not activated",
    emphasis:
      "Submitting a deal does not enroll you in a paid service and does not create a commission or referral obligation.",
  },
];

export const FINANCING_OFFERINGS: { title: string; body: string }[] = [
  {
    title: "Program navigation",
    body:
      "Compare how SBA 7(a), SBA 504, USDA B&I, FSA, and conventional structures may relate to the project without treating a pathway match as qualification.",
  },
  {
    title: "Readiness & document organization",
    body:
      "Build a lender-ready evidence picture, surface missing items, and keep sensitive documents inside the governed vault.",
  },
  {
    title: "Lender-network coordination",
    body:
      "Identify institutions whose published program, geography, and deal profile may fit. Candidate status is not a partnership or endorsement, and no case is sent until the recipient and consent gates pass.",
  },
  {
    title: "Environmental-finance coordination",
    body:
      "Keep environmental screening and financing readiness connected for SBA, USDA, agricultural, commercial, and mixed-use transactions without letting the platform make the lender's or environmental professional's determination.",
  },
];

export interface FinancingTrustLine {
  text: string;
  link?: { label: string; href: string };
}

export const FINANCING_TRUST: FinancingTrustLine[] = [
  {
    text:
      "Furlong Core is not the creditor. Underwriting, pricing, approval, commitment, servicing, and adverse-action authority remain with the applicable funding institution.",
  },
  {
    text:
      "Lender ranking and routing may not be sold. An affiliated lender, if one is created later, must compete under the same disclosed neutral-routing rules as outside institutions.",
  },
  {
    text:
      "A lender-network candidate receives no borrower data merely because it appears in the network registry; live delivery requires certification, verified recipient authority, and borrower consent bound to the exact package and purpose.",
  },
  {
    text:
      "Paid commercial packaging, brokerage, referral, or consulting remains off until jurisdiction and program requirements are cleared and the customer accepts the written scope and compensation disclosure.",
  },
  {
    text:
      "For SBA 7(a)/504 transactions, compensated Agent activity is routed through the applicable SBA Form 159 disclosure/compensation control when required.",
  },
];

export const FINANCING_FEE_NOTES = {
  guild:
    "Membership does not create an exception to licensing, disclosure, conflict, or program-agent requirements.",
  broker:
    "No paid commercial brokerage or packaging fee is authorized by this page today.",
  disclosure:
    "If Furlong later activates a paid professional service, the exact scope, payer, amount or calculation method, provider, legal basis, and required program disclosures must be accepted before work begins.",
};
