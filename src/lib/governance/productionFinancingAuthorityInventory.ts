import { HUMAN_AUTHORITY_ROLE_REGISTRY } from "@/lib/human-authority/humanAuthorityRegistryRuntime";

export const PRODUCTION_FINANCING_AUTHORITY_VERSION = "p5-b03-financing-authority-v1";

export const productionFinancingAuthority = {
  blockerId: "P5-B03",
  ownerRole: "CREDIT_ELIGIBILITY_AUTHORITY",
  ownerPresent: HUMAN_AUTHORITY_ROLE_REGISTRY.some((r) => r.roleId === "CREDIT_ELIGIBILITY_AUTHORITY"),
  qualifiedHumanApprovalRequired: true,
  qualifiedHumanApprovalGranted: false,
  lenderParticipationApproved: false,
  productionFinancingPermitted: false,
  autonomousUnderwritingPermitted: false,
  autonomousCreditDecisionPermitted: false,
  lenderCommitmentPermitted: false,
  borrowerNoticeSendPermitted: false,
  paymentAuthorizationPermitted: false,
} as const;

export const financingActivationControls = [
  "named participating lender or agency",
  "executed participation agreement",
  "license or agency authority reference",
  "jurisdiction and product scope",
  "authorized human decision role",
  "underwriting policy ownership",
  "fair-lending and ECOA review",
  "adverse-action ownership",
  "notice template and delivery ownership",
  "appeal and reconsideration procedure",
  "data-use and retention terms",
  "security and incident obligations",
  "audit and replay access",
  "effective date and expiration",
  "revocation and suspension procedure",
] as const;

export const financingBoundaryMatrix = [
  { action: "collect intake and documents", furlong: "COORDINATION_ONLY", lender: "AUTHORIZED_AFTER_AGREEMENT" },
  { action: "suggest financing pathways", furlong: "ADVISORY_ONLY", lender: "REVIEW_REQUIRED" },
  { action: "determine eligibility", furlong: "PROHIBITED", lender: "QUALIFIED_HUMAN_ONLY" },
  { action: "underwrite credit", furlong: "PROHIBITED", lender: "QUALIFIED_HUMAN_ONLY" },
  { action: "approve or deny", furlong: "PROHIBITED", lender: "QUALIFIED_HUMAN_ONLY" },
  { action: "issue commitment", furlong: "PROHIBITED", lender: "AUTHORIZED_LENDER_ONLY" },
  { action: "issue adverse-action notice", furlong: "PROHIBITED", lender: "AUTHORIZED_LENDER_ONLY" },
  { action: "send borrower notice", furlong: "BLOCKED_PENDING_CONTROLLED_DELIVERY", lender: "AUTHORIZED_LENDER_ONLY" },
] as const;
