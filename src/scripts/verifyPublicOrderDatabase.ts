import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { Pool } from "pg";

import {
  PUBLIC_PRODUCT_CATALOG_VERSION,
  PUBLIC_PRODUCTS,
} from "@/lib/billing/publicProductCatalog";
import type { PublicOrderStripeEventInput } from "@/lib/billing/publicOrderPaymentPolicy";

async function main() {
  const url = new URL(
    process.env.DATABASE_URL ?? "postgresql://invalid/",
  );
  if (
    process.env.FURLONG_ISOLATED_CHECKOUT_TEST !== "true" ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.pathname !== "/furlong_checkout_test"
  ) {
    throw new Error(
      "This acceptance test requires the explicitly enabled local furlong_checkout_test database.",
    );
  }

  const schema = "checkout_test_" + randomUUID().replace(/-/g, "");
  const admin = new Pool({ connectionString: url.toString(), ssl: false });
  await admin.query(`CREATE SCHEMA ${schema}`);

  url.searchParams.set("options", `-c search_path=${schema}`);
  process.env.DATABASE_URL = url.toString();

  const { db } = await import("@/lib/db");
  const store = await import("@/lib/billing/publicOrderStore");
  const migrations = new Pool({ connectionString: url.toString(), ssl: false });

  try {
    for (const name of [
      "0064_furlong_public_orders.sql",
      "0065_public_order_upgrade_credit.sql",
    ]) {
      await migrations.query(
        await readFile("src/lib/db/migrations/" + name, "utf8"),
      );
    }

    const traceId = randomUUID();
    const created = await store.createPublicOrder({
      checkoutRequestId: randomUUID(),
      buyerActorId: null,
      product: PUBLIC_PRODUCTS.focused_property_report,
      targetType: "PROPERTY",
      targetRef: "synthetic-property",
      targetSnapshot: {
        exactAddress: "SYNTHETIC TEST PROPERTY — NOT A CUSTOMER RECORD",
      },
      priceReviewId: "synthetic-ci-price-review",
      maxOpenOrders: 100,
      traceId,
    });

    const wrongCustomer = await store.loadPublicOrder({
      orderId: created.order.id,
      buyerActorId: null,
      accessToken: "wrong-customer-token",
    });
    assert.equal(wrongCustomer, null);

    const acceptedAt = new Date("2026-09-30T12:00:00.000Z");
    await store.recordPublicOrderAgreementAcceptance({
      orderId: created.order.id,
      productName: PUBLIC_PRODUCTS.focused_property_report.publicName,
      productDescription:
        PUBLIC_PRODUCTS.focused_property_report.description,
      includedScope: PUBLIC_PRODUCTS.focused_property_report.includedScope,
      excludedScope: PUBLIC_PRODUCTS.focused_property_report.excludedScope,
      acceptedAt,
      networkAddress: "127.0.0.1",
      userAgent: "furlong-isolated-db-acceptance",
      traceId: randomUUID(),
    });

    const afterAgreement = await store.loadPublicOrder({
      orderId: created.order.id,
      buyerActorId: null,
      accessToken: created.accessToken,
    });
    assert(afterAgreement);
    assert.equal(
      afterAgreement.agreementEvent?.eventType,
      "public_order.agreement_accepted",
    );

    const checkoutSessionId = "cs_test_" + randomUUID();
    await store.attachPublicOrderCheckout({
      orderId: created.order.id,
      checkoutSessionId,
      traceId: randomUUID(),
    });

    const paymentEvent: PublicOrderStripeEventInput = {
      signatureVerified: true,
      providerEventId: "evt_test_" + randomUUID(),
      eventType: "checkout.session.completed",
      orderId: created.order.id,
      productCode: PUBLIC_PRODUCTS.focused_property_report.code,
      productCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION,
      checkoutSessionId,
      paymentIntentId: "pi_test_" + randomUUID(),
      amountCents: PUBLIC_PRODUCTS.focused_property_report.unitAmountCents,
      amountRefundedCents: null,
      currency: "usd",
      paymentStatus: "paid",
    };
    const payloadDigest = createHash("sha256")
      .update(JSON.stringify(paymentEvent))
      .digest("hex");

    const first = await store.applyPublicOrderProviderEvent({
      event: paymentEvent,
      payloadDigest,
      occurredAt: new Date("2026-09-30T12:01:00.000Z"),
      traceId: randomUUID(),
    });
    const replay = await store.applyPublicOrderProviderEvent({
      event: paymentEvent,
      payloadDigest,
      occurredAt: new Date("2026-09-30T12:01:01.000Z"),
      traceId: randomUUID(),
    });

    assert.equal(first.handled, true);
    assert.equal(replay.handled, true);
    assert.equal("duplicate" in replay && replay.duplicate, true);

    const paid = await store.loadPublicOrder({
      orderId: created.order.id,
      buyerActorId: null,
      accessToken: created.accessToken,
    });
    assert(paid);
    assert.equal(paid.order.status, "FULFILLMENT_PENDING");
    assert.equal(
      paid.order.amountPaidCents,
      PUBLIC_PRODUCTS.focused_property_report.unitAmountCents,
    );
    assert.equal(paid.order.amountRefundedCents, 0);

    const providerEvents = await migrations.query(
      "SELECT COUNT(*)::int AS n FROM furlong_public_order_events WHERE provider='stripe' AND provider_event_id=$1",
      [paymentEvent.providerEventId],
    );
    assert.equal(providerEvents.rows[0]?.n, 1);

    let appendOnlyBlocked = false;
    try {
      await migrations.query(
        "UPDATE furlong_public_order_events SET event_status='TAMPERED' WHERE provider='stripe' AND provider_event_id=$1",
        [paymentEvent.providerEventId],
      );
    } catch {
      appendOnlyBlocked = true;
    }
    assert.equal(
      appendOnlyBlocked,
      true,
      "Public order events must remain append-only.",
    );

    const capacityTarget = "synthetic-capacity-property";
    const capacityAttempts = await Promise.allSettled(
      [1, 2].map(() =>
        store.createPublicOrder({
          checkoutRequestId: randomUUID(),
          buyerActorId: null,
          product: PUBLIC_PRODUCTS.custom_property_analysis,
          targetType: "PROPERTY",
          targetRef: capacityTarget,
          targetSnapshot: {},
          priceReviewId: "synthetic-ci-price-review",
          maxOpenOrders: 1,
          traceId: randomUUID(),
        }),
      ),
    );
    assert.equal(
      capacityAttempts.filter((result) => result.status === "fulfilled").length,
      1,
      "The paid-order capacity limit must be atomic.",
    );
    assert.equal(
      capacityAttempts.filter((result) => result.status === "rejected").length,
      1,
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          synthetic: true,
          rule: "PAID-REPORT-DATABASE-ACCEPTANCE-001",
          checks: [
            "migrations 0064/0065 applied in isolated schema",
            "order persisted",
            "agreement acceptance persisted",
            "cross-customer token denied",
            "signed provider event persisted",
            "provider replay idempotent",
            "paid state persisted without fulfillment fabrication",
            "event ledger append-only",
            "capacity limit atomic",
          ],
          salesActivated: false,
          productionAuthorized: false,
        },
        null,
        2,
      ),
    );
  } finally {
    await migrations.end();
    await db.$client.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
