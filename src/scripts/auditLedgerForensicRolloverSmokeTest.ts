import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  chainAppend,
  forensicRolloverLedger,
  verifyLedgerChain,
} from "@/lib/security/ledgerHashChain";

const directory = mkdtempSync(join(tmpdir(), "furlong-ledger-rollover-"));
const ledgerPath = join(directory, "audit-ledger.ndjson");

try {
  chainAppend(ledgerPath, { event: "ONE", value: 1 });
  chainAppend(ledgerPath, { event: "TWO", value: 2 });
  chainAppend(ledgerPath, { event: "THREE", value: 3 });
  const lines = readFileSync(ledgerPath, "utf8").trimEnd().split("\n");
  const tampered = JSON.parse(lines[1]) as Record<string, unknown>;
  tampered.value = 200;
  lines[1] = JSON.stringify(tampered);
  writeFileSync(ledgerPath, `${lines.join("\n")}\n`, { mode: 0o600 });

  const original = readFileSync(ledgerPath);
  const expectedHash = createHash("sha256").update(original).digest("hex");
  const before = verifyLedgerChain(ledgerPath);
  if (before.ok || before.brokenAt !== 1) {
    throw new Error(`Broken test ledger was not detected: ${JSON.stringify(before)}`);
  }

  const result = forensicRolloverLedger(ledgerPath, {
    preservedAt: "2026-07-22T00:00:00.000Z",
    actorId: "rollover-smoke-test",
    reason: "Deterministic forensic rollover smoke test.",
  });
  const archived = readFileSync(result.archivePath);
  if (!archived.equals(original) || result.originalSha256 !== expectedHash) {
    throw new Error("Forensic archive did not preserve the original bytes and digest.");
  }
  for (const protectedPath of [result.archivePath, result.manifestPath, result.newLedgerPath]) {
    if ((statSync(protectedPath).mode & 0o777) !== 0o600) {
      throw new Error("Forensic rollover artifacts must be owner-readable and owner-writable only.");
    }
  }

  const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8")) as Record<string, unknown>;
  if (manifest.originalSha256 !== expectedHash || manifest.brokenAtLine !== 2) {
    throw new Error("Forensic manifest does not describe the preserved ledger accurately.");
  }

  let verification = verifyLedgerChain(ledgerPath);
  if (!verification.ok || verification.chained !== 1) {
    throw new Error(`Replacement chain failed verification: ${JSON.stringify(verification)}`);
  }
  chainAppend(ledgerPath, { event: "POST_ROLLOVER_APPEND" });
  verification = verifyLedgerChain(ledgerPath);
  if (!verification.ok || verification.chained !== 2) {
    throw new Error(`Post-rollover append failed verification: ${JSON.stringify(verification)}`);
  }

  console.log(JSON.stringify({
    ok: true,
    originalPreserved: true,
    manifestVerified: true,
    replacementChainVerified: true,
    postRolloverAppendVerified: true,
    ownerOnlyPermissionsVerified: true,
  }, null, 2));
} finally {
  rmSync(directory, { recursive: true, force: true });
}
