import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { degrees, PDFDocument, StandardFonts } from "pdf-lib";
import {
  SIGNATURE_BLOCKER_CODES, SIGNATURE_EXECUTION_DOCTRINE, SIGNATURE_EXECUTION_STATES,
  analyzeSignaturePdf, assertSignatureTransition, captureMockSignature, evaluateExecutionGate,
  finalizeOfflineExecutedPdf, planSignaturePlacement, productionExecutionFacts, signatureSha256,
  validateExecutedPdf,
} from "@/lib/signature-execution";

const outputDir = path.resolve("tmp/signature-execution-fixtures");

async function fixture(text: string, rotate = false) {
  const pdf = await PDFDocument.create(); const page = pdf.addPage([612, 792]);
  if (rotate) page.setRotation(degrees(90));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 72, y: 700, font, size: 12 });
  return pdf.save({ useObjectStreams: false });
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  assert.equal(SIGNATURE_BLOCKER_CODES.length, 20);
  assert.equal(SIGNATURE_EXECUTION_STATES.length, 28);
  assert.equal(SIGNATURE_EXECUTION_DOCTRINE.liveSigningBlocked, true);
  assertSignatureTransition("DRAFT", "PREPARING");
  assert.throws(() => assertSignatureTransition("DRAFT", "EXECUTED"));

  const source = await fixture("Third-party lender instrument — preserved source page");
  const analysis = await analyzeSignaturePdf({ bytes: source, malwareStatus: "CLEAN" });
  assert.equal(analysis.safeForOfflinePlanning, true);
  const plan = planSignaturePlacement({ analysis, profile: "THIRD_PARTY", signerRole: "customer" });
  assert.equal(plan.marginMarker.applied, false);
  assert.equal(plan.appendExecutionPage, true);
  const capture = captureMockSignature({ executionId: "exec-fixture-001", documentSha256: analysis.sourceSha256, signerName: "Test Signer", capacity: "Authorized representative", authorizedAt: "2026-08-06T12:00:00.000Z" });
  const finalized = await finalizeOfflineExecutedPdf({ sourceBytes: source, plan, evidence: {
    executionId: "exec-fixture-001", signerName: "Test Signer", capacity: "Authorized representative",
    representedParty: "Fixture Organization", signedAtIso: "2026-08-06T12:00:00.000Z", timezone: "UTC",
    sourceSha256: analysis.sourceSha256, authorityRef: "fixture-authority-v1", consentRef: "fixture-consent-v1",
    intentRef: "fixture-intent-v1", reviewRef: "fixture-review-v1", captureRef: capture.captureId,
  } });
  const report = await validateExecutedPdf({ sourceBytes: source, executedBytes: finalized.bytes, plan });
  assert.equal(report.valid, true); assert.equal(report.pageCount, 2); assert.equal(finalized.canonicalSinglePdf, true);
  await writeFile(path.join(outputDir, "third-party-executed-offline-test.pdf"), finalized.bytes);

  const authored = await fixture("Furlong-authored fixture with certified empty signature zone");
  const authoredAnalysis = await analyzeSignaturePdf({ bytes: authored, malwareStatus: "CLEAN" });
  const authoredPlan = planSignaturePlacement({ analysis: authoredAnalysis, profile: "FURLONG_AUTHORED", templateId: "furlong-generic-instrument", templateVersion: "v1", signerRole: "customer" });
  assert.equal(authoredPlan.blockerCodes.length, 0);
  const authoredResult = await finalizeOfflineExecutedPdf({ sourceBytes: authored, plan: authoredPlan, evidence: {
    executionId: "exec-fixture-002", signerName: "Test Customer", capacity: "Self", signedAtIso: "2026-08-06T12:00:00.000Z", timezone: "UTC",
    sourceSha256: authoredAnalysis.sourceSha256, authorityRef: "self-fixture", consentRef: "fixture-consent-v1", intentRef: "fixture-intent-v1", reviewRef: "fixture-review-v1", captureRef: "mock-fixture",
  } });
  assert.equal((await validateExecutedPdf({ sourceBytes: authored, executedBytes: authoredResult.bytes, plan: authoredPlan })).valid, true);
  await writeFile(path.join(outputDir, "furlong-authored-executed-offline-test.pdf"), authoredResult.bytes);

  const changed = new Uint8Array(source); changed[changed.length - 2] ^= 1;
  await assert.rejects(() => finalizeOfflineExecutedPdf({ sourceBytes: changed, plan, evidence: { executionId: "x", signerName: "x", capacity: "x", signedAtIso: "x", timezone: "UTC", sourceSha256: analysis.sourceSha256, authorityRef: "x", consentRef: "x", intentRef: "x", reviewRef: "x", captureRef: "x" } }), /SIG_DOC_HASH_MISMATCH/);
  const unsafe = new Uint8Array([...source, ...Buffer.from("\n/JavaScript /S /Launch /EmbeddedFile /FT /Sig /ByteRange [0 1 2 3]")]);
  const unsafeAnalysis = await analyzeSignaturePdf({ bytes: unsafe, malwareStatus: "CLEAN" });
  assert(unsafeAnalysis.blockerCodes.includes("SIG_DOC_UNSUPPORTED"));
  assert(unsafeAnalysis.blockerCodes.includes("SIG_EXISTING_SIGNATURE_CONFLICT"));
  const pendingScan = await analyzeSignaturePdf({ bytes: source, malwareStatus: "PENDING" });
  assert.equal(pendingScan.safeForOfflinePlanning, false);

  const blocked = evaluateExecutionGate(productionExecutionFacts({ documentIntegrity: true }));
  assert.equal(blocked.allowed, false); assert(blocked.blockerCodes.includes("SIG_PROMOTION_INACTIVE"));
  const fixtureAllowed = evaluateExecutionGate(productionExecutionFacts({ documentIntegrity: true, transactionOverlayApproved: true, identityVerified: true, authorityValid: true, disclosureValid: true, intentValid: true, placementValid: true, humanReviewValid: true, providerCertified: true, classificationAllowed: true, idempotencyHealthy: true, replayHealthy: true, promotionActive: true }));
  assert.equal(fixtureAllowed.allowed, true);
  console.log(JSON.stringify({ ok: true, doctrine: SIGNATURE_EXECUTION_DOCTRINE.version, sourceSha256: signatureSha256(source), executedSha256: finalized.executedSha256, fixtures: outputDir }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
