import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
function ok(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-ext-dry-"),
  );
  const reg =
    await import("@/lib/property/officialEvidenceExternalNotificationConnector");
  const dry =
    await import("@/lib/property/officialEvidenceExternalNotificationDryRun");
  const h = createHash("sha256").update("impl").digest("hex");
  reg.registerExternalNotificationConnector({
    connectorId: "email-primary",
    channel: "EMAIL",
    implementationHash: h,
    replayEvidence: "replay",
  });
  let blocked = false;
  try {
    dry.runExternalNotificationDryRun({
      connectorId: "email-primary",
      notificationId: "n1",
      severity: "P1",
      slaAction: "ACK_BREACH",
      occurredAt: "2026-07-25T00:00:00Z",
      send: () => ({ accepted: true }),
    });
  } catch {
    blocked = true;
  }
  ok(blocked, "Unapproved connector must be blocked.");
  const r = reg.listExternalNotificationConnectorRegistrations()[0];
  reg.decideExternalNotificationConnector({
    registrationId: r.registrationId,
    decision: "APPROVE",
    actorId: "op",
    actorName: "Operator",
    reason: "Approve dry-run only.",
  });
  let calls = 0;
  const a = dry.runExternalNotificationDryRun({
    connectorId: "email-primary",
    notificationId: "n1",
    severity: "P1",
    slaAction: "ACK_BREACH",
    occurredAt: "2026-07-25T00:00:00Z",
    send: (p, k) => {
      calls++;
      ok(
        Object.keys(p).sort().join(",") ===
          "event,notificationId,occurredAt,severity",
        "Payload not minimal.",
      );
      ok(k.length === 64, "Missing idempotency key.");
      return { accepted: true, reference: "sandbox-1" };
    },
  });
  const b = dry.runExternalNotificationDryRun({
    connectorId: "email-primary",
    notificationId: "n1",
    severity: "P1",
    slaAction: "ACK_BREACH",
    occurredAt: "2026-07-25T00:00:00Z",
    send: () => {
      calls++;
      return { accepted: true };
    },
  });
  ok(a.receiptId === b.receiptId && calls === 1, "Dry run must be idempotent.");
  ok(
    !dry.externalNotificationLiveDeliveryPermitted() &&
      !a.liveDeliveryPermitted,
    "Dry run must not permit live delivery.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-DRY-RUN-001",
        blocked,
        calls,
        payloadFields: a.payloadFields,
        liveDeliveryPermitted: false,
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
