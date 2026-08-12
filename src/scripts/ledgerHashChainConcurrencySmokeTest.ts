import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { verifyLedgerChain } from "@/lib/security/ledgerHashChain";

const execute = promisify(execFile);
const workerCount = 6;
const recordsPerWorker = 30;
const workerSource = `
  import { chainAppend } from "./src/lib/security/ledgerHashChain.ts";
  const filePath = process.env.TEST_LEDGER_PATH;
  const workerId = process.env.TEST_LEDGER_WORKER;
  if (!filePath || !workerId) throw new Error("Missing concurrency-test worker configuration.");
  for (let index = 0; index < ${recordsPerWorker}; index += 1) {
    chainAppend(filePath, { workerId, index, event: "CONCURRENCY_TEST" });
  }
`;

async function main(): Promise<void> {
  const tempDirectory = await mkdtemp(join(tmpdir(), "furlong-ledger-concurrency-"));
  const ledgerPath = join(tempDirectory, "audit-ledger.ndjson");

  try {
    await Promise.all(
      Array.from({ length: workerCount }, (_, workerIndex) =>
        execute(
          process.execPath,
          ["--import", "tsx", "--input-type=module", "--eval", workerSource],
          {
            cwd: process.cwd(),
            env: {
              ...process.env,
              TEST_LEDGER_PATH: ledgerPath,
              TEST_LEDGER_WORKER: String(workerIndex),
            },
            timeout: 30_000,
            maxBuffer: 1024 * 1024,
          }
        )
      )
    );

    const lines = (await readFile(ledgerPath, "utf8")).split("\n").filter(Boolean);
    const verification = verifyLedgerChain(ledgerPath);
    const expectedRecords = workerCount * recordsPerWorker;
    if (lines.length !== expectedRecords) {
      throw new Error(`Expected ${expectedRecords} records; found ${lines.length}.`);
    }
    if (!verification.ok || verification.chained !== expectedRecords) {
      throw new Error(`Concurrent ledger chain failed verification: ${JSON.stringify(verification)}`);
    }

    console.log(JSON.stringify({
      ok: true,
      workerCount,
      recordsPerWorker,
      chainedRecords: verification.chained,
      message: "Concurrent ledger append integrity passed.",
    }, null, 2));
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
