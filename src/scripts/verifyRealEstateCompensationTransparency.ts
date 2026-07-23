import assert from "node:assert/strict";
import {
  buildRealEstateCompensationTransparency,
  emptyRealEstateCompensationInput,
} from "../lib/property/realEstateCompensationTransparency";

const empty = buildRealEstateCompensationTransparency(emptyRealEstateCompensationInput());
assert.equal(empty.posture, "UNKNOWN");
assert.ok(empty.knownFacts.some((line) => /negotiable/.test(line)));
assert.ok(empty.legalBoundary.some((line) => /does not use MLS data feeds/.test(line)));

const openEnded = buildRealEstateCompensationTransparency({
  ...emptyRealEstateCompensationInput(),
  consumerRole: "BUYER",
  buyerAgreementStatus: "SIGNED",
  buyerBrokerCompensation: { type: "OTHER", value: null, description: "whatever the seller offers" },
  sourceType: "BUYER_AGREEMENT",
  sourceReference: "agreement-1",
  disclosureAuthorized: true,
});
assert.equal(openEnded.posture, "REVIEW_NEEDED");
assert.ok(openEnded.reviewFlags.some((line) => /open-ended/.test(line)));

assert.throws(() => buildRealEstateCompensationTransparency({
  ...emptyRealEstateCompensationInput(),
  sourceType: "AUTHORIZED_OFF_MLS_DISCLOSURE",
  disclosureAuthorized: false,
}), /requires documented authorization/);

console.log("verify:real-estate-compensation PASS - transparency and MLS compensation boundary fail closed.");
