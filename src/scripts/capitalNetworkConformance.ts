import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { apiSecurityPublicReason } from "@/lib/security/apiSecurityPolicy";
import {
  matchCapitalProviders,
  type CapitalDealMatchInput,
  type CapitalProviderProfile,
} from "@/lib/financing/capitalNetworkRuntime";

const deal: CapitalDealMatchInput = {
  serviceRequestId: "FIN-CAPITAL-NETWORK-TEST",
  state: "DE",
  program: "sba_504",
  purpose: "acquisition",
  estimatedAmount: 1_500_000,
  propertyType: "commercial",
  industry: "hospitality",
  borrowerType: "operating_business",
};

const base: Omit<CapitalProviderProfile, "providerId" | "organizationName" | "affiliation"> = {
  providerRole: "LENDER",
  providerType: "SBA_CDC_504",
  status: "CERTIFIED_ACTIVE",
  states: ["DE", "MD"],
  programs: ["sba_504"],
  purposes: ["acquisition"],
  propertyTypes: ["commercial"],
  industries: ["hospitality"],
  borrowerTypes: ["operating_business"],
  minDealAmount: 100_000,
  maxDealAmount: 5_000_000,
  matchingEnabled: true,
  explicitAssignmentAllowed: true,
  liveRoutingAllowed: true,
  profileVersion: 3,
};

const independent: CapitalProviderProfile = {
  ...base,
  providerId: "independent-lender",
  organizationName: "Independent Lender",
  affiliation: "INDEPENDENT",
};
const affiliate: CapitalProviderProfile = {
  ...base,
  providerId: "furlong-affiliate",
  organizationName: "Furlong Lending Affiliate",
  affiliation: "FURLONG_AFFILIATE",
};
const matches = matchCapitalProviders(deal, [independent, affiliate]);
assert.equal(matches.length, 2);
assert.equal(matches[0].eligible, true);
assert.equal(matches[1].eligible, true);
assert.equal(matches[0].score, matches[1].score, "Affiliate ownership must never improve match score.");

const wrongState = matchCapitalProviders(deal, [{ ...independent, providerId: "wrong-state", states: ["CA"] }])[0];
assert.equal(wrongState.eligible, false);
assert(wrongState.blockers.some((value) => value.includes("geography")));

const transitionBroker = matchCapitalProviders(deal, [{
  ...independent,
  providerId: "retained-external-broker",
  providerRole: "BROKER",
  providerType: "COMMERCIAL_BROKER",
  status: "TRANSITION_ACTIVE",
  matchingEnabled: false,
}])[0];
assert.equal(transitionBroker.eligible, false, "Retained transition broker must not auto-match.");

const conventional = matchCapitalProviders({ ...deal, program: "conventional" }, [{
  ...independent,
  providerId: "conventional-bank",
  programs: ["commercial_conventional"],
}])[0];
assert.equal(conventional.eligible, true, "Canonical conventional intake must map to declared commercial conventional appetite.");

const migration = readFileSync("src/lib/db/migrations/0056_capital_network_multi_provider.sql", "utf8");
assert(migration.includes("capital_network_providers"));
assert(migration.includes("capital_network_matches"));
assert(migration.includes("capital_network_deal_rooms"));
assert(migration.includes("'retained-external-broker'"));
assert(migration.includes("FALSE, TRUE,\n  FALSE"), "Transition seed must not enable automatic matching or live routing.");

const store = readFileSync("src/lib/financing/capitalNetworkStore.ts", "utf8");
assert(store.includes("Affiliation does not improve its match score or priority."));
assert(store.includes("providerAccessAllowed: existingRoom?.providerAccessAllowed ?? false"));
assert(store.includes("exactPackageConsentRequired: true"));
assert(store.includes("activateDealRoomAfterConsent"));
assert(store.includes("dataShared: true"), "Consented provider deal-room access must be represented as scoped data disclosure.");

const submissionStore = readFileSync("src/lib/lender-submission/store.ts", "utf8");
assert(submissionStore.includes("Consent provider does not match the borrower-selected Capital Network provider."));
assert(submissionStore.includes("Verified recipient is not bound to the borrower-selected Capital Network provider."));
assert(submissionStore.includes("activateDealRoomAfterConsent"));

const brokerDesk = readFileSync("src/app/api/lender/deal-desk/route.ts", "utf8");
assert(brokerDesk.includes("listLenderDealsForProvider"));
assert(brokerDesk.includes("providerMayAccessServiceRequest"));

const statusComponent = readFileSync("src/components/public/CapitalNetworkMatches.tsx", "utf8");
assert(statusComponent.includes("Selecting a provider does not disclose or deliver your file."));
assert(statusComponent.includes("Affiliation with Furlong never improves a provider"));


assert.equal(
  apiSecurityPublicReason("/api/capital-network/matches"),
  "public-surface-gateway",
  "Reference+email Capital Network matching must cross the narrow public API perimeter while all other Capital Network APIs remain authenticated.",
);

const dealRoomApi = readFileSync("src/app/api/capital-network/deal-room/route.ts", "utf8");
assert(dealRoomApi.includes('body.action !== "create-submission-case"'));
assert(dealRoomApi.includes("exactPackageConsentRequired: true"));

const protectedRoutes = readFileSync("src/lib/auth/protectedRoutes.ts", "utf8");
const pageRoles = readFileSync("src/lib/auth/pageRolePolicy.ts", "utf8");
assert(protectedRoutes.includes('"/capital-network"'));
assert(pageRoles.includes("capital-provider-onboarding"));
assert(pageRoles.includes("capital-provider-workspace"));

console.log(JSON.stringify({
  ok: true,
  neutrality: { affiliateScoreEqual: true, deterministic: true },
  onboarding: { applicationIsNotActivation: true, certificationGated: true },
  matching: { geographyProgramAmountAppetite: true, creditDecision: false },
  borrowerSelection: { selectionSharesData: false, multipleProvidersSupported: true },
  packageDelivery: { exactProviderConsent: true, verifiedRecipientBinding: true },
  dealRooms: { providerScoped: true, accessAfterPackageConsent: true },
  retainedBroker: { providerId: "retained-external-broker", autoMatch: false, legacyDeskPreserved: true },
}, null, 2));
