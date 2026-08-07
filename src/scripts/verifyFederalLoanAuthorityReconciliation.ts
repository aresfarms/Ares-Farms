import assert from "node:assert/strict";
import fs from "node:fs";

import {
  extractDeterministicProgramFacts,
  FEDERAL_LOAN_AUTHORITY_RECONCILIATION_RULE,
  reconcileFederalLoanAuthority,
} from "@/lib/governance/federalLoanAuthorityReconciliation";
import type {
  FederalLoanAuthorityDocument,
  FederalLoanAuthorityMonitorState,
} from "@/lib/governance/federalLoanAuthorityMonitor";
import { syntheticUltimateProformaInput } from "@/scripts/verifyUltimateProforma";

const sourceUrl = syntheticUltimateProformaInput.authority.officialSourceRefs[0];
const doc: FederalLoanAuthorityDocument = {
  documentId: "synthetic-sba-authority",
  agency: "SBA",
  kind: "PROGRAM_TERMS",
  url: sourceUrl,
  contentType: "text/html",
  contentHash: "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
  etag: '"synthetic-v2"',
  lastModified: "Sun, 26 Jul 2026 12:00:00 GMT",
  title: "Current 7(a) authority",
  normalizedText: "SBA Form 1919 revised 2026-07-01. Maximum loan amount $5,000,000. Guaranty up to 75%. Annual service fee 0.55%.",
  fetchedAt: "2026-07-26T12:00:00.000Z",
  firstObservedAt: "2026-07-26T10:00:00.000Z",
  changedAt: "2026-07-26T12:00:00.000Z",
  previousContentHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  status: "CHANGED_REVIEW_REQUIRED",
  error: null,
};
const state: FederalLoanAuthorityMonitorState = {
  schemaVersion: "federal-loan-authority-monitor-v1",
  lastRunAt: "2026-07-26T12:00:00.000Z",
  documents: [doc],
  changes: [],
  runReceipts: [],
};

const facts = extractDeterministicProgramFacts({
  document: doc,
  content: doc.normalizedText!,
  extractedAt: "2026-07-26T12:05:00.000Z",
});
assert.ok(facts.some((item) => item.type === "FORM_VERSION"));
assert.ok(facts.some((item) => item.type === "MAXIMUM_LOAN_AMOUNT"));
assert.ok(facts.some((item) => item.type === "GUARANTY_PERCENTAGE"));
assert.ok(facts.some((item) => item.type === "FEE"));
assert.ok(facts.every((item) => item.confidence === "DETERMINISTIC"));

const proforma = structuredClone(syntheticUltimateProformaInput);
proforma.authority.officialSourceRefs = [sourceUrl];
proforma.authority.reviewedContentHashes = {
  [sourceUrl]: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
};
const applied = reconcileFederalLoanAuthority({
  proforma,
  state,
  extractedFacts: facts,
  now: "2026-07-26T12:05:00.000Z",
});
assert.equal(applied.overlay.status, "AUTO_APPLIED", applied.overlay.blockers.join("\n"));
assert.equal(applied.overlay.reviewRequiredFactIds.length, 0);
assert.ok(applied.overlay.autoAppliedFactIds.length >= 4);
assert.equal(applied.proforma.authority.reviewedContentHashes[sourceUrl], doc.contentHash);
assert.match(applied.proforma.authority.formVersion, /1919/);
assert.ok((applied.proforma.authority.automaticProgramUpdates ?? []).length >= 4);

const materialText = "The applicant must provide new ownership and eligibility documentation before loan approval.";
const materialFacts = extractDeterministicProgramFacts({
  document: { ...doc, contentHash: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" },
  content: materialText,
  extractedAt: "2026-07-26T13:00:00.000Z",
});
assert.ok(materialFacts.some((item) => item.confidence === "REVIEW_REQUIRED"));
const held = reconcileFederalLoanAuthority({
  proforma,
  state: { ...state, documents: [{ ...doc, contentHash: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" }] },
  extractedFacts: materialFacts,
  now: "2026-07-26T13:00:00.000Z",
});
assert.equal(held.overlay.status, "REVIEW_REQUIRED");
assert.ok(held.overlay.blockers.includes("MATERIAL_OR_AMBIGUOUS_PROGRAM_CHANGE_REQUIRES_REVIEW"));

const route = fs.readFileSync("src/app/api/reports/ultimate-proforma-pdf/route.ts", "utf8");
assert.match(route, /reconcileFederalLoanAuthority/);
assert.match(route, /reconciliation\.overlay\.status === "REVIEW_REQUIRED"/);
assert.match(route, /proforma: reconciledProforma/);
const template = fs.readFileSync("src/lib/pdf/ultimateProformaTemplate.ts", "utf8");
assert.match(template, /CURRENT PROGRAM AUTHORITY — AUTOMATIC UPDATE OVERLAY/);

console.log(JSON.stringify({
  ok: true,
  rule: FEDERAL_LOAN_AUTHORITY_RECONCILIATION_RULE,
  deterministicChangesAutoApplied: true,
  proformaAuthorityHashesAutoRebound: true,
  currentAuthorityOverlayRendered: true,
  materialChangesRequireHumanReview: true,
  autoAppliedFacts: applied.overlay.autoAppliedFactIds.length,
  reviewRequiredFacts: held.overlay.reviewRequiredFactIds.length,
  overlaySha256: applied.overlay.overlaySha256,
}, null, 2));
