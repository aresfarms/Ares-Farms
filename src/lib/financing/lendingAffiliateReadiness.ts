/**
 * Lending Affiliate Readiness — Step 4.
 *
 * The affiliate is intentionally modeled as NOT FORMED / NOT LICENSED until
 * corporate formation and regulator/counsel evidence exist. Nothing in this
 * file grants authority to lend or permits Furlong Core to become a creditor.
 */

export const LENDING_AFFILIATE_READINESS_VERSION =
  "lending-affiliate-readiness-v1.0.0";

export type AffiliateGateStatus = "NOT_STARTED" | "IN_PROGRESS" | "VERIFIED";

export interface AffiliateReadinessGate {
  id: string;
  label: string;
  status: AffiliateGateStatus;
  productionRequired: boolean;
  evidenceRequired: string[];
}

export const LENDING_AFFILIATE_POSTURE = {
  entityStatus: "NOT_FORMED",
  lendingAuthority: "NONE",
  stateLicenses: "NONE_VERIFIED",
  federalProgramApprovals: "NONE",
  mayFundLoans: false,
  mayRepresentItselfAsLender: false,
  corePlatformIsCreditor: false,
} as const;

export const LENDING_AFFILIATE_GATES: AffiliateReadinessGate[] = [
  {
    id: "entity-formation",
    label: "Separate legal entity formation and ownership records",
    status: "NOT_STARTED",
    productionRequired: true,
    evidenceRequired: ["formation filing", "governing document", "EIN", "beneficial ownership/control record"],
  },
  {
    id: "capitalization",
    label: "Capitalization and source-of-funds evidence",
    status: "NOT_STARTED",
    productionRequired: true,
    evidenceRequired: ["opening balance sheet", "capital contribution evidence", "bank account", "capital policy"],
  },
  {
    id: "jurisdiction-authority",
    label: "State lending authority / exemption analysis",
    status: "NOT_STARTED",
    productionRequired: true,
    evidenceRequired: ["license or exemption", "counsel opinion where appropriate", "jurisdiction matrix"],
  },
  {
    id: "credit-policy",
    label: "Independent credit and underwriting policy",
    status: "NOT_STARTED",
    productionRequired: true,
    evidenceRequired: ["credit policy", "delegated authority matrix", "exception process", "adverse-action controls"],
  },
  {
    id: "servicing",
    label: "Servicing, collections, workout, and liquidation capability",
    status: "NOT_STARTED",
    productionRequired: true,
    evidenceRequired: ["servicing procedures", "payment controls", "delinquency/workout policy", "records-retention controls"],
  },
  {
    id: "compliance",
    label: "KYC/KYB, OFAC, fair-lending, privacy, complaint, and examination controls",
    status: "NOT_STARTED",
    productionRequired: true,
    evidenceRequired: ["compliance program", "training", "independent review plan", "complaint and escalation procedures"],
  },
  {
    id: "funding-liquidity",
    label: "Warehouse/line-of-credit and liquidity plan where required",
    status: "NOT_STARTED",
    productionRequired: true,
    evidenceRequired: ["funding source", "liquidity policy", "contingency funding plan"],
  },
  {
    id: "loss-reserve-accounting",
    label: "Loan-loss reserve, accounting, audit, and financial reporting",
    status: "NOT_STARTED",
    productionRequired: true,
    evidenceRequired: ["reserve methodology", "chart of accounts", "financial reporting package", "audit engagement"],
  },
  {
    id: "affiliate-conflict-boundary",
    label: "Furlong Core / lender-affiliate conflict and data boundary",
    status: "IN_PROGRESS",
    productionRequired: true,
    evidenceRequired: ["neutral-routing policy", "affiliate disclosure", "separate books and permissions", "conflict monitoring"],
  },
];

export function affiliateReadinessSummary() {
  const required = LENDING_AFFILIATE_GATES.filter((gate) => gate.productionRequired);
  const verified = required.filter((gate) => gate.status === "VERIFIED");
  return {
    version: LENDING_AFFILIATE_READINESS_VERSION,
    posture: LENDING_AFFILIATE_POSTURE,
    requiredGateCount: required.length,
    verifiedGateCount: verified.length,
    productionReady: required.length > 0 && verified.length === required.length,
    blockers: required
      .filter((gate) => gate.status !== "VERIFIED")
      .map((gate) => gate.label),
  };
}
