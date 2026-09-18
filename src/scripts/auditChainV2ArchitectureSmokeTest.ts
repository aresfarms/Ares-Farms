import assert from "node:assert/strict";
import fs from "node:fs";

const writer = fs.readFileSync("src/lib/audit/writeAuditEvent.ts", "utf8");
const hashing = fs.readFileSync("src/lib/audit/hashAuditEvent.ts", "utf8");
const migration = fs.readFileSync(
  "src/lib/db/migrations/0043_audit_chain_head_v2.sql",
  "utf8",
);
assert.match(writer, /audit_chain_heads/);
assert.match(writer, /for update/);
assert.match(writer, /MIGRATION:/);
assert.match(writer, /chainVersion: "audit-chain-v2"/);
assert.match(hashing, /Object\.entries\(value/);
assert.match(hashing, /sort\(/);
assert.match(migration, /PRIMARY KEY/);
console.log("✓ audit chain v2 architecture smoke test passed");
