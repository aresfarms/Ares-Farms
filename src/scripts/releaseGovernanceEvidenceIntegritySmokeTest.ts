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
  const dir = mkdtempSync(path.join(tmpdir(), "furlong-release-integrity-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = dir;
  process.env.REPORT_SIGNING_SECRET = "release-integrity-smoke-secret";
  const store = await import("@/lib/governance/releaseGovernanceEvidenceStore");
  const record = store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_LAUNCH_EVIDENCE_HOLD",
    scope: "platform",
    actorId: "integrity-test",
    reviewNote: "signed evidence",
    replayRef: "integrity-smoke",
  });
  assert(store.releaseGovernanceEvidenceFor("platform").length === 1, "Signed record was not readable.");
  const recordDir = path.join(dir, "governance", "release-governance-evidence-records");
  const filePath = firstJsonFile(recordDir);
  const altered = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  altered.reviewNote = "tampered evidence";
  writeFileSync(filePath, JSON.stringify(altered, null, 2));
  assert(store.releaseGovernanceEvidenceFor("platform").length === 0, "Tampered record must fail closed.");
  console.log(JSON.stringify({ ok: true, evidenceId: record.evidenceId, tamperedRecordsAccepted: 0 }, null, 2));
  rmSync(dir, { recursive: true, force: true });
}

void main();
