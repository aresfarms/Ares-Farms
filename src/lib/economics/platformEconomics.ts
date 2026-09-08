/**
 * Current Furlong commercial activation policy.
 *
 * This is deliberately narrower than the full Master Volume revenue authority:
 * the borrower property/readiness/provider-fit/case-room journey is $0 to the
 * borrower. Institutional software, certification, integrations, and separately
 * scoped professional services may be billed, but money may never change a
 * pathway recommendation, provider match, rank, placement, or explanation.
 */
export const FURLONG_PLATFORM_ECONOMICS = Object.freeze({
  policyId: "ECON-CONFLICT-001",
  version: "furlong-economics-2026-09-08-v1",
  borrowerCoreJourneyPriceUsd: 0,
  borrowerCoreJourneyIncludes: [
    "property intelligence",
    "financing-readiness guidance",
    "neutral provider-fit comparison",
    "customer-controlled case-room preparation",
  ],
  institutionalRevenueClasses: [
    "institutional software subscription",
    "certification and participation",
    "governed workflow infrastructure",
    "API and integration access",
    "separately scoped professional services",
  ],
  prohibitedRankingSignals: [
    "license fee amount",
    "subscription tier",
    "referral fee",
    "commission",
    "success fee",
    "transaction economics",
    "affiliate relationship",
  ],
  providerCompensationAffectsRanking: false,
  leadSellingEnabled: false,
  silentSubmissionEnabled: false,
} as const);

export function economicInfluenceAllowedForProviderMatch(): false {
  return false;
}
