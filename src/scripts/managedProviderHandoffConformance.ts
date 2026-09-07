import {
  CLOSING_MILESTONES,
  MANAGED_HANDOFF_NON_NEGOTIABLES,
  MAX_COMPARISON_PROVIDERS,
  caseRoomExpiry,
  completedClosingPath,
  validateProviderResponse,
  validateProviderSelection,
} from "@/lib/financing/managedProviderHandoff";

const failures: string[] = [];
const assert = (value: boolean, message: string) => {
  if (!value) failures.push(message);
};

assert(MAX_COMPARISON_PROVIDERS > 1, "Customer must be able to compare more than one provider.");
assert(MAX_COMPARISON_PROVIDERS <= 5, "Comparison round must remain bounded and private.");
assert(!MANAGED_HANDOFF_NON_NEGOTIABLES.sellsBorrowerLeads, "Lead sales must remain prohibited.");
assert(!MANAGED_HANDOFF_NON_NEGOTIABLES.auctionsBorrowerFiles, "File auctions must remain prohibited.");
assert(!MANAGED_HANDOFF_NON_NEGOTIABLES.providerPaysForRank, "Provider payments must never influence rank.");
assert(MANAGED_HANDOFF_NON_NEGOTIABLES.separateConsentPerProvider, "Every provider requires separate consent.");

assert(validateProviderSelection({
  selectedProviderIds: ["a", "b"],
  eligibleProviderIds: ["a", "b"],
}).length === 0, "Two eligible providers should be permitted.");
assert(validateProviderSelection({
  selectedProviderIds: ["a", "b", "c", "d", "e"],
  eligibleProviderIds: ["a", "b", "c", "d", "e"],
}).length > 0, "Unbounded provider broadcast must fail.");
assert(validateProviderResponse({
  status: "MISSING_INFORMATION",
  missingItems: [],
}).length > 0, "Missing-information response must list missing items.");
assert(validateProviderResponse({
  status: "CONDITIONAL_PATH",
  conditions: ["Updated appraisal"],
}).length === 0, "A documented conditional path should pass.");

const start = new Date("2026-09-05T00:00:00.000Z");
assert(caseRoomExpiry(start).toISOString() === "2026-10-05T00:00:00.000Z", "Default case room must expire after 30 days.");
assert(completedClosingPath([...CLOSING_MILESTONES]), "Complete path must end with keys and logbook.");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  multiProviderComparison: true,
  separateRecipientConsent: true,
  structuredProviderResponses: true,
  closingThroughLogbook: true,
  lendingTreePatternBlocked: true,
}, null, 2));
