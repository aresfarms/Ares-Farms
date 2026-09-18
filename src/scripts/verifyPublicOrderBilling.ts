import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PUBLIC_PRODUCT_CATALOG_VERSION,
  PUBLIC_PRODUCTS,
  productSupportsTarget,
  publicCheckoutDecision,
  publicProduct,
} from "@/lib/billing/publicProductCatalog";
import {
  evaluatePublicOrderAgreement,
  PUBLIC_ORDER_AGREEMENT_ACCEPTANCE,
  PUBLIC_ORDER_AGREEMENT_TERMS,
  PUBLIC_ORDER_AGREEMENT_TEXT,
  PUBLIC_ORDER_AGREEMENT_VERSION,
  publicOrderPaymentButtonLabel,
} from "@/lib/billing/publicOrderAgreement";
import {
  evaluatePublicOrderPaymentEvent,
  PUBLIC_ORDER_REQUIRED_STRIPE_EVENTS,
  type PublicOrderStripeEventInput,
} from "@/lib/billing/publicOrderPaymentPolicy";
import {
  calculatePublicProductPrice,
  evaluateCatalogPriceAlignment,
  type PublicProductPriceCostInput,
} from "@/lib/billing/publicProductPricing";
import { evaluatePublicOrderFullRefund } from "@/lib/billing/publicOrderRefundPolicy";

const order = {
  id: "5a6c7584-4627-44a3-9515-da18d862e29c",
  productCode: "custom_property_analysis" as const,
  productCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
  status: "CHECKOUT_CREATED",
  amountTotalCents: 24_900,
  currency: "usd",
  checkoutSessionId: "cs_test_furlong_public",
  paymentIntentId: "pi_test_furlong_public",
};

function event(
  changes: Partial<PublicOrderStripeEventInput> = {},
): PublicOrderStripeEventInput {
  return {
    signatureVerified: true,
    providerEventId: "evt_test_public_order",
    eventType: "checkout.session.completed",
    orderId: order.id,
    productCode: order.productCode,
    productCatalogVersion: order.productCatalogVersion,
    checkoutSessionId: order.checkoutSessionId,
    paymentIntentId: order.paymentIntentId,
    amountCents: order.amountTotalCents,
    amountRefundedCents: null,
    currency: order.currency,
    paymentStatus: "paid",
    ...changes,
  };
}

function verifyCatalog() {
  assert.equal(PUBLIC_PRODUCTS.property_snapshot.unitAmountCents, 0);
  assert.equal(
    publicCheckoutDecision(PUBLIC_PRODUCTS.property_snapshot, {}).allowed,
    false,
  );

  const propertyReport = PUBLIC_PRODUCTS.focused_property_report;
  assert.equal(propertyReport.publicName, "Furlong Property Report");
  assert.equal(propertyReport.unitAmountCents, 4_900);
  assert.equal(publicCheckoutDecision(propertyReport, {}).allowed, false);
  assert.equal(
    publicCheckoutDecision(propertyReport, {
      FURLONG_PUBLIC_PROPERTY_REPORT_SALES_ENABLED: "true",
      FURLONG_PROPERTY_REPORT_MAX_OPEN_ORDERS: "20",
    }).allowed,
    false,
  );
  const releasedPropertyReport = publicCheckoutDecision(propertyReport, {
    FURLONG_PUBLIC_PROPERTY_REPORT_SALES_ENABLED: "true",
    FURLONG_PROPERTY_REPORT_ARTIFACT_DELIVERY_ENABLED: "true",
    FURLONG_PROPERTY_REPORT_MAX_OPEN_ORDERS: "20",
  });
  assert.equal(releasedPropertyReport.allowed, true);
  assert.equal(releasedPropertyReport.deliveryBusinessDays, null);
  assert.equal(releasedPropertyReport.maxOpenOrders, 20);

  assert.equal(PUBLIC_PRODUCTS.complete_property_analysis.publicName, null);
  assert.equal(
    publicCheckoutDecision(PUBLIC_PRODUCTS.complete_property_analysis, {})
      .allowed,
    false,
  );

  const decisionReport = PUBLIC_PRODUCTS.custom_property_analysis;
  assert.equal(decisionReport.publicName, "Furlong Property Decision Report");
  assert.equal(decisionReport.unitAmountCents, 24_900);
  assert.equal(publicCheckoutDecision(decisionReport, {}).allowed, false);
  assert.equal(
    publicCheckoutDecision(decisionReport, {
      FURLONG_PUBLIC_DECISION_REPORT_SALES_ENABLED: "true",
      FURLONG_DECISION_REPORT_DELIVERY_BUSINESS_DAYS: "7",
    }).allowed,
    false,
  );
  const releasedDecisionReport = publicCheckoutDecision(decisionReport, {
    FURLONG_PUBLIC_DECISION_REPORT_SALES_ENABLED: "true",
    FURLONG_DECISION_REPORT_DELIVERY_BUSINESS_DAYS: "7",
    FURLONG_DECISION_REPORT_MAX_OPEN_ORDERS: "3",
  });
  assert.equal(releasedDecisionReport.allowed, true);
  assert.equal(releasedDecisionReport.deliveryBusinessDays, 7);
  assert.equal(releasedDecisionReport.maxOpenOrders, 3);
  assert.equal(decisionReport.upgradeCredit?.amountCents, 4_900);
  assert.equal(decisionReport.upgradeCredit?.validDays, 30);
  assert(
    decisionReport.excluded.some((item) =>
      item.includes("Phase I, II, or III"),
    ),
  );
  assert.equal(productSupportsTarget(decisionReport, "PROPERTY"), true);
  assert.equal(
    productSupportsTarget(decisionReport, "PROPERTY_COMPARISON"),
    false,
  );
  assert.equal(PUBLIC_PRODUCTS.portfolio_comparison.unitAmountCents, null);
  assert.equal(publicProduct("invented_product"), null);
}

