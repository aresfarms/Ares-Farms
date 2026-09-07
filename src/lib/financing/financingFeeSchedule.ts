/**
 * Financing fee posture — owner-controlled Furlong Capital Desk.
 *
 * The customer-facing financing core is free end-to-end: intake, readiness,
 * verified-provider comparison, exact-recipient case-room handoff, and status
 * coordination through closing. Optional professional/archival engagements are
 * separate fixed-scope services and never buy financing access, placement, or a
 * better rank. Lead sales, file auctions, automatic broadcasts, referral fees,
 * success percentages, transaction cuts, and pay-to-rank placement are prohibited.
 *
 * Master Volume Governance:
 * - FACILITATION-001 / CONST-FAIR-001: no credit decision or paid placement.
 * - REG-STATE-001 / REG-LICENSE-001: jurisdictional authority before activity.
 * - CANON-TREASURY-001: no undisclosed or post-hoc compensation.
 */

export const FINANCING_FREE_STATEMENT = {
  lead: "The Furlong financing core is free to the customer.",
  body:
    "You can submit a deal, build one readiness file, compare verified providers, authorize provider-specific case rooms, and follow the file through closing without a borrower financing fee. The funding institution sets its own loan pricing and closing costs. Optional professional or archival work is separately scoped and never changes financing access or provider rank.",
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
    service: "Managed provider comparison",
    detail:
      "Furlong ranks verified providers by published credit-box fit and evidence-backed execution. Customers may authorize several provider-specific case rooms; Furlong never sells or broadcasts the file.",
    fee: "$0",
    feeConfirmed: true,
    guild: "Included",
    emphasis:
      "No provider can pay to improve rank. Furlong takes no success percentage, referral fee, or transaction cut from the financing outcome.",
  },
  {
    service: "Authorized case-room handoff & closing status",
    detail:
      "Freeze the exact package, authorize each named recipient separately, keep provider access expiring and revocable, and track conditions, environmental work, appraisal, title, closing, and keys/logbook status.",
    fee: "$0",
    feeConfirmed: true,
    guild: "Included",
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
    title: "Customer-controlled provider search",
    body:
      "See the best-supported verified providers and why each published credit box fits. Select more than one for a private comparison; each receives a separate expiring case room only after exact-recipient consent.",
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
      "Borrower financing access is never sold. Lead sales, file auctions, automatic broadcasts, referral fees, success percentages, transaction cuts, and pay-to-rank placement are prohibited. Optional professional or archival work uses a separate written scope and cannot affect financing routing.",
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
    "Managed provider matching may recommend verified providers, but Furlong charges the borrower no financing-access, referral, success, or transaction fee. Lead sales, file auctions, and pay-to-rank placement are never permitted.",
  disclosure:
    "Any optional professional or archival engagement must use a separate written scope, fixed or otherwise non-outcome-contingent fee disclosure, applicable professional authority, and conflict review. It cannot affect provider ranking, routing, or credit treatment."
};
