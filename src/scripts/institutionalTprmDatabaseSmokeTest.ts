import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";

import { hashAuditEvent } from "@/lib/audit/hashAuditEvent";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { db } from "@/lib/db";
import { listAuditLedgerAdminRecords } from "@/lib/ledger/auditLedgerAdminStore";

type Row = Record<string, unknown>;
const text = (value: unknown) =>
  value === null || value === undefined ? null : String(value);

async function main() {
  assert.ok(process.env.DATABASE_URL);
  const suffix = randomUUID().slice(0, 8);
  const moduleId = "tprm-ledger-stress-v2";
  const actorRef = `anon:tprm-v2-${suffix}`;
  const anonymousId = `tprm-v2-${suffix}`;

  const receipts = await Promise.all(
    Array.from({ length: 50 }, (_, index) =>
      writeAuditEvent({
        moduleId,
        traceId: `tprm-v2-${suffix}-${index}`,
        actorRef,
        target: { type: "tprm_fixture", id: String(index) },
        anonymousId,
        eventType: "TPRM_CONCURRENCY_TEST_V2",
        entityType: "tprm_fixture",
        entityId: String(index),
        decision: "TEST_ONLY",
        payload: { fixture: true, index },
        classification: "RESTRICTED",
        source: moduleId,
      }),
    ),
  );
  assert.equal(new Set(receipts.map((receipt) => receipt.id)).size, 50);
  assert.ok(
    receipts.every((receipt) => receipt.chainVersion === "audit-chain-v2"),
  );

  const hashes = new Set(receipts.map((receipt) => receipt.eventHash));
  const roots = receipts.filter((receipt) => !hashes.has(receipt.prevHash));
  assert.equal(
    roots.length,
    1,
    `Expected one test-chain root, found ${roots.length}`,
  );
  const children = new Map<string, typeof receipts>();
  for (const receipt of receipts) {
    const list = children.get(receipt.prevHash) ?? [];
    list.push(receipt);
    children.set(receipt.prevHash, list);
  }
  assert.ok(
    [...children.values()].every((list) => list.length === 1),
    "Fork detected in v2 receipts",
  );
  let cursor = roots[0];
  let reachable = 1;
  while (children.has(cursor.eventHash)) {
    cursor = children.get(cursor.eventHash)![0];
    reachable += 1;
  }
  assert.equal(reachable, 50);

  const headResult = await db.execute(sql`
    select head_event_id, head_hash, chain_version, anchor_manifest_hash
    from audit_chain_heads where chain_name = 'audit_events_v2'
  `);
  const head = headResult.rows[0] as Row;
  assert.equal(text(head.head_event_id), cursor.id);
  assert.equal(text(head.head_hash), cursor.eventHash);
  assert.equal(text(head.chain_version), "audit-chain-v2");
  assert.match(text(head.anchor_manifest_hash) ?? "", /^[0-9a-f]{64}$/);

  const rowsResult = await db.execute(sql`
    select id, event_type, entity_type, entity_id, decision, classification, source,
           payload, trace, prev_hash, event_hash, created_at
    from audit_events
    where source = ${moduleId} and trace->>'actorRef' = ${actorRef}
  `);
  assert.equal(rowsResult.rows.length, 50);
  for (const raw of rowsResult.rows as Row[]) {
    const rebuilt = hashAuditEvent({
      prev_hash: text(raw.prev_hash),
      payload: {
        id: text(raw.id),
        timestamp: new Date(String(raw.created_at)).toISOString(),
        eventType: text(raw.event_type),
        entityType: text(raw.entity_type),
        entityId: text(raw.entity_id),
        decision: text(raw.decision),
        classification: text(raw.classification),
        source: text(raw.source),
        canonicalPayload: raw.payload,
        trace: raw.trace,
      },
    });
    assert.equal(
      rebuilt,
      text(raw.event_hash),
      `Hash mismatch for ${text(raw.id)}`,
    );
  }

  const found = await listAuditLedgerAdminRecords({
    actorRef,
    moduleId,
    limit: 100,
    includeCanonicalMeta: false,
    includeReplay: false,
    includeObservability: false,
  });
  assert.equal(found.auditEvents.length, 50);

  const indexRows = await db.execute(sql`
    select indexname from pg_indexes where schemaname='public' and indexname in
    ('audit_events_actor_ref_idx','audit_events_trace_id_idx','audit_events_module_id_idx',
     'audit_events_anonymous_id_idx','audit_reconciliation_spool_status_idx')
  `);
  assert.equal(indexRows.rows.length, 5);
  const pii = await db.execute(sql`
    select count(*)::int as count from audit_events where created_at > now()-interval '30 days'
    and (coalesce(payload::text,'') ~* '[0-9]{3}-[0-9]{2}-[0-9]{4}'
      or coalesce(payload::text,'') ~* '[0-9]{13,19}')
  `);
  const severe = Number((pii.rows[0] as Row).count);
  assert.equal(severe, 0, `PII-like high-risk values found: ${severe}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        concurrentWrites: 50,
        reachableEvents: reachable,
        forks: 0,
        recomputedHashes: rowsResult.rows.length,
        actorRefMatches: found.auditEvents.length,
        chainHead: head.head_hash,
        anchorManifestHash: head.anchor_manifest_hash,
        indexes: indexRows.rows,
        highRiskPiiMatches: severe,
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