function verifyAgreement() {
  assert.equal(evaluatePublicOrderAgreement(null).accepted, false);
  assert.deepEqual(
    evaluatePublicOrderAgreement({
      accepted: true,
      version: "stale-terms",
    }),
    {
      accepted: false,
      reason: "AGREEMENT_VERSION_MISMATCH",
    },
  );
  assert.deepEqual(
    evaluatePublicOrderAgreement({
      accepted: true,
      version: PUBLIC_ORDER_AGREEMENT_VERSION,
    }),
    {
      accepted: true,
      version: PUBLIC_ORDER_AGREEMENT_VERSION,
    },
  );
  assert(PUBLIC_ORDER_AGREEMENT_TERMS.length <= 4);
  assert(PUBLIC_ORDER_AGREEMENT_TEXT.includes("full refund"));
  assert(PUBLIC_ORDER_AGREEMENT_TEXT.includes("materially missing"));
  assert(PUBLIC_ORDER_AGREEMENT_TEXT.includes("unprofitable"));
  assert(PUBLIC_ORDER_AGREEMENT_TEXT.includes("cannot be waived"));
  assert(!/zero returns|no refunds/i.test(PUBLIC_ORDER_AGREEMENT_TEXT));
  assert(PUBLIC_ORDER_AGREEMENT_ACCEPTANCE.includes("authorize"));
  assert.match(
    createHash("sha256")
      .update(PUBLIC_ORDER_AGREEMENT_TEXT, "utf8")
      .digest("hex"),
    /^[a-f0-9]{64}$/,
  );
  assert.equal(
    publicOrderPaymentButtonLabel(24_900, "usd"),
    "PAY $249.00 AND START MY ANALYSIS",
  );
}

function verifyRefundPolicy() {
  const paid = {
    status: "FULFILLMENT_PENDING",
    amountTotalCents: 24_900,
    amountPaidCents: 24_900,
    amountRefundedCents: 0,
    paymentIntentId: "pi_test_furlong_public",
    fulfillmentStartedAt: null,
    providerRefundId: null,
  };
  assert.equal(
    evaluatePublicOrderFullRefund(paid).outcome,
    "RESERVE_FULL_REFUND",
  );
  assert.equal(
    evaluatePublicOrderFullRefund({
      ...paid,
      fulfillmentStartedAt: new Date(),
    }).allowed,
    false,
  );
  assert.equal(
    evaluatePublicOrderFullRefund({
      ...paid,
      amountPaidCents: 0,
    }).allowed,
    false,
  );
  assert.equal(
    evaluatePublicOrderFullRefund({
      ...paid,
      status: "REFUND_PENDING",
    }).outcome,
    "RETRY_PROVIDER_SUBMISSION",
  );
  assert.equal(
    evaluatePublicOrderFullRefund({
      ...paid,
      status: "REFUND_PENDING",
      providerRefundId: "re_test_furlong",
    }).outcome,
    "ALREADY_PENDING",
  );
  assert.equal(
    evaluatePublicOrderFullRefund({
      ...paid,
      status: "REFUNDED",
      amountRefundedCents: 24_900,
    }).outcome,
    "ALREADY_REFUNDED",
  );
}

