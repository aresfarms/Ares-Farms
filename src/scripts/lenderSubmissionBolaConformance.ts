import assert from "node:assert/strict";
import {
  assertBorrowerCustomerBinding,
  submissionCaseAccessAllowed,
  type SubmissionCaseAccessConsent,
} from "@/lib/lender-submission/caseAccess";

const now = new Date("2026-09-06T20:00:00.000Z");
const record = {
  customerId: "borrower-a@example.test",
  metadata: { createdBy: "borrower-a@example.test" },
};
const activeConsent: SubmissionCaseAccessConsent = {
  lenderId: "provider-1",
  packageVersionId: "11111111-1111-4111-8111-111111111111",
  revokedAt: null,
  expiresAt: new Date("2026-09-07T20:00:00.000Z"),
};

assert.equal(submissionCaseAccessAllowed({ record, actorId: "borrower-a@example.test", role: "borrower", now }), true, "owner must read own Furlong Case");
assert.equal(submissionCaseAccessAllowed({ record, actorId: "borrower-b@example.test", role: "borrower", now }), false, "second borrower must not read another customer's case");
assert.throws(() => assertBorrowerCustomerBinding({ actorId: "borrower-b@example.test", role: "borrower", requestedCustomerId: "borrower-a@example.test" }), /authenticated borrower/, "borrower must not create a case bound to another customer");
assert.equal(submissionCaseAccessAllowed({ record, actorId: "provider.user@example.test", role: "lender", allowConsentedProvider: true, providerIds: ["provider-1"], consents: [], now }), false, "provider must not access before customer consent");
assert.equal(submissionCaseAccessAllowed({ record, actorId: "provider.user@example.test", role: "lender", allowConsentedProvider: true, providerIds: ["provider-2"], consents: [activeConsent], now }), false, "unnamed provider must not inherit another provider's consent");
assert.equal(submissionCaseAccessAllowed({ record, actorId: "provider.user@example.test", role: "lender", allowConsentedProvider: true, providerIds: ["provider-1"], consents: [activeConsent], packageVersionId: activeConsent.packageVersionId, now }), true, "named provider may read the exact consent-bound package");
assert.equal(submissionCaseAccessAllowed({ record, actorId: "provider.user@example.test", role: "lender", allowConsentedProvider: true, providerIds: ["provider-1"], consents: [activeConsent], packageVersionId: "22222222-2222-4222-8222-222222222222", now }), false, "provider consent must not authorize a different package version");
assert.equal(submissionCaseAccessAllowed({ record, actorId: "provider.user@example.test", role: "lender", allowConsentedProvider: true, providerIds: ["provider-1"], consents: [{ ...activeConsent, revokedAt: new Date("2026-09-06T19:00:00.000Z") }], now }), false, "revocation must fail closed immediately");
assert.equal(submissionCaseAccessAllowed({ record, actorId: "provider.user@example.test", role: "lender", allowConsentedProvider: true, providerIds: ["provider-1"], consents: [{ ...activeConsent, expiresAt: new Date("2026-09-06T19:00:00.000Z") }], now }), false, "expired consent must fail closed");
assert.equal(submissionCaseAccessAllowed({ record, actorId: "operator@example.test", role: "operator", now }), true, "governed operator retains operational access");

console.log(JSON.stringify({
  ok: true,
  rule: "FURLONG-CASE-BOLA-001",
  guarantees: [
    "borrower object ownership",
    "cross-borrower denial",
    "borrower customer binding",
    "provider denied before consent",
    "provider identity bound to named lender",
    "provider package-version binding",
    "revocation and expiry fail closed",
    "privileged operational access remains explicit",
  ],
}, null, 2));
