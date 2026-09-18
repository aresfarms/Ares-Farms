import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function runWriter(stateDirectory: string, writerId: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "src/scripts/releaseGovernanceEvidenceConcurrentWriter.ts", stateDirectory, String(writerId)],
      { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] }
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`writer ${writerId} exited ${code}: ${stderr}`));
    });
  });
}

async function main() {
  const dir = mkdtempSync(path.join(tmpdir(), "furlong-release-concurrency-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = dir;
  const writerCount = 24;
  await Promise.all(Array.from({ length: writerCount }, (_, index) => runWriter(dir, index)));
  const store = await import("@/lib/governance/releaseGovernanceEvidenceStore");
  const records = store.releaseGovernanceEvidenceFor("concurrency-test", "PRODUCTION_LAUNCH_EVIDENCE_HOLD");
  assert(records.length === writerCount, `Expected ${writerCount} records, found ${records.length}.`);
  assert(new Set(records.map((record) => record.evidenceId)).size === writerCount, "Concurrent records must have unique evidence IDs.");
  console.log(JSON.stringify({ ok: true, writers: writerCount, records: records.length, lostUpdates: 0 }, null, 2));
  rmSync(dir, { recursive: true, force: true });
}

void main();
