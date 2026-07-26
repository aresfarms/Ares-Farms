import assert from "node:assert/strict";
import fs from "node:fs";

import {
  composeGovernedUltimateProforma,
  GOVERNED_ULTIMATE_PROFORMA_RULE,
  type ProformaEvidenceItem,
} from "@/lib/governance/governedUltimateProforma";
import { generateLoanProformaPdf } from "@/lib/pdf/generateLoanProformaPdf";
import { syntheticUltimateProformaInput } from "@/scripts/verifyUltimateProforma";

const evidence: ProformaEvidenceItem[] = [
  { claimId: "identity.goodStanding", kind: "THIRD_PARTY_VERIFIED", sourceRef: "evidence://entity-good-standing", asOf: "2026-07-01", description: "Synthetic state good-standing evidence." },
  { claimId: "identity.ownership", kind: "BORROWER_ATTESTED", sourceRef: "evidence://ownership-schedule", asOf: "2026-06-30", description: "Synthetic ownership schedule." },
  { claimId: "sourcesUses", kind: "CALCULATED", sourceRef: "model://sources-uses-v1", asOf: "2026-07-26", description: "Sources and uses model." },
  { claimId: "collateral", kind: "THIRD_PARTY_VERIFIED", sourceRef: "evidence://collateral-valuations", asOf: "2026-06-30", description: "Synthetic collateral valuations." },
  { claimId: "guarantorPfs", kind: "BORROWER_ATTESTED", sourceRef: "evidence://pfs", asOf: "2026-06-30", description: "Synthetic guarantor PFS." },
  { claimId: "balanceSheet", kind: "BORROWER_ATTESTED", sourceRef: "evidence://balance-sheet", asOf: "2026-06-30", description: "Synthetic business balance sheet." },
  { claimId: "revenue", kind: "ASSUMPTION", sourceRef: "model://revenue-v1", asOf: "2026-07-26", description: "Synthetic conservative and stabilized revenue model." },
  { claimId: "workingCapital", kind: "CALCULATED", sourceRef: "model://working-capital-v1", asOf: "2026-07-26", description: "Synthetic working-capital model." },
  { claimId: "debtService", kind: "ASSUMPTION", sourceRef: "model://debt-service-v1", asOf: "2026-07-26", description: "Illustrative debt-service assumptions." },
  { claimId: "yearModel", kind: "CALCULATED", sourceRef: "model://year-model-v1", asOf: "2026-07-26", description: "Synthetic historical/projected model." },
  { claimId: "laneAuthority", kind: "OFFICIAL_SOURCE", sourceRef: "authority://sba-current-source-snapshot", asOf: "2026-07-26", description: "Current official SBA source snapshot." },
];


const routeSource = fs.readFileSync("src/app/api/reports/ultimate-proforma-pdf/route.ts", "utf8");
assert.match(routeSource, /getServerSession\(authOptions\)/);
assert.match(routeSource, /allowedRoles:\s*\["operator", "underwriter", "admin", "governance"\]/);
assert.ok(!routeSource.includes("allowedRoles: [\"borrower\""));
assert.ok(!routeSource.includes("allowedRoles: [\"lender\""));
assert.match(routeSource, /evaluateApplicationRecordAccess/);
assert.match(routeSource, /canonicalReportAuthority\.persist/);
assert.match(routeSource, /cache-control": "private, no-store/);
assert.match(routeSource, /x-furlong-external-delivery": "blocked"/);

const ready = composeGovernedUltimateProforma({
  proforma: syntheticUltimateProformaInput,
  evidence,
  humanReviewerId: "synthetic-reviewer",
  generatedAt: "2026-07-26T00:00:00.000Z",
});
assert.equal(ready.status, "READY_FOR_INTERNAL_REVIEW", ready.blockers.join("\n"));
assert.equal(ready.officialUseAllowed, false);
assert.equal(ready.externalDeliveryAllowed, false);
assert.equal(ready.humanReviewRequired, true);
assert.match(ready.packetSha256, /^[a-f0-9]{64}$/);
assert.match(ready.evidenceManifestSha256, /^[a-f0-9]{64}$/);
assert.ok(ready.document);

const badMath = structuredClone(syntheticUltimateProformaInput);
badMath.partI.sourcesAndUses.totalProjectCost = "$3,000,000";
const mathBlocked = composeGovernedUltimateProforma({ proforma: badMath, evidence, humanReviewerId: "reviewer", generatedAt: "2026-07-26T00:00:00.000Z" });
assert.ok(mathBlocked.blockers.includes("TOTAL_PROJECT_COST_MISMATCH"));
assert.equal(mathBlocked.document, null);

const pii = structuredClone(syntheticUltimateProformaInput);
pii.partI.identity.ownershipTable = "Jordan Sample — SSN 123-45-6789";
const piiBlocked = composeGovernedUltimateProforma({ proforma: pii, evidence, humanReviewerId: "reviewer", generatedAt: "2026-07-26T00:00:00.000Z" });
assert.ok(piiBlocked.blockers.includes("FULL_SENSITIVE_IDENTIFIER_PROHIBITED_IN_PDF"));

const stale = structuredClone(syntheticUltimateProformaInput);
stale.authority.reviewedAt = "2025-01-01";
const staleBlocked = composeGovernedUltimateProforma({ proforma: stale, evidence, humanReviewerId: "reviewer", generatedAt: "2026-07-26T00:00:00.000Z" });
assert.ok(staleBlocked.blockers.includes("PROGRAM_AUTHORITY_REVIEW_STALE"));

const overclaim = structuredClone(syntheticUltimateProformaInput);
overclaim.partII.eligibilityNarrative = "The borrower is eligible for funding and SBA approval.";
const claimBlocked = composeGovernedUltimateProforma({ proforma: overclaim, evidence, humanReviewerId: "reviewer", generatedAt: "2026-07-26T00:00:00.000Z" });
assert.ok(claimBlocked.blockers.some((blocker) => blocker.includes("PROHIBITED_PROGRAM_OR_APPROVAL_OVERCLAIM") || blocker.includes("CONTENT_CLAIM")));

assert.throws(() => generateLoanProformaPdf({ ...ready.document!, branding: { ...ready.document!.branding, logoPath: "/brand/../secret.png" } }), /controlled \/brand asset/);

const stream = generateLoanProformaPdf(ready.document!);
const chunks: Buffer[] = [];
stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
stream.on("end", () => {
  const bytes = Buffer.concat(chunks);
  assert.ok(bytes.length > 10_000);
  console.log(JSON.stringify({
    ok: true,
    rule: GOVERNED_ULTIMATE_PROFORMA_RULE,
    financialRecomputation: true,
    evidenceManifestRequired: true,
    fullSensitiveIdentifiersBlocked: true,
    currentAuthorityRequired: true,
    officialUseAllowed: false,
    externalDeliveryAllowed: false,
    pdfBytes: bytes.length,
    packetSha256: ready.packetSha256,
  }, null, 2));
});
