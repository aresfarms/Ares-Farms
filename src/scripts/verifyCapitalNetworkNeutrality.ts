import assert from "node:assert/strict";

import { FINANCING_FREE_STATEMENT, FINANCING_FEE_LINES, FINANCING_TRUST } from "@/lib/financing/financingFeeSchedule";
import {
  CAPITAL_NETWORK_NON_NEGOTIABLES,
  matchCapitalProvider,
  matchCapitalProviders,
  type CapitalDealMatchInput,
  type CapitalProviderProfile,
} from "@/lib/financing/capitalNetworkRuntime";

const deal: CapitalDealMatchInput = {
  serviceRequestId: "FIN-NEUTRALITY-TEST",
  state: "DE",
  program: "usda_bi",
  purpose: "acquisition",
  estimatedAmount: 1_000_000,
  propertyType: "farm",
  industry: "agriculture",
  borrowerType: "business",
};

function provider(id: string, name: string, verified = true): CapitalProviderProfile {
  return {
    providerId: id,
    organizationName: name,
    providerRole: "LENDER",
    providerType: "BANK",
    status: "CERTIFIED_ACTIVE",
    affiliation: id === "affiliate" ? "FURLONG_AFFILIATE" : "INDEPENDENT",
    states: ["DE"],
    programs: ["usda_bi"],
    purposes: ["acquisition"],
    propertyTypes: ["farm"],
    industries: ["agriculture"],
    borrowerTypes: ["business"],
    minDealAmount: 100_000,
    maxDealAmount: 5_000_000,
    publishedCreditBox: { publishedSummary: "Synthetic source-backed box." },
    collateralPolicy: {},
    environmentalRequirements: {},
    typicalFirstResponseDays: null,
    typicalClosingDays: null,
    creditBoxSourceRefs: verified ? ["https://example.test/box"] : [],
    creditBoxVerifiedAt: verified ? new Date("2026-09-08T00:00:00Z") : null,
    matchingEnabled: true,
    explicitAssignmentAllowed: true,
    liveRoutingAllowed: true,
    profileVersion: 1,
  };
}

assert.equal(CAPITAL_NETWORK_NON_NEGOTIABLES.sellsBorrowerLeads, false);
assert.equal(CAPITAL_NETWORK_NON_NEGOTIABLES.auctionsBorrowerFiles, false);
assert.equal(CAPITAL_NETWORK_NON_NEGOTIABLES.compensationInfluencesRanking, false);
assert.equal(CAPITAL_NETWORK_NON_NEGOTIABLES.affiliationInfluencesRanking, false);
assert.equal(CAPITAL_NETWORK_NON_NEGOTIABLES.borrowerChoosesRecipients, true);
assert.match(FINANCING_FREE_STATEMENT.lead, /free to the customer/i);
assert.ok(FINANCING_FEE_LINES.every((line) => line.fee === "$0" && line.feeConfirmed));
assert.ok(FINANCING_TRUST.some((line) => /Lead sales, file auctions, automatic broadcasts, referral fees, success percentages, transaction cuts, and pay-to-rank placement are prohibited/i.test(line.text)));

const independent = provider("independent", "Alpha Institution");
const affiliate = provider("affiliate", "Zulu Affiliated Institution");
const a = matchCapitalProvider(deal, independent);
const b = matchCapitalProvider(deal, affiliate);
assert.equal(a.score, b.score, "affiliation must not influence score");
assert.equal(a.eligible, true);
assert.equal(b.eligible, true);
const order = matchCapitalProviders(deal, [affiliate, independent]);
assert.deepEqual(order.map((item) => item.providerId), ["independent", "affiliate"], "equal fit must use deterministic non-economic name ordering");

const unverified = matchCapitalProvider(deal, provider("pending", "Pending Box", false));
assert.equal(unverified.eligible, false, "published credit box must be source-verified before fit presentation");
assert.ok(unverified.blockers.some((item) => /not source-verified/i.test(item)));

console.log(JSON.stringify({
  ok: true,
  rule: "CAPITAL-NETWORK-NEUTRALITY-001",
  borrowerCoreFinancingFee: 0,
  leadSelling: false,
  paidRanking: false,
  affiliationRanking: false,
  verifiedPublishedBoxRequiredForFit: true,
  exactRecipientControl: true,
}, null, 2));
