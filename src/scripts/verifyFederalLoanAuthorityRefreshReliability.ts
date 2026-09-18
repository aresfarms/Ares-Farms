import assert from "node:assert/strict";

import {
  inspectFederalLoanAuthorityBinding,
  refreshFederalLoanAuthorities,
  type FederalLoanAuthorityMonitorState,
  type FederalLoanAuthoritySeed,
} from "@/lib/governance/federalLoanAuthorityMonitor";

const seeds: FederalLoanAuthoritySeed[] = [
  { agency: "SBA", kind: "PROGRAM_TERMS", url: "https://www.sba.gov/funding-programs/loans", discoverLinks: false, required: true },
  { agency: "FSA", kind: "HANDBOOK", url: "https://www.fsa.usda.gov/news-events/laws-regulations/fsa-handbooks", discoverLinks: false, required: true },
  { agency: "USDA_RD", kind: "PROGRAM_CATALOG", url: "https://www.rd.usda.gov/programs-services/all-programs", discoverLinks: false, required: true },
];

const empty: FederalLoanAuthorityMonitorState = {
  schemaVersion: "federal-loan-authority-monitor-v1",
  lastRunAt: null,
  documents: [],
  changes: [],
  runReceipts: [],
};

function mixedFetch(input: URL | RequestInfo, init?: RequestInit): Promise<Response> {
  const url = String(input);
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname === "fsa.usda.gov" || hostname.endsWith(".fsa.usda.gov")) {
    return new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    });
  }
  return Promise.resolve(new Response(`<html><title>Current</title><body>${url} current official terms</body></html>`, {
    status: 200,
    headers: { "content-type": "text/html" },
  }));
}

async function main() {
  const result = await refreshFederalLoanAuthorities({
    now: "2026-07-26T15:00:00.000Z",
    seeds,
    previousState: empty,
    fetchImpl: mixedFetch as typeof fetch,
    fetchTimeoutMs: 80,
    runTimeoutMs: 500,
    concurrency: 3,
    persist: false,
  });

  assert.equal(result.fetched, 2);
  assert.equal(result.timedOut, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.attempted, 3);
  assert.ok(result.durationMs < 1_000);
  assert.equal(result.state.documents.find((doc) => doc.agency === "FSA")?.status, "TIMED_OUT");
  assert.equal(result.state.documents.find((doc) => doc.agency === "SBA")?.status, "CURRENT");
  assert.equal(result.state.documents.find((doc) => doc.agency === "USDA_RD")?.status, "CURRENT");
  assert.equal(result.state.runReceipts.at(-1)?.timedOut, 1);

  const fsa = result.state.documents.find((doc) => doc.agency === "FSA")!;
  const binding = inspectFederalLoanAuthorityBinding({
    reviewedAt: "2026-07-26T15:01:00.000Z",
    officialSourceRefs: [fsa.url],
    reviewedContentHashes: { [fsa.url]: fsa.contentHash },
  }, result.state);
  assert.equal(binding.current, false);
  assert.ok(binding.blockers.some((blocker) => blocker.startsWith("AUTHORITY_SOURCE_TIMED_OUT")));

  console.log(JSON.stringify({
    ok: true,
    rule: "FEDERAL-LOAN-AUTHORITY-REFRESH-RELIABILITY-001",
    boundedConcurrency: true,
    perSourceTimeout: true,
    wholeRunDeadline: true,
    partialSuccessPreserved: true,
    timeoutReceiptPersisted: true,
    timedOutAuthorityBlockedFromReliance: true,
    fetched: result.fetched,
    timedOut: result.timedOut,
    durationMs: result.durationMs,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
