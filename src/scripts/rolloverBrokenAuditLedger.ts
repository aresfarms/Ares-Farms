import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import {
  forensicRolloverLedger,
  verifyLedgerChain,
} from "@/lib/security/ledgerHashChain";

const execute = process.argv.includes("--execute");
const plan = process.argv.includes("--plan") || !execute;
const ledgerPath = canonicalLandRegisterAuthority.path;
const verification = verifyLedgerChain(ledgerPath);

if (plan) {
  console.log(JSON.stringify({
    ok: verification.ok,
    mode: "PLAN_ONLY",
    action: verification.ok ? "NONE" : "FORENSIC_ROLLOVER_REQUIRED",
    ledger: "audit-ledger.ndjson",
    verification,
    preservation: "The original file will be archived byte-for-byte; history will not be repaired or rewritten.",
    executeCommand: verification.ok ? null : "npm run audit-ledger:rollover",
  }, null, 2));
  process.exit(verification.ok ? 0 : 2);
}

if (verification.ok) {
  throw new Error("Audit ledger is intact; forensic rollover is not permitted.");
}

const result = forensicRolloverLedger(ledgerPath, {
  preservedAt: new Date().toISOString(),
  actorId: process.env.AUDIT_LEDGER_ROLLOVER_ACTOR?.trim() || "local-security-hardening",
  reason: "Historical hash-chain break preserved for forensic review; future writes continue on a new chain.",
});

console.log(JSON.stringify({
  ...result,
  archivePath: result.archivePath.replace(process.cwd(), "."),
  manifestPath: result.manifestPath.replace(process.cwd(), "."),
  newLedgerPath: result.newLedgerPath.replace(process.cwd(), "."),
}, null, 2));
