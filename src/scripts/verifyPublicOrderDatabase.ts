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
    for (const name of ["0058_furlong_case_lifecycle.sql", "0060_furlong_case_living_record_upgrade.sql", "0063_furlong_property_comparisons.sql", "0064_furlong_public_orders.sql", "0065_public_order_upgrade_credit.sql"]) {
      await migrations.query(await readFile("src/lib/db/migrations/" + name, "utf8"));
    }
    const comparisons = await import("@/lib/intelligence/propertyComparisonStore");
    const { basePackage } = await import("./fixtures/economicEvidence");
    const { propertyReportPreparation } = await import("@/lib/intelligence/propertyReportPreparation");
    const address = "123 Fixture Rd, Testville, MD 00000";
    const savedCase = await comparisons.createPropertyComparison({
      intake: { addresses: [address], excludedAddresses: [], requestedResultCount: 1 }, ownerActorId: null, traceId: randomUUID(),
    });
    const access = { comparisonId: savedCase.comparisonId, ownerActorId: null, accessToken: savedCase.accessToken };
    assert.equal(await comparisons.loadPropertyComparison({ ...access, accessToken: "wrong-customer" }), null);
    const [claimed] = await comparisons.claimQueuedPropertyComparisonItems({ comparisonId: savedCase.comparisonId, limit: 1, traceId: randomUUID() });
    assert(claimed);
    await comparisons.recordPropertyComparisonVerification({ itemId: claimed.id, comparisonId: savedCase.comparisonId,
      verified: true, normalizedAddress: address, propertyId: "synthetic-comparison-property", traceId: randomUUID(),
      resultSnapshot: { verificationStatus: "verified" } });
    await comparisons.claimVerifiedPropertyComparisonItems({ comparisonId: savedCase.comparisonId, limit: 1, traceId: randomUUID() });
    await comparisons.recordPropertyComparisonEvidenceGap({ itemId: claimed.id, comparisonId: savedCase.comparisonId,
      missingEvidence: ["Synthetic missing operating budget"], analysisSnapshot: { evidenceCapture: { version: "property-evidence-capture-v1", classification: "CONFIDENTIAL", synthetic: true } }, traceId: randomUUID() });
    const reopened = await comparisons.loadPropertyComparison(access);
    assert.equal(reopened?.items[0].status, "NEEDS_EVIDENCE");
    assert.equal((reopened?.items[0].resultSnapshot as { evidenceCapture: { synthetic: boolean } }).evidenceCapture.synthetic, true);
    const packages = (["best-single-enterprise", "best-mixed-use", "best-distinct-alternative"] as const).map((role, index) => {
      const p = structuredClone(basePackage);
      p.propertyId = "synthetic-comparison-property"; p.address = address;
      p.generatedAt = new Date().toISOString();
      p.professionalReview.reviewedAt = p.generatedAt;
      p.sources = p.sources.map(source => ({ ...source, asOf: p.generatedAt, capturedAt: p.generatedAt }));
      p.packageId = `database-fixture-${index}`; p.candidate.id = `candidate-${index}`;
      p.candidate.title = `Synthetic use ${index}`; p.candidate.candidateRole = role;
      p.candidate.enterpriseComponents = index === 1 ? ["A", "B"] : ["A"];
      return p;
    });
    const finished = await comparisons.recordCompletedPropertyComparisonAnalysis({ itemId: claimed.id,
      comparisonId: savedCase.comparisonId, evidencePackages: packages, traceId: randomUUID() });
    assert(finished);
    const readyCase = await comparisons.loadPropertyComparison(access);
    assert(readyCase);
    assert.equal((readyCase.items[0].resultSnapshot as { evidenceCapture: { synthetic: boolean } }).evidenceCapture.synthetic, true, "completion must preserve captured source evidence");
    assert(propertyReportPreparation(readyCase.items[0], new Date()).evidenceReady, "stored JSONB wrappers must reopen for report preparation");
    assert(!propertyReportPreparation(readyCase.items[0], new Date("2028-01-01")).evidenceReady);
    assert.equal(await comparisons.loadPropertyComparison({ ...access, accessToken: "another-customer-token" }), null);

    const { exclusionFixture } = await import("./fixtures/candidateExclusion");
    const noGoCase = await comparisons.createPropertyComparison({
      intake: { addresses: [address], excludedAddresses: [], requestedResultCount: 1 }, ownerActorId: null, traceId: randomUUID(),
    });
    const noGoAccess = { comparisonId: noGoCase.comparisonId, ownerActorId: null, accessToken: noGoCase.accessToken };
    const [noGoClaim] = await comparisons.claimQueuedPropertyComparisonItems({ comparisonId: noGoCase.comparisonId, limit: 1, traceId: randomUUID() });
    await comparisons.recordPropertyComparisonVerification({ itemId: noGoClaim.id, comparisonId: noGoCase.comparisonId,
      verified: true, normalizedAddress: address, propertyId: "synthetic-comparison-property", traceId: randomUUID(),
      resultSnapshot: { verificationStatus: "verified" } });
    const exclusions = packages.map(p => {
      const exclusion = exclusionFixture(p.candidate.candidateRole, p.propertyId, p.address);
      exclusion.generatedAt = p.generatedAt; exclusion.review.reviewedAt = p.generatedAt;
      exclusion.sources = structuredClone(p.sources); return exclusion;
    });
    const staleExclusions = structuredClone(exclusions); staleExclusions[0].sources[0].asOf = "2020-01-01";
    await assert.rejects(comparisons.recordCompletedPropertyComparisonAnalysis({ itemId: noGoClaim.id,
      comparisonId: noGoCase.comparisonId, evidencePackages: [], candidateExclusions: staleExclusions, traceId: randomUUID() }), /incomplete/);
    assert.equal((await comparisons.loadPropertyComparison(noGoAccess))?.items[0].status, "VERIFIED", "failed review must not mark the item complete");
    await comparisons.recordCompletedPropertyComparisonAnalysis({ itemId: noGoClaim.id,
      comparisonId: noGoCase.comparisonId, evidencePackages: [], candidateExclusions: exclusions, traceId: randomUUID() });
    const noGoFinal = await comparisons.finalizePropertyComparison({ comparisonId: noGoCase.comparisonId, traceId: randomUUID() });
    assert(noGoFinal?.ranking);
    assert.equal(noGoFinal.ranking.portfolioVerdict, "RUN_FROM_ALL");
    assert.equal(noGoFinal.ranking.status, "completed");
    const noGoLoaded = await comparisons.loadPropertyComparison(noGoAccess);
    assert(noGoLoaded);
    assert.equal(noGoLoaded.comparison.status, "COMPLETED");
    assert.equal(propertyReportPreparation(noGoLoaded.items[0], new Date()).outcome, "no-supported-use");
    assert.equal(propertyReportPreparation(noGoLoaded.items[0], new Date()).exclusions.length, 3);
    const childEvidence = await migrations.query("SELECT property_snapshot FROM furlong_cases WHERE case_id=$1", [noGoLoaded.items[0].childCaseId]);
    assert.equal(childEvidence.rows[0].property_snapshot.candidateExclusions.length, 3);
    const exclusionEvent = await migrations.query("SELECT detail, evidence_refs FROM furlong_case_events WHERE case_id=$1", [noGoLoaded.items[0].childCaseId]);
    assert.equal(exclusionEvent.rows[0].detail.exclusionCount, 3);
    assert(exclusionEvent.rows[0].evidence_refs.includes(exclusions[0].replayRef));
    assert.equal(await comparisons.loadPropertyComparison({ ...noGoAccess, accessToken: "wrong-customer" }), null);

    const bytes = Buffer.from("%PDF-1.7\nsynthetic delivery-byte fixture\n%%EOF");
    const digest = createHash("sha256").update(bytes).digest("hex");
    const sourceDigest = "b".repeat(64);
    async function create(ready = true, targetRef = "synthetic-property", product = PUBLIC_PRODUCTS.focused_property_report) {
      const result = await store.createPublicOrder({ checkoutRequestId: randomUUID(), buyerActorId: null,
        product, targetType: "PROPERTY", targetRef,
        targetSnapshot: { exactAddress: "SYNTHETIC TEST PROPERTY" }, priceReviewId: "synthetic-price-review",
        maxOpenOrders: 100, traceId: randomUUID() });
      const artifactId = randomUUID(), now = new Date().toISOString();
      if (ready) {
        const artifact = { artifactId, status: "VERIFIED", fileName: "fixture.pdf", mimeType: "application/pdf",
          byteSize: bytes.length, expectedSha256: digest, verifiedSha256: digest,
          objectKey: `public-orders/${result.order.id}/${artifactId}.pdf`, storageProvider: "gcs-resumable-v1",
          storageGeneration: "123", createdAt: now, verifiedAt: now, availableAt: null,
          downloadCount: 0, verification: { evidenceSha256: sourceDigest, modelSha256: "c".repeat(64), malwareStatus: "clean", structuralSafety: true, storageReadbackVerified: true } };
        await db.update(tables.furlongPublicOrders).set({ targetSnapshot: { reportArtifact: {
          reference: artifactId, digest: `sha256:${digest}`, generatedAt: now } },
          metadata: { reportArtifact: artifact, automatedReport: { version: AUTOMATED_REPORT_BINDING_VERSION,
            orderId: result.order.id, targetRef, artifactId, evidenceSha256: sourceDigest, modelSha256: "c".repeat(64) } } })
          .where(eq(tables.furlongPublicOrders.id, result.order.id));
      }
      await store.recordPublicOrderAgreementAcceptance({ orderId: result.order.id,
        productName: product.publicName ?? product.code, productDescription: product.description,
        includedScope: product.included, excludedScope: product.excluded,
        acceptedAt: new Date(), networkAddress: "127.0.0.1", userAgent: "furlong-isolated-db-acceptance", traceId: randomUUID() });
      const session = "cs_test_" + randomUUID();
      await store.attachPublicOrderCheckout({ orderId: result.order.id, checkoutSessionId: session, traceId: randomUUID() });
      const event: PublicOrderStripeEventInput = { signatureVerified: true, providerEventId: "evt_test_" + randomUUID(),
        eventType: "checkout.session.completed", orderId: result.order.id, productCode: product.code,
        productCatalogVersion: PUBLIC_PRODUCT_CATALOG_VERSION, checkoutSessionId: session,
        paymentIntentId: "pi_test_" + randomUUID(), amountCents: result.order.amountTotalCents, amountRefundedCents: null,
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
    assert.equal(loaded?.agreementEvent?.eventType, "public_order.agreement_accepted");
    await assert.rejects(migrations.query(
      "UPDATE furlong_public_order_events SET event_status='TAMPERED' WHERE provider='stripe' AND provider_event_id=$1",
      [order.event.providerEventId]), /append.only|immutable/i, "public order events must remain append-only");
    assert.equal(artifactStore.readPublicOrderReportArtifact(loaded?.order.metadata)?.status, "AVAILABLE");
    assert.equal(loaded?.grants[0].active, false);
    assert.equal(loaded?.grants[0].unitsRemaining, 0);
    assert.equal(await store.loadPublicOrder({ orderId: order.order.id, buyerActorId: null, accessToken: "another-customer" }), null);
    const paidAgain = await apply({...order.event, providerEventId: "evt_second_confirmation_" + randomUUID(),
      eventType: "checkout.session.async_payment_succeeded"});
    assert(paidAgain.handled && paidAgain.order.status === "FULFILLED", "a different payment confirmation must not reset fulfillment");
    for (const eventType of ["checkout.session.completed", "checkout.session.expired", "payment_intent.payment_failed"]) {
      const late = await apply({...order.event, providerEventId: "evt_out_of_order_" + randomUUID(), eventType, paymentStatus: "unpaid"});
      assert(late.handled && late.order.status === "FULFILLED", `late ${eventType} must not undo payment`);
    }
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
    const afterLateExpiry = await apply({...order.event, providerEventId: "evt_late_expiry_" + randomUUID(), eventType: "checkout.session.expired"});
    assert(afterLateExpiry.handled && afterLateExpiry.order.status === "REFUNDED");

    const absent = await create(false);
    const held = await apply(absent.event);
    assert(held.handled && held.order.status === "HELD");
    const noGrant = await migrations.query("SELECT COUNT(*)::int n FROM furlong_public_access_grants WHERE order_id=$1 AND active", [absent.order.id]);
    assert.equal(noGrant.rows[0].n, 0);
    const refundReservation = await store.reservePublicOrderFullRefund({ orderId: absent.order.id, traceId: randomUUID() });
    assert.equal(refundReservation.state, "RESERVED", "a paid report held before delivery remains refundable");
    const duringRefund = await apply({...absent.event, providerEventId: "evt_payment_during_refund_" + randomUUID()});
    assert(duringRefund.handled && duringRefund.order.status === "REFUND_PENDING");
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
    const supervised = await create(false, "supervised-fixture", PUBLIC_PRODUCTS.custom_property_analysis);
    const supervisedPaid = await apply(supervised.event);
    assert(supervisedPaid.handled && supervisedPaid.order.status === "FULFILLMENT_PENDING");
    const action = (orderId: string, action: "START" | "COMPLETE", reportRef?: string) => ({
      orderId, action, operatorActorId: "synthetic-test-operator", reportRef,
      evidenceRefs: ["synthetic-review-only"], idempotencyKey: randomUUID(), traceId: randomUUID(),
    });
    await assert.rejects(store.transitionPublicOrderFulfillment(action(absent.order.id, "START")), /Automated reports/);
    await store.transitionPublicOrderFulfillment(action(supervised.order.id, "START"));
    await assert.rejects(store.reservePublicOrderFullRefund({orderId: supervised.order.id, traceId: randomUUID()}));
    await assert.rejects(store.transitionPublicOrderFulfillment(action(supervised.order.id, "COMPLETE", "missing-artifact")));
    const frozen = artifactStore.readPublicOrderReportArtifact(loaded!.order.metadata)!;
    await db.update(tables.furlongPublicOrders).set({metadata: { reportArtifact: { ...frozen,
      status: "VERIFIED", objectKey: `public-orders/${supervised.order.id}/${frozen.artifactId}.pdf` } }})
      .where(eq(tables.furlongPublicOrders.id, supervised.order.id));
    const completedAction = action(supervised.order.id, "COMPLETE", frozen.artifactId);
    const completed = await store.transitionPublicOrderFulfillment(completedAction);
    assert.equal(completed.order.status, "FULFILLED");
    assert.equal((await store.transitionPublicOrderFulfillment(completedAction)).duplicate, true);
    const supervisedAgain = await apply({...supervised.event, providerEventId: "evt_second_supervised_confirmation_" + randomUUID()});
    assert(supervisedAgain.handled && supervisedAgain.order.status === "FULFILLED");
    const consumedGrant = await migrations.query("SELECT active, units_remaining FROM furlong_public_access_grants WHERE order_id=$1", [supervised.order.id]);
    assert.equal(consumedGrant.rows[0].active, false);
    assert.equal(consumedGrant.rows[0].units_remaining, 0);

    const creditSource = await create(true, "upgrade-fixture"); await apply(creditSource.event);
    const upgrade = () => store.createPublicOrder({checkoutRequestId: randomUUID(), buyerActorId: null,
      product: PUBLIC_PRODUCTS.custom_property_analysis, targetType: "PROPERTY", targetRef: "upgrade-fixture",
      targetSnapshot: {}, priceReviewId: "synthetic-price-review", maxOpenOrders: 100, traceId: randomUUID(),
      upgradeSource: {orderId: creditSource.order.id, accessToken: creditSource.accessToken}});
    const upgrades = await Promise.allSettled([upgrade(), upgrade()]);
    assert.equal(upgrades.filter(result => result.status === "fulfilled").length, 1);
    const upgraded = upgrades.find(result => result.status === "fulfilled")!;
    assert(upgraded.status === "fulfilled");
    assert.equal(upgraded.value.order.creditAmountCents, 4900);
    assert.equal(upgraded.value.order.amountTotalCents, 20000);
    const upgradeCheckout = "cs_test_upgrade_" + randomUUID();
    await store.attachPublicOrderCheckout({orderId: upgraded.value.order.id, checkoutSessionId: upgradeCheckout, traceId: randomUUID()});
    await apply({...supervised.event, providerEventId: "evt_upgrade_paid_" + randomUUID(),
      orderId: upgraded.value.order.id, checkoutSessionId: upgradeCheckout,
      paymentIntentId: "pi_test_upgrade_" + randomUUID(), amountCents: 20000});
    await store.transitionPublicOrderFulfillment(action(upgraded.value.order.id, "START"));
    await db.update(tables.furlongPublicOrders).set({metadata: { reportArtifact: { ...frozen,
      status: "VERIFIED", objectKey: `public-orders/${upgraded.value.order.id}/${frozen.artifactId}.pdf` } }})
      .where(eq(tables.furlongPublicOrders.id, upgraded.value.order.id));
    const conflicting = await Promise.allSettled([
      store.transitionPublicOrderFulfillment(action(upgraded.value.order.id, "COMPLETE", frozen.artifactId)),
      apply({...creditSource.event, providerEventId: "evt_refund_" + randomUUID(),
        eventType: "charge.refunded", amountRefundedCents: 4900}),
    ]);
    assert.equal(conflicting[1].status, "fulfilled");
    const heldUpgrade = await store.loadPublicOrder({orderId: upgraded.value.order.id,
      buyerActorId: null, accessToken: upgraded.value.accessToken});
    assert.equal(heldUpgrade?.order.status, "HELD");
    await assert.rejects(store.transitionPublicOrderFulfillment(action(upgraded.value.order.id, "START")));

    console.log(JSON.stringify({ ok: true, synthetic: true, checks: ["agreement acceptance persisted", "event ledger append-only", "exclusion-only database completion", "stale exclusions rejected before persistence", "exclusion child-case lineage", "free negative findings before purchase", "saved evidence and recovery", "comparison ownership denial", "completed evidence JSONB round trip", "stale saved evidence denied", "concurrent webhook replay", "atomic automatic fulfillment",
      "missing artifact held", "cross-customer denial", "exact private PDF bytes", "changed object rejected",
      "refund revocation", "late payment cannot restore refund", "dispute revocation", "concurrent capacity limit", "different-event payment confirmation preserves fulfillment", "out-of-order pre-payment notifications cannot undo payment or refund", "payment during refund stays pending", "supervised completion replay", "supervised artifact required", "post-start cancellation denied", "single-use upgrade credit", "concurrent source-refund holds upgrade"] }));
  } finally {
    globalThis.fetch = originalFetch;
    await migrations.end();
    await db.$client.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