function verifyPricing() {
  const review: PublicProductPriceCostInput = {
    productCode: "custom_property_analysis",
    productCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
    unitAmountCents: 24_900,
    currency: "usd",
    directDataCostCents: 1_500,
    computeCostCents: 500,
    reviewLaborMinutes: 60,
    reviewLaborRateCentsHourly: 10_000,
    supportReserveCents: 1_000,
    overheadAllocationCents: 1_000,
    paymentFeeBasisPoints: 290,
    paymentFeeFixedCents: 30,
    refundReserveBasisPoints: 300,
    minimumMarginBasisPoints: 3_500,
    effectiveAt: "2026-09-01T00:00:00.000Z",
    expiresAt: "2026-10-31T00:00:00.000Z",
    sourceRefs: [
      {
        kind: "DATA_AND_COMPUTE",
        reference: "cost-ledger:data-compute",
        asOf: "2026-09-01",
        reviewed: true,
      },
      {
        kind: "REVIEW_LABOR",
        reference: "operator-rate-card:licensed-review",
        asOf: "2026-09-01",
        reviewed: true,
      },
      {
        kind: "PAYMENT_PROCESSING",
        reference: "processor-fee-schedule:stripe",
        asOf: "2026-09-01",
        reviewed: true,
      },
      {
        kind: "SUPPORT_AND_REFUNDS",
        reference: "support-refund-reserve:launch",
        asOf: "2026-09-01",
        reviewed: true,
      },
    ],
  };
  const calculation = calculatePublicProductPrice(review);
  assert.equal(calculation.valid, true);
  assert.equal(calculation.fullyLoadedCostCents, 15_500);
  assert.equal(calculation.contributionMarginCents, 9_400);
  assert.equal(calculation.contributionMarginBasisPoints, 3_775);

  const aligned = evaluateCatalogPriceAlignment({
    product: PUBLIC_PRODUCTS.custom_property_analysis,
    review,
    expectedCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
    now: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(aligned.allowed, true);

  const underpriced = calculatePublicProductPrice({
    ...review,
    reviewLaborMinutes: 180,
  });
  assert.equal(underpriced.valid, false);
  assert(
    underpriced.reasons.includes("CONTRIBUTION_MARGIN_BELOW_APPROVED_FLOOR"),
  );

  const stale = evaluateCatalogPriceAlignment({
    product: PUBLIC_PRODUCTS.custom_property_analysis,
    review,
    expectedCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
    now: new Date("2027-01-01T00:00:00.000Z"),
  });
  assert.equal(stale.allowed, false);
  assert(stale.reasons.includes("PRICE_REVIEW_NOT_CURRENT"));
}

function verifyPaymentPolicy() {
  assert(PUBLIC_ORDER_REQUIRED_STRIPE_EVENTS.includes("charge.refunded"));
  assert(PUBLIC_ORDER_REQUIRED_STRIPE_EVENTS.includes("refund.failed"));
  assert(PUBLIC_ORDER_REQUIRED_STRIPE_EVENTS.includes("charge.dispute.closed"));

  const paid = evaluatePublicOrderPaymentEvent(order, event());
  assert.equal(paid.action, "CONFIRM_PAID");
  assert.equal(paid.grantAccess, true);
  assert.equal(paid.revokeAccess, false);

  const unpaid = evaluatePublicOrderPaymentEvent(
    order,
    event({ paymentStatus: "unpaid" }),
  );
  assert.equal(unpaid.action, "MARK_PENDING");
  assert.equal(unpaid.grantAccess, false);

  const tamperedPrice = evaluatePublicOrderPaymentEvent(
    order,
    event({ amountCents: 100 }),
  );
  assert.equal(tamperedPrice.action, "REJECT_HOLD");
  assert(tamperedPrice.reasons.includes("SERVER_PRICE_MISMATCH"));

  const wrongCurrency = evaluatePublicOrderPaymentEvent(
    order,
    event({ currency: "cad" }),
  );
  assert.equal(wrongCurrency.action, "REJECT_HOLD");

  const wrongProduct = evaluatePublicOrderPaymentEvent(
    order,
    event({ productCode: "focused_property_report" }),
  );
  assert.equal(wrongProduct.action, "REJECT_HOLD");

  const wrongCatalog = evaluatePublicOrderPaymentEvent(
    order,
    event({ productCatalogVersion: "future-catalog" }),
  );
  assert.equal(wrongCatalog.action, "REJECT_HOLD");

  const wrongSession = evaluatePublicOrderPaymentEvent(
    order,
    event({ checkoutSessionId: "cs_wrong" }),
  );
  assert.equal(wrongSession.action, "REJECT_HOLD");

  const badSignature = evaluatePublicOrderPaymentEvent(
    order,
    event({ signatureVerified: false }),
  );
  assert.equal(badSignature.action, "REJECT_HOLD");
  assert.equal(badSignature.grantAccess, false);

  const asyncPaid = evaluatePublicOrderPaymentEvent(
    order,
    event({
      eventType: "checkout.session.async_payment_succeeded",
      paymentStatus: null,
    }),
  );
  assert.equal(asyncPaid.action, "CONFIRM_PAID");

  const chargeEvidence = evaluatePublicOrderPaymentEvent(
    order,
    event({
      eventType: "charge.succeeded",
      checkoutSessionId: null,
      paymentStatus: null,
      providerEvidence: {
        riskLevel: "normal",
        threeDSecure: { result: "authenticated" },
      },
    }),
  );
  assert.equal(chargeEvidence.action, "RECORD_CHARGE_EVIDENCE");
  assert.equal(chargeEvidence.grantAccess, false);
  assert.equal(chargeEvidence.revokeAccess, false);

  const refund = evaluatePublicOrderPaymentEvent(
    order,
    event({
      eventType: "charge.refunded",
      checkoutSessionId: null,
      amountRefundedCents: 5_000,
      paymentStatus: null,
    }),
  );
  assert.equal(refund.action, "REVOKE_REFUND");
  assert.equal(refund.revokeAccess, true);

  const refundFailed = evaluatePublicOrderPaymentEvent(
    { ...order, status: "REFUND_PENDING" },
    event({
      eventType: "refund.failed",
      checkoutSessionId: null,
      amountCents: order.amountTotalCents,
      amountRefundedCents: order.amountTotalCents,
      paymentStatus: "failed",
    }),
  );
  assert.equal(refundFailed.action, "HOLD_REFUND_FAILED");
  assert.equal(refundFailed.grantAccess, false);
  assert.equal(refundFailed.revokeAccess, false);

  const dispute = evaluatePublicOrderPaymentEvent(
    order,
    event({
      eventType: "charge.dispute.created",
      checkoutSessionId: null,
      paymentStatus: null,
    }),
  );
  assert.equal(dispute.action, "REVOKE_DISPUTE");
  assert.equal(dispute.revokeAccess, true);

  const disputeWon = evaluatePublicOrderPaymentEvent(
    { ...order, status: "DISPUTED" },
    event({
      eventType: "charge.dispute.closed",
      checkoutSessionId: null,
      paymentStatus: "won",
    }),
  );
  assert.equal(disputeWon.action, "CLOSE_DISPUTE_WON");
  assert.equal(disputeWon.revokeAccess, true);

  const disputeLost = evaluatePublicOrderPaymentEvent(
    { ...order, status: "DISPUTED" },
    event({
      eventType: "charge.dispute.closed",
      checkoutSessionId: null,
      paymentStatus: "lost",
    }),
  );
  assert.equal(disputeLost.action, "CLOSE_DISPUTE_LOST");
  assert.equal(disputeLost.revokeAccess, true);

  const failed = evaluatePublicOrderPaymentEvent(
    order,
    event({
      eventType: "payment_intent.payment_failed",
      checkoutSessionId: null,
      paymentStatus: null,
    }),
  );
  assert.equal(failed.action, "MARK_FAILED");
  assert.equal(failed.revokeAccess, true);

  const expired = evaluatePublicOrderPaymentEvent(
    order,
    event({
      eventType: "checkout.session.expired",
      paymentStatus: null,
    }),
  );
  assert.equal(expired.action, "CANCEL");

  const terminal = evaluatePublicOrderPaymentEvent(
    { ...order, status: "REFUNDED" },
    event(),
  );
  assert.equal(terminal.action, "REJECT_HOLD");

  const held = evaluatePublicOrderPaymentEvent(
    { ...order, status: "HELD" },
    event(),
  );
  assert.equal(held.action, "REJECT_HOLD");
  assert.equal(held.grantAccess, false);
  assert(held.reasons.includes("ADVERSE_OR_HELD_STATE_CANNOT_BE_REGRANTED"));

  const ignored = evaluatePublicOrderPaymentEvent(
    order,
    event({ eventType: "customer.created" }),
  );
  assert.equal(ignored.action, "IGNORE");
}

async function verifyImplementationAnchors() {
  const root = process.cwd();
  const [
    migration,
    schema,
    store,
    checkout,
    legacyCheckout,
    webhook,
    stripeClient,
    migrationRegistry,
    agreementFile,
    checkoutComponent,
    purchasePage,
    successPage,
  ] = await Promise.all([
    readFile(
      path.join(root, "src/lib/db/migrations/0064_furlong_public_orders.sql"),
      "utf8",
    ),
    readFile(path.join(root, "src/db/schema/publicOrders.ts"), "utf8"),
    readFile(path.join(root, "src/lib/billing/publicOrderStore.ts"), "utf8"),
    readFile(
      path.join(root, "src/app/api/public/purchases/checkout/route.ts"),
      "utf8",
    ),
    readFile(path.join(root, "src/app/api/checkout/route.ts"), "utf8"),
    readFile(path.join(root, "src/app/api/stripe/webhook/route.ts"), "utf8"),
    readFile(path.join(root, "src/lib/stripe/client.ts"), "utf8"),
    readFile(
      path.join(root, "src/lib/db/canonicalGovernanceMigrations.ts"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/lib/billing/publicOrderAgreement.ts"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/components/public/PublicOrderCheckoutAgreement.tsx"),
      "utf8",
    ),
    readFile(path.join(root, "src/app/(public)/purchase/page.tsx"), "utf8"),
    readFile(
      path.join(root, "src/app/(public)/purchase/success/page.tsx"),
      "utf8",
    ),
  ]);
  const [
    cancelRoute,
    fulfillmentRoute,
    orderStatusComponent,
    pricingReviewRoute,
    pricingReviewPage,
  ] = await Promise.all([
    readFile(
      path.join(root, "src/app/api/public/purchases/[orderId]/cancel/route.ts"),
      "utf8",
    ),
    readFile(
      path.join(
        root,
        "src/app/api/internal/public-orders/fulfillment/route.ts",
      ),
      "utf8",
    ),
    readFile(
      path.join(root, "src/components/public/PublicOrderStatus.tsx"),
      "utf8",
    ),
    readFile(
      path.join(
        root,
        "src/app/api/internal/public-product-pricing/reviews/route.ts",
      ),
      "utf8",
    ),
    readFile(
      path.join(root, "src/app/internal/public-product-pricing/page.tsx"),
      "utf8",
    ),
  ]);

  assert(migration.includes("furlong_public_orders"));
  assert(migration.includes("furlong_public_order_events_provider_event_uq"));
  assert(migration.includes("furlong_public_order_events_immutable"));
  assert(migration.includes("is append-only"));
  assert(migration.includes("'REFUND_PENDING'"));
  assert(migration.includes("furlong_public_access_grants_scope_uq"));
  assert(migration.includes("furlong_public_product_price_reviews"));
  assert(schema.includes("checkoutRequestId"));
  assert(schema.includes("amountPaidCents"));
  assert(store.includes("db.transaction"));
  assert(store.includes("onConflictDoNothing"));
  assert(store.includes("providerEventId"));
  assert(store.includes("unitsRemaining: 0"));
  assert(checkout.includes("browserPriceAccepted: false"));
  assert(checkout.includes("evaluateRecordedPublicProductPrice"));
  assert(!checkout.includes("body.price"));
  assert(checkout.includes("idempotencyKey:"));
  assert(legacyCheckout.includes('process.env.NODE_ENV === "production"'));
  assert(legacyCheckout.includes("client-supplied-price"));
  assert(webhook.includes("processPublicOrderStripeWebhook"));
  assert(webhook.includes("return null;\n}\n\nfunction mapPlanToPermissions"));
  assert(stripeClient.includes("idempotencyKey"));
  assert(stripeClient.includes("sdk.refunds.create"));
  assert(migrationRegistry.includes("0064_furlong_public_orders.sql"));
  assert(store.includes("recordPublicOrderAgreementAcceptance"));
  assert(store.includes("public_order.agreement_accepted"));
  assert(store.includes("PUBLIC_ORDER_AGREEMENT_TEXT"));
  assert(store.includes("public_order.fulfillment_completed"));
  assert(store.includes("reportCompleted: true"));
  assert(store.includes("pg_advisory_xact_lock"));
  assert(store.includes("PUBLIC_ORDER_CAPACITY_STATUSES"));
  assert(store.includes("upgradeCreditRelease"));
  assert(store.includes("TARGET_ORDER_FULLY_REFUNDED"));
  assert(store.includes("public_order.upgrade_credit_source_invalidated"));
  assert(store.includes("UPGRADE_CREDIT_SOURCE_REFUNDED"));
  assert(store.includes("UPGRADE_CREDIT_SOURCE_DISPUTED"));
  assert(store.includes("The prior-report credit is no longer valid."));
  assert(checkout.includes("release.maxOpenOrders"));
  assert(checkout.includes("evaluatePublicOrderAgreement"));
  assert(checkout.includes("publicAgreementDigest"));
  assert(checkout.includes("product_data"));
  assert(checkout.includes("description: deliveryDescription"));
  assert(checkout.includes("release.deliveryBusinessDays"));
  assert(agreementFile.includes("unfavorable conclusion"));
  assert(agreementFile.includes("PUBLIC_ORDER_AGREEMENT_VERSION"));
  assert(checkoutComponent.includes('type="checkbox"'));
  assert(checkoutComponent.includes("checked={accepted}"));
  assert(
    checkoutComponent.includes(
      "disabled={!accepted || busy || upgradeBlocked}",
    ),
  );
  assert(checkoutComponent.includes("PUBLIC_ORDER_AGREEMENT_VERSION"));
  assert(purchasePage.includes("PublicOrderCheckoutAgreement"));
  assert(successPage.includes("PublicOrderStatus"));
  assert(cancelRoute.includes("reservePublicOrderFullRefund"));
  assert(cancelRoute.includes("refundAmountFromBrowser: false"));
  assert(cancelRoute.includes("stripe.refunds.create"));
  assert(!cancelRoute.includes("body.amount"));
  assert(store.includes("public_order.full_refund_requested"));
  assert(store.includes('status: "REFUND_PENDING"'));
  assert(store.includes("HOLD_REFUND_FAILED"));
  assert(fulfillmentRoute.includes("transitionPublicOrderFulfillment"));
  assert(fulfillmentRoute.includes("Verified operator access"));
  assert(pricingReviewRoute.includes("listPublicProductPriceReviews"));
  assert(pricingReviewRoute.includes("PUBLIC_PRODUCT_CATALOG_VERSION"));
  assert(
    pricingReviewPage.includes("unitAmountCents: product.unitAmountCents"),
  );
  assert(pricingReviewPage.includes("I approve this exact"));
  assert(pricingReviewPage.includes("Save draft review"));
  assert(
    orderStatusComponent.includes(
      "Cancel before processing and refund in full",
    ),
  );
}

async function main() {
  verifyCatalog();
  verifyAgreement();
  verifyRefundPolicy();
  verifyPricing();
  verifyPaymentPolicy();
  await verifyImplementationAnchors();
  console.log(
    "✓ Public order agreement, catalog, price integrity, capacity, payment policy, fulfillment and revocation verified.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
