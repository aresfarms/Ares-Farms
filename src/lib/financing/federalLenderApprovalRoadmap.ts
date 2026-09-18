/**
 * Federal lender approval roadmap — Step 5.
 *
 * This is a readiness plan, not a representation that Furlong or a future
 * affiliate is approved by SBA, USDA Rural Development, or FSA.
 */

export const FEDERAL_LENDER_APPROVAL_ROADMAP_VERSION =
  "federal-lender-approval-roadmap-v1.0.0";

export type RoadmapStatus =
  | "NEAR_TERM_PARTNER_PATH"
  | "BUILD_OPERATING_HISTORY"
  | "LONG_TERM_APPLICATION_PATH";

export interface FederalLenderRoadmapItem {
  id: string;
  program: string;
  status: RoadmapStatus;
  currentAuthority: "NONE" | "PARTNER_ONLY";
  targetRole: string;
  prerequisites: string[];
  nextActions: string[];
  officialSources: string[];
  ruleReviewDate?: string;
}

export const FEDERAL_LENDER_ROADMAP: FederalLenderRoadmapItem[] = [
  {
    id: "sba-504-third-party-lender",
    program: "SBA 504",
    status: "NEAR_TERM_PARTNER_PATH",
    currentAuthority: "PARTNER_ONLY",
    targetRole:
      "Participate through qualified senior/third-party lenders and SBA-certified CDCs while the future affiliate builds lending history.",
    prerequisites: [
      "Certified CDC relationship",
      "Qualified senior lender relationship",
      "Current SOP 50 10 procedures",
      "Lender-neutral borrower consent and package delivery",
    ],
    nextActions: [
      "Open outreach to Delaware and Maryland CDC candidates.",
      "Document each CDC's intake, geography, minimum deal size, occupancy/use, environmental, and third-party-lender requirements.",
      "Version the workflow against SOP 50 10 8.1 before its October 1, 2026 effective date.",
    ],
    officialSources: [
      "https://www.sba.gov/loans/504-loans/",
      "https://www.sba.gov/loans/504-loans/list-of-certified-development-companies/",
    ],
    ruleReviewDate: "2026-10-01",
  },
  {
    id: "fsa-guaranteed-lender",
    program: "FSA Guaranteed Farm Loans",
    status: "BUILD_OPERATING_HISTORY",
    currentAuthority: "NONE",
    targetRole:
      "Future lending affiliate seeks the FSA lender category appropriate to its regulatory status and agricultural lending experience.",
    prerequisites: [
      "Eligible lending entity",
      "Agricultural lending capability",
      "FSA lender application/training appropriate to lender category",
      "Servicing and reporting capability",
    ],
    nextActions: [
      "Use existing FSA/Farm Credit lenders as network partners now.",
      "Build documented agricultural credit and servicing capability in the separate affiliate before applying.",
      "Evaluate Micro Lender versus Standard Eligible Lender pathway with the state FSA guaranteed-loan contact.",
    ],
    officialSources: [
      "https://www.fsa.usda.gov/resources/programs/guaranteed-farm-loans/lender-toolkit",
      "https://www.fsa.usda.gov/resources/loans/guaranteed-farm-loans",
    ],
  },
  {
    id: "usda-onerd-nonregulated",
    program: "USDA OneRD Guarantee Loan Initiative",
    status: "BUILD_OPERATING_HISTORY",
    currentAuthority: "NONE",
    targetRole: "Future affiliate applies as an approved non-regulated lending entity if eligible.",
    prerequisites: [
      "Legal authority to operate a lending program",
      "At least five commercial loans totaling at least $1 million in each of the prior three years",
      "Commercial portfolio performance within USDA delinquency/loss thresholds",
      "At least 10% balance-sheet equity/assets",
      "Acceptable line of credit and required loss reserves",
      "Audited financials, lending policies, servicing capacity, and experienced management",
      "License/charter evidence or attorney opinion that licensing is not required",
    ],
    nextActions: [
      "Start the three-year operating-history clock only inside the separately governed lending affiliate after state authority is cleared.",
      "Design financial reporting and portfolio metrics now so OneRD application evidence is generated from the first loan onward.",
    ],
    officialSources: ["https://www.ecfr.gov/current/title-7/section-5001.130"],
  },
  {
    id: "sba-7a-direct-lender",
    program: "SBA 7(a)",
    status: "LONG_TERM_APPLICATION_PATH",
    currentAuthority: "NONE",
    targetRole:
      "Evaluate a future SBA-approved 7(a) lender route only after the affiliate has sufficient capital, staff, servicing infrastructure, and regulatory eligibility.",
    prerequisites: [
      "SBA lender eligibility and participation approval",
      "Ability to evaluate, process, close, disburse, service, and liquidate SBA loans",
      "Capital appropriate to the lender type",
      "Current SOP 50 10 and SOP 50 56 compliance",
    ],
    nextActions: [
      "Use participating 7(a) lenders as network partners rather than waiting for direct lender authority.",
      "After operating history exists, compare SBLC/NFRL/acquisition or other eligible participation routes with regulatory counsel and SBA.",
      "Refresh the roadmap against SOP 50 10 8.1 on October 1, 2026.",
    ],
    officialSources: [
      "https://www.sba.gov/sba-lenders/",
      "https://www.sba.gov/document/sop-50-10-lender-development-company-loan-programs",
    ],
    ruleReviewDate: "2026-10-01",
  },
];

export function federalLenderRoadmapSummary() {
  return {
    version: FEDERAL_LENDER_APPROVAL_ROADMAP_VERSION,
    itemCount: FEDERAL_LENDER_ROADMAP.length,
    directFederalApprovalsHeld: 0,
    currentStrategy:
      "Partner now; build the separate affiliate's legal authority, capital, portfolio history, staffing, servicing, and evidence before direct federal lender applications.",
  };
}
