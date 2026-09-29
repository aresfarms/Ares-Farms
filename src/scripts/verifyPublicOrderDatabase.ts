import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { PUBLIC_PRODUCTS, PUBLIC_PRODUCT_CATALOG_VERSION } from "@/lib/billing/publicProductCatalog";
import { AUTOMATED_REPORT_BINDING_VERSION } from "@/lib/billing/publicAutomatedReportPolicy";
import type { PublicOrderStripeEventInput } from "@/lib/billing/publicOrderPaymentPolicy";

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "postgresql://invalid/");
  if (process.env.FURLONG_ISOLATED_CHECKOUT_TEST !== "true" ||
      !["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/furlong_checkout_test") {
    throw new Error("This test requires the explicitly enabled, local furlong_checkout_test database.");
  }
  const schema = "checkout_test_" + randomUUID().replace(/-/g, "");
  const admin = new Pool({ connectionString: url.toString(), ssl: false });
  await admin.query(`CREATE SCHEMA ${schema}`);
  url.searchParams.set("options", `-c search_path=${schema}`);
  process.env.DATABASE_URL = url.toString();
  const { db } = await import("@/lib/db");
  const tables = await import("@/db/schema");
  const store = await import("@/lib/billing/publicOrderStore");
  const artifactStore = await import("@/lib/billing/publicOrderReportArtifact");
  const { GET: download } = await import("@/app/api/public/purchases/[orderId]/report/route");
  const migrations = new Pool({ connectionString: url.toString(), ssl: false });
  const originalFetch = globalThis.fetch;
  try {
    for (const name of ["0064_furlong_public_orders.sql", "0065_public_order_upgrade_credit.sql"]) {
      await migrations.query(await readFile("src/lib/db/migrations/" + name, "utf8"));
    }
    const bytes = Buffer.from("%PDF-1.7\nsynthetic delivery-byte fixture\n%%EOF");
    const digest = createHash("sha256").update(bytes).digest("hex");
    const sourceDigest = "b".repeat(64);
    async function create(ready = true, targetRef = "synthetic-property") {
      const result = await store.createPublicOrder({ checkoutRequestId: randomUUID(), buyerActorId: null,
        product: PUBLIC_PRODUCTS.focused_property_report, targetType: "PROPERTY", targetRef,
        targetSnapshot: { exactAddress: "SYNTHETIC TEST PROPERTY" }, priceReviewId: "synthetic-price-review",
        maxOpenOrders: 100, traceId: randomUUID() });
      const artifactId = randomUUID(), now = new Date().toISOString();
      if (ready) {
        const artifact = { artifactId, status: "VERIFIED", fileName: "fixture.pdf", mimeType: "application/pdf",
          byteSize: bytes.length, expectedSha256: digest, verifiedSha256: digest,
          objectKey: `public-orders/${result.order.id}/${artifactId}.pdf`, storageProvider: "gcs-resumable-v1",
          storageGeneration: "123", createdAt: now, verifiedAt: now, availableAt: null,
          downloadCount: 0, verification: { evidenceSha256: sourceDigest, malwareStatus: "clean", structuralSafety: true } };
        await db.update(tables.furlongPublicOrders).set({ targetSnapshot: { reportArtifact: {
          reference: artifactId, digest: `sha256:${digest}`, generatedAt: now } },
          metadata: { reportArtifact: artifact, automatedReport: { version: AUTOMATED_REPORT_BINDING_VERSION,
            orderId: result.order.id, targetRef, artifactId, evidenceSha256: sourceDigest, modelSha256: "c".repeat(64) } } })
          .where(eq(tables.furlongPublicOrders.id, result.order.id));
      }
      const session = "cs_test_" + randomUUID();
      await store.attachPublicOrderCheckout({ orderId: result.order.id, checkoutSessionId: session, traceId: randomUUID() });
      const event: PublicOrderStripeEventInput = { signatureVerified: true, providerEventId: "evt_test_" + randomUUID(),
        eventType: "checkout.session.completed", orderId: result.order.id, productCode: "focused_property_report",
        productCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION, checkoutSessionId: session,
        paymentIntentId: "pi_test_" + randomUUID(), amountCents: 4900, amountRefundedCents: null,
        currency: "usd", paymentStatus: "paid" };
      return { ...result, event, artifactId };
    }
    const apply = (event: PublicOrderStripeEventInput) => store.applyPublicOrderProviderEvent({ event,
      payloadDigest: createHash("sha256").update(JSON.stringify(event)).digest("hex"), occurredAt: new Date(), traceId: randomUUID() });
    const order = await create();
    const confirmations = await Promise.all([apply(order.event), apply(order.event)]);
    assert(confirmations.every(result => result.handled));
    const loaded = await store.loadPublicOrder({ orderId: order.order.id, buyerActorId: null, accessToken: order.accessToken });
    assert.equal(loaded?.order.status, "FULFILLED");
    assert.equal(artifactStore.readPublicOrderReportArtifact(loaded?.order.metadata)?.status, "AVAILABLE");
    assert.equal(await store.loadPublicOrder({ orderId: order.order.id, buyerActorId: null, accessToken: "another-customer" }), null);
    const count = await migrations.query("SELECT COUNT(*)::int n FROM furlong_public_order_events WHERE event_type='public_order.automated_report_fulfilled'");
    assert.equal(count.rows[0].n, 1);
    process.env.DOCUMENT_STORAGE_BUCKET = "synthetic-private-bucket";
    let deliveredBytes = bytes;
    globalThis.fetch = async (input) => {
      const request = String(input);
      if (request.includes("metadata.google.internal")) return Response.json({ access_token: "synthetic-test-token" });
      if (request.startsWith("https://storage.googleapis.com/")) {
        assert(request.includes("generation=123"));
        return new Response(new Uint8Array(deliveredBytes), { headers: { "Content-Length": String(deliveredBytes.length) } });
      }
      throw new Error("Unexpected outbound request in isolated test.");
    };
    const request = (token: string) => new NextRequest("http://localhost/api/public/purchases/" + order.order.id + "/report", {
      headers: { Authorization: `Bearer ${token}` } });
    const params = { params: Promise.resolve({ orderId: order.order.id }) };
    assert.equal((await download(request("another-customer"), params)).status, 404);
    const response = await download(request(order.accessToken), params);
    assert.equal(response.status, 200);
    assert.equal(createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex"), digest);
    deliveredBytes = Buffer.from(bytes); deliveredBytes[10] ^= 1;
    assert.equal((await download(request(order.accessToken), params)).status, 503);
    deliveredBytes = bytes;
    const refunded = await apply({ ...order.event, providerEventId: "evt_refund_" + randomUUID(),
      eventType: "charge.refunded", amountRefundedCents: 4900 });
    assert(refunded.handled && refunded.order.status === "REFUNDED");
    assert.equal((await download(request(order.accessToken), params)).status, 409);
    await apply({ ...order.event, providerEventId: "evt_late_paid_" + randomUUID() });
    const afterLatePayment = await store.loadPublicOrder({ orderId: order.order.id, buyerActorId: null, accessToken: order.accessToken });
    assert.equal(afterLatePayment?.order.status, "REFUNDED");

    const absent = await create(false);
    const held = await apply(absent.event);
    assert(held.handled && held.order.status === "HELD");
    const noGrant = await migrations.query("SELECT COUNT(*)::int n FROM furlong_public_access_grants WHERE order_id=$1 AND active", [absent.order.id]);
    assert.equal(noGrant.rows[0].n, 0);
    const refundReservation = await store.reservePublicOrderFullRefund({ orderId: absent.order.id, traceId: randomUUID() });
    assert.equal(refundReservation.state, "RESERVED", "a paid report held before delivery remains refundable");
    const disputed = await create(); await apply(disputed.event);
    await apply({ ...disputed.event, providerEventId: "evt_dispute_" + randomUUID(), eventType: "charge.dispute.created" });
    const disputeOrder = await store.loadPublicOrder({ orderId: disputed.order.id, buyerActorId: null, accessToken: disputed.accessToken });
    assert.equal(disputeOrder?.order.status, "DISPUTED");
    assert.equal(artifactStore.readPublicOrderReportArtifact(disputeOrder?.order.metadata)?.status, "REVOKED");

    const requests = await Promise.allSettled([1, 2].map(() => store.createPublicOrder({
      checkoutRequestId: randomUUID(), buyerActorId: null, product: PUBLIC_PRODUCTS.custom_property_analysis,
      targetType: "PROPERTY", targetRef: "capacity-fixture", targetSnapshot: {}, priceReviewId: "synthetic",
      maxOpenOrders: 1, traceId: randomUUID(),
    })));
    assert.equal(requests.filter(r => r.status === "fulfilled").length, 1);
    console.log(JSON.stringify({ ok: true, synthetic: true, checks: ["concurrent webhook replay", "atomic automatic fulfillment",
      "missing artifact held", "cross-customer denial", "exact private PDF bytes", "changed object rejected",
      "refund revocation", "late payment cannot restore refund", "dispute revocation", "concurrent capacity limit"] }));
  } finally {
    globalThis.fetch = originalFetch;
    await migrations.end();
    await db.$client.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
