import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";


function firstJsonFile(directory: string): string {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      try { return firstJsonFile(candidate); } catch {}
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      return candidate;
    }
  }
  throw new Error("No evidence record file found.");
}

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function main() {
  const dir = mkdtempSync(path.join(tmpdir(), "furlong-release-diagnostics-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = dir;
  process.env.REPORT_SIGNING_SECRET = "diagnostics-smoke-secret";
  const store = await import("@/lib/governance/releaseGovernanceEvidenceStore");
  store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_LAUNCH_EVIDENCE_HOLD",
    scope: "platform",
    actorId: "diagnostics-smoke",
    replayRef: "diagnostics-smoke",
  });
  const recordsDir = path.join(dir, "governance", "release-governance-evidence-records");
  const file = firstJsonFile(recordsDir);
  const record = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  record.reviewNote = "tampered";
  writeFileSync(file, JSON.stringify(record, null, 2));
  writeFileSync(path.join(recordsDir, "malformed.json"), "{not-json");
  const summary = store.releaseGovernanceEvidenceIntegritySummary();
  assert(summary.acceptedRecords === 0, "Tampered evidence must not be accepted.");
  assert(summary.rejectedByReason.DIGEST_MISMATCH === 1, "Digest mismatch must be reported.");
  assert(summary.rejectedByReason.READ_ERROR === 1, "Unreadable JSON must be reported.");
  console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
  rmSync(dir, { recursive: true, force: true });
}

void main();
