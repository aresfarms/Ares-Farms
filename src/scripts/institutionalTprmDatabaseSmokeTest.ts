import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { listAuditLedgerAdminRecords } from "@/lib/ledger/auditLedgerAdminStore";
async function main() {
  assert.ok(process.env.DATABASE_URL);
  const suffix = randomUUID().slice(0, 8),
    moduleId = "tprm-ledger-stress",
    actorRef = `anon:tprm-${suffix}`;
  const receipts = await Promise.all(
    Array.from({ length: 50 }, (_, i) =>
      writeAuditEvent({
        moduleId,
        traceId: `tprm-${suffix}-${i}`,
        actorRef,
        target: { type: "tprm_fixture", id: String(i) },
        anonymousId: `tprm-${suffix}`,
        eventType: "TPRM_CONCURRENCY_TEST",
        entityType: "tprm_fixture",
        entityId: String(i),
        decision: "TEST_ONLY",
        payload: { fixture: true, index: i },
        classification: "RESTRICTED",
        source: moduleId,
      }),
    ),
  );
  assert.equal(new Set(receipts.map((r) => r.id)).size, 50);
  const found = await listAuditLedgerAdminRecords({
    actorRef,
    moduleId,
    limit: 100,
    includeCanonicalMeta: false,
    includeReplay: false,
    includeObservability: false,
  });
  assert.equal(found.auditEvents.length, 50);
  const indexRows = await db.execute(
    sql`select indexname from pg_indexes where schemaname='public' and indexname in ('audit_events_actor_ref_idx','audit_events_trace_id_idx','audit_events_module_id_idx','audit_events_anonymous_id_idx','audit_reconciliation_spool_status_idx')`,
  );
  assert.equal(indexRows.rows.length, 5);
  const pii = await db.execute(
    sql`select count(*)::int as count from audit_events where created_at > now()-interval '30 days' and (coalesce(payload::text,'') ~* '[0-9]{3}-[0-9]{2}-[0-9]{4}' or coalesce(payload::text,'') ~* '[0-9]{13,19}')`,
  );
  const severe = Number((pii.rows[0] as any).count);
  assert.equal(severe, 0, `PII-like high-risk values found: ${severe}`);
  console.log(
    JSON.stringify(
      {
        ok: true,
        concurrentWrites: 50,
        actorRefMatches: found.auditEvents.length,
        indexes: indexRows.rows,
        highRiskPiiMatches: severe,
        firstHash: receipts[0].eventHash,
        lastHash: receipts.at(-1)?.eventHash,
      },
      null,
      2,
    ),
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
