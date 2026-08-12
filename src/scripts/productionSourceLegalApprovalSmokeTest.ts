import { productionSourceLegalAuthorization, productionSourceLegalInventory } from "@/lib/governance/productionSourceLegalInventory";
import { SOURCE_STACK_REGISTRY } from "@/lib/platform/authorities/source";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function main(): void {
  assert(productionSourceLegalInventory.length === SOURCE_STACK_REGISTRY.length, "Every canonical source must have a legal inventory entry.");
  assert(productionSourceLegalInventory.length > 0, "Source legal inventory is empty.");
  assert(productionSourceLegalInventory.every((x) => x.termsReviewRequired && !x.approvalGranted), "Every source must require ungranted qualified terms approval.");
  assert(productionSourceLegalInventory.every((x) => x.permittedUses.length && x.prohibitedUses.length), "Every source needs permitted and prohibited uses.");
  assert(productionSourceLegalInventory.every((x) => x.retentionRule && x.cacheRule && x.republicationRule && x.publicDisplayRule), "Every source needs retention, cache, republication, and display controls.");
  assert(productionSourceLegalInventory.every((x) => !x.liveFetchAllowed && !x.productionRelianceAllowed && !x.officialUseAllowed), "No source may be activated by inventory generation.");
  assert(productionSourceLegalAuthorization.approvalRequired && !productionSourceLegalAuthorization.approvalGranted, "Human legal approval must remain pending.");
  console.log(JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), blockerId: "P5-B04", sources: productionSourceLegalInventory.length, sourceApprovalsGranted: 0, liveSourceUsePermitted: false, message: "Production source legal approval inventory passed fail-closed." }, null, 2));
}
main();
