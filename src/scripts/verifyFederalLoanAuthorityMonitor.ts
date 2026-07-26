import assert from "node:assert/strict";
import fs from "node:fs";

import {
  FEDERAL_LOAN_AUTHORITY_MONITOR_RULE,
  inspectFederalLoanAuthorityBinding,
  refreshFederalLoanAuthorities,
  type FederalLoanAuthorityMonitorState,
  type FederalLoanAuthoritySeed,
} from "@/lib/governance/federalLoanAuthorityMonitor";

const seedUrl = "https://www.sba.gov/funding-programs/loans";
const termsUrl = "https://www.sba.gov/partners/lenders/7a-loan-program/terms-conditions-eligibility";
const seeds: FederalLoanAuthoritySeed[] = [
  { agency: "SBA", url: seedUrl, kind: "PROGRAM_CATALOG", discoverLinks: true, required: true },
];

function mockFetch(version: "v1" | "v2" | "fail"): typeof fetch {
  return (async (input: URL | RequestInfo) => {
    const url = String(input);
    if (version === "fail") throw new Error("synthetic official-source outage");
    if (url === seedUrl) {
      return new Response(
        `<html><head><title>SBA Loans</title></head><body>
          <a href="${termsUrl}">7(a) loan terms and eligibility</a>
          <a href="https://evil.example/loan-rules">untrusted</a>
        </body></html>`,
        { status: 200, headers: { "content-type": "text/html", etag: '"seed-1"' } },
      );
    }
    if (url === termsUrl) {
      return new Response(
        `<html><head><title>7(a) Terms</title></head><body>${version === "v1" ? "75 percent guaranty" : "changed official requirement"}</body></html>`,
        { status: 200, headers: { "content-type": "text/html", etag: version === "v1" ? '"terms-1"' : '"terms-2"' } },
      );
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

const empty: FederalLoanAuthorityMonitorState = {
  schemaVersion: "federal-loan-authority-monitor-v1",
  lastRunAt: null,
  documents: [],
  changes: [],
  runReceipts: [],
};

async function main() {
const baseline = await refreshFederalLoanAuthorities({
  now: "2026-07-26T10:00:00.000Z",
  fetchImpl: mockFetch("v1"),
  seeds,
  previousState: empty,
  persist: false,
});
assert.equal(baseline.failed, 0);
assert.equal(baseline.changed, 0);
assert.equal(baseline.discovered, 1);
assert.equal(baseline.state.documents.length, 2);
assert.ok(baseline.state.documents.every((doc) => doc.status === "CURRENT"));
assert.ok(!baseline.state.documents.some((doc) => doc.url.includes("evil.example")));

const unchanged = await refreshFederalLoanAuthorities({
  now: "2026-07-26T11:00:00.000Z",
  fetchImpl: mockFetch("v1"),
  seeds,
  previousState: baseline.state,
  persist: false,
});
assert.equal(unchanged.changed, 0);

const changed = await refreshFederalLoanAuthorities({
  now: "2026-07-26T12:00:00.000Z",
  fetchImpl: mockFetch("v2"),
  seeds,
  previousState: unchanged.state,
  persist: false,
});
assert.equal(changed.changed, 1);
assert.equal(changed.changes[0]?.status, "REVIEW_REQUIRED");
const changedDoc = changed.state.documents.find((doc) => doc.url === termsUrl)!;
assert.equal(changedDoc.status, "CHANGED_REVIEW_REQUIRED");

const staleBinding = inspectFederalLoanAuthorityBinding({
  reviewedAt: "2026-07-26T11:30:00.000Z",
  officialSourceRefs: [termsUrl],
  reviewedContentHashes: { [termsUrl]: unchanged.state.documents.find((doc) => doc.url === termsUrl)!.contentHash },
}, changed.state);
assert.equal(staleBinding.current, false);
assert.ok(staleBinding.blockers.some((blocker) => blocker.startsWith("AUTHORITY_CHANGED_AFTER_REVIEW")));
assert.ok(staleBinding.blockers.some((blocker) => blocker.startsWith("AUTHORITY_HASH_MISMATCH")));

const rebound = inspectFederalLoanAuthorityBinding({
  reviewedAt: "2026-07-26T12:30:00.000Z",
  officialSourceRefs: [termsUrl],
  reviewedContentHashes: { [termsUrl]: changedDoc.contentHash },
}, changed.state);
assert.equal(rebound.current, true, rebound.blockers.join("\n"));

const failed = await refreshFederalLoanAuthorities({
  now: "2026-07-26T13:00:00.000Z",
  fetchImpl: mockFetch("fail"),
  seeds,
  previousState: changed.state,
  persist: false,
});
assert.equal(failed.failed, 1);
assert.equal(failed.state.documents.find((doc) => doc.url === seedUrl)?.status, "FETCH_FAILED");

const refreshSource = fs.readFileSync("src/lib/property/sourceRefresh.ts", "utf8");
assert.match(refreshSource, /refreshFederalLoanAuthorities/);
const routeSource = fs.readFileSync("src/app/api/reports/ultimate-proforma-pdf/route.ts", "utf8");
assert.match(routeSource, /inspectFederalLoanAuthorityBinding/);
assert.match(routeSource, /reconcileFederalLoanAuthority/);
assert.match(routeSource, /automatically reconciled content hashes/);

console.log(JSON.stringify({
  ok: true,
  rule: FEDERAL_LOAN_AUTHORITY_MONITOR_RULE,
  officialDomainsOnly: true,
  discoveryBounded: true,
  contentHashChangeDetection: true,
  changedAuthorityBlocksStaleReview: true,
  exactHashRebindingRequired: true,
  sourceRefreshIntegrated: true,
  proformaRuntimeIntegrated: true,
  baselineSnapshotSha256: baseline.snapshotSha256,
  changedSnapshotSha256: changed.snapshotSha256,
}, null, 2));

}

main().catch((error) => { console.error(error); process.exit(1); });
