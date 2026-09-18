import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-assurance-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = root;
  const connector =
    await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dry =
    await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation =
    await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const delivery =
    await import("../lib/property/officialEvidenceExternalNotificationDelivery");
  const assurance =
    await import("../lib/property/officialEvidenceExternalNotificationAssurance");
  const hash = "a".repeat(64);
  const reg = connector.registerExternalNotificationConnector({
    connectorId: "pager-primary",
    channel: "PAGER",
    implementationHash: hash,
    replayEvidence: "replay",
  });
  connector.decideExternalNotificationConnector({
    registrationId: reg.registrationId,
    decision: "APPROVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Approved",
  });
  dry.runExternalNotificationDryRun({
    connectorId: reg.connectorId,
    notificationId: "dry",
    severity: "P1",
    slaAction: "ASSIGN",
    occurredAt: "2026-01-01T00:00:00.000Z",
    send: () => ({ accepted: true, reference: "sandbox" }),
  });
  activation.decideExternalNotificationActivation({
    registrationId: reg.registrationId,
    action: "ACTIVATE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Activate",
  });
  const delivered = [] as any[];
  for (let i = 0; i < 3; i++) {
    delivered.push(
      ...delivery.deliverExternalNotificationLive({
        connectorId: reg.connectorId,
        notificationId: `live-${i}`,
        severity: "P1",
        slaAction: "ACK_BREACH",
        occurredAt: `2026-01-01T00:0${i}:00.000Z`,
        at: `2026-01-01T00:0${i}:00.000Z`,
        send: () => ({ accepted: true, reference: `provider-${i}` }),
        fallback: () => {},
      }),
    );
  }
  const first = delivered.find((x) => x.action === "DELIVERED");
  const ack = assurance.acknowledgeExternalNotificationDelivery({
    deliveryReceiptId: first.receiptId,
    providerReference: "ack-1",
    at: "2026-01-01T00:04:00.000Z",
  });
  assert.equal(ack.action, "ACKNOWLEDGED");
  const created = assurance.evaluateExternalNotificationAcknowledgments(
    "2026-01-01T01:00:00.000Z",
  );
  assert.equal(created.filter((x) => x.action === "ACK_TIMEOUT").length, 2);
  assert.equal(activation.liveExternalNotificationConnectors().length, 1);
  delivery.deliverExternalNotificationLive({
    connectorId: reg.connectorId,
    notificationId: "live-3",
    severity: "P1",
    slaAction: "ACK_BREACH",
    occurredAt: "2026-01-01T00:03:00.000Z",
    at: "2026-01-01T00:03:00.000Z",
    send: () => ({ accepted: true, reference: "provider-3" }),
    fallback: () => {},
  });
  const later = assurance.evaluateExternalNotificationAcknowledgments(
    "2026-01-01T01:00:00.000Z",
  );
  assert.ok(later.some((x) => x.action === "AUTO_SUSPEND"));
  assert.equal(activation.liveExternalNotificationConnectors().length, 0);
  const all = assurance.listExternalNotificationAssuranceReceipts();
  assert.equal(all.filter((x) => x.action === "ACK_TIMEOUT").length, 3);
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-ASSURANCE-001",
        actions: all.map((x) => x.action),
        liveAfterSuspend:
          activation.liveExternalNotificationConnectors().length > 0,
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
