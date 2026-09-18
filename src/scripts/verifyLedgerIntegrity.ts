/**
 * verify:ledger-integrity — nightly hash-chain integrity check (control J).
 * Read-only (the monitor path is separate from the write path). Schedule via
 * Cloud Scheduler → Cloud Run Job in production. Fails (exit 1) on any break.
 */
import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import { verifyLedgerChain } from "@/lib/security/ledgerHashChain";
import * as path from "node:path";

const LEDGERS = [
  ["audit", canonicalLandRegisterAuthority.path],
  ["security-events", path.join(process.cwd(), "data", "security-events.ndjson")],
] as const;

let bad = 0;
for (const [name, p] of LEDGERS) {
  const r = verifyLedgerChain(p);
  if (r.ok) console.log(`  ✓ ${name}: ${r.chained} chained, ${r.legacy} legacy (grandfathered)`);
  else { console.error(`  ✗ ${name}: CHAIN BROKEN at line ${r.brokenAt} (${r.chained} verified before break)`); bad++; }
}
if (bad) { console.error(`\n✗ verify:ledger-integrity FAIL — ${bad} ledger(s) failed integrity.`); process.exit(1); }
console.log("\n✓ verify:ledger-integrity PASS — all hash chains intact.");
