import assert from "node:assert/strict";
import fs from "node:fs";
const writer = fs.readFileSync("src/lib/audit/writeAuditEvent.ts", "utf8");
const route = fs.readFileSync("src/app/api/ledger/admin/route.ts", "utf8");
const mig = fs.readFileSync(
  "src/lib/db/migrations/0042_audit_search_and_reconciliation.sql",
  "utf8",
);
assert.match(writer, /actorRef/);
assert.match(writer, /normalizationStatus/);
assert.match(writer, /target/);
assert.match(route, /actorRef/);
assert.match(mig, /audit_reconciliation_spool/);
assert.match(mig, /audit_events_actor_ref_idx/);
console.log("✓ audit hardening architecture smoke test passed");
