import { createHash, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { furlongPublicOrderEvents, furlongPublicOrders } from "@/db/schema";
import { db } from "@/lib/db";
import { isEnterpriseEconomicEvidencePackage } from "@/lib/intelligence/economicEvidencePackage";
import { resolvePropertyFacts } from "@/lib/property/propertyFactsService";
import { analyzeSignaturePdf } from "@/lib/signature-execution";
import { scanBytesForMalware } from "@/lib/documents/malwareScan";
import { DOCUMENT_STORAGE_PROVIDER, fetchObjectBytes, uploadImmutableObjectBytes } from "@/lib/documents/gcsResumableUpload";
import { AutomatedReportNotReadyError, AUTOMATED_PROPERTY_REPORT_VERSION, buildAutomatedPropertyReport, renderAutomatedPropertyReport, reportSnapshotDigest } from "@/lib/reports/automatedPropertyReport";
import { AUTOMATED_REPORT_BINDING_VERSION, verifiedAutomatedReportForOrder } from "@/lib/billing/publicAutomatedReportPolicy";
import type { PublicOrderReportArtifact } from "@/lib/billing/publicOrderReportArtifact";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Prepare before creating a payment session. Browser report bodies, object
 * references and digests are never inputs. A failure leaves payment unopened.
 */
export async function preparePublicAutomatedReport(input: {
  order: typeof furlongPublicOrders.$inferSelect;
  traceId: string;
}) {
  const { order } = input;
  if (order.productCode !== "focused_property_report" || order.fulfillmentMode !== "AUTOMATED" || order.status !== "CREATED") {
    throw new AutomatedReportNotReadyError(["This order cannot prepare an automated report."]);
  }
  const target = record(order.targetSnapshot);
  const exactAddress = typeof target.exactAddress === "string" ? target.exactAddress : "";
  const propertyId = typeof target.propertyId === "string" ? target.propertyId : null;
  const customerVision = typeof target.customerVision === "string" ? target.customerVision : null;
  const facts = await resolvePropertyFacts({ exactAddress, propertyId }, { fresh: true });
  const generatedAt = new Date();
  const captured = record(target.economicEvidence);
  const packages = Array.isArray(captured.packages) && captured.packages.every(isEnterpriseEconomicEvidencePackage) ? captured.packages : null;
  const economicEvidence = packages && typeof captured.propertyId === "string" && typeof captured.comparisonItemId === "string"
    ? { propertyId: captured.propertyId, comparisonItemId: captured.comparisonItemId, packages } : null;
  const report = buildAutomatedPropertyReport({ facts, requestedAddress: exactAddress, customerVision, generatedAt, economicEvidence });
  // A parseable PDF is not product acceptance. The current planning-only
  // engine cannot authorize a charge without complete server-owned economic
  // evidence. Review artifacts remain available through the internal script.
  if (!report.saleReadiness.allowed) throw new AutomatedReportNotReadyError(report.saleReadiness.reasons);
  const bytes = await renderAutomatedPropertyReport(report.model);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const malware = await scanBytesForMalware(bytes);
  if (malware.status !== "clean") {
    throw new AutomatedReportNotReadyError(["The report safety scan did not pass. No payment has been taken."]);
  }
  const pdf = await analyzeSignaturePdf({ bytes, malwareStatus: "CLEAN" });
  if (!pdf.parseable || !pdf.safeForOfflinePlanning) {
    throw new AutomatedReportNotReadyError(["The finished PDF did not pass structural verification."]);
  }
  const artifactId = randomUUID();
  const objectKey = `public-orders/${order.id}/${artifactId}.pdf`;
  const stored = await uploadImmutableObjectBytes({ objectKey, bytes, contentType: "application/pdf" });
  const readback = stored ? await fetchObjectBytes(objectKey, bytes.length, stored.generation) : null;
  if (!stored || !readback || readback.length !== bytes.length || createHash("sha256").update(readback).digest("hex") !== digest) {
    throw new AutomatedReportNotReadyError(["Private storage verification failed. No payment has been taken."]);
  }
  const verifiedAt = new Date();
  const artifact: PublicOrderReportArtifact = {
    artifactId, status: "VERIFIED", fileName: "Furlong-Property-Report.pdf", mimeType: "application/pdf",
    byteSize: bytes.length, expectedSha256: digest, verifiedSha256: digest, objectKey,
    storageProvider: DOCUMENT_STORAGE_PROVIDER, storageGeneration: stored.generation,
    createdAt: generatedAt.toISOString(), verifiedAt: verifiedAt.toISOString(), availableAt: null,
    firstDownloadedAt: null, lastDownloadedAt: null, downloadCount: 0,
    verification: { malwareStatus: "clean", structuralSafety: true, storageReadbackVerified: true,
      evidenceSha256: report.evidenceDigest, modelSha256: report.modelDigest, version: AUTOMATED_PROPERTY_REPORT_VERSION },
    sensitivity: { classificationLevel: "CONFIDENTIAL", sensitivityScope: "public-report-customer",
      sharingPermissions: ["purchaser", "authorized-furlong-operator"], exportRestrictions: ["order-bound-customer-download"],
      vaultRequirements: ["iam-private-object-storage"], retentionRequirements: ["retain-per-public-order-policy"],
      consentRequirements: ["accepted-public-order-agreement"], replayClassificationContext: "captured-with-artifact-event" },
  };
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${order.id}))`);
    const [current] = await tx.select().from(furlongPublicOrders).where(eq(furlongPublicOrders.id, order.id)).limit(1);
    if (!current || current.status !== "CREATED" || current.targetRef !== order.targetRef ||
        record(current.metadata).reportArtifact) {
      throw new AutomatedReportNotReadyError(["The order changed while the report was being prepared."]);
    }
    const binding = { version: AUTOMATED_REPORT_BINDING_VERSION, orderId: order.id, targetRef: order.targetRef,
      artifactId, evidenceSha256: report.evidenceDigest, modelSha256: report.modelDigest, generatedAt: generatedAt.toISOString() };
    const targetSnapshot = { ...record(current.targetSnapshot), reportArtifact: {
      reference: artifactId, digest: `sha256:${digest}`, generatedAt: generatedAt.toISOString(),
    } };
    const metadata = { ...record(current.metadata), reportArtifact: artifact, automatedReport: binding };
    if (!verifiedAutomatedReportForOrder({ ...current, metadata, targetSnapshot })) {
      throw new AutomatedReportNotReadyError(["Report-to-order verification failed."]);
    }
    const event = { binding, artifact, quality: report.quality, sourceSnapshot: { facts, economicEvidence }, reportModel: report.model };
    await tx.insert(furlongPublicOrderEvents).values({
      orderId: order.id, provider: "furlong-automated-report", providerEventId: `report-prepared:${order.id}`,
      eventType: "public_order.automated_report_prepared", eventStatus: "VERIFIED",
      payloadDigest: reportSnapshotDigest(event), governanceVersion: "furlong-public-order-v1.0.0",
      classification: "CONFIDENTIAL", replayRef: input.traceId, traceId: input.traceId,
      source: AUTOMATED_PROPERTY_REPORT_VERSION, metadata: event, occurredAt: verifiedAt,
    });
    const [updated] = await tx.update(furlongPublicOrders).set({ metadata, targetSnapshot,
      updatedAt: verifiedAt, traceId: input.traceId, replayRef: input.traceId })
      .where(eq(furlongPublicOrders.id, order.id)).returning();
    return updated;
  });
}
