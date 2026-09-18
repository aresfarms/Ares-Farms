import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-step3t-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = dir;
  const connector =
    await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dry =
    await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation =
    await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const delivery =
    await import("../lib/property/officialEvidenceExternalNotificationDelivery");
  const implementationHash = "d".repeat(64);
  const registration = connector.registerExternalNotificationConnector({
    connectorId: "test-email",
    channel: "EMAIL",
    implementationHash,
    replayEvidence: "replay",
  });
  connector.decideExternalNotificationConnector({
    registrationId: registration.registrationId,
    decision: "APPROVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "test approval",
  });
  dry.runExternalNotificationDryRun({
    connectorId: "test-email",
    notificationId: "dry-1",
    severity: "P1",
    slaAction: "ASSIGN",
    occurredAt: "2026-07-25T00:00:00Z",
    send: () => ({ accepted: true, reference: "sandbox" }),
  });
  activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "ACTIVATE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "test activation",
  });
  let calls = 0,
    fallbacks = 0;
  const accepted = delivery.deliverExternalNotificationLive({
    connectorId: "test-email",
    notificationId: "live-1",
    severity: "P1",
    slaAction: "ACK_BREACH",
    occurredAt: "2026-07-25T01:00:00Z",
    send: (payload) => {
      calls++;
      assert.deepEqual(Object.keys(payload).sort(), [
        "event",
        "notificationId",
        "occurredAt",
        "severity",
      ]);
      return { accepted: true, reference: "provider-1" };
    },
    fallback: () => {
      fallbacks++;
    },
  });
  assert.equal(accepted.at(-1)?.action, "DELIVERED");
  delivery.deliverExternalNotificationLive({
    connectorId: "test-email",
    notificationId: "live-1",
    severity: "P1",
    slaAction: "ACK_BREACH",
    occurredAt: "2026-07-25T01:00:00Z",
    send: () => {
      calls++;
      return { accepted: true };
    },
    fallback: () => {
      fallbacks++;
    },
  });
  assert.equal(calls, 1);
  const rejected = delivery.deliverExternalNotificationLive({
    connectorId: "test-email",
    notificationId: "live-2",
    severity: "P2",
    slaAction: "ASSIGN",
    occurredAt: "2026-07-25T02:00:00Z",
    send: () => ({ accepted: false }),
    fallback: () => {
      fallbacks++;
    },
  });
  assert.equal(rejected.at(-1)?.action, "INTERNAL_FALLBACK");
  assert.equal(fallbacks, 1);
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-DELIVERY-001",
        calls,
        fallbacks,
        actions: delivery
          .listExternalNotificationDeliveryReceipts()
          .map((x) => x.action),
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
