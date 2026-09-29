import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import { basePackage } from "./fixtures/economicEvidence";
import { captureGeneratedEvidenceArtifactDurably } from "@/lib/property/durableEvidenceGenerationCapture";
import { verifySignedReplayPacket } from "@/lib/property/officialEvidenceReplayPacketStore";
import { automatedReportFixture } from "./fixtures/automatedReportFixture";
import { buildAutomatedPropertyReport, renderAutomatedPropertyReport, AutomatedReportNotReadyError, reportSnapshotDigest } from "@/lib/reports/automatedPropertyReport";
import { verifiedAutomatedReportForOrder, AUTOMATED_REPORT_BINDING_VERSION } from "@/lib/billing/publicAutomatedReportPolicy";
import { POST as attest } from "@/app/api/public/property-report-token/route";
import { POST as legacyPdf } from "@/app/api/public/property-report-pdf/route";

async function main() {
  assert.equal(reportSnapshotDigest({ b: 2, a: 1 }), reportSnapshotDigest({ a: 1, b: 2 }));
  const facts = automatedReportFixture();
  const input = { facts, requestedAddress: "123 Fixture Road, Testville, MD 00000", customerVision: "Diversified farm", generatedAt: new Date("2026-09-28T00:00:00Z") };
  const report = buildAutomatedPropertyReport(input);
  assert.equal(report.model.context.priceLabel, "Current asking price not established");
  assert.equal(report.model.tier.id, "paid");
  assert.equal(report.saleReadiness.allowed, false, "an investigation outline must never authorize payment");
  assert(report.model.conceptSummary.some(line => line.includes("Missing inputs are not treated as zero")));
  assert(report.model.honestUnknowns?.some(line => line.includes("operating budget")));
  assert.equal(buildAutomatedPropertyReport(input).modelDigest, report.modelDigest);
  assert.throws(() => buildAutomatedPropertyReport({ ...input, requestedAddress: "999 Other Road, Testville, MD 00000" }), AutomatedReportNotReadyError);
  for (const mutation of [
    (x: Record<string, unknown>) => { x.verification = { status: "blocked" }; },
    (x: Record<string, unknown>) => { (x.propertyRecord as Record<string, unknown>).recordBasis = "verified-address-only"; },
    (x: Record<string, unknown>) => { (x.propertyRecord as Record<string, unknown>).parcelRefs = []; },
    (x: Record<string, unknown>) => { (x.propertyRecord as Record<string, unknown>).propertyType = null; },
  ]) {
    const copy = structuredClone(facts); mutation(copy as unknown as Record<string, unknown>);
    assert.throws(() => buildAutomatedPropertyReport({ ...input, facts: copy }));
  }
  const packages = (["best-single-enterprise", "best-mixed-use", "best-distinct-alternative"] as const).map((role, index) => {
    const p = structuredClone(basePackage);
    p.propertyId = "synthetic-report-property"; p.address = input.requestedAddress;
    p.packageId = `fixture-package-${index}`; p.candidate = { ...p.candidate, id: `fixture-candidate-${index}`, candidateRole: role, title: `Synthetic candidate ${index}`, enterpriseComponents: index === 1 ? ["Synthetic use A", "Synthetic use B"] : ["Synthetic use A"] };
    return p;
  });
  const supported = buildAutomatedPropertyReport({ ...input, customerVision: null,
    economicEvidence: { propertyId: "synthetic-report-property", comparisonItemId: "fixture-item", packages } });
  assert.equal(supported.saleReadiness.allowed, true, JSON.stringify(supported.saleReadiness));
  assert(supported.model.conceptSummary.some(line => line.includes("NOI")));
  assert(!supported.model.honestUnknowns?.some(line => line.includes("Obtain a complete sourced operating budget")), "completed budget evidence must replace generic missing-budget text");
  assert(supported.model.laneAnswers?.lines.some(line => line.includes("operating-costs")));
  const chosen = buildAutomatedPropertyReport({ ...input, customerVision: packages[0].candidate.title,
    selectedReportCandidateId: packages[0].candidate.id,
    economicEvidence: { propertyId: "synthetic-report-property", comparisonItemId: "fixture-item", packages } });
  assert(chosen.saleReadiness.allowed, "a supported single use can be selected without creating a duplicate vision candidate");
  assert(chosen.model.executiveSummary.includes(packages[0].candidate.title));
  const unsupported = buildAutomatedPropertyReport({ ...input, customerVision: "Unrestricted custom idea", selectedReportCandidateId: "not-evaluated",
    economicEvidence: { propertyId: "synthetic-report-property", comparisonItemId: "fixture-item", packages } });
  assert(!unsupported.saleReadiness.allowed);
  assert(!supported.model.conceptSummary.some(line => line.includes("withheld")));
  const constrainedPackages = structuredClone(packages);
  constrainedPackages[0].constraints.zoning.status = "blocked";
  constrainedPackages[0].operations.baseAnnualRevenue.value = 9_000_000;
  const constrained = buildAutomatedPropertyReport({ ...input, customerVision: null,
    economicEvidence: { propertyId: "synthetic-report-property", comparisonItemId: "fixture-item", packages: constrainedPackages } });
  assert.equal(constrained.saleReadiness.allowed, true);
  assert(!constrained.model.scenarioComparison![0].includes("Synthetic candidate 0"), "a blocked use cannot rank ahead of viable uses on income");
  assert(constrained.model.scenarioComparison!.some(line => line.includes("Cannot proceed")));
  const stale = buildAutomatedPropertyReport({ ...input, customerVision: null, generatedAt: new Date("2028-01-01T00:00:00Z"),
    economicEvidence: { propertyId: "synthetic-report-property", comparisonItemId: "fixture-item", packages } });
  assert.equal(stale.saleReadiness.allowed, false, "source freshness must be evaluated at purchase time");
  const priorKey = process.env.EVIDENCE_REPLAY_SIGNING_SECRET;
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET = "synthetic-ephemeral-signing-key-for-unit-test";
  let persisted = false;
  await captureGeneratedEvidenceArtifactDurably({ kind: "property-report", propertyId: "synthetic-report-property",
    replayInput: { property: "synthetic" }, replayOutput: supported.model, authority: "CUSTOMER_ASSERTED" }, async record => {
    const result = record.replayVerification!.result!;
    assert.equal(verifySignedReplayPacket(result.packet as Parameters<typeof verifySignedReplayPacket>[0]).valid, true);
    assert.equal(record.replayVerification!.metadata!.authority, "CUSTOMER_ASSERTED");
    assert.equal(record.replayVerification!.verificationStatus, "CAPTURED_NOT_REPLAY_VERIFIED");
    persisted = true;
    return { ok: true, traceId: record.traceId, persisted: { versions: 0, classifications: 0, observability: 0, replayVerification: 1 }, evidenceStoreVersion: "test", persistedAt: input.generatedAt.toISOString() };
  });
  assert(persisted);
  if (priorKey === undefined) delete process.env.EVIDENCE_REPLAY_SIGNING_SECRET;
  else process.env.EVIDENCE_REPLAY_SIGNING_SECRET = priorKey;
  const pdf = await renderAutomatedPropertyReport(supported.model);
  assert(pdf.subarray(0, 5).toString() === "%PDF-");
  const document = await PDFDocument.load(pdf);
  assert(document.getPageCount() >= 2);

  const id = randomUUID(), artifactId = randomUUID(), sha = "a".repeat(64), evidence = "b".repeat(64);
  const order = { id, targetRef: "fixture-property", productCode: "focused_property_report", fulfillmentMode: "AUTOMATED",
    targetSnapshot: { reportArtifact: { reference: artifactId, digest: `sha256:${sha}`, generatedAt: input.generatedAt.toISOString() } },
    metadata: { automatedReport: { version: AUTOMATED_REPORT_BINDING_VERSION, orderId: id, targetRef: "fixture-property",
      artifactId, evidenceSha256: evidence, modelSha256: "c".repeat(64) },
    reportArtifact: { artifactId, status: "VERIFIED", mimeType: "application/pdf", byteSize: pdf.length,
      expectedSha256: sha, verifiedSha256: sha, storageGeneration: "123", createdAt: input.generatedAt.toISOString(), verifiedAt: input.generatedAt.toISOString(), objectKey: `public-orders/${id}/${artifactId}.pdf`,
      verification: { evidenceSha256: evidence, modelSha256: "c".repeat(64), malwareStatus: "clean", structuralSafety: true, storageReadbackVerified: true } } } };
  assert(verifiedAutomatedReportForOrder(order));
  for (const patch of [{ status: "AVAILABLE" }, { expectedSha256: "d".repeat(64) }, { storageGeneration: null },
    { objectKey: "another-customer/report.pdf" }, { byteSize: 0 }, { verification: { malwareStatus: "unavailable" } }]) {
    assert(!verifiedAutomatedReportForOrder({ ...order, metadata: { ...order.metadata, reportArtifact: { ...order.metadata.reportArtifact, ...patch } } }));
  }
  assert(!verifiedAutomatedReportForOrder({ ...order, id: randomUUID() }));
  assert(!verifiedAutomatedReportForOrder({ ...order, targetRef: "different-property" }));
  for (const handler of [attest, legacyPdf]) {
    const response = await handler(new NextRequest("http://localhost/api/public/property-report", {
      method: "POST", body: JSON.stringify({ report: report.model }), headers: { "Content-Type": "application/json" },
    }));
    assert.equal(response.status, 403, "legacy export cannot bypass paid report preparation");
  }
  const route = await readFile("src/app/api/public/purchases/checkout/route.ts", "utf8");
  assert(route.indexOf("await preparePublicAutomatedReport") < route.indexOf("const checkout = await stripe.checkout.sessions.create"));
  console.log(JSON.stringify({ ok: true, fixture: "SYNTHETIC", checks: ["identity mismatch rejected", "address-only refused", "missing evidence refused", "unknown income not fabricated", "deterministic model", "parseable multi-page PDF", "artifact ownership and integrity", "legacy paid export denied", "prepare precedes payment"], pdfPages: document.getPageCount() }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
