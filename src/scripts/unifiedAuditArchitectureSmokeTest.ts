import assert from "node:assert/strict";
import fs from "node:fs";

const writer = fs.readFileSync("src/lib/audit/writeAuditEvent.ts", "utf8");
const ledgerWriter = fs.readFileSync(
  "src/lib/audit/writeAuditLedger.ts",
  "utf8",
);
const traceLoader = fs.readFileSync("src/lib/audit/auditLedger.ts", "utf8");
const adminStore = fs.readFileSync(
  "src/lib/ledger/auditLedgerAdminStore.ts",
  "utf8",
);
const adminRoute = fs.readFileSync("src/app/api/ledger/admin/route.ts", "utf8");
const anonymousStore = fs.readFileSync(
  "src/lib/borrower-experience/anonymousToken.ts",
  "utf8",
);

assert.match(writer, /pg_advisory_xact_lock/);
assert.match(writer, /tx\.insert\(auditEvents\)/);
assert.match(writer, /mode: "durable-canonical"/);
assert.doesNotMatch(writer, /migration-stabilization/);
assert.match(ledgerWriter, /writeAuditEvent/);
assert.doesNotMatch(ledgerWriter, /migration-stabilization/);
assert.match(traceLoader, /listAuditLedgerAdminRecords/);
assert.doesNotMatch(traceLoader, /TRACE_REPLAY_PLACEHOLDER/);
for (const field of ["traceId", "moduleId", "anonymousId"]) {
  assert.match(adminStore, new RegExp(field));
  assert.match(adminRoute, new RegExp(field));
}
assert.match(adminStore, /replayVerification/);
assert.match(adminStore, /observabilityEvents/);
assert.match(anonymousStore, /await writeAuditEvent/);
assert.match(anonymousStore, /zeroPii: true/);

console.log("✓ unified audit architecture smoke test passed");
