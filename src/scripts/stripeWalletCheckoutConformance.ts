import assert from "node:assert/strict";
import fs from "node:fs";

import {
  expectedStripeMethodForSyntheticScenario,
  syntheticStripeMethodMatches,
} from "@/lib/testing/syntheticFixtureLineage";

const checkoutRoute = fs.readFileSync(
  "src/app/api/stripe/checkout/route.ts",
  "utf8",
);
const webhookRoute = fs.readFileSync(
  "src/app/api/stripe/webhook/route.ts",
  "utf8",
);

assert.equal(
  checkoutRoute.includes("payment_method_types"),
  false,
  "Stripe Checkout must use Dashboard-managed dynamic payment methods so Apple Pay and Google Pay can surface without another code deployment.",
);
assert(checkoutRoute.includes("stripe.checkout.sessions.create"));
assert(checkoutRoute.includes('mode: "payment"'));
assert(webhookRoute.includes("SYNTHETIC_PAYMENT_METHOD_MISMATCH"));
assert.equal(expectedStripeMethodForSyntheticScenario("stripe-card"), "card");
assert.equal(
  expectedStripeMethodForSyntheticScenario("stripe-apple-pay"),
  "apple_pay",
);
assert.equal(
  expectedStripeMethodForSyntheticScenario("stripe-google-pay"),
  "google_pay",
);
assert.equal(syntheticStripeMethodMatches("stripe-card", null), true);
assert.equal(
  syntheticStripeMethodMatches("stripe-apple-pay", "apple_pay"),
  true,
);
assert.equal(
  syntheticStripeMethodMatches("stripe-google-pay", "google_pay"),
  true,
);
assert.equal(
  syntheticStripeMethodMatches("stripe-apple-pay", "google_pay"),
  false,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      checkoutMode: "stripe-hosted-dynamic-payment-methods",
      dashboardManaged: true,
      applePayScenarioVerified: true,
      googlePayScenarioVerified: true,
      mismatchFailsClosed: true,
    },
    null,
    2,
  ),
);
