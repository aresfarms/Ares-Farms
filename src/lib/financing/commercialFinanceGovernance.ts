/**
 * Commercial Finance Governance — owner-controlled capital coordination.
 *
 * This runtime separates Furlong's unregulated coordination/readiness work
 * from activities that may require a state license, written engagement,
 * program-specific disclosure, or lender authority. It never grants a license.
 *
 * Master Volume traceability:
 * - Vol I: CONST-PATHWAY-001, CONST-FAIR-001, CONST-ARCH-001.
 * - Vol II: REG-STATE-001, REG-LICENSE-001, REG-ECOA-001.
 * - Vol III: TECH-RULES-001, TECH-API-001, TECH-LEDGER-001.
 * - Vol IV: OPS-LENDER-001, OPS-LICENSE-001, OPS-REGCHANGE-001.
 * - Vol V: CANON-CONSENT-001, CANON-TREASURY-001, CANON-OBS-001.
 */

export const COMMERCIAL_FINANCE_GOVERNANCE_VERSION =
  "commercial-finance-governance-v1.0.0";

export type CommercialFinanceActivity =
  | "program_navigation"
  | "document_readiness"
  | "lender_network_coordination"
  | "compensated_packaging"
  | "compensated_brokerage_or_referral"
  | "lending_own_funds"
  | "residential_mortgage_brokerage";

export type CommercialFinanceProgram =
  | "sba_7a"
  | "sba_504"
  | "usda_bi"
  | "fsa"
  | "conventional"
  | "unsure";

export type AuthorityPosture =
  | "ACTIVE_COORDINATION_ONLY"
  | "PARTNER_CERTIFICATION_REQUIRED"
  | "LEGAL_REVIEW_REQUIRED"
  | "LENDER_AUTHORITY_REQUIRED"
  | "RESIDENTIAL_LICENSE_REQUIRED";

export interface CommercialFinanceAuthorityInput {
  state?: string | null;
  activity: CommercialFinanceActivity;
  program?: CommercialFinanceProgram | null;
  partnerCertified?: boolean;
  writtenEngagementAccepted?: boolean;
  stateLegalClearance?: boolean;
  lenderAuthorityVerified?: boolean;
}

export interface CommercialFinanceAuthorityDecision {
  version: string;
  allowed: boolean;
  posture: AuthorityPosture;
  state: string | null;
  activity: CommercialFinanceActivity;
  form159Required: boolean;
  conditions: string[];
  blockedReasons: string[];
  disclosures: string[];
}

const COORDINATION_ONLY = new Set<CommercialFinanceActivity>([
  "program_navigation",
  "document_readiness",
]);

function normalizeState(state?: string | null): string | null {
  const value = state?.trim().toUpperCase();
  return value || null;
}

export function requiresSbaForm159(
  activity: CommercialFinanceActivity,
  program?: CommercialFinanceProgram | null,
): boolean {
  if (program !== "sba_7a" && program !== "sba_504") return false;
  return (
    activity === "compensated_packaging" ||
    activity === "compensated_brokerage_or_referral"
  );
}

