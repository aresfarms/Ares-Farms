import fs from "fs";
import path from "path";

import { createEventHash } from "@/lib/ledger/cryptoSeal";

/**
 * Ledger Conformance Test
 *
 * Verifies the ledger proof surface: append-only ledger files, hash-chain
 * primitives, canonical schema, replay references, and admin-read evidence.
 */

const repoRoot = process.cwd();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function exists(pathname: string): boolean {
  return fs.existsSync(path.join(repoRoot, pathname));
}

function main() {
  const requiredFiles = [
    "src/lib/ledger/writeEvent.ts",
    "src/lib/ledger/verifyAuditChain.ts",
    "src/lib/ledger/replayCanonicalLedger.ts",
    "src/lib/ledger/ledgerContract.ts",
    "src/db/schema/canonicalLedger.ts",
    "src/db/schema/canonicalLedgerMeta.ts",
    "src/app/api/ledger/admin/route.ts",
    "src/scripts/ledgerAdminReadSmokeTest.ts",
  ];

  for (const pathname of requiredFiles) {
    assert(exists(pathname), `${pathname} is required for ledger conformance.`);
  }

  const event = {
    event_type: "LEDGER_CONFORMANCE",
    status: "TEST",
    replay_ref: "ledger-conformance",
  };
  const firstHash = createEventHash(event, null);
  const secondHash = createEventHash(event, firstHash);

  assert(firstHash.length === 64, "Ledger event hash must be SHA-256 length.");
  assert(secondHash.length === 64, "Ledger chained hash must be SHA-256 length.");
  assert(firstHash !== secondHash, "Ledger chained hash must include previous hash.");

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        requiredFiles: requiredFiles.length,
        hashLength: firstHash.length,
        message: "Ledger conformance test passed.",
      },
      null,
      2
    )
  );
}

main();
