import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateFinancialControlChain } from "@/lib/treasury/borrowerFinancialControlStore";

const base = {
  scopeAcceptedInAdvance: true,
  feeControlPresent: true,
  feeDisclosedInAdvance: true,
  actualWorkEvidencePresent: true,
  actualWorkEvidenceVerified: true,
  moduleAttributionPresent: true,
  paymentRecordPresent: true,
  paymentReferencesActualWorkEvidence: true,
  refundRecordsCoherent: true,
  revenueAttributionRecordPresent: true,
  reconciliationPresent: true,
  reconciliationComplete: true,
  reconciliationVarianceResolved: true,
  fiveSourceReconciliationPresent: true,
  separationOfDutiesSatisfied: true,
  distributionAllowedByReconciliation: false,
  productionPaymentConnectorAuthorized: false,
} as const;

const safe = evaluateFinancialControlChain(base);
assert.equal(safe.engagementReady, true);
assert.equal(safe.paymentAuthorizationReady, true);
assert.equal(safe.revenueRecognitionReady, true);
assert.equal(safe.liveCaptureAllowed, false, "Control completeness must never self-activate production capture.");
assert.equal(safe.distributionAllowed, false, "Reconciliation must explicitly release distribution.");

for (const [field, blocker] of [
  ["scopeAcceptedInAdvance", "ADVANCE_SCOPE_ACCEPTANCE_MISSING"],
  ["feeControlPresent", "BORROWER_PROTECTION_FEE_CONTROL_MISSING"],
  ["feeDisclosedInAdvance", "ADVANCE_FEE_DISCLOSURE_MISSING"],
  ["moduleAttributionPresent", "MODULE_REVENUE_ATTRIBUTION_MISSING"],
] as const) {
  const decision = evaluateFinancialControlChain({ ...base, [field]: false });
  assert.equal(decision.engagementReady, false);
  assert(decision.blockers.includes(blocker));
}

for (const [field, blocker] of [
  ["actualWorkEvidencePresent", "ACTUAL_WORK_EVIDENCE_MISSING"],
  ["actualWorkEvidenceVerified", "ACTUAL_WORK_EVIDENCE_UNVERIFIED"],
  ["paymentReferencesActualWorkEvidence", "PAYMENT_WORK_EVIDENCE_LINK_MISSING"],
] as const) {
  const decision = evaluateFinancialControlChain({ ...base, [field]: false });
  assert.equal(decision.paymentAuthorizationReady, false);
  assert.equal(decision.liveCaptureAllowed, false);
  assert(decision.blockers.includes(blocker));
}

for (const [field, blocker] of [
  ["paymentRecordPresent", "PAYMENT_RECORD_MISSING"],
  ["refundRecordsCoherent", "REFUND_LINEAGE_INCOHERENT"],
  ["revenueAttributionRecordPresent", "MODULE_REVENUE_ATTRIBUTION_RECORD_MISSING"],
  ["reconciliationPresent", "TREASURY_RECONCILIATION_MISSING"],
  ["reconciliationComplete", "TREASURY_RECONCILIATION_INCOMPLETE"],
  ["reconciliationVarianceResolved", "TREASURY_VARIANCE_UNRESOLVED"],
  ["fiveSourceReconciliationPresent", "FIVE_SOURCE_RECONCILIATION_EVIDENCE_MISSING"],
  ["separationOfDutiesSatisfied", "TREASURY_SEPARATION_OF_DUTIES_FAILED"],
] as const) {
  const decision = evaluateFinancialControlChain({ ...base, [field]: false });
  assert.equal(decision.revenueRecognitionReady, false);
  assert(decision.blockers.includes(blocker));
}

const productionReady = evaluateFinancialControlChain({ ...base, productionPaymentConnectorAuthorized: true });
assert.equal(productionReady.liveCaptureAllowed, true);
const distributable = evaluateFinancialControlChain({
  ...base, productionPaymentConnectorAuthorized: true, distributionAllowedByReconciliation: true,
});
assert.equal(distributable.distributionAllowed, true);

const schema = fs.readFileSync("src/db/schema/borrowerFinancialControls.ts", "utf8");
const feeSchema = fs.readFileSync("src/db/schema/environmentalComplianceRecords.ts", "utf8");
const treasury = fs.readFileSync("src/db/schema/treasury.ts", "utf8");
for (const required of [
  "engagement_scope_acceptances", "service_delivery_evidence_records", "governed_payment_records",
  "module_revenue_attribution_records", "governed_refund_records", "treasury_reconciliation_records",
]) assert(schema.includes(required), `Missing durable table ${required}`);
for (const required of ["actual_work_evidence_id", "accounting_system_total", "attestation_actor", "distribution_allowed"])
  assert(schema.includes(required), `Missing financial lineage field ${required}`);
assert(feeSchema.includes("borrower_protection_fee_controls"));
assert(feeSchema.includes("scope_accepted_before_work"));
assert(treasury.includes("moduleAttribution"), "Treasury revenue must carry module attribution.");
const checkoutRoute = fs.readFileSync("src/app/api/stripe/checkout/route.ts", "utf8");
const executionRoute = fs.readFileSync("src/app/api/billing/execution/route.ts", "utf8");
const webhookRoute = fs.readFileSync("src/app/api/stripe/webhook/route.ts", "utf8");
assert(checkoutRoute.includes("evaluateRecordedPaymentAuthorization"), "Paid Stripe checkout must enforce recorded financial controls.");
assert(executionRoute.includes("evaluateRecordedPaymentAuthorization"), "Payment execution authorization must enforce recorded financial controls.");
assert(executionRoute.includes("sessionAuthority(req)"), "Payment execution authority must be server-derived, not caller-claimed.");
assert(webhookRoute.includes("recordGovernedPayment"), "Verified Stripe payment events must create governed payment records.");
assert(webhookRoute.includes("recordObservedProviderRefund"), "Stripe refund events must create governed refund records.");
assert(webhookRoute.includes("recordModuleRevenueAttribution"), "Payment completion must persist explicit module revenue attribution.");

console.log(JSON.stringify({ ok: true, advanceScopeAcceptance: true, borrowerProtectionFeeControl: true,
  actualWorkEvidenceBeforePaymentAuthorization: true, moduleRevenueAttribution: true,
  paymentRefundLineage: true, fiveSourceTreasuryReconciliation: true,
  reconciliationAttestationSeparation: true, livePaymentCaptureStillSeparatelyGated: true }, null, 2));