export function assessCommercialFinanceAuthority(
  input: CommercialFinanceAuthorityInput,
): CommercialFinanceAuthorityDecision {
  const state = normalizeState(input.state);
  const form159Required = requiresSbaForm159(input.activity, input.program);
  const conditions: string[] = [];
  const blockedReasons: string[] = [];

  if (COORDINATION_ONLY.has(input.activity)) {
    return {
      version: COMMERCIAL_FINANCE_GOVERNANCE_VERSION,
      allowed: true,
      posture: "ACTIVE_COORDINATION_ONLY",
      state,
      activity: input.activity,
      form159Required,
      conditions: [
        "No credit decision, commitment, rate quote, lender representation, or eligibility determination.",
        "No transaction-tied compensation is authorized by this posture.",
      ],
      blockedReasons: [],
      disclosures: [
        "Furlong coordinates information and document readiness; the funding institution controls underwriting and credit decisions.",
      ],
    };
  }

  if (input.activity === "lender_network_coordination") {
    if (!input.partnerCertified) {
      blockedReasons.push(
        "A lender or finance provider must complete Furlong partner certification before case information can be routed.",
      );
    }
    return {
      version: COMMERCIAL_FINANCE_GOVERNANCE_VERSION,
      allowed: blockedReasons.length === 0,
      posture: "PARTNER_CERTIFICATION_REQUIRED",
      state,
      activity: input.activity,
      form159Required,
      conditions: [
        "Borrower consent must bind the exact provider, purpose, package, and delivery channel.",
        "Lender neutrality applies; no paid placement or undisclosed affiliated preference.",
      ],
      blockedReasons,
      disclosures: [
        "A network listing or candidate record is not a lender endorsement, approval, or commitment.",
      ],
    };
  }

  if (input.activity === "residential_mortgage_brokerage") {
    if (!input.stateLegalClearance) {
      blockedReasons.push(
        "Residential mortgage brokerage is outside the current Furlong commercial-finance authority and requires applicable mortgage licensing clearance.",
      );
    }
    return {
      version: COMMERCIAL_FINANCE_GOVERNANCE_VERSION,
      allowed: false,
      posture: "RESIDENTIAL_LICENSE_REQUIRED",
      state,
      activity: input.activity,
      form159Required: false,
      conditions: [],
      blockedReasons,
      disclosures: [
        "Furlong does not currently offer residential mortgage brokerage or residential loan origination through this commercial-finance workflow.",
      ],
    };
  }

  if (input.activity === "lending_own_funds") {
    if (!input.lenderAuthorityVerified) {
      blockedReasons.push(
        "The proposed lending entity has no verified lending authority in this jurisdiction/program.",
      );
    }
    if (!input.stateLegalClearance) {
      blockedReasons.push(
        "State lending-license or exemption analysis has not been cleared for the proposed lending entity.",
      );
    }
    return {
      version: COMMERCIAL_FINANCE_GOVERNANCE_VERSION,
      allowed:
        Boolean(input.lenderAuthorityVerified) && Boolean(input.stateLegalClearance),
      posture: "LENDER_AUTHORITY_REQUIRED",
      state,
      activity: input.activity,
      form159Required: false,
      conditions: [
        "Lending must occur through the separately capitalized lending affiliate, never Furlong Core.",
      ],
      blockedReasons,
      disclosures: [
        "Furlong Core is not the creditor and does not extend credit from its own balance sheet.",
      ],
    };
  }

  if (!input.stateLegalClearance) {
    blockedReasons.push(
      `State-specific legal/licensing clearance is required before ${input.activity.replaceAll("_", " ")} may be activated${state ? ` in ${state}` : ""}.`,
    );
  }
  if (!input.writtenEngagementAccepted) {
    blockedReasons.push(
      "A written scope and compensation disclosure must be accepted before compensated work begins.",
    );
  }
  if (form159Required) {
    conditions.push(
      "SBA Form 159 disclosure/compensation handling is required when the compensated Agent activity falls within the applicable 7(a)/504 rule.",
    );
  }

  return {
    version: COMMERCIAL_FINANCE_GOVERNANCE_VERSION,
    allowed: blockedReasons.length === 0,
    posture: "LEGAL_REVIEW_REQUIRED",
    state,
    activity: input.activity,
    form159Required,
    conditions: [
      "Compensation may not influence lender ranking, routing, or borrower choice.",
      ...conditions,
    ],
    blockedReasons,
    disclosures: [
      "Paid packaging, brokerage, referral, or consulting activity is not activated merely because intake and readiness tools are available.",
    ],
  };
}

export const COMMERCIAL_FINANCE_JURISDICTION_NOTES = {
  DE: {
    status: "LEGAL_REVIEW_REQUIRED",
    note:
      "Delaware consumer mortgage and licensed-lender regimes do not by themselves establish authority for Furlong's proposed paid commercial-finance activities. Obtain written Delaware licensing analysis before activation.",
  },
  MD: {
    status: "LEGAL_REVIEW_REQUIRED",
    note:
      "Maryland business-purpose lender exemptions do not automatically answer the separate paid-broker/referral question. Obtain Maryland licensing analysis before compensated brokerage activation.",
  },
} as const;
