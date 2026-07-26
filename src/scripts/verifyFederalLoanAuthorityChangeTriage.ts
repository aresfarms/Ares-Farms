import assert from "node:assert/strict";

import {
  FEDERAL_LOAN_AUTHORITY_CHANGE_TRIAGE_RULE,
  buildFederalAuthoritySemanticFingerprint,
  classifyFederalAuthorityChange,
} from "@/lib/governance/federalLoanAuthorityChangeTriage";
import { refreshFederalLoanAuthorities, type FederalLoanAuthorityMonitorState } from "@/lib/governance/federalLoanAuthorityMonitor";

async function main() {
const base = "Farm Operating Loans provide credit to eligible family farmers. The maximum loan amount is $400,000. Applicants must provide FSA Form 2001. Interest rates are published monthly.";
const cosmetic = `Home | About FSA | Contact Us. ${base} Updated site navigation.`;
const cosmeticPrevious = `Home | Programs | News. ${base} Previous site navigation.`;
const cosmeticResult = classifyFederalAuthorityChange({ previousText: cosmeticPrevious, nextText: cosmetic });
assert.equal(cosmeticResult.materiality, "COSMETIC");
assert.equal(cosmeticResult.disposition, "AUTO_CLEARED");

const informational = classifyFederalAuthorityChange({
  previousText: "Welcome to the agency. Office locations are listed below.",
  nextText: "Welcome to the agency. A new regional office opened this summer.",
});
assert.equal(informational.materiality, "INFORMATIONAL");
assert.equal(informational.disposition, "AUTO_CLEARED");

const lending = classifyFederalAuthorityChange({
  previousText: "The maximum loan amount is $400,000. Interest rates are published monthly.",
  nextText: "The maximum loan amount is $500,000. Interest rates are published monthly.",
});
assert.equal(lending.materiality, "LENDING_RELEVANT");
assert.equal(lending.disposition, "REVIEW_REQUIRED");

const material = classifyFederalAuthorityChange({
  previousText: "Eligible applicants must operate a family farm.",
  nextText: "Eligible applicants must operate a family farm and provide additional collateral.",
});
assert.equal(material.materiality, "LEGALLY_MATERIAL");
assert.equal(material.disposition, "REVIEW_REQUIRED");

const noHistory = classifyFederalAuthorityChange({
  previousText: null,
  nextText: "Eligible applicants must provide collateral and a personal guaranty.",
});
assert.equal(noHistory.disposition, "REVIEW_REQUIRED");
assert.ok(noHistory.reasonCodes.includes("PRIOR_SEMANTIC_BASELINE_MISSING"));

const priorState: FederalLoanAuthorityMonitorState = {
  schemaVersion: "federal-loan-authority-monitor-v1", lastRunAt: null, changes: [], runReceipts: [],
  documents: [{ documentId: "doc", agency: "SBA", kind: "PROGRAM_TERMS", url: "https://www.sba.gov/funding-programs/loans", contentType: "text/html", contentHash: "abc", etag: "etag", lastModified: null, title: "Loans", normalizedText: base, fetchedAt: "2026-07-26T00:00:00.000Z", firstObservedAt: "2026-07-26T00:00:00.000Z", changedAt: null, previousContentHash: null, status: "CURRENT", error: null }],
};
const notModifiedFetch = (async () => new Response(null, { status: 304 })) as typeof fetch;
const backfill = await refreshFederalLoanAuthorities({ now: "2026-07-26T01:00:00.000Z", fetchImpl: notModifiedFetch, seeds: [{ agency: "SBA", kind: "PROGRAM_TERMS", url: "https://www.sba.gov/funding-programs/loans", discoverLinks: false, required: true }], previousState: priorState, persist: false });
assert.equal(backfill.state.documents[0]?.semanticHash, buildFederalAuthoritySemanticFingerprint(base).semanticHash);

console.log(JSON.stringify({
  ok: true,
  rule: FEDERAL_LOAN_AUTHORITY_CHANGE_TRIAGE_RULE,
  cosmeticChangesAutoCleared: true,
  informationalChangesIsolated: true,
  lendingChangesHeld: true,
  legallyMaterialChangesElevated: true,
  missingHistoryFailsClosed: true,
  unchangedSnapshotSemanticBackfill: true,
}, null, 2));

}
main().catch((error) => { console.error(error); process.exit(1); });
