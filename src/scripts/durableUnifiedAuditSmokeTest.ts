import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { auditEvents } from "@/db/schema";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { db } from "@/lib/db";
import { listAuditLedgerAdminRecords } from "@/lib/ledger/auditLedgerAdminStore";

async function main() {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required.");

  const suffix = randomUUID().slice(0, 8);
  const traceId = `audit-unified-smoke-${suffix}`;
  const moduleId = "audit-unified-smoke-module";
  const anonymousId = `anon-smoke-${suffix}`;

  const receipt = await writeAuditEvent({
    traceId,
    moduleId,
    anonymousId,
    eventType: "DURABLE_UNIFIED_AUDIT_SMOKE",
    entityType: "anonymous-token",
    entityId: anonymousId,
    decision: "VERIFY_DURABLE_SEARCH",
    payload: { anonymousId, traceId, moduleId, disposableSmokeEvidence: true },
    metadata: { traceId, moduleId, anonymousId, replayRef: traceId },
    classification: "RESTRICTED",
    source: moduleId,
  });

  assert.equal(receipt.mode, "durable-canonical");
  assert.equal(receipt.governance.durable, true);
  assert.match(receipt.eventHash, /^[0-9a-f]{64}$/);

  const [persisted] = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.id, receipt.id))
    .limit(1);
  assert.ok(persisted, "Durable audit row was not persisted.");
  assert.equal(persisted.eventHash, receipt.eventHash);
  assert.equal(persisted.prevHash, receipt.prevHash);

  const byTrace = await listAuditLedgerAdminRecords({
    traceId,
    includeCanonicalMeta: false,
    includeReplay: true,
    includeObservability: true,
  });
  assert.ok(byTrace.auditEvents.some((row) => row.id === receipt.id));

  const byModule = await listAuditLedgerAdminRecords({
    moduleId,
    includeCanonicalMeta: false,
    includeReplay: false,
    includeObservability: false,
  });
  assert.ok(byModule.auditEvents.some((row) => row.id === receipt.id));

  const byAnonymous = await listAuditLedgerAdminRecords({
    anonymousId,
    includeCanonicalMeta: false,
    includeReplay: false,
    includeObservability: false,
  });
  assert.ok(byAnonymous.auditEvents.some((row) => row.id === receipt.id));

  console.log(
    JSON.stringify(
      {
        ok: true,
        auditEventId: receipt.id,
        traceId,
        moduleId,
        anonymousId,
        eventHash: receipt.eventHash,
        prevHash: receipt.prevHash,
        traceMatches: byTrace.auditEvents.length,
        moduleMatches: byModule.auditEvents.length,
        anonymousMatches: byAnonymous.auditEvents.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
