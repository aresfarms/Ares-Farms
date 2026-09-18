import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-reinstate-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = root;
  const connector =
    await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dry =
    await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation =
    await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const assurance =
    await import("../lib/property/officialEvidenceExternalNotificationAssurance");
  const reinstatement =
    await import("../lib/property/officialEvidenceExternalNotificationReinstatement");
  const delivery =
    await import("../lib/property/officialEvidenceExternalNotificationDelivery");
  const impl = "a".repeat(64);
  const reg = connector.registerExternalNotificationConnector({
    connectorId: "mail",
    channel: "EMAIL",
    implementationHash: impl,
    replayEvidence: "ok",
    at: "2026-01-01T00:00:00Z",
  });
  connector.decideExternalNotificationConnector({
    registrationId: reg.registrationId,
    decision: "APPROVE",
    actorId: "m45",
    actorName: "M45",
    reason: "reviewed",
  });
  dry.runExternalNotificationDryRun({
    connectorId: "mail",
    notificationId: "pre",
    severity: "P1",
    slaAction: "ASSIGN",
    occurredAt: "2026-01-01T00:00:00Z",
    send: () => ({ accepted: true, reference: "sandbox" }),
    at: "2026-01-01T00:01:00Z",
  });
  activation.decideExternalNotificationActivation({
    registrationId: reg.registrationId,
    action: "ACTIVATE",
    actorId: "m45",
    actorName: "M45",
    reason: "activate",
  });
  for (let i = 0; i < 3; i++) {
    delivery.deliverExternalNotificationLive({
      connectorId: "mail",
      notificationId: `n${i}`,
      severity: "P1",
      slaAction: "ASSIGN",
      occurredAt: "2026-01-01T00:00:00Z",
      at: `2026-01-01T0${i + 1}:00:00Z`,
      send: () => ({ accepted: true, reference: `p${i}` }),
      fallback: () => {},
    });
  }
  assurance.evaluateExternalNotificationAcknowledgments("2026-01-01T04:00:00Z");
  assert.equal(activation.liveExternalNotificationConnectors().length, 0);
  let blocked = false;
  try {
    reinstatement.reinstateExternalNotificationConnector({
      registrationId: reg.registrationId,
      actorId: "m45",
      actorName: "M45",
      reason: "too early",
    });
  } catch {
    blocked = true;
  }
  assert.equal(blocked, true);
  dry.runExternalNotificationDryRun({
    connectorId: "mail",
    notificationId: "fresh",
    severity: "P1",
    slaAction: "ASSIGN",
    occurredAt: "2026-01-01T04:01:00Z",
    send: () => ({ accepted: true, reference: "fresh" }),
    at: "2026-01-01T04:02:00Z",
  });
  const receipt = reinstatement.reinstateExternalNotificationConnector({
    registrationId: reg.registrationId,
    actorId: "m45",
    actorName: "M45",
    reason: "fresh evidence",
    at: "2026-01-01T04:03:00Z",
  });
  assert.equal(reinstatement.connectorInProbation(reg.registrationId), true);
  assert.equal(
    reinstatement.probationRequiresInternalDualRoute(reg.registrationId),
    true,
  );
  reinstatement.recordProbationOutcome({
    registrationId: reg.registrationId,
    acknowledged: true,
    notificationId: "p1",
  });
  reinstatement.recordProbationOutcome({
    registrationId: reg.registrationId,
    acknowledged: true,
    notificationId: "p2",
  });
  const pass = reinstatement.recordProbationOutcome({
    registrationId: reg.registrationId,
    acknowledged: true,
    notificationId: "p3",
  });
  assert.equal(pass.action, "PROBATION_PASS");
  assert.equal(reinstatement.connectorInProbation(reg.registrationId), false);
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-REINSTATEMENT-001",
        prematureBlocked: blocked,
        action: receipt.action,
        outcome: pass.action,
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
