import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function main() {
  const dir = mkdtempSync(path.join(tmpdir(), "furlong-release-integrity-cache-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = dir;
  process.env.REPORT_SIGNING_SECRET = "release-integrity-cache-test-secret";
  const store = await import("@/lib/governance/releaseGovernanceEvidenceStore");
  const generationPath = path.join(dir, "governance", "release-governance-evidence-generation.json");
  mkdirSync(path.dirname(generationPath), { recursive: true });
  writeFileSync(generationPath, JSON.stringify({ generation: "initial-test-generation" }));

  const first = store.releaseGovernanceEvidenceIntegritySummary();
  const second = store.releaseGovernanceEvidenceIntegritySummary();
  assert(first.cacheHit === false, "Initial integrity scan must not be a cache hit.");
  assert(second.cacheHit === true, "Repeated integrity scan should reuse the bounded cache.");
  assert(second.scannedAtUtc === first.scannedAtUtc, "Cached scan timestamp changed unexpectedly.");

  store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_LAUNCH_EVIDENCE_HOLD",
    scope: "platform",
    actorId: "cache-test",
    reviewNote: "cache invalidation test",
    replayRef: "release-integrity-cache-test",
  });
  const afterWrite = store.releaseGovernanceEvidenceIntegritySummary();
  assert(afterWrite.cacheHit === false, "Evidence write must invalidate the integrity cache.");
  assert(afterWrite.acceptedRecords === 1, "Post-write integrity scan did not see the new record.");

  const cachedAfterWrite = store.releaseGovernanceEvidenceIntegritySummary();
  assert(cachedAfterWrite.cacheHit === true, "Post-write repeated scan should reuse the cache.");

  writeFileSync(generationPath, JSON.stringify({ generation: "external-instance-change" }));
  const afterExternalWrite = store.releaseGovernanceEvidenceIntegritySummary();
  assert(afterExternalWrite.cacheHit === false, "Shared generation change must invalidate another instance cache.");

  const forced = store.releaseGovernanceEvidenceIntegritySummary({ forceRefresh: true });
  assert(forced.cacheHit === false, "Forced integrity refresh must bypass the cache.");
  assert(forced.acceptedRecords === 1, "Forced integrity refresh changed accepted count.");

  writeFileSync(generationPath, "not-json");
  const unreadableFirst = store.releaseGovernanceEvidenceIntegritySummary();
  const unreadableSecond = store.releaseGovernanceEvidenceIntegritySummary();
  assert(unreadableFirst.sharedGenerationStatus === "UNREADABLE", "Malformed marker must report UNREADABLE.");
  assert(unreadableSecond.cacheHit === false, "Unreadable shared marker must disable cache reuse.");
  rmSync(generationPath, { force: true });
  const missingFirst = store.releaseGovernanceEvidenceIntegritySummary();
  const missingSecond = store.releaseGovernanceEvidenceIntegritySummary();
  assert(missingFirst.sharedGenerationStatus === "MISSING", "Missing marker must report MISSING.");
  assert(missingSecond.cacheHit === false, "Missing shared marker must disable cache reuse.");
  mkdirSync(path.dirname(generationPath), { recursive: true });

  console.log(JSON.stringify({
    ok: true,
    cacheTtlMs: forced.cacheTtlMs,
    repeatedReadCacheHit: second.cacheHit,
    writeInvalidatedCache: !afterWrite.cacheHit,
    sharedGenerationInvalidatedCache: !afterExternalWrite.cacheHit,
    forcedRefreshCacheHit: forced.cacheHit,
    unreadableMarkerCacheHit: unreadableSecond.cacheHit,
    missingMarkerCacheHit: missingSecond.cacheHit,
  }, null, 2));
  rmSync(dir, { recursive: true, force: true });
}

void main();
